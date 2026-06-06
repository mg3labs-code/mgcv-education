import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { useChapters, useSubjects } from "@/hooks/useTextbookData";
import { useUserEpisodeProgress, getChapterProgress } from "@/hooks/useEpisodeProgress";
import { BookOpen, Clock, FileText, Lock, ChevronRight, ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ListSkeleton } from "@/components/PageSkeleton";
import EmptyState from "@/components/EmptyState";
import { useState } from "react";
import { ROUTES } from "@/lib/routes";

const JOURNEY_STEPS = [
  { label: "Dashboard", emoji: "🧠", desc: "See your Inner OS" },
  { label: "Learn Episode", emoji: "📚", desc: "7-layer deep learning" },
  { label: "Apply Method", emoji: "🎓", desc: "Research-proven tools" },
  { label: "Track Growth", emoji: "📈", desc: "Watch dimensions grow" },
  { label: "Next Episode", emoji: "🚀", desc: "Keep the momentum" },
];

const StudentTextbook = () => {
  const navigate = useNavigate();
  const { data: rawSubjects, isLoading: subjectsLoading } = useSubjects();
  // Filter out generic "Science" — dedicated Chemistry/Physics/Biology cover it
  const subjects = rawSubjects?.filter(s => s.name !== "Science");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const { data: chapters, isLoading: chaptersLoading } = useChapters(selectedSubject);
  const { data: progressMap } = useUserEpisodeProgress();

  const isLoading = subjectsLoading || chaptersLoading;

  const breadcrumbs = [
    { label: "Dashboard", href: "/student" },
    { label: "Textbook" },
  ];

  return (
    <PageLayout role="student" breadcrumbItems={breadcrumbs}>
      <div className="w-full max-w-[1280px] mx-auto">

        {/* ── Learning Journey Flow — desktop only (hidden on mobile to reduce clutter) ── */}
        <div className="hidden md:block mb-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-2xl p-5 md:p-6">
          <h2 className="text-base font-bold text-foreground text-center mb-4">🗺️ Your Learning Journey</h2>
          <div className="flex items-center justify-between gap-1">
            {JOURNEY_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center min-w-0 flex-1">
                <div className="flex flex-col items-center text-center flex-1 min-w-0 px-1">
                  <div className="w-11 h-11 rounded-full bg-white border-2 border-primary/30 flex items-center justify-center text-xl shadow-sm mb-1.5">
                    {step.emoji}
                  </div>
                  <span className="text-xs font-semibold text-foreground truncate w-full">{step.label}</span>
                  <span className="text-[10px] text-muted-foreground truncate w-full">{step.desc}</span>
                </div>
                {i < JOURNEY_STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-primary/40 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Header — compact on mobile */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">📚 My Textbook</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Class X · Telangana State Board</p>
            </div>
          </div>
          <p className="hidden md:block text-muted-foreground mt-2 text-sm">
            Every chapter transformed into bite-sized episodes. Read, interact, recall & master — at your own pace.
          </p>
        </div>

        {/* Subject Tabs */}
        {subjects && subjects.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedSubject === s.name
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && <ListSkeleton rows={5} />}

        {/* Chapter Grid */}
        {!isLoading && chapters && (
          <div className="space-y-3">
            {chapters.map((chapter) => {
              const hasEpisodes = chapter.episodes.length > 0;
              const episodeCount = chapter.episodes.length;
              const episodeSlugs = chapter.episodes.map((e) => e.id);
              const chProg = getChapterProgress(progressMap, chapter.id, episodeSlugs);
              const isComplete = hasEpisodes && chProg.completed === chProg.total;
              const showResume = hasEpisodes && chProg.completed > 0 && !isComplete;

              const handleClick = () => {
                if (!hasEpisodes) return;
                if (showResume && chProg.resumeEpisodeSlug) {
                  navigate(ROUTES.textbook.episode(chapter.id, chProg.resumeEpisodeSlug));
                } else {
                  navigate(ROUTES.textbook.chapter(chapter.id));
                }
              };

              return (
                <button
                  key={chapter.id}
                  onClick={handleClick}
                  disabled={!hasEpisodes}
                  className={`w-full text-left rounded-xl border p-5 transition-all group ${
                    hasEpisodes
                      ? "bg-card hover:shadow-md hover:border-primary/30 cursor-pointer"
                      : "bg-muted/30 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 relative"
                      style={{ backgroundColor: chapter.color }}
                    >
                      {chapter.number}
                      {isComplete && (
                        <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success flex items-center justify-center border-2 border-card">
                          <CheckCircle2 className="h-3 w-3 text-success-foreground" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">{chapter.title}</h3>
                        {!hasEpisodes && (
                          <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                            <Lock className="h-3 w-3" /> Coming Soon
                          </span>
                        )}
                        {isComplete && (
                          <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </span>
                        )}
                        {showResume && (
                          <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                            <PlayCircle className="h-3 w-3" /> Resume
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{chapter.subtitle}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {chapter.periods} periods
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Pages {chapter.pageRange}
                        </span>
                        {hasEpisodes && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> {chProg.completed}/{episodeCount} episodes
                          </span>
                        )}
                      </div>
                      {hasEpisodes && (
                        <div className="mt-2">
                          <Progress value={chProg.pct} className="h-1.5" />
                        </div>
                      )}
                    </div>
                    {hasEpisodes && (
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default StudentTextbook;
