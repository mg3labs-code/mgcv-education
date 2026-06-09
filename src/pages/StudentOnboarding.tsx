import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, Sparkles, ArrowRight, Heart } from 'lucide-react';
import { PILOT_INTEREST_OPTIONS, type PilotInterest } from '@/data/dayPilotContent';

const CLASS_OPTIONS = ['Class 8', 'Class 9', 'Class 10'];
const BOARD_OPTIONS = [
  { id: 'CBSE', label: 'CBSE', sub: 'Central Board' },
  { id: 'Telangana', label: 'Telangana', sub: 'State Board' },
  { id: 'ICSE', label: 'ICSE', sub: 'Council Board' },
  { id: 'Other', label: 'Other', sub: 'Any board' },
];

const SUBJECT_OPTIONS = [
  { id: 'Mathematics', icon: '🔢', color: '#7C3AED' },
  { id: 'Science', icon: '🔬', color: '#059669' },
  { id: 'English', icon: '📖', color: '#2563EB' },
  { id: 'Social Science', icon: '🌍', color: '#F59E0B' },
  { id: 'Hindi', icon: '📝', color: '#EF4444' },
  { id: 'Sanskrit', icon: '📜', color: '#06B6D4' },
  { id: 'Telugu', icon: '🇮🇳', color: '#8B5CF6' },
];

const StudentOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const canContinueStep0 = name.trim().length > 0 && selectedClass && selectedBoard;
  const canContinueStep1 = selectedSubjects.length > 0;

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const profilePayload = {
        user_id: user.id,
        full_name: name.trim(),
        class_name: selectedClass,
        school_name: selectedBoard,
      };

      const { data: existingProfiles, error: profileLookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (profileLookupError) throw profileLookupError;

      const { error: profileError } = (existingProfiles?.length ?? 0) > 0
        ? await supabase
            .from('profiles')
            .update({
              full_name: profilePayload.full_name,
              class_name: profilePayload.class_name,
              school_name: profilePayload.school_name,
            })
            .eq('user_id', user.id)
        : await supabase
            .from('profiles')
            .insert(profilePayload);

      if (profileError) throw profileError;

      const gradeNum = parseInt(selectedClass.replace('Class ', ''));

      const preferencesPayload = {
        user_id: user.id,
        grade: gradeNum,
        interests: selectedSubjects,
        onboarding_completed: true,
        difficulty_level: 'medium',
        preferred_language: 'en',
      };

      const { data: existingPreferences, error: preferenceLookupError } = await supabase
        .from('student_preferences')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (preferenceLookupError) throw preferenceLookupError;

      const { error: prefError } = (existingPreferences?.length ?? 0) > 0
        ? await supabase
            .from('student_preferences')
            .update({
              grade: preferencesPayload.grade,
              interests: preferencesPayload.interests,
              onboarding_completed: preferencesPayload.onboarding_completed,
              difficulty_level: preferencesPayload.difficulty_level,
              preferred_language: preferencesPayload.preferred_language,
            })
            .eq('user_id', user.id)
        : await supabase
            .from('student_preferences')
            .insert(preferencesPayload);

      if (prefError) throw prefError;

      queryClient.setQueryData(["onboarding-status", user.id], true);
      toast.success("You're all set! Let's start learning 🚀");
      navigate('/student');
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (user) {
      await supabase.from('student_preferences').update({ onboarding_completed: true }).eq('user_id', user.id);
      queryClient.setQueryData(["onboarding-status", user.id], true);
    }
    navigate('/student');
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle gradient orbs */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      {/* Skip */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 text-sm text-white/40 hover:text-white/70 transition-colors z-20"
      >
        Skip →
      </button>

      <div className="relative z-10 w-full max-w-md">
        {/* Step 0: Welcome — Name, Class, Board */}
        {step === 0 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <span className="text-5xl block mb-3">👋</span>
              <h1 className="text-2xl font-bold text-white">Welcome to EduTech</h1>
              <p className="text-teal-400 text-sm mt-1">Let's set you up in 30 seconds</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">What should we call you?</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your first name"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all text-sm"
                  autoFocus
                />
              </div>

              {/* Class */}
              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">Your class</label>
                <div className="flex gap-2">
                  {CLASS_OPTIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedClass(c)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                        selectedClass === c
                          ? 'bg-teal-500 text-white border-teal-400 shadow-lg shadow-teal-500/20'
                          : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Board */}
              <div>
                <label className="text-sm font-medium text-white/70 block mb-2">Your board</label>
                <div className="grid grid-cols-2 gap-2">
                  {BOARD_OPTIONS.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBoard(b.id)}
                      className={`py-3 px-3 rounded-xl text-left transition-all border ${
                        selectedBoard === b.id
                          ? 'bg-teal-500/20 border-teal-400 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <span className="font-semibold text-sm block">{b.label}</span>
                      <span className="text-[11px] text-white/40">{b.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Continue */}
              <button
                onClick={() => setStep(1)}
                disabled={!canContinueStep0}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  canContinueStep0
                    ? 'bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-500/20'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-2 mt-6">
              <div className="w-8 h-2 rounded-full bg-teal-500" />
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <div className="w-2 h-2 rounded-full bg-white/20" />
            </div>
          </div>
        )}

        {/* Step 1: Pick favorite subjects */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <span className="text-5xl block mb-3">📚</span>
              <h1 className="text-2xl font-bold text-white">
                What do you love, {name}?
              </h1>
              <p className="text-teal-400 text-sm mt-1">Pick subjects you're excited about</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {SUBJECT_OPTIONS.map(s => {
                  const isSelected = selectedSubjects.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={`py-4 px-4 rounded-xl text-left transition-all border flex items-center gap-3 ${
                        isSelected
                          ? 'border-teal-400 bg-teal-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <span className="text-2xl">{s.icon}</span>
                      <span className="text-sm font-semibold">{s.id}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(0)}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white/50 bg-white/5 border border-white/10 hover:text-white/70 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canContinueStep1}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    canContinueStep1
                      ? 'bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-500/20'
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <div className="w-8 h-2 rounded-full bg-teal-500" />
              <div className="w-2 h-2 rounded-full bg-white/20" />
            </div>
          </div>
        )}

        {/* Step 2: Ready to go! */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <span className="text-5xl block mb-3">🚀</span>
              <h1 className="text-2xl font-bold text-white">You're all set!</h1>
              <p className="text-teal-400 text-sm mt-1">
                {name}, your personalized learning is ready
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
              {/* Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-white/50">Name</span>
                  <span className="text-sm font-semibold text-white">{name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-white/50">Class</span>
                  <span className="text-sm font-semibold text-white">{selectedClass}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-white/50">Board</span>
                  <span className="text-sm font-semibold text-white">{selectedBoard}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-white/50">Subjects</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {selectedSubjects.map(s => {
                      const opt = SUBJECT_OPTIONS.find(o => o.id === s);
                      return (
                        <span key={s} className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">
                          {opt?.icon} {s}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white/50 bg-white/5 border border-white/10 hover:text-white/70 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all"
                >
                  {saving ? (
                    <span className="animate-pulse">Saving...</span>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Start Learning
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <div className="w-8 h-2 rounded-full bg-teal-500" />
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

export default StudentOnboarding;
