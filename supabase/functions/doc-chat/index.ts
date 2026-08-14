import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  question: z.string().min(1).max(2000),
  pageText: z.string().max(20000).optional().default(""),
  docName: z.string().max(300).optional().default("this document"),
  targetLang: z.string().max(10).optional().default("te"),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(20)
    .optional()
    .default([]),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { question, pageText, docName, history } = parsed.data;

    const systemPrompt = `You are a calm, clear study assistant answering questions about a document the student is reading ("${docName}").
Rules:
- Answer using the page content given below whenever possible. If the answer is not in the page, say so briefly, then give the best general explanation.
- Reply in the SAME language the student asked in (Telugu, Hindi, English, etc.).
- Keep it short: 2-5 sentences or a few tight bullets. No preamble, no markdown headings.
- For technical terms, give the native word with the English term in brackets.

PAGE CONTENT:
${pageText || "(no page content available)"}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: question },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Too many questions right now. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", resp.status, await resp.text());
      throw new Error("AI request failed");
    }

    const data = await resp.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "I couldn't form an answer. Please rephrase.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("doc-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
