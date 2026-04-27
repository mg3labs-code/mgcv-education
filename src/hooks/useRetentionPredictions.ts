import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type RetentionPrediction = Tables<"retention_predictions">;

export type PeerBenchmark = {
  class_name: string;
  concept_key: string;
  concept_label: string;
  sample_size: number;
  student: {
    student_id: string;
    risk_score: number;
    completion_pct: number;
    explain_average: number;
    day1_detective_correct: boolean;
  };
  distribution: {
    avg_risk_score: number;
    avg_explain_score: number;
    avg_completion_pct: number;
    detective_accuracy_pct: number;
  };
  percentile: {
    risk: number | null;
    explain: number | null;
    completion: number | null;
  };
};

export function useRetentionPredictions(chapterId?: string, episodeId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["retention_predictions", user?.id, chapterId, episodeId],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("retention_predictions")
        .select("*")
        .eq("user_id", user!.id)
        .order("risk_score", { ascending: false })
        .order("generated_at", { ascending: false });

      if (chapterId) query = query.eq("chapter_id", chapterId);
      if (episodeId) query = query.eq("episode_id", episodeId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as RetentionPrediction[];
    },
    staleTime: 60_000,
  });
}

export function useGenerateRetentionPrediction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      chapterId?: string;
      episodeId?: string;
      conceptKey?: string;
      conceptLabel?: string;
      studentId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("predict-retention", { body: input });
      if (error) throw error;
      return data as { predictions: RetentionPrediction[] };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["retention_predictions"] });
    },
  });
}

export function usePeerBenchmark() {
  return useMutation({
    mutationFn: async (input: {
      chapterId: string;
      episodeId: string;
      conceptKey?: string;
      conceptLabel?: string;
      studentId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("predict-retention", {
        body: { ...input, action: "benchmark" },
      });
      if (error) throw error;
      return data as { benchmark: PeerBenchmark | null; error?: string };
    },
  });
}
