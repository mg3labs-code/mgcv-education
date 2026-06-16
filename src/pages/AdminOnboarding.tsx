import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, ArrowRight } from 'lucide-react';
import { TEACHER_BOARDS, TEACHER_GRADES } from '@/data/teacherSubjects';
import { Checkbox } from '@/components/ui/checkbox';

const AdminOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [boards, setBoards] = useState<string[]>([]);
  const [grades, setGrades] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && boards.length > 0 && grades.length > 0;

  const toggle = <T,>(arr: T[], v: T, set: (next: T[]) => void) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const save = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).from('admin_profiles').upsert({
        user_id: user.id,
        full_name: name.trim(),
        phone: phone.trim() || null,
        boards,
        grades,
      }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success("Admin profile saved");
      navigate('/admin');
    } catch (err: any) {
      toast.error(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🛠️</span>
          <h1 className="text-2xl font-bold text-white">Admin setup</h1>
          <p className="text-teal-400 text-sm mt-1">Tell us which boards and grades you oversee</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-white/70 block mb-2">Full name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white/70 block mb-2">Phone (optional)</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91…"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white/70 block mb-2">Boards you manage</label>
            <div className="grid grid-cols-2 gap-2">
              {TEACHER_BOARDS.map(b => {
                const checked = boards.includes(b.code);
                return (
                  <label
                    key={b.code}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-sm ${
                      checked ? 'bg-teal-500/15 border-teal-400 text-white' : 'bg-white/5 border-white/10 text-white/60'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(boards, b.code, setBoards)}
                    />
                    {b.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white/70 block mb-2">Grades you oversee</label>
            <div className="flex flex-wrap gap-2">
              {TEACHER_GRADES.map(g => {
                const checked = grades.includes(g);
                return (
                  <label
                    key={g}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm ${
                      checked ? 'bg-teal-500/15 border-teal-400 text-white' : 'bg-white/5 border-white/10 text-white/60'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(grades, g, setGrades)}
                    />
                    Class {g}
                  </label>
                );
              })}
            </div>
          </div>

          <button
            onClick={save}
            disabled={!canSave || saving}
            className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              canSave && !saving
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving…' : (<><Sparkles className="h-4 w-4" /> Finish setup <ArrowRight className="h-4 w-4" /></>)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOnboarding;
