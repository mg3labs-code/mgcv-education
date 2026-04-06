

# Fix Telangana Syllabus + Regenerate Content (4 Subjects)

## Current State Summary

| Subject | Ch1 Title (WRONG) | Block Types | Problem |
|---|---|---|---|
| **English** | "A Letter to God" (NCERT) | STEM 7-layer ✅ | Wrong syllabus |
| **Social Science** | "Rise of Nationalism in Europe" (NCERT) | STEM 7-layer ✅ | Wrong syllabus |
| **Hindi** | "सूरदास के पद" (NCERT) | Language pipeline ✅ | Wrong syllabus |
| **Telugu** | "సారాంశం — కవిత్వం" (generic) | STEM 7-layer ❌ | Wrong syllabus + wrong pipeline |
| Math, Science, Physics, Chemistry | Correct | Correct | **Keep as-is** |

**Key finding**: Telugu was generated with the STEM pipeline (concept, reasoning, assumptions) instead of the language pipeline (bilingual_concept, vocabulary, grammar_pattern, story_reading). Hindi has the correct block types but wrong NCERT content.

No previous project database is accessible — this is a fresh remix. No tables or foreign keys are missing; the schema is complete.

## Plan

### Step 1 — Update ALL chapter titles for 4 subjects to Telangana SCERT

**SQL UPDATE via insert tool** on `tb_chapters`:

**Social Science** (10 chapters → Telangana Geography/Civics/Economics):
- Ch1: "India — Relief Features" | Ch2: "People and Settlement" | Ch3: "Water Resources" | Ch4: "Climate of India" | Ch5: "Indian Rivers and Water Resources" | Ch6: "The Population" | Ch7: "Settlement and Migration" | Ch8: "Rampur — A Village Economy" | Ch9: "Globalisation" | Ch10: "Food Security"

**English** (8 chapters → Telangana English Reader):
- Ch1: "Personality Development" | Ch2: "Wit and Humour" | Ch3: "Human Relations" | Ch4: "Films and Theatre" | Ch5: "Social Issues" | Ch6: "Bio-Diversity" | Ch7: "Nation and Diversity" | Ch8: "Human Rights"

**Hindi** (8 chapters → Telangana Hindi Second Language):
- Ch1: "बरसते बादल" | Ch2: "ईदगाह" | Ch3: "माँ मुझे आने दे!" | Ch4: "कण-कण का अधिकारी" | Ch5: "लोकगीत" | Ch6: "सबसे बड़ा शो-मैन" | Ch7: "हिमालय" | Ch8: "कर्मवीर"

**Telugu** (9 chapters → Telangana Telugu Reader):
- Ch1: "దానశీలము" | Ch2: "లక్ష్యసిద్ధి" | Ch3: "వీర తెలంగాణ" | Ch4: "ఆత్మస్తుతి" | Ch5: "భాగ్యోదయం" | Ch6: "జీవనభాష్యం" | Ch7: "గోలకొండ పట్టణము" | Ch8: "భూమిక" | Ch9: "ఛందస్సు"

### Step 2 — Update Chapter 1 episode titles

**Social Science** (India Relief Features):
- Ep1: "The Great Himalayas" | Ep2: "Peninsular Plateau & Coastal Plains" | Ep3: "Islands, Deserts & River Plains"

**English** (Personality Development):
- Ep1: "Attitude is Altitude" (Nick Vujicic) | Ep2: "Every Success Story" (Sudha Murthy) | Ep3: "I Will Do It"

**Hindi** (बरसते बादल):
- Ep1: "बरसते बादल — कविता परिचय" | Ep2: "बरसते बादल — भाव विश्लेषण" | Ep3: "बरसते बादल — भाषा और शिल्प"

**Telugu** (దానశీలము):
- Ep1: "దానశీలము — పద్య పరిచయం" | Ep2: "దానశీలము — పద్య విశ్లేషణ" | Ep3: "దానశీలము — భావ విస్తరణ"

### Step 3 — Delete old content blocks for these 4 subjects

Delete all `content_blocks` for the 12 affected episodes (wrong syllabus content; Telugu also has wrong block types).

### Step 4 — Regenerate content with correct pipelines

- **Telugu** → call `generate-language-content` → produces bilingual_concept, vocabulary, grammar_pattern, story_reading blocks (the rich bilingual UI)
- **Hindi** → call `generate-language-content` → same language pipeline
- **English & Social Science** → call `generate-chapter-content` → STEM 7-layer blocks with visual_aids

### Step 5 — Verify completeness

Query all 12 episodes to confirm:
- Telugu & Hindi: 9-11 language-specific blocks each
- English & Social Science: 11-14 STEM blocks each
- No null content blocks

## What stays untouched
- Mathematics, Science, Physics, Chemistry — already correct
- All UI components — no code changes
- Edge function code — already correct
- TTS v3 upgrade — already deployed
- Database schema — no structural changes needed

## Files Modified
- **Database only** (via insert tool): UPDATE `tb_chapters`, UPDATE `tb_episodes`, DELETE `content_blocks`, then edge function calls to regenerate

