// Canonical lookups used in teacher signup / settings and to scope access.

export const TEACHER_CLASSES = [
  "Class 7",
  "Class 8",
  "Class 9",
] as const;

export const TEACHER_GRADES = [7, 8, 9] as const;

export const TEACHER_BOARDS = [
  { code: "CBSE", label: "CBSE" },
  { code: "ICSE", label: "ICSE" },
  { code: "BSE_TELANGANA", label: "BSE Telangana" },
  { code: "IB", label: "IB" },
  { code: "IGCSE", label: "IGCSE" },
] as const;

export const TEACHER_SECTIONS = ["A", "B", "C", "D", "E", "F"] as const;

export const TEACHER_SUBJECTS = [
  { id: "Mathematics", label: "Mathematics", icon: "🔢" },
  { id: "Science", label: "Science", icon: "🔬" },
  { id: "Physics", label: "Physics", icon: "⚛️" },
  { id: "Chemistry", label: "Chemistry", icon: "🧪" },
  { id: "Biology", label: "Biology", icon: "🧬" },
  { id: "Social Science", label: "Social Science", icon: "🌍" },
  { id: "English", label: "English", icon: "📖" },
  { id: "Hindi", label: "Hindi", icon: "🇮🇳" },
  { id: "Sanskrit", label: "Sanskrit", icon: "📜" },
  { id: "Telugu", label: "Telugu", icon: "🪔" },
] as const;

// Legacy row used by older UI: one (class_name, subject) pair.
export type TeacherAssignment = { class_name: string; subject: string };

// New canonical row in `teacher_teaching_map`.
export type TeachingMapEntry = {
  subject: string;
  board: string;
  grade: number;
  section: string;
};

// A row in the builder UI — sections are picked as a multi-select then expanded
// into one TeachingMapEntry per section before being persisted.
export type TeachingRowDraft = {
  id: string;       // local-only key
  subject: string;
  board: string;
  grade: number | null;
  sections: string[];
};
