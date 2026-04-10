import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const EpisodeSchema = z.object({
  id: z.string().min(1).max(200),
  number: z.number().int().min(1).max(50),
  title: z.string().min(1).max(500),
  subtitle: z.string().max(500).optional(),
  type: z.string().max(100).optional(),
});
const BodySchema = z.object({
  chapterId: z.string().min(1).max(200),
  chapterTitle: z.string().min(1).max(500),
  subject: z.string().min(1).max(200),
  episodes: z.array(EpisodeSchema).min(1).max(20),
  board: z.string().max(100).default("Telangana"),
  grade: z.number().int().min(1).max(12).default(10),
  depth: z.enum(["board", "jee"]).default("board"),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { chapterId, chapterTitle, subject, episodes, board, grade, depth } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: any[] = [];

    for (const ep of episodes) {
      let systemPrompt: string;
      let userPrompt: string;

      if (depth === "jee") {
        systemPrompt = `You are an expert JEE/NEET competitive exam content creator for ${grade}th class ${subject} (${board} State Board).
You create JEE-level competitive content that builds on board-level concepts. Focus on:
- Competitive problem-solving patterns & shortcuts
- Previous year JEE/NEET question patterns with trap analysis
- Speed and accuracy under time pressure
- Extended syllabus topics beyond state board
Content must be culturally relevant to Indian students.`;

        userPrompt = `Generate JEE Boost content blocks for:
Subject: ${subject}
Chapter: ${chapterTitle}
Episode ${ep.number}: "${ep.title}" - ${ep.subtitle}

Return a JSON array with exactly 3 blocks in this order:
1. jee_extension (type: "jee_extension") — Advanced concepts beyond board syllabus
2. jee_problems (type: "jee_problems") — 4-5 competitive MCQs with traps
3. jee_speed_drill (type: "jee_speed_drill") — 5 rapid-fire questions

Each block must have: { "block_type": string, "title": string, "icon": string, "content": object }

Content structures:
- jee_extension: { title: string, sections: [{heading, body, formula?}], advancedFormulas?: string[], proofSketch?: string }
- jee_problems: { questions: [{question, options: string[], correctIndex: number, explanation, trap?: string, previousYear?: string, negativeMarking?: number}], timePerQuestion?: number }
- jee_speed_drill: { questions: [{question, answer, hint?}], totalTimeSeconds: number }

For jee_problems:
- Each question should test competitive-level thinking, not just recall
- Include "trap" field explaining common mistakes students make
- Include "previousYear" field like "JEE Main 2023" or "Similar to JEE Advanced 2022" where applicable
- Set negativeMarking to 1 (default JEE scheme: +4/-1)

For jee_speed_drill:
- Questions should be answerable in 10-15 seconds each
- Answers should be short (a number, formula, or 1-2 words)
- Set totalTimeSeconds to 90

Return ONLY the JSON array, no markdown wrapping.`;
      } else {
        systemPrompt = `You are an expert curriculum designer creating world-class educational content for ${grade}th class ${subject} (${board} State Board).

You follow the 7-Layer Elite Learning Framework:
- Layer 1 (Definition/Concept): Simple, non-academic explanation. Like explaining to a bright child. Use analogies.
- Layer 2 (Mechanism/Activity): Step-by-step "how it works" walkthrough. Interactive classify/match/explore activity.
- Layer 3 (Reasoning - Cambridge "Why"): Central question + 3 "why" sub-questions with hints and deeper insights.
- Layer 4 (Assumptions - Oxford Tutorial Defense): 3 hidden assumptions students take for granted. Challenge each.
- Layer 5 (Connections - MIT Cross-Domain): 4-5 connections to Science, Finance, Technology, History, Art/Music.
- Layer 6 (Application - Harvard Case Method): Real-world Indian scenario with 3 questions, careers list, and "why this matters".
- Layer 7 (Implications - Oxford Essay): Big "what if" question, 3 structured implication categories (Global/Future/Philosophical), and an essay prompt.

Also include: recall (4 Q&A pairs), explain (prompt + guide points), assessment (3-4 MCQs), exercise (textbook problems).

Additionally, include 2-3 visual_aid blocks placed after concept, reasoning, and application blocks. Each visual_aid block helps students visualize the topic with images or short videos.

Content must be culturally relevant to Indian students. Use Indian examples, ₹ currency, cricket/Bollywood references where appropriate.`;

        userPrompt = `Generate complete 7-layer content blocks for:
Subject: ${subject}
Chapter: ${chapterTitle}
Episode ${ep.number}: "${ep.title}" - ${ep.subtitle}
Type: ${ep.type}

Return a JSON array of content blocks in this exact order:
1. concept (type: "concept")
2. visual_aid (type: "visual_aid") — an image/diagram illustrating the core concept
3. activity (type: "activity") 
4. recall (type: "recall")
5. explain (type: "explain")
6. assessment (type: "assessment")
7. exercise (type: "exercise")
8. reasoning (type: "reasoning")
9. visual_aid (type: "visual_aid") — a diagram showing why/how the concept works
10. assumptions (type: "assumptions")
11. connections (type: "connections")
12. application (type: "application")
13. visual_aid (type: "visual_aid") — a real-world image showing the concept in action
14. implications (type: "implications")

Each block must have: { "block_type": string, "title": string, "icon": string, "content": object }

The content object structure for each type:
- concept: { sections: [{heading, body, highlight?}], keyFormulas?: string[], example?: [{question, solution}] }
- visual_aid: { type: "image", url: "", caption: string, explanation: string, alt: string, searchTerms: string }
  For visual_aid blocks: leave "url" as empty string (it will be resolved later). 
  Set "searchTerms" to SPECIFIC descriptive keywords that would find an existing educational diagram online.
  Examples: "Wikimedia Commons Venn diagram rational irrational numbers", "NCERT labeled diagram human digestive system", "Khan Academy photosynthesis process diagram labeled".
  Use 4-8 words, include the source site name if possible, and always include "labeled diagram" or "educational illustration".
  Set "caption" to a short description of what the image shows.
  Set "explanation" to 1-2 sentences explaining how the visual connects to the lesson.
  Set "alt" to accessibility text describing the image.
- activity: { instruction: string, type: "classify"|"match"|"order"|"explore", items?: [{value, categories?}], categories?: [{id, label, description}] }
- recall: { questions: [{question, answer, hint?}] }
- explain: { prompt: string, guidePoints?: string[], wordLimit?: number }
- assessment: { questions: [{question, options: string[], correctIndex: number, explanation}] }
- exercise: { source: string, problems: [{number, text, answer?}] }
- reasoning: { centralQuestion: string, whyQuestions: [{question, hint?, deeperInsight}] }
- assumptions: { concept: string, hiddenAssumptions: [{assumption, whyItMatters, challenge}], defensePrompt: string }
- connections: { concept: string, connections: [{domain, icon, link, explanation}] }
- application: { scenario: string, context: string, questions: [{question, hint?}], realWorldWhy: string, careers?: string[], harvardLabel?: string }
- implications: { whatIfQuestion: string, reflectionPrompts: string[], essayPrompt: string, wordLimit?: number, implications?: [{category, icon, color, points: string[]}] }

Return ONLY the JSON array, no markdown wrapping.`;
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 20000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`AI error for ep ${ep.number}:`, response.status, errText);
        if (response.status === 429) {
          results.push({ episode: ep.number, error: "Rate limited, try again later" });
          continue;
        }
        if (response.status === 402) {
          results.push({ episode: ep.number, error: "Credits exhausted" });
          continue;
        }
        results.push({ episode: ep.number, error: `AI error ${response.status}` });
        continue;
      }

      const aiData = await response.json();
      let contentText = aiData.choices?.[0]?.message?.content || "";
      
      // Clean markdown wrapping if present
      contentText = contentText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      // Try to extract JSON array even if truncated
      if (!contentText.startsWith("[")) {
        const arrStart = contentText.indexOf("[");
        if (arrStart !== -1) contentText = contentText.slice(arrStart);
      }
      
      let generatedBlocks;
      try {
        generatedBlocks = JSON.parse(contentText);
      } catch (e) {
        // Try to recover truncated JSON by closing brackets
        console.error(`JSON parse error for ep ${ep.number}, attempting recovery...`);
        try {
          // Count open/close braces and brackets to fix truncation
          let fixed = contentText;
          const openBraces = (fixed.match(/{/g) || []).length;
          const closeBraces = (fixed.match(/}/g) || []).length;
          const openBrackets = (fixed.match(/\[/g) || []).length;
          const closeBrackets = (fixed.match(/]/g) || []).length;
          // Remove trailing comma if any
          fixed = fixed.replace(/,\s*$/, "");
          for (let i = 0; i < openBraces - closeBraces; i++) fixed += "}";
          for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += "]";
          generatedBlocks = JSON.parse(fixed);
        } catch (e2) {
          console.error(`JSON recovery failed for ep ${ep.number}:`, e2);
          results.push({ episode: ep.number, error: "Failed to parse AI response" });
          continue;
        }
      }

      if (!Array.isArray(generatedBlocks)) {
        results.push({ episode: ep.number, error: "AI response is not an array" });
        continue;
      }

      // Check if blocks already exist for this episode at this depth (prevent duplicates)
      const { count: existingCount } = await supabase
        .from("content_blocks")
        .select("id", { count: "exact", head: true })
        .eq("episode_id", ep.id)
        .eq("depth", depth);

      if (existingCount && existingCount > 0) {
        console.log(`Episode ${ep.number} already has ${existingCount} ${depth} blocks, skipping`);
        results.push({ episode: ep.number, blocks: existingCount, status: "already_exists", depth });
        continue;
      }

      // Insert blocks into DB — filter out blocks with null/missing content
      const blockInserts = generatedBlocks
        .filter((block: any) => block.content != null && (block.block_type || block.type))
        .map((block: any, idx: number) => ({
          episode_id: ep.id,
          block_type: block.block_type || block.type,
          title: block.title || "",
          icon: block.icon || "📝",
          content: block.content || {},
          sort_order: depth === "jee" ? 100 + idx + 1 : idx + 1,
          depth: depth,
        }));

      const { error: insertErr } = await supabase
        .from("content_blocks")
        .insert(blockInserts);

      if (insertErr) {
        console.error(`Insert error for ep ${ep.number}:`, insertErr);
        results.push({ episode: ep.number, error: insertErr.message });
      } else {
        results.push({ episode: ep.number, blocks: generatedBlocks.length, status: "success" });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-chapter-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
