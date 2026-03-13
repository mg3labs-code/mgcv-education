

# Persist "Mark as Understood" to Database

## Approach

Use the existing `episode_progress` table which already has `layer_scores` (jsonb) and `completion_pct` columns. Store understood block indices in `layer_scores` and compute `completion_pct` from them.

## Database

No schema changes needed. The `episode_progress` table already has:
- `user_id`, `chapter_id`, `episode_id` — identifiers
- `layer_scores` jsonb — will store `{ "understood": [0, 2, 5] }` (block indices)
- `completion_pct` integer — auto-computed from understood count / total blocks
- RLS: students can manage own rows ✓

## Code Changes

**File: `src/pages/TextbookEpisode.tsx`**

1. Import `supabase` client and `useAuth` hook
2. On mount (when `blocks` load), fetch existing `episode_progress` row for this user/chapter/episode and populate `understoodBlocks` state from `layer_scores.understood`
3. Update `toggleUnderstood` to upsert `episode_progress` row:
   - Set `layer_scores` to `{ understood: [...indices] }`
   - Set `completion_pct` to `Math.round(understoodCount / totalBlocks * 100)`
   - Use debounced save (300ms) to avoid rapid DB writes
4. Show a subtle "Saved" indicator in the stats bar when synced

## Flow

```text
Page loads → fetch episode_progress → populate understoodBlocks Set
User clicks "Mark as Understood" → update local state → debounced upsert to episode_progress
User returns later → understood blocks restored from DB
```

## Files Changed

| File | Change |
|---|---|
| `src/pages/TextbookEpisode.tsx` | Add DB fetch on load, persist on toggle, import supabase + useAuth |

