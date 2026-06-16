import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TEACHER_BOARDS,
  TEACHER_GRADES,
  TEACHER_SECTIONS,
  TEACHER_SUBJECTS,
  type TeachingMapEntry,
  type TeachingRowDraft,
} from "@/data/teacherSubjects";

interface Props {
  value: TeachingMapEntry[];
  onChange: (next: TeachingMapEntry[]) => void;
  disabled?: boolean;
}

const newId = () => Math.random().toString(36).slice(2, 9);

// Convert flat (subject, board, grade, section) rows into draft rows for editing,
// grouping by (subject + board + grade) so the user sees one row per combination
// with sections as a multi-select.
function entriesToDrafts(entries: TeachingMapEntry[]): TeachingRowDraft[] {
  const map = new Map<string, TeachingRowDraft>();
  for (const e of entries) {
    const key = `${e.subject}::${e.board}::${e.grade}`;
    const existing = map.get(key);
    if (existing) {
      if (!existing.sections.includes(e.section)) existing.sections.push(e.section);
    } else {
      map.set(key, {
        id: newId(),
        subject: e.subject,
        board: e.board,
        grade: e.grade,
        sections: [e.section],
      });
    }
  }
  return Array.from(map.values());
}

function draftsToEntries(drafts: TeachingRowDraft[]): TeachingMapEntry[] {
  const out: TeachingMapEntry[] = [];
  const seen = new Set<string>();
  for (const d of drafts) {
    if (!d.subject || !d.board || d.grade == null || d.sections.length === 0) continue;
    for (const s of d.sections) {
      const k = `${d.subject}::${d.board}::${d.grade}::${s}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ subject: d.subject, board: d.board, grade: d.grade, section: s });
    }
  }
  return out;
}

/**
 * Repeatable row builder. Each row = (Subject + Board + Grade + Section(s)).
 * Expands to one teacher_teaching_map row per section on save.
 */
export default function TeacherClassSubjectMatrix({ value, onChange, disabled }: Props) {
  const [drafts, setDrafts] = useState<TeachingRowDraft[]>(() => {
    const d = entriesToDrafts(value);
    return d.length > 0 ? d : [{ id: newId(), subject: "", board: "", grade: null, sections: [] }];
  });

  const sync = (next: TeachingRowDraft[]) => {
    setDrafts(next);
    onChange(draftsToEntries(next));
  };

  const update = (id: string, patch: Partial<TeachingRowDraft>) => {
    sync(drafts.map(d => (d.id === id ? { ...d, ...patch } : d)));
  };

  const toggleSection = (id: string, section: string) => {
    const row = drafts.find(d => d.id === id);
    if (!row) return;
    const sections = row.sections.includes(section)
      ? row.sections.filter(s => s !== section)
      : [...row.sections, section];
    update(id, { sections });
  };

  const addRow = () => sync([...drafts, { id: newId(), subject: "", board: "", grade: null, sections: [] }]);
  const removeRow = (id: string) => sync(drafts.length === 1 ? drafts : drafts.filter(d => d.id !== id));

  const selectClass =
    "w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {drafts.map((row, idx) => (
          <div key={row.id} className="rounded-xl border border-border bg-card p-3 md:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Teaching preference #{idx + 1}</span>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={disabled || drafts.length === 1}
                className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                aria-label="Remove row"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Subject</label>
                <select
                  value={row.subject}
                  onChange={e => update(row.id, { subject: e.target.value })}
                  disabled={disabled}
                  className={selectClass}
                >
                  <option value="">Select subject</option>
                  {TEACHER_SUBJECTS.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Board</label>
                <select
                  value={row.board}
                  onChange={e => update(row.id, { board: e.target.value })}
                  disabled={disabled}
                  className={selectClass}
                >
                  <option value="">Select board</option>
                  {TEACHER_BOARDS.map(b => (
                    <option key={b.code} value={b.code}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Grade</label>
                <select
                  value={row.grade ?? ""}
                  onChange={e => update(row.id, { grade: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={disabled}
                  className={selectClass}
                >
                  <option value="">Select grade</option>
                  {TEACHER_GRADES.map(g => (
                    <option key={g} value={g}>Class {g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Sections</label>
              <div className="flex flex-wrap gap-2">
                {TEACHER_SECTIONS.map(s => {
                  const checked = row.sections.includes(s);
                  return (
                    <label
                      key={s}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs cursor-pointer select-none ${
                        checked ? "bg-primary/10 border-primary text-foreground" : "bg-background border-border text-muted-foreground"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={() => toggleSection(row.id, s)}
                        className="h-3.5 w-3.5"
                      />
                      Section {s}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={disabled}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add another subject / board / grade
      </Button>

      <p className="text-[11px] text-muted-foreground">
        Each row expands into one access entry per ticked section. Students only see the teacher whose row exactly matches their board + grade + section.
      </p>
    </div>
  );
}
