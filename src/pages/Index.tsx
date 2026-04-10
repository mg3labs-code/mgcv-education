import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import GradientMeshBg from "@/components/landing/GradientMeshBg";
import TrustBadges from "@/components/landing/TrustBadges";
import FeatureShowcase from "@/components/landing/FeatureShowcase";
import LoadingScreen from "@/components/LoadingScreen";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroStudents from "@/assets/hero-students.webp";
import heroFutureLearning from "@/assets/hero-future-learning.jpg";
import heroAiStudent from "@/assets/hero-ai-student.png";
import ImageTextEffect from "@/components/landing/ImageTextEffect";

type LoginType = "student" | "teacher" | "";
type ModalType = "login" | "about" | "contact" | "";
type AuthMode = "login" | "signup";

const isInIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

const Index = () => {
  const navigate = useNavigate();
  const { user, role, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const inIframe = isInIframe();
  const standalonePreviewUrl = typeof window !== "undefined" ? window.location.href : "/";
  const [modalType, setModalType] = useState<ModalType>("");
  const [loginType, setLoginType] = useState<LoginType>("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginError, setLoginError] = useState<{ message: string; code?: string; suggestion: string } | null>(null);

  useEffect(() => {
    if (!loading && user && role) {
      navigate(`/${role}`, { replace: true });
    }
  }, [loading, user, role, navigate]);

  const openStandalonePreview = useCallback(() => {
    window.open(standalonePreviewUrl, "_blank", "noopener,noreferrer");
  }, [standalonePreviewUrl]);

  const openModal = (type: "student" | "teacher" | "about" | "contact") => {
    setMobileMenuOpen(false);
    if (type === "student" || type === "teacher") {
      if (inIframe) {
        openStandalonePreview();
        return;
      }
      setLoginType(type);
      setModalType("login");
    } else {
      setModalType(type);
    }
  };

  const closeModal = useCallback(() => {
    setModalType("");
    setLoginType("");
    setAuthMode("login");
    setShowForgot(false);
    setEmail("");
    setPassword("");
    setFullName("");
    setClassName("");
    setSchoolName("");
    setLoginError(null);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeModal]);

  const parseError = (err: any): { message: string; code?: string; suggestion: string } => {
    const msg = err?.message || "Unknown error";
    const code = err?.code || err?.status?.toString() || undefined;
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
      return { message: msg, code: "NETWORK_ERROR", suggestion: "Network issue detected. Try opening the app in a new tab or check your internet connection." };
    }
    if (msg.includes("Invalid login credentials")) {
      return { message: msg, code: "AUTH_INVALID_CREDENTIALS", suggestion: "Double-check your email and password. If you just signed up, verify your email first." };
    }
    if (msg.includes("Email not confirmed")) {
      return { message: msg, code: "AUTH_EMAIL_NOT_CONFIRMED", suggestion: "Please check your inbox and click the verification link before signing in." };
    }
    if (msg.includes("User already registered")) {
      return { message: msg, code: "AUTH_USER_EXISTS", suggestion: "An account with this email already exists. Try signing in instead." };
    }
    if (msg.includes("Password should be at least")) {
      return { message: msg, code: "AUTH_WEAK_PASSWORD", suggestion: "Password must be at least 6 characters long." };
    }
    return { message: msg, code, suggestion: "Something went wrong. Please try again or contact support." };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLoginError(null);
    try {
      if (authMode === "signup") {
        const selectedRole = loginType === "teacher" ? "teacher" : "student";
        await signUp(email, password, fullName, selectedRole as any, className, schoolName);
        toast({ title: "Account created!", description: "Please check your email to verify your account." });
        closeModal();
      } else {
        await signIn(email, password);
        toast({ title: "Welcome back!" });
        closeModal();
      }
    } catch (err: any) {
      const parsed = parseError(err);
      setLoginError(parsed);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (user && role) return null;

  const inputClass = "w-full py-4 px-5 rounded-xl bg-muted/80 text-foreground text-sm outline-none border border-border transition-all placeholder:text-muted-foreground focus:bg-muted focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.2)]";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Iframe Banner */}
      {inIframe && (
        <div className="fixed top-0 left-0 right-0 z-[1100] bg-gradient-to-r from-warning to-destructive text-white text-center py-4 px-4 shadow-lg">
          <div className="max-w-xl mx-auto">
            <p className="font-bold text-base mb-1">⚠️ Preview Mode — Login may not work here</p>
            <p className="text-sm text-white/90 mb-2">Browser security blocks authentication inside iframes.</p>
              <a href={standalonePreviewUrl} target="_blank" rel="noopener noreferrer"
              className="inline-block bg-white text-destructive font-bold px-6 py-2 rounded-full text-sm hover:bg-white/90 transition-all shadow-md">
                🚀 Open This Preview in New Tab ↗
            </a>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[1000] bg-background/80 backdrop-blur-xl py-4 border-b border-border/50" style={{ top: inIframe ? '100px' : 0 }}>
        <div className="max-w-[1400px] mx-auto flex justify-between items-center px-4 md:px-10">
          <div className="text-2xl md:text-[28px] font-bold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-info">Student</span>
            <span className="text-foreground"> Inner OS</span>
          </div>

          <button className="md:hidden text-muted-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <nav className="hidden md:flex gap-8 items-center">
            {["Student Login", "Teacher Login", "About"].map((label) => {
              const key = label === "Student Login" ? "student" : label === "Teacher Login" ? "teacher" : "about";
              return (
                <button key={key} onClick={() => openModal(key as any)}
                  className="text-muted-foreground text-sm font-medium transition-colors hover:text-foreground cursor-pointer bg-transparent border-none relative group">
                  {label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </button>
              );
            })}
            <button onClick={() => openModal("contact")}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:shadow-[0_8px_25px_hsl(162_65%_38%/0.3)] hover:-translate-y-0.5">
              Contact Us
            </button>
          </nav>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 px-4 py-4 flex flex-col gap-2 bg-background/95 backdrop-blur-xl animate-slide-down">
            {(["student", "teacher", "about"] as const).map((key) => (
              <button key={key} onClick={() => openModal(key)}
                className="text-muted-foreground text-sm py-2.5 text-left bg-transparent border-none hover:text-foreground">
                {key === "student" ? "Student Login" : key === "teacher" ? "Teacher Login" : "About"}
              </button>
            ))}
            <button onClick={() => openModal("contact")}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold text-sm text-center mt-1">
              Contact Us
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="relative min-h-screen flex items-center pt-20 md:pt-0">
        <GradientMeshBg />

        <div className="max-w-[1400px] mx-auto px-4 md:px-10 w-full relative z-10">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" as const }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Now with AI-Powered Learning</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" as const }}
              className="mb-2"
            >
              <p className="text-sm md:text-base font-medium text-muted-foreground tracking-wide mb-1">World-Class</p>
              <ImageTextEffect />
              <p className="text-lg md:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-info mt-1">
                Every Student.
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" as const }}
              className="text-base md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl"
            >
              We integrate proven methods from elite universities into your curriculum — building thinking capacity, not just knowledge.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" as const }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <button onClick={() => openModal("student")}
                className="group bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold text-base transition-all hover:shadow-[0_12px_30px_hsl(162_65%_38%/0.35)] hover:-translate-y-0.5 flex items-center justify-center gap-2">
                Start Learning
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => openModal("teacher")}
                className="bg-secondary text-secondary-foreground px-8 py-4 rounded-full font-semibold text-base border border-border transition-all hover:bg-accent/10 hover:-translate-y-0.5">
                Teacher Portal
              </button>
            </motion.div>
          </div>
        </div>

        {/* Hero Image - desktop only */}
        <div className="absolute top-0 right-0 w-[50%] h-full z-[1] hidden lg:flex items-center justify-end pr-10 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" as const }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/30" style={{ maxWidth: 520 }}>
              <img
                src={heroStudents}
                alt="Students collaborating with technology"
                className="w-full h-auto object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
            </div>
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -bottom-4 -left-6 bg-card border border-border/50 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm">🎯</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">5 Inner OS Dimensions</p>
                  <p className="text-[10px] text-muted-foreground">Clarity · Thinking · Focus · Momentum · Character</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Trust Badges / Stats */}
      <TrustBadges />

      {/* Feature Showcase */}
      <FeatureShowcase />

      {/* Visual Showcase Section */}
      <section className="relative z-10 py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30">
                <img src={heroAiStudent} alt="Student learning with AI technology" className="w-full h-auto object-cover" loading="lazy" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="space-y-5"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Learning that <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-info">thinks with you</span>
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Our AI doesn't just deliver content — it tracks 47 micro-patterns in how you learn, adapts in real-time, and builds your cognitive muscle across 5 dimensions.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: "👁️", label: "Clarity", desc: "See concepts clearly" },
                  { emoji: "🧠", label: "Thinking", desc: "Reason deeper" },
                  { emoji: "🎯", label: "Attention", desc: "Stay focused" },
                  { emoji: "🚀", label: "Momentum", desc: "Keep growing" },
                ].map(d => (
                  <div key={d.label} className="bg-card border border-border/50 rounded-xl p-3">
                    <span className="text-lg">{d.emoji}</span>
                    <p className="text-sm font-semibold text-foreground mt-1">{d.label}</p>
                    <p className="text-xs text-muted-foreground">{d.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 md:py-28">
        <div className="max-w-[800px] mx-auto px-4 md:px-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-2xl overflow-hidden mb-10 mx-auto max-w-md shadow-lg border border-border/30">
              <img src={heroFutureLearning} alt="Future of education with immersive technology" className="w-full h-auto object-cover" loading="lazy" />
            </div>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Ready to transform your school?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-lg mx-auto">
            Building cognitive muscle, one layer at a time. Zero infrastructure needed — students start the same day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => openModal("student")}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold text-base transition-all hover:shadow-[0_12px_30px_hsl(162_65%_38%/0.35)] hover:-translate-y-0.5">
              Get Started — Free
            </button>
            <button onClick={() => openModal("contact")}
              className="bg-secondary text-secondary-foreground px-8 py-4 rounded-full font-semibold text-base border border-border transition-all hover:bg-accent/10">
              Talk to Us
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">© 2026 EduTech by MG3 Labs. All rights reserved.</div>
          <div className="flex gap-6">
            <button onClick={() => openModal("about")} className="text-sm text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer">About</button>
            <button onClick={() => openModal("contact")} className="text-sm text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer">Contact</button>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {modalType === "login" && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[2000] flex justify-center items-center p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" as const }}
            className="glass-premium rounded-2xl p-8 md:p-10 w-full max-w-[440px] text-center relative border border-border/50 shadow-2xl"
          >
            <button onClick={closeModal} className="absolute top-4 right-5 text-2xl cursor-pointer text-muted-foreground hover:text-foreground bg-transparent border-none">
              ×
            </button>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
              loginType === "teacher" 
                ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10" 
                : "bg-gradient-to-br from-primary/20 to-info/10"
            }`}>
              <span className={`text-xl font-bold ${loginType === "teacher" ? "text-amber-600" : "text-primary"}`}>
                {loginType === "student" ? "🎓" : "👩‍🏫"}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
              {loginType === "student" ? "Student Portal" : "Teacher Portal"}
            </h2>

            {showForgot ? (
              <div className="mt-6">
                <ForgotPasswordModal onBack={() => setShowForgot(false)} variant="glass" />
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-6 text-sm">
                  {authMode === "login"
                    ? loginType === "student" ? "Access your learning dashboard" : "Manage your classroom"
                    : loginType === "student" ? "Create your student account" : "Register as an educator"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {authMode === "signup" && (
                    <>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                        placeholder="Full name" className={inputClass} />
                      {loginType === "student" ? (
                        <input type="text" value={className} onChange={(e) => setClassName(e.target.value)}
                          placeholder="Class (e.g. Class 10)" className={inputClass} />
                      ) : (
                        <>
                          <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="School name" className={inputClass} />
                          <p className="text-xs text-muted-foreground text-left">Subjects you teach:</p>
                          <div className="flex gap-2 flex-wrap justify-center">
                            {["Mathematics", "Science", "Social", "English", "Hindi", "Telugu"].map(sub => {
                              const selected = className.split(",").map(s => s.trim()).includes(sub);
                              return (
                                <button key={sub} type="button"
                                  onClick={() => setClassName(prev => {
                                    const subjects = prev ? prev.split(",").map(s => s.trim()).filter(Boolean) : [];
                                    return subjects.includes(sub) 
                                      ? subjects.filter(s => s !== sub).join(", ")
                                      : [...subjects, sub].join(", ");
                                  })}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    selected 
                                      ? "bg-primary/20 border-primary text-primary" 
                                      : "bg-muted/40 border-border text-muted-foreground hover:border-primary/50"
                                  }`}>
                                  {sub}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  )}
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="Email address" className={inputClass} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                    placeholder="Password" className={inputClass} />
                  <button type="submit" disabled={submitting}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all mt-2 hover:shadow-[0_10px_30px_hsl(162_65%_38%/0.3)] disabled:opacity-50">
                    {submitting ? "Authenticating..." : authMode === "login" ? "Sign In" : "Create Account"}
                  </button>

                  {loginError && (
                    <div className="mt-3 bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-left">
                      <p className="text-destructive text-sm font-medium">{loginError.message}</p>
                      <p className="text-muted-foreground text-xs mt-1">{loginError.suggestion}</p>
                    </div>
                  )}
                </form>

                <div className="flex justify-between mt-5">
                  <button onClick={() => setShowForgot(true)}
                    className="text-muted-foreground text-xs hover:text-primary bg-transparent border-none cursor-pointer transition-colors">
                    Forgot Password?
                  </button>
                  <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                    className="text-muted-foreground text-xs hover:text-primary bg-transparent border-none cursor-pointer transition-colors">
                    {authMode === "login" ? "Create Account" : "Sign In Instead"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* About Modal */}
      {modalType === "about" && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[2000] flex justify-center items-center p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" as const }}
            className="glass-premium rounded-2xl p-8 md:p-10 w-full max-w-[600px] max-h-[80vh] overflow-y-auto text-left relative border border-border/50 shadow-2xl"
          >
            <button onClick={closeModal} className="absolute top-4 right-5 text-2xl cursor-pointer text-muted-foreground hover:text-foreground bg-transparent border-none">×</button>
            <h2 className="text-2xl font-bold text-foreground mb-5 text-center">About EduTech</h2>
            <div className="text-muted-foreground leading-relaxed text-sm space-y-4">
              <p><strong className="text-primary">EduTech</strong> is a cutting-edge educational technology platform designed to revolutionize the way students learn and teachers educate.</p>
              <p>Built with modern web technologies and user-centered design principles, EduTech offers separate, tailored experiences for both students and educators.</p>
              <p>Our platform emphasizes <strong className="text-primary">collaborative learning</strong>, <strong className="text-primary">data-driven insights</strong>, and <strong className="text-primary">personalized education paths</strong>.</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Contact Modal */}
      {modalType === "contact" && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[2000] flex justify-center items-center p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" as const }}
            className="glass-premium rounded-2xl p-8 md:p-10 w-full max-w-[550px] text-center relative border border-border/50 shadow-2xl"
          >
            <button onClick={closeModal} className="absolute top-4 right-5 text-2xl cursor-pointer text-muted-foreground hover:text-foreground bg-transparent border-none">×</button>
            <h2 className="text-2xl font-bold text-foreground mb-6">Get in Touch</h2>
            <div className="text-left space-y-3">
              {[
                { icon: "📧", title: "Developer Email", desc: "mg3labs@gmail.com" },
                { icon: "🚀", title: "MG3 Labs", desc: "Innovation in Educational Technology" },
                { icon: "💡", title: "Support & Inquiries", desc: "Feature requests, partnerships, or support" },
                { icon: "⚡", title: "Response Time", desc: "We typically respond within 24-48 hours" },
                { icon: "🌐", title: "Available Services", desc: "Custom development and consultation" },
              ].map((item, i) => (
                <div key={i} className="flex items-center p-4 bg-muted/30 rounded-xl border border-border/50">
                  <div className="text-xl mr-4 w-8">{item.icon}</div>
                  <div>
                    <h4 className="text-foreground font-semibold text-sm">{item.title}</h4>
                    <p className="text-muted-foreground text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Index;
