import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ForgotPasswordModalProps {
  onBack: () => void;
  variant?: "card" | "glass";
}

const ForgotPasswordModal = ({ onBack, variant = "card" }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Reset link sent!", description: "Check your email inbox." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === "glass") {
    return (
      <div className="text-center">
        {sent ? (
          <>
            <Mail className="h-12 w-12 text-teal mx-auto mb-4" />
            <h3 className="text-xl text-white font-semibold mb-2">Check Your Email</h3>
            <p className="text-white/70 text-sm mb-6">
              We've sent a password reset link to <strong className="text-teal">{email}</strong>
            </p>
            <button
              onClick={onBack}
              className="text-white/70 text-sm transition-colors hover:text-teal bg-transparent border-none cursor-pointer flex items-center gap-1 mx-auto"
            >
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </button>
          </>
        ) : (
          <>
            <h3 className="text-xl text-teal font-light mb-2">Reset Password</h3>
            <p className="text-white/70 text-sm mb-6">Enter your email to receive a reset link</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="📧 Enter your email"
                  className="w-full py-[18px] px-6 border-none rounded-full bg-white/15 text-white text-base outline-none border-2 border-transparent transition-all placeholder:text-white/60 focus:bg-white/20 focus:border-teal focus:shadow-[0_0_20px_rgba(0,212,170,0.3)]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-[18px] border-none rounded-full bg-gradient-to-br from-teal to-teal-light text-white text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(0,212,170,0.4)] disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <button
              onClick={onBack}
              className="text-white/70 text-sm transition-colors hover:text-teal bg-transparent border-none cursor-pointer mt-4 flex items-center gap-1 mx-auto"
            >
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {sent ? (
        <div className="text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Check Your Email</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We've sent a reset link to <strong>{email}</strong>
          </p>
          <Button variant="outline" onClick={onBack} className="gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Button>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-1">Reset Password</h3>
          <p className="text-sm text-muted-foreground mb-4">Enter your email to receive a reset link</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@school.edu"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground mt-3 flex items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </button>
        </>
      )}
    </div>
  );
};

export default ForgotPasswordModal;
