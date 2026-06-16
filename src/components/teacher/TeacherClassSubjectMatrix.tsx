import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { TEACHER_CLASSES, TEACHER_SUBJECTS, type TeacherAssignment } from "@/data/teacherSubjects";

interface Props {
  value: TeacherAssignment[];
  onChange: (next: TeacherAssignment[]) => void;
  disabled?: boolean;
}

/**
 * A class × subject checkbox grid. Each ticked cell becomes one
 * (class_name, subject) row in `teacher_assignments`.
 */
export default function TeacherClassSubjectMatrix({ value, onChange, disabled }: Props) {
  const selected = useMemo(() => {
    const m = new Set<string>();
    value.forEach(v => m.add(`${v.class_name}::${v.subject}`));
    return m;
  }, [value]);

  const toggle = (className: string, subject: string) => {
    const key = `${className}::${subject}`;
    if (selected.has(key)) {
      onChange(value.filter(v => !(v.class_name === className && v.subject === subject)));
    } else {
      onChange([...value, { class_name: className, subject }]);
    }
  };

  return (
    <div className="border border-border rounded-xl overflow-x-auto bg-card">
      <table className="w-full text-xs">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left p-2 font-semibold sticky left-0 bg-muted/40 z-10">Class \ Subject</th>
            {TEACHER_SUBJECTS.map(s => (
              <th key={s.id} className="p-2 font-medium text-center whitespace-nowrap">
                <span className="mr-1">{s.icon}</span>{s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TEACHER_CLASSES.map(cls => (
            <tr key={cls} className="border-t border-border/40">
              <td className="p-2 font-semibold sticky left-0 bg-card z-10">{cls}</td>
              {TEACHER_SUBJECTS.map(s => {
                const checked = selected.has(`${cls}::${s.id}`);
                return (
                  <td key={s.id} className="p-2 text-center">
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => toggle(cls, s.id)}
                      aria-label={`${cls} ${s.label}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-muted-foreground px-3 py-2 border-t border-border/40">
        Tick every (class, subject) you teach. You can only create or change calendar entries, assignments, and attendance for the boxes you tick.
      </p>
    </div>
  );
}
