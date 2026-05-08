import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

const DISMISS_KEY = "mgcv:install-banner-dismissed-at";
const DISMISS_DAYS = 7;

export default function InstallBanner() {
  const { canInstall, isIOS, isAndroid, isInstalled, promptInstall } = useInstallPrompt();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isInstalled) return;
    const isMobile = isIOS || isAndroid;
    if (!isMobile) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const fresh = Date.now() - dismissedAt > DISMISS_DAYS * 24 * 60 * 60 * 1000;
    if (!fresh) return;

    const t = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(t);
  }, [isIOS, isAndroid, isInstalled]);

  if (!show || isInstalled) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  const handleInstall = async () => {
    if (canInstall) {
      const result = await promptInstall();
      if (result === "accepted") setShow(false);
    }
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 md:hidden animate-in slide-in-from-bottom-4">
      <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl p-4 flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Install MGCV</p>
          <p className="text-xs text-muted-foreground truncate">
            {isIOS ? "Add to Home Screen — opens like an app" : "Open like a real app, no Play Store needed"}
          </p>
        </div>
        {isIOS ? (
          <Button asChild size="sm" variant="default">
            <Link to="/install">
              <Share className="h-4 w-4 mr-1" /> How
            </Link>
          </Button>
        ) : canInstall ? (
          <Button size="sm" onClick={handleInstall}>
            Install
          </Button>
        ) : (
          <Button asChild size="sm" variant="default">
            <Link to="/install">Install</Link>
          </Button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
