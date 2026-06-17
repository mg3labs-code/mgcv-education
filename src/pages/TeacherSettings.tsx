import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
import {
  TEACHER_BOARDS,
  TEACHER_GRADES,
  TEACHER_SECTIONS,
  TEACHER_SUBJECTS,
  type TeachingMapEntry,
} from "@/data/teacherSubjects";

type GroupedCard = {
  key: string;
  subject: string;
  board: string;
  grade: number;
  sections: string[];
};

const subjectMeta = (id: string) =>
  TEACHER_SUBJECTS.find((s) => s.id === id) ?? { id, label: id, icon: "📚" };

const boardLabel = (code: string) =>
  TEACHER_BOARDS.find((b) => b.code === code)?.label ?? code;

function groupEntries(entries: TeachingMapEntry[]): GroupedCard[] {
  const map = new Map<string, GroupedCard>();
  for (const e of entries) {
    const key = `${e.subject}::${e.board}::${e.grade}`;
    const existing = map.get(key);
    if (existing) {
      if (!existing.sections.includes(e.section)) existing.sections.push(e.section);
    } else {
      map.set(key, { key, subject: e.subject, board: e.board, grade: e.grade, sections: [e.section] });
    }
  }
  return Array.from(map.values())
    .map((c) => ({ ...c, sections: c.sections.slice().sort() }))
    .sort((a, b) => a.grade - b.grade || a.subject.localeCompare(b.subject));
}

type EditorState = {
  open: boolean;
  original: GroupedCard | null; // null = add mode
  subject: string;
  board: string;
  grade: number | null;
  sections: string[];
};

const emptyEditor: EditorState = {
  open: false,
  original: null,
  subject: "",
  board: "",
  grade: null,
  sections: [],
};

const TeacherSettings = () => {
  const { user } = useAuth();
  const { entries, refetch, loading } = useTeacherAssignments();
  const cards = useMemo(() => groupEntries(entries), [entries]);

  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GroupedCard | null>(null);

  const openAdd = () =>
    setEditor({ open: true, original: null, subject: "", board: "", grade: null, sections: [] });

  const openEdit = (card: GroupedCard) =>
    setEditor({
      open: true,
      original: card,
      subject: card.subject,
      board: card.board,
      grade: card.grade,
      sections: card.sections.slice(),
    });

  const close = () => setEditor((s) => ({ ...s, open: false }));

  const toggleSection = (s: string) =>
    setEditor((e) => ({
      ...e,
      sections: e.sections.includes(s) ? e.sections.filter((x) => x !== s) : [...e.sections, s],
    }));

  const deleteCard = async (card: GroupedCard) => {
    if (!user) return;
    const { error } = await (supabase as any)
      .from("teacher_teaching_map")
      .delete()
      .eq("teacher_id", user.id)
      .eq("subject", card.subject)
      .eq("board", card.board)
      .eq("grade", card.grade);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Preference removed" });
    await refetch();
  };

  const save = async () => {
    if (!user) return;
    if (!editor.subject || !editor.board || editor.grade == null || editor.sections.length === 0) {
      toast({
        title: "Missing fields",
        description: "Pick a subject, board, grade and at least one section.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      // Replace strategy: delete the old (subject,board,grade) bucket, then insert
      // the new section set. This keeps add + edit on one simple path.
      const target = editor.original ?? {
        subject: editor.subject,
        board: editor.board,
        grade: editor.grade,
      };

      const { error: delErr } = await (supabase as any)
        .from("teacher_teaching_map")
        .delete()
        .eq("teacher_id", user.id)
        .eq("subject", target.subject)
        .eq("board", target.board)
        .eq("grade", target.grade);
      if (delErr) throw delErr;

      // If the user changed subject/board/grade during an edit, the new combo
      // might already exist — clear it too so we don't hit the unique key.
      if (
        editor.original &&
        (editor.original.subject !== editor.subject ||
          editor.original.board !== editor.board ||
          editor.original.grade !== editor.grade)
      ) {
        await (supabase as any)
          .from("teacher_teaching_map")
          .delete()
          .eq("teacher_id", user.id)
          .eq("subject", editor.subject)
          .eq("board", editor.board)
          .eq("grade", editor.grade);
      }

      const rows = editor.sections.map((section) => ({
        teacher_id: user.id,
        subject: editor.subject,
        board: editor.board,
        grade: editor.grade,
        section,
      }));
      const { error: insErr } = await (supabase as any)
        .from("teacher_teaching_map")
        .insert(rows);
      if (insErr) throw insErr;

      toast({ title: editor.original ? "Preference updated" : "Preference saved" });
      await refetch();
      close();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    "w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <DashboardLayout
      role="teacher"
      breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "My Profile" }]}
    >
      <main className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-sm text-muted-foreground">
              Subjects, boards, grades and sections you teach.
            </p>
          </div>
          <Button onClick={openAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add preference
          </Button>
        </div>

        {loading ? (
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center space-y-3">
            <BookOpen className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">No teaching preferences yet</p>
              <p className="text-sm text-muted-foreground">
                Add the subjects and classes you teach so students can find you.
              </p>
            </div>
            <Button onClick={openAdd} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add your first preference
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cards.map((card) => {
              const meta = subjectMeta(card.subject);
              return (
                <div
                  key={card.key}
                  className="relative rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
                >
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(card)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      aria-label="Edit preference"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(card)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      aria-label="Delete preference"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-start gap-3 pr-16">
                    <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{meta.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {boardLabel(card.board)} · Class {card.grade}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {card.sections.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium"
                      >
                        Section {s}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add / Edit dialog */}
      <Dialog open={editor.open} onOpenChange={(o) => (o ? null : close())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editor.original ? "Edit teaching preference" : "Add teaching preference"}
            </DialogTitle>
            <DialogDescription>
              One preference = a subject you teach for a board, grade and the sections you cover.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Subject</label>
              <select
                value={editor.subject}
                onChange={(e) => setEditor((s) => ({ ...s, subject: e.target.value }))}
                className={selectClass}
              >
                <option value="">Select subject</option>
                {TEACHER_SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Board</label>
                <select
                  value={editor.board}
                  onChange={(e) => setEditor((s) => ({ ...s, board: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">Select board</option>
                  {TEACHER_BOARDS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Grade</label>
                <select
                  value={editor.grade ?? ""}
                  onChange={(e) =>
                    setEditor((s) => ({ ...s, grade: e.target.value ? parseInt(e.target.value) : null }))
                  }
                  className={selectClass}
                >
                  <option value="">Select grade</option>
                  {TEACHER_GRADES.map((g) => (
                    <option key={g} value={g}>
                      Class {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Sections</label>
              <div className="flex flex-wrap gap-2">
                {TEACHER_SECTIONS.map((s) => {
                  const checked = editor.sections.includes(s);
                  return (
                    <label
                      key={s}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs cursor-pointer select-none ${
                        checked
                          ? "bg-primary/10 border-primary text-foreground"
                          : "bg-background border-border text-muted-foreground"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleSection(s)}
                        className="h-3.5 w-3.5"
                      />
                      Section {s}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving…
                </>
              ) : editor.original ? (
                "Save changes"
              ) : (
                "Save preference"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => (o ? null : setDeleting(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this preference?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (
                <>
                  Students in <strong>{boardLabel(deleting.board)} · Class {deleting.grade}</strong>{" "}
                  sections {deleting.sections.join(", ")} will no longer see you as their{" "}
                  {subjectMeta(deleting.subject).label} teacher.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleting) await deleteCard(deleting);
                setDeleting(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default TeacherSettings;
