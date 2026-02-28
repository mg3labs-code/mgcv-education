import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await signIn(email, password);
        toast({ title: "Welcome back!" });
        return;
      } catch (err: any) {
        const isNetworkError =
          err.message === "Failed to fetch" ||
          err.message?.includes("NetworkError") ||
          err.message?.includes("network") ||
          err.code === "ECONNABORTED";

        if (isNetworkError && attempt < maxRetries) {
          toast({
            title: "Connection issue",
            description: `Retrying… (${attempt}/${maxRetries})`,
          });
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }

        toast({
          title: "Error",
          description: isNetworkError
            ? "Unable to reach the server. Please check your connection and try again."
            : err.message,
          variant: "destructive",
        });
        return;
      } finally {
        if (attempt === maxRetries || true) setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-serif text-foreground">EduTech</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8">
          {showForgot ? (
            <ForgotPasswordModal onBack={() => setShowForgot(false)} />
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@school.edu"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Please wait..." : "Sign In"}
                </Button>
              </form>
              <button
                onClick={() => setShowForgot(true)}
                className="text-sm text-muted-foreground hover:text-foreground mt-4 bg-transparent border-none cursor-pointer"
              >
                Forgot Password?
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Educational Technology Platform
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
