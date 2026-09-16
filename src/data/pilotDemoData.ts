import type { TeachingMapEntry } from "@/data/teacherSubjects";

export type ExplanationBand = "Needs support" | "Developing" | "Strong";

export type TeacherExplanation = {
  student_id: string;
  student_name: string;
  board: string;
  grade: number;
  section: string;
  chapter_id: string;
  episode_id: string;
  chapter_title: string;
  episode_title: string;
  explanation: string;
  score: number;
  band: ExplanationBand;
  feedback: string;
  next_step: string;
  completed_at: string;
};

export const PILOT_DEMO_ASSIGNMENTS: TeachingMapEntry[] = [
  { subject: "Mathematics", board: "CBSE", grade: 9, section: "A" },
];

export const PILOT_DEMO_EXPLANATIONS: TeacherExplanation[] = [
  {
    student_id: "demo-ananya",
    student_name: "Ananya Reddy",
    board: "CBSE",
    grade: 9,
    section: "A",
    chapter_id: "ch1",
    episode_id: "ch1-ep2",
    chapter_title: "Real Numbers",
    episode_title: "Finding the pattern",
    explanation: "A rational number ends or repeats because division eventually gives a remainder we have already seen. Then the same steps repeat, so the digits repeat too.",
    score: 91,
    band: "Strong",
    feedback: "Clear reasoning with the remainder pattern explained in the student's own words.",
    next_step: "Ask for one terminating and one repeating example.",
    completed_at: "2026-09-15T08:20:00.000Z",
  },
  {
    student_id: "demo-arjun",
    student_name: "Arjun Kumar",
    board: "CBSE",
    grade: 9,
    section: "A",
    chapter_id: "ch1",
    episode_id: "ch1-ep2",
    chapter_title: "Real Numbers",
    episode_title: "Finding the pattern",
    explanation: "It repeats because rational numbers have patterns after the decimal. Irrational numbers do not have a pattern.",
    score: 64,
    band: "Developing",
    feedback: "The comparison is useful, but the reason the pattern repeats is still missing.",
    next_step: "Use long division and track the remainders.",
    completed_at: "2026-09-15T08:12:00.000Z",
  },
  {
    student_id: "demo-meera",
    student_name: "Meera Sharma",
    board: "CBSE",
    grade: 9,
    section: "A",
    chapter_id: "ch1",
    episode_id: "ch1-ep2",
    chapter_title: "Real Numbers",
    episode_title: "Finding the pattern",
    explanation: "The decimal repeats because the denominator is bigger and keeps dividing again.",
    score: 38,
    band: "Needs support",
    feedback: "This identifies division but does not yet explain why a repeated remainder creates repeated digits.",
    next_step: "Show 1 ÷ 3 and circle each repeated remainder.",
    completed_at: "2026-09-15T08:05:00.000Z",
  },
];

export const PILOT_DEMO_ROSTER = [
  "Ananya Reddy", "Arjun Kumar", "Meera Sharma", "Rohan Patel", "Saanvi Rao", "Vikram Singh",
  "Ishita Nair", "Aditya Verma", "Kavya Iyer", "Rahul Das", "Nisha Gupta", "Sai Charan",
];