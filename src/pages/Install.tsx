import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Share,
  Plus,
  Check,
  Sparkles,
  Brain,
  Trophy,
  Star,
  ShieldCheck,
  Zap,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export default function Install() {
  const { canInstall, isIOS, isAndroid, isInstalled, promptInstall } = useInstallPrompt();

  const shareLink = async () => {
    const url = window.location.origin + "/install";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "MGCV Elite Learning",
          text: "India's most advanced AI tutor for Class 6-10. Install free.",
          url,
        });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Install link copied to clipboard");
    }
  };

  useEffect(() => {
    document.title = "Install MGCV Elite Learning — AI Tutor for Class 6-10";
    const meta = document.querySelector('meta[name="description"]');
    if (meta)
      meta.setAttribute(
        "content",
        "Install MGCV Elite Learning on your phone. India's most advanced AI tutor for Class 6-10 — 7-layer deep learning, exam mastery, free to install.",
      );
  }, []);

  const features = [
    { icon: Brain, title: "AI Study Companion", desc: "Personal tutor 24/7" },
    { icon: Trophy, title: "Exam Mastery", desc: "Board + JEE ready" },
    { icon: Sparkles, title: "7-Layer Learning", desc: "Deep understanding" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <header className="relative border-b border-border/40 bg-card/40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className="font-serif text-lg font-bold text-foreground">
              MGCV <span className="text-primary">Elite</span>
            </span>
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Home
          </Link>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 py-10 md:py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide">
              ELITE LEARNING · CLASS 6-10
            </span>
          </div>

          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-3xl" />
            <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-1 shadow-2xl">
              <img
                src="/icons/icon-512.png"
                alt="MGCV Elite Learning app icon"
                className="h-full w-full rounded-[1.3rem] object-cover"
              />
            </div>
          </div>

          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
            MGCV <span className="text-primary">Elite Learning</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            India's most advanced AI tutor. Install in one tap — opens like a real app, updates
            instantly, free for students.
          </p>

          {/* Rating row */}
          <div className="flex items-center justify-center gap-4 mt-6 text-sm">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-1 font-semibold text-foreground">4.9</span>
            </div>
            <span className="h-4 w-px bg-border" />
            <span className="text-muted-foreground">10,000+ students</span>
            <span className="h-4 w-px bg-border hidden sm:block" />
            <span className="text-muted-foreground hidden sm:inline">Editor's Pick</span>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto mb-10">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group relative p-4 md:p-5 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-sm text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* Install card */}
        <Card className="relative overflow-hidden p-6 md:p-10 max-w-2xl mx-auto mb-8 border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

          {isInstalled ? (
            <div className="text-center py-6">
              <div className="inline-flex h-16 w-16 rounded-full bg-emerald-500/10 items-center justify-center mb-4 ring-4 ring-emerald-500/20">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">You're all set</h2>
              <p className="text-muted-foreground mb-5">
                MGCV Elite is installed. Open it from your home screen anytime.
              </p>
              <Button asChild size="lg">
                <Link to="/student">Open dashboard</Link>
              </Button>
            </div>
          ) : isIOS ? (
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
                Install on iPhone / iPad
              </h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Apple needs 3 quick taps in Safari — that's it.
              </p>
              <ol className="space-y-4">
                {[
                  {
                    n: 1,
                    title: (
                      <>
                        Tap the <Share className="h-4 w-4 inline mx-1" /> Share button
                      </>
                    ),
                    desc: "It's at the bottom of Safari (top on iPad).",
                  },
                  {
                    n: 2,
                    title: (
                      <>
                        Scroll → tap <Plus className="h-4 w-4 inline mx-1" /> Add to Home Screen
                      </>
                    ),
                    desc: 'You\'ll see "MGCV Elite" with our icon.',
                  },
                  {
                    n: 3,
                    title: <>Tap Add</>,
                    desc: "MGCV Elite lands on your home screen — fullscreen, app-like.",
                  },
                ].map((s) => (
                  <li key={s.n} className="flex gap-4">
                    <span className="shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold flex items-center justify-center text-sm shadow-lg">
                      {s.n}
                    </span>
                    <div className="pt-1">
                      <p className="font-medium text-foreground">{s.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground mt-6 p-3 rounded-lg bg-muted/50 border border-border/50">
                Use <strong>Safari</strong>. Chrome on iPhone can't install web apps (Apple's rule).
              </p>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
                Install on Android
              </h2>
              <p className="text-muted-foreground mb-7">
                One tap. MGCV Elite lands on your home screen with its own icon.
              </p>
              {canInstall ? (
                <Button
                  size="lg"
                  onClick={promptInstall}
                  className="w-full sm:w-auto h-14 px-8 text-base shadow-lg shadow-primary/30"
                >
                  <Download className="h-5 w-5 mr-2" /> Install MGCV Elite — Free
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Open this page in <strong>Chrome</strong> or <strong>Edge</strong> on Android,
                    then menu (⋮) → <em>Install app</em>.
                  </p>
                  {!isAndroid && (
                    <Button variant="outline" onClick={shareLink} size="lg">
                      <Share className="h-4 w-4 mr-2" /> Send install link to phone
                    </Button>
                  )}
                </div>
              )}

              {/* Trust strip */}
              <div className="mt-7 pt-6 border-t border-border/50 grid grid-cols-3 gap-2 text-xs">
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Safe & verified</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Instant updates</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <Wifi className="h-4 w-4 text-primary" />
                  <span>Light on data</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Share */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Sharing with a parent, student, or school?
          </p>
          <Button variant="outline" onClick={shareLink}>
            <Share className="h-4 w-4 mr-2" /> Share install link
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-12">
          © MGCV Elite Learning · Built for India's curious minds
        </p>
      </main>
    </div>
  );
}
