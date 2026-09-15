export type ClassIdentity = {
  board: string;
  grade: number;
  section: string;
};

export const classLabel = (grade: number) => `Class ${grade}`;

export const assignmentKey = ({ board, grade, section }: ClassIdentity) =>
  `${board}::${grade}::${section}`;

export const assignmentLabel = ({ board, grade, section }: ClassIdentity) =>
  `${board} · Class ${grade}${section}`;