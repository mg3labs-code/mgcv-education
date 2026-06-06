import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DepthTrack } from "@/hooks/useRungPacing";

/**
 * Returns the most recently saved depth track (foundation / core / advanced)
 * for the current student on a given episode. Defaults to "core".
 */
export function useEpisodeDepthTrack(chapterId?: string | null, episodeId?: string | null): DepthTrack {
  const { user } = useAuth();
  const [track, setTrack] = useState<DepthTrack>("core");

  useEffect(() => {
    let cancelled = false;
    if (!user || !chapterId || !episodeId) return;
    (async () => {
      const { data } = await supabase
        .from("student_rung_state")
        .select("depth_track, updated_at")
        .eq("user_id", user.id)
        .eq("chapter_id", chapterId)
        .eq("episode_id", episodeId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data?.depth_track) {
        setTrack(data.depth_track as DepthTrack);
      }
    })();
    return () => { cancelled = true; };
  }, [user, chapterId, episodeId]);

  return track;
}
