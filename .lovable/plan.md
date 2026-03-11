
# Database-Driven Textbook with AI Content Generation — Status

## ✅ Completed

1. **4 new DB tables** created: `subjects`, `tb_chapters`, `tb_episodes`, `content_blocks` with RLS
2. **7 subjects seeded**: Mathematics (14ch), Physics (12ch), Chemistry (9ch), Biology (8ch), English (8ch), Telugu (6ch), Social Studies (14ch) = **71 chapters total**
3. **Math Ch1**: 7 episodes + 11 content blocks (full 7-layer) for Episode 1 migrated to DB
4. **Frontend updated**: StudentTextbook, TextbookChapter, TextbookEpisode now query DB with hardcoded fallback
5. **Subject tabs** added to textbook page for switching between subjects
6. **AI content generator** edge function built (`generate-chapter-content`) using Gemini

## 🔜 Next Steps

1. **Generate content for Math Ch1 Eps 2-7** elite layers (call the edge function)
2. **Generate episodes + content for Math Ch2-14** (seed episodes, then call AI generator)
3. **Generate episodes + content for all other subjects** (same pattern)
4. **Add Chemistry chapters** to the physical science curriculum mapping
5. **Teacher content review UI** — allow teachers to edit AI-generated content before publishing
