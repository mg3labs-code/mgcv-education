import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ForgotPasswordModalProps {
  onBack: () => void;
  variant?: "card" | "glass";
  accountType?: "student" | "teacher";
}

const ForgotPasswordModal = ({ onBack, variant = "card", accountType }: ForgotPasswordModalProps) => {
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
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl text-foreground font-semibold mb-2">Check your email</h3>
            <p className="text-muted-foreground text-sm mb-6">
              We sent a password reset link to <strong className="text-foreground">{email}</strong>. Check spam if it does not arrive.
            </p>
            <Button type="button" variant="ghost" onClick={onBack} className="mx-auto text-muted-foreground">
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-xl text-foreground font-semibold mb-2">Reset password</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Enter your {accountType ? `${accountType} account` : "account"} email to receive a reset link.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4 text-left">
                <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-foreground">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder={accountType === "student" ? "student@school.edu" : "teacher@school.edu"}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <Button type="button" variant="ghost" onClick={onBack} className="mx-auto mt-3 text-muted-foreground">
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Button>
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
