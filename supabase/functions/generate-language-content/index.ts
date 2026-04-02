import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { chapterId, chapterTitle, subject, episodes } = await req.json();

    if (!chapterId || !subject || !episodes?.length) {
      return new Response(
        JSON.stringify({ error: "Missing chapterId, subject, or episodes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const scriptName = subject === "Telugu" ? "Telugu script" : "Devanagari script";
    const langCode = subject === "Telugu" ? "te" : "hi";

    const systemPrompt = `You are an expert ${subject} language teacher for 10th-grade students (Telangana State Board).
You create bilingual learning content using native ${scriptName} with English translations and transliterations.
All native text MUST be in actual ${scriptName} (not romanized). Transliterations use standard IAST/phonetic romanization.
Content should be age-appropriate, culturally relevant, and pedagogically sound for Indian students.`;

    const userPrompt = `Generate exactly 9 content blocks for the episode titled "{EPISODE_TITLE}" from Chapter "{CHAPTER_TITLE}" in ${subject}.

Return a JSON array of 11 objects. Each object must have: block_type, title, icon, content.

The 11 blocks IN ORDER:

1. block_type: "bilingual_concept"
   title: A heading for this concept section
   icon: "📖"
   content: {
     "heading": "Topic heading",
     "sections": [
       {"native": "<${subject} text>", "english": "<English translation>", "transliteration": "<romanized pronunciation>"},
       ... (4-6 sections)
     ]
   }

2. block_type: "visual_aid"
   title: "Visualize the Concept"
   icon: "🖼️"
   content: {
     "type": "image",
     "url": "",
     "caption": "<what the image shows related to the story/concept>",
     "explanation": "<how this visual helps understand the ${subject} content>",
     "alt": "<accessibility description>",
     "searchTerms": "<2-4 keywords for finding a relevant cultural/educational image>"
   }

3. block_type: "story_reading"
   title: A story title
   icon: "📚"
   content: {
     "title": "Story title in ${subject} and English",
     "sentences": [
       {"native": "<${subject} sentence>", "english": "<English translation>"},
       ... (6-10 sentences telling a short story or passage)
     ],
     "questions": [
       {"question": "<comprehension question in ${subject}>", "answer": "<answer>"},
       ... (3-4 questions)
     ]
   }

4. block_type: "vocabulary"
   title: "New Words"
   icon: "🔤"
   content: {
     "heading": "Key Vocabulary",
     "words": [
       {
         "word": "<${subject} word>",
         "transliteration": "<pronunciation>",
         "meaning": "<English meaning>",
         "example": "<example sentence in ${subject}>",
         "exampleTranslation": "<English translation of example>",
         "memoryTrick": "<a fun memory trick>"
       },
       ... (6-8 words)
     ]
   }

4. block_type: "grammar_pattern"
   title: "Grammar Pattern"
   icon: "🧩"
   content: {
     "patternName": "<name of grammar pattern>",
     "rule": "<explain the grammar rule simply>",
     "examples": [
       {
         "sentence": "<full sentence in ${subject}>",
         "translation": "<English translation>",
         "highlights": [
           {"text": "<word/phrase>", "role": "subject"},
           {"text": "<word/phrase>", "role": "verb"},
           {"text": "<word/phrase>", "role": "object"}
         ]
       },
       ... (3-4 examples)
     ],
     "challenge": {
       "question": "Form a sentence using this pattern about...",
       "answer": "<model answer in ${subject} with translation>"
     }
   }

5. block_type: "recall"
   title: "Quick Recall"
   icon: "🧠"
   content: {
     "questions": [
       {"question": "<question in ${subject} about the episode content>", "answer": "<answer>", "hint": "<optional hint>"},
       ... (4-5 questions)
     ]
   }

6. block_type: "assessment"
   title: "Check Your Understanding"
   icon: "✅"
   content: {
     "questions": [
       {
         "question": "<MCQ question about ${subject} language concepts>",
         "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
         "correctIndex": 0,
         "explanation": "<why this is correct>"
       },
       ... (4-5 questions)
     ]
   }

7. block_type: "explain"
   title: "Express in ${subject}"
   icon: "✍️"
   content: {
     "prompt": "<writing prompt asking student to write in ${subject}>",
     "guidePoints": ["<hint 1>", "<hint 2>", "<hint 3>"],
     "wordLimit": 100
   }

8. block_type: "application"
   title: "Real-World ${subject}"
   icon: "🌍"
   content: {
     "scenario": "<real-world scenario where ${subject} is used>",
     "context": "<cultural context>",
     "questions": [{"question": "<question>", "hint": "<hint>"}],
     "realWorldWhy": "<why this matters>",
     "careers": ["<career 1>", "<career 2>"]
   }

9. block_type: "connections"
   title: "Cultural Connections"
   icon: "🌐"
   content: {
     "concept": "<the language concept>",
     "connections": [
       {"domain": "Literature", "icon": "📚", "link": "<connection to ${subject} literature>", "explanation": "<explain>"},
       {"domain": "Film", "icon": "🎬", "link": "<connection to ${subject} cinema>", "explanation": "<explain>"},
       {"domain": "History", "icon": "🏛️", "link": "<connection to cultural history>", "explanation": "<explain>"}
     ]
   }

IMPORTANT:
- ALL native text must be in actual ${scriptName}, NOT romanized
- Transliterations are separate fields for pronunciation help
- Content should be relevant to the chapter topic "{CHAPTER_TITLE}"
- Make examples culturally relevant to Telugu/Indian students
- Return ONLY a valid JSON array, no markdown fences`;

    const results: any[] = [];

    for (const ep of episodes) {
      try {
        // Check if blocks already exist
        const { count } = await supabase
          .from("content_blocks")
          .select("id", { count: "exact", head: true })
          .eq("episode_id", ep.id);

        if (count && count > 0) {
          results.push({ episode: ep.title, status: "skipped", reason: "blocks exist" });
          continue;
        }

        const prompt = userPrompt
          .replaceAll("{EPISODE_TITLE}", ep.title)
          .replaceAll("{CHAPTER_TITLE}", chapterTitle);

        const aiResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
              ],
            }),
          }
        );

        if (!aiResponse.ok) {
          const status = aiResponse.status;
          const text = await aiResponse.text();
          if (status === 429 || status === 402) {
            results.push({ episode: ep.title, status: "error", error: `Rate/credit limit: ${status}` });
            // Wait before continuing
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          results.push({ episode: ep.title, status: "error", error: `AI ${status}: ${text.slice(0, 200)}` });
          continue;
        }

        const aiData = await aiResponse.json();
        let raw = aiData.choices?.[0]?.message?.content || "";

        // Clean markdown fences
        raw = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");
        raw = raw.trim();

        // Find the JSON array
        const arrStart = raw.indexOf("[");
        const arrEnd = raw.lastIndexOf("]");
        if (arrStart === -1 || arrEnd === -1) {
          results.push({ episode: ep.title, status: "error", error: "No JSON array found" });
          continue;
        }
        raw = raw.slice(arrStart, arrEnd + 1);

        let blocks: any[];
        try {
          blocks = JSON.parse(raw);
        } catch {
          results.push({ episode: ep.title, status: "error", error: "JSON parse failed" });
          continue;
        }

        if (!Array.isArray(blocks) || blocks.length === 0) {
          results.push({ episode: ep.title, status: "error", error: "Empty blocks array" });
          continue;
        }

        const rows = blocks.map((b: any, i: number) => ({
          episode_id: ep.id,
          block_type: b.block_type,
          title: b.title || null,
          icon: b.icon || null,
          content: b.content || {},
          sort_order: i,
        }));

        const { error: insertError } = await supabase
          .from("content_blocks")
          .insert(rows);

        if (insertError) {
          results.push({ episode: ep.title, status: "error", error: insertError.message });
        } else {
          results.push({ episode: ep.title, status: "ok", blocks: rows.length });
        }

        // Small delay between episodes
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {
        results.push({ episode: ep.title, status: "error", error: String(e) });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
