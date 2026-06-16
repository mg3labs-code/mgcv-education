// Canonical list of classes & subjects used in the teacher signup / settings matrix
// and to scope content access in the rest of the app.

export const TEACHER_CLASSES = [
  "Class 7",
  "Class 8",
  "Class 9",
] as const;

export const TEACHER_SUBJECTS = [
  { id: "Mathematics", label: "Mathematics", icon: "🔢" },
  { id: "Science", label: "Science", icon: "🔬" },
  { id: "Social Science", label: "Social Science", icon: "🌍" },
  { id: "English", label: "English", icon: "📖" },
  { id: "Hindi", label: "Hindi", icon: "🇮🇳" },
  { id: "Telugu", label: "Telugu", icon: "🪔" },
] as const;

export type TeacherAssignment = { class_name: string; subject: string };
