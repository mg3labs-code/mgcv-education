import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Download, Share, Plus, Check, Smartphone, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export default function Install() {
  const { canInstall, isIOS, isAndroid, isInstalled, promptInstall } = useInstallPrompt();

  const shareLink = async () => {
    const url = window.location.origin + "/install";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Install MGCV", url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Install link copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Helmet>
        <title>Install MGCV — AI Learning App for Class 6-10</title>
        <meta
          name="description"
          content="Install MGCV on your phone in one tap. Works like a real app, no Play Store needed. Free for students."
        />
      </Helmet>

      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold text-foreground">
            MGCV
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 md:py-16">
        <div className="text-center mb-10">
          <div className="inline-flex h-20 w-20 rounded-3xl bg-primary/10 items-center justify-center mb-5">
            <img
              src="/icons/icon-512.png"
              alt="MGCV"
              width={80}
              height={80}
              className="rounded-3xl"
              loading="lazy"
            />
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-3">
            Get MGCV on your phone
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Install in one tap. Opens like a real app. No Play Store, no sign-up to install,
            updates instantly.
          </p>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto mb-10">
          {[
            { icon: Shield, label: "No Play Store needed" },
            { icon: Zap, label: "Free & instant" },
            { icon: Smartphone, label: "Works on Android & iOS" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center text-center p-3 rounded-xl bg-card border border-border/50"
            >
              <Icon className="h-5 w-5 text-primary mb-2" />
              <span className="text-xs font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Install card */}
        <Card className="p-6 md:p-8 max-w-2xl mx-auto mb-8">
          {isInstalled ? (
            <div className="text-center py-6">
              <div className="inline-flex h-14 w-14 rounded-full bg-emerald-500/10 items-center justify-center mb-4">
                <Check className="h-7 w-7 text-emerald-500" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">MGCV is installed</h2>
              <p className="text-muted-foreground mb-5">
                You're already using the installed app. Open it from your home screen anytime.
              </p>
              <Button asChild>
                <Link to="/student">Open dashboard</Link>
              </Button>
            </div>
          ) : isIOS ? (
            <div>
              <h2 className="font-serif text-2xl font-bold mb-1">Install on iPhone / iPad</h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Apple doesn't allow one-tap install. It takes 3 short taps in Safari:
              </p>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-foreground">
                      Tap the <Share className="h-4 w-4 inline mx-1" /> Share button
                    </p>
                    <p className="text-sm text-muted-foreground">
                      It's at the bottom of Safari (or top, on iPad).
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-foreground">
                      Scroll down → tap <Plus className="h-4 w-4 inline mx-1" /> Add to Home Screen
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You'll see "MGCV" with our icon.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Tap Add</p>
                    <p className="text-sm text-muted-foreground">
                      MGCV will appear on your home screen. Tap it to open fullscreen.
                    </p>
                  </div>
                </li>
              </ol>
              <p className="text-xs text-muted-foreground mt-6 p-3 rounded-lg bg-muted/50">
                Make sure you're using <strong>Safari</strong>. Chrome on iPhone can't install
                web apps (Apple's rule).
              </p>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="font-serif text-2xl font-bold mb-2">Install on Android</h2>
              <p className="text-muted-foreground mb-6">
                One tap. MGCV will land on your home screen with its own icon.
              </p>
              {canInstall ? (
                <Button size="lg" onClick={promptInstall} className="w-full sm:w-auto">
                  <Download className="h-5 w-5 mr-2" /> Install MGCV
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Open this page in <strong>Chrome</strong> or <strong>Edge</strong> on your
                    Android phone, then tap the menu (⋮) → <em>Install app</em> or{" "}
                    <em>Add to Home screen</em>.
                  </p>
                  {!isAndroid && (
                    <Button variant="outline" onClick={shareLink}>
                      Share install link to your phone
                    </Button>
                  )}
                </div>
              )}
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
      </main>
    </div>
  );
}
