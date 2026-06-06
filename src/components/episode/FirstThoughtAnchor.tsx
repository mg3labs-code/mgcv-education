import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  conceptKey?: string | null;
  /** Only show on Day 2 / Day 3. */
  viewDay: 1 | 2 | 3;
}

/**
 * FirstThoughtAnchor — visible card under the ladder on Day 2 / Day 3
 * that echoes the student's Day-1 first thought verbatim from the DB.
 * Quiet, single-line, never blocking.
 */
const FirstThoughtAnchor = ({ conceptKey, viewDay }: Props) => {
  const { user } = useAuth();
  const [thought, setThought] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    if (!user || !conceptKey || viewDay === 1) {
      setThought("");
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("curiosity_arc_progress")
        .select("day1_first_thought")
        .eq("user_id", user.id)
        .eq("concept_key", conceptKey)
        .maybeSingle();
      if (!cancelled) setThought((data?.day1_first_thought as string) ?? "");
    })();
    return () => { cancelled = true; };
  }, [user, conceptKey, viewDay]);

  if (viewDay === 1 || !thought.trim()) return null;

  const label = viewDay === 2 ? "Yesterday you wondered" : "Where you started";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 -mt-1 pb-3"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/5 px-4 py-2.5">
        <Quote className="h-3.5 w-3.5 mt-1 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            {label}
          </div>
          <p className="text-sm font-medium text-foreground/90 leading-snug truncate">
            "{thought}"
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default FirstThoughtAnchor;
