// Single endpoint for the Educational Document Translation Engine.
// Actions: start | add_chunks | process | status
// Structure-preserving English -> Indian language conversion with a terminology
// database, translation-memory cache and a validation agent.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const LANG_NAMES: Record<string, string> = {
  te: "Telugu",
  hi: "Hindi",
  ta: "Tamil",
  kn: "Kannada",
  mr: "Marathi",
  bn: "Bengali",
};

type Block = {
  id: string;
  type: string;
  num?: string;
  label?: string;
  text?: string;
  cells?: string[][];
};

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------- Validation agent ----------
const NUM_RE = /\d+(?:[.,]\d+)?/g;

function validateChunk(src: Block[], out: Block[]) {
  const issues: string[] = [];
  if (out.length !== src.length) issues.push(`block count ${src.length} -> ${out.length}`);
  const byId = new Map(out.map((b) => [b.id, b]));
  for (const s of src) {
    const t = byId.get(s.id);
    if (!t) {
      issues.push(`missing block ${s.id}`);
      continue;
    }
    if (t.type !== s.type) issues.push(`${s.id}: type changed`);
    if ((s.num || "") !== (t.num || "")) issues.push(`${s.id}: numbering changed`);
    if ((s.label || "") !== (t.label || "")) issues.push(`${s.id}: option label changed`);
    if (s.cells) {
      const rowsOk = Array.isArray(t.cells) && t.cells.length === s.cells.length;
      const colsOk = rowsOk && s.cells.every((r, i) => (t.cells as string[][])[i]?.length === r.length);
      if (!rowsOk || !colsOk) issues.push(`${s.id}: table shape changed`);
    } else {
      if (!t.text || !t.text.trim()) issues.push(`${s.id}: empty translation`);
      const sn = (s.text || "").match(NUM_RE) || [];
      const tn = (t.text || "").match(NUM_RE) || [];
      const missing = sn.filter((n) => !tn.includes(n));
      if (missing.length) issues.push(`${s.id}: numbers dropped (${missing.slice(0, 4).join(", ")})`);
    }
  }
  return { pass: issues.length === 0, issues: issues.slice(0, 12) };
}

// ---------- Translation ----------
async function translateBlocks(
  blocks: Block[],
  targetLang: string,
  termStyle: string,
  glossary: { english: string; translation: string; rule: string }[],
  apiKey: string,
) {
  const langName = LANG_NAMES[targetLang] || targetLang;
  const glossaryText = glossary
    .map((g) => `${g.english} => ${g.translation} [${g.rule}]`)
    .join("\n");

  const styleRule =
    termStyle === "bracket"
      ? `For technical/scientific terms write the ${langName} term followed by the English term in brackets, e.g. "కణ శ్వాసక్రియ (Cellular Respiration)".`
      : termStyle === "pure"
        ? `Use the standard ${langName} term only. Keep English only when no standard term exists.`
        : `Keep widely-used English technical terms as-is in ${langName} script transliteration.`;

  const system = `You are an expert academic translator producing exam-grade ${langName} versions of English educational documents (textbooks, study guides, question banks, exam papers).

ABSOLUTE RULES
1. Translate ONLY the "text" and "cells" values. Never change "id", "type", "num" or "label".
2. Preserve question numbering, option labels (A/B/C/D), answer keys, marks, table shape, row/column counts.
3. Never translate, reformat or recompute: numbers, dates, units, symbols, chemical formulas, mathematical expressions, variable names, equations. Copy them exactly.
4. Never merge, split, drop or add blocks. Output exactly the same number of blocks in the same order.
5. Keep proper nouns, brand names and citations in English.
6. ${styleRule}
7. Use the terminology dictionary strictly. rule=always -> use given translation; rule=keep_english -> keep the English word; rule=both -> ${langName} term with English in brackets.
8. Output valid JSON only.

TERMINOLOGY DICTIONARY
${glossaryText || "(empty)"}`;

  const user = `Translate the "text"/"cells" fields of these blocks into ${langName}.
Return ONLY a JSON object: {"blocks":[ ...same blocks with translated text/cells... ]}

${JSON.stringify({ blocks })}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`AI ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  let raw: string = data.choices?.[0]?.message?.content || "";
  raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in AI response");
  const parsed = JSON.parse(raw.slice(start, end + 1));
  const out = parsed.blocks;
  if (!Array.isArray(out)) throw new Error("AI response missing blocks array");
  return out as Block[];
}

serve_handler();

function serve_handler() {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      const authHeader = req.headers.get("Authorization") || "";
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: userData } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
      const user = userData?.user;
      if (!user) return json({ error: "Please sign in to convert documents." }, 401);

      const body = await req.json();
      const action = body.action as string;

      // ---------- START: create or reuse a job ----------
      if (action === "start") {
        const {
          fileName,
          fileSize = null,
          docType = "auto",
          targetLang = "te",
          termStyle = "bracket",
          contentHash,
        } = body;
        if (!fileName || !contentHash) return json({ error: "fileName and contentHash required" }, 400);

        const { data: existing } = await admin
          .from("doc_translation_jobs")
          .select("*")
          .eq("user_id", user.id)
          .eq("content_hash", contentHash)
          .eq("target_lang", targetLang)
          .eq("term_style", termStyle)
          .maybeSingle();

        if (existing) return json({ job: existing, reused: true });

        const { data: job, error } = await admin
          .from("doc_translation_jobs")
          .insert({
            user_id: user.id,
            file_name: fileName,
            file_size: fileSize,
            doc_type: docType,
            target_lang: targetLang,
            term_style: termStyle,
            content_hash: contentHash,
            status: "parsing",
          })
          .select()
          .single();
        if (error) throw error;
        return json({ job, reused: false });
      }

      const jobId = body.jobId as string;
      if (!jobId) return json({ error: "jobId required" }, 400);

      const { data: job, error: jobErr } = await admin
        .from("doc_translation_jobs")
        .select("*")
        .eq("id", jobId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (jobErr) throw jobErr;
      if (!job) return json({ error: "Job not found" }, 404);

      // ---------- ADD_CHUNKS: stream parsed structure in batches ----------
      if (action === "add_chunks") {
        const chunks = (body.chunks || []) as { idx: number; kind?: string; blocks: Block[] }[];
        if (!chunks.length) return json({ error: "chunks required" }, 400);

        const rows = [] as Record<string, unknown>[];
        for (const c of chunks) {
          rows.push({
            job_id: jobId,
            idx: c.idx,
            kind: c.kind || "block",
            source: { blocks: c.blocks },
            source_hash: await sha256(JSON.stringify(c.blocks)),
          });
        }
        const { error } = await admin
          .from("doc_translation_chunks")
          .upsert(rows, { onConflict: "job_id,idx" });
        if (error) throw error;

        const { count } = await admin
          .from("doc_translation_chunks")
          .select("id", { count: "exact", head: true })
          .eq("job_id", jobId);

        const finalized = body.done === true;
        await admin
          .from("doc_translation_jobs")
          .update({
            total_chunks: count || 0,
            status: finalized ? "translating" : "parsing",
          })
          .eq("id", jobId);

        return json({ ok: true, total_chunks: count || 0 });
      }

      // ---------- PROCESS: translate the next batch (resumable) ----------
      if (action === "process") {
        const apiKey = Deno.env.get("LOVABLE_API_KEY");
        if (!apiKey) return json({ error: "AI key not configured" }, 500);
        const batchSize = Math.min(Math.max(Number(body.batchSize) || 3, 1), 6);

        const { data: glossary } = await admin
          .from("doc_glossary")
          .select("english, translation, rule")
          .eq("target_lang", job.target_lang)
          .limit(400);

        const { data: pending } = await admin
          .from("doc_translation_chunks")
          .select("id, idx, source, source_hash")
          .eq("job_id", jobId)
          .in("status", ["pending", "error"])
          .order("idx", { ascending: true })
          .limit(batchSize);

        if (!pending || pending.length === 0) {
          const { count: doneCount } = await admin
            .from("doc_translation_chunks")
            .select("id", { count: "exact", head: true })
            .eq("job_id", jobId)
            .eq("status", "done");
          await admin
            .from("doc_translation_jobs")
            .update({ status: "completed", done_chunks: doneCount || 0 })
            .eq("id", jobId);
          return json({ finished: true, done_chunks: doneCount || 0 });
        }

        const results = await Promise.all(
          pending.map(async (chunk) => {
            const srcBlocks: Block[] = (chunk.source as { blocks: Block[] }).blocks || [];
            try {
              // translation memory
              const { data: cached } = await admin
                .from("doc_translation_cache")
                .select("translated")
                .eq("source_hash", chunk.source_hash)
                .eq("target_lang", job.target_lang)
                .eq("term_style", job.term_style)
                .maybeSingle();

              let outBlocks: Block[];
              let validation: { pass: boolean; issues: string[] };
              let fromCache = false;

              if (cached?.translated) {
                outBlocks = (cached.translated as { blocks: Block[] }).blocks;
                validation = validateChunk(srcBlocks, outBlocks);
                fromCache = true;
              } else {
                outBlocks = await translateBlocks(
                  srcBlocks,
                  job.target_lang,
                  job.term_style,
                  glossary || [],
                  apiKey,
                );
                validation = validateChunk(srcBlocks, outBlocks);
                // one structured retry when the validation agent fails
                if (!validation.pass) {
                  outBlocks = await translateBlocks(
                    srcBlocks,
                    job.target_lang,
                    job.term_style,
                    glossary || [],
                    apiKey,
                  );
                  validation = validateChunk(srcBlocks, outBlocks);
                }
              }

              await admin
                .from("doc_translation_chunks")
                .update({
                  translated: { blocks: outBlocks, validation, cached: fromCache },
                  status: "done",
                  error: validation.pass ? null : `review: ${validation.issues.join("; ")}`,
                })
                .eq("id", chunk.id);

              if (!fromCache) {
                await admin.from("doc_translation_cache").upsert({
                  source_hash: chunk.source_hash,
                  target_lang: job.target_lang,
                  term_style: job.term_style,
                  translated: { blocks: outBlocks },
                });
              }
              return { ok: true, review: !validation.pass };
            } catch (e) {
              await admin
                .from("doc_translation_chunks")
                .update({ status: "error", error: String(e).slice(0, 400) })
                .eq("id", chunk.id);
              return { ok: false, review: false, error: String(e) };
            }
          }),
        );

        const [{ count: doneCount }, { count: failedCount }, { count: totalCount }] = await Promise.all([
          admin.from("doc_translation_chunks").select("id", { count: "exact", head: true })
            .eq("job_id", jobId).eq("status", "done"),
          admin.from("doc_translation_chunks").select("id", { count: "exact", head: true })
            .eq("job_id", jobId).eq("status", "error"),
          admin.from("doc_translation_chunks").select("id", { count: "exact", head: true })
            .eq("job_id", jobId),
        ]);

        const finished = (doneCount || 0) + (failedCount || 0) >= (totalCount || 0);
        await admin
          .from("doc_translation_jobs")
          .update({
            done_chunks: doneCount || 0,
            failed_chunks: failedCount || 0,
            total_chunks: totalCount || 0,
            status: finished ? (failedCount ? "needs_review" : "completed") : "translating",
          })
          .eq("id", jobId);

        return json({
          finished,
          processed: results.length,
          done_chunks: doneCount || 0,
          failed_chunks: failedCount || 0,
          total_chunks: totalCount || 0,
        });
      }

      // ---------- STATUS ----------
      if (action === "status") return json({ job });

      return json({ error: `Unknown action: ${action}` }, 400);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });
}
