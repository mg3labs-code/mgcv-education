import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, ArrowRight } from 'lucide-react';

const BOARD_OPTIONS = [
  { id: 'CBSE', label: 'CBSE' },
  { id: 'ICSE', label: 'ICSE' },
  { id: 'BSE_TELANGANA', label: 'BSE Telangana' },
  { id: 'IB', label: 'IB' },
  { id: 'IGCSE', label: 'IGCSE' },
];
const GRADE_OPTIONS = [7, 8, 9];
const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

const StudentOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [board, setBoard] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [section, setSection] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [saving, setSaving] = useState(false);

  const canContinue = name.trim().length > 0 && board && grade !== null && section;

  const handleComplete = async () => {
    if (!user || !canContinue) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('student_profiles')
        .upsert({
          user_id: user.id,
          full_name: name.trim(),
          board,
          grade,
          section,
          school_name: schoolName.trim() || null,
        }, { onConflict: 'user_id' });
      if (error) throw error;

      await (supabase as any)
        .from('student_preferences')
        .upsert({
          user_id: user.id,
          grade,
          onboarding_completed: true,
          difficulty_level: 'medium',
          preferred_language: 'en',
        }, { onConflict: 'user_id' });

      queryClient.setQueryData(['onboarding-status', user.id], true);
      toast.success("You're all set! Let's start learning 🚀");
      navigate('/student');
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      toast.error(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (user) {
      await (supabase as any).from('student_preferences').update({ onboarding_completed: true }).eq('user_id', user.id);
      queryClient.setQueryData(['onboarding-status', user.id], true);
    }
    navigate('/student');
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 text-sm text-white/40 hover:text-white/70 transition-colors z-20"
      >
        Skip →
      </button>

      <div className="relative z-10 w-full max-w-md">
        {step === 0 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <span className="text-5xl block mb-3">👋</span>
              <h1 className="text-2xl font-bold text-white">Welcome to EduTech</h1>
              <p className="text-teal-400 text-sm mt-1">Tell us where you study</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your first name"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-teal-500/50 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">Board</label>
                <select
                  value={board}
                  onChange={e => setBoard(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm"
                >
                  <option value="" className="bg-[#1a1a2e]">Select board</option>
                  {BOARD_OPTIONS.map(b => (
                    <option key={b.id} value={b.id} className="bg-[#1a1a2e]">{b.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-white/70 block mb-2">Grade</label>
                  <select
                    value={grade ?? ''}
                    onChange={e => setGrade(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm"
                  >
                    <option value="" className="bg-[#1a1a2e]">Select</option>
                    {GRADE_OPTIONS.map(g => (
                      <option key={g} value={g} className="bg-[#1a1a2e]">Class {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 block mb-2">Section</label>
                  <select
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm"
                  >
                    <option value="" className="bg-[#1a1a2e]">Select</option>
                    {SECTION_OPTIONS.map(s => (
                      <option key={s} value={s} className="bg-[#1a1a2e]">{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">School (optional)</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                  placeholder="Your school name"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 text-sm"
                />
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!canContinue}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  canContinue
                    ? 'bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-500/20'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <span className="text-5xl block mb-3">🚀</span>
              <h1 className="text-2xl font-bold text-white">You're all set!</h1>
              <p className="text-teal-400 text-sm mt-1">{name}, your personalized learning is ready</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="space-y-3">
                <Row label="Name" value={name} />
                <Row label="Board" value={BOARD_OPTIONS.find(b => b.id === board)?.label ?? board} />
                <Row label="Class" value={`Class ${grade}`} />
                <Row label="Section" value={section} />
                {schoolName && <Row label="School" value={schoolName} />}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(0)}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white/50 bg-white/5 border border-white/10 hover:text-white/70"
                >
                  ← Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20"
                >
                  {saving ? <span className="animate-pulse">Saving...</span> : (<><Sparkles className="h-4 w-4" /> Start Learning</>)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5">
    <span className="text-sm text-white/50">{label}</span>
    <span className="text-sm font-semibold text-white">{value}</span>
  </div>
);

export default StudentOnboarding;
