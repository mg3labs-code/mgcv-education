import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type LoginType = "student" | "teacher" | "";
type ModalType = "login" | "about" | "contact" | "";
type AuthMode = "login" | "signup";

const Index = () => {
  const navigate = useNavigate();
  const { user, role, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [modalType, setModalType] = useState<ModalType>("");
  const [loginType, setLoginType] = useState<LoginType>("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      navigate(`/${role}`, { replace: true });
    }
  }, [loading, user, role, navigate]);

  const openModal = (type: "student" | "teacher" | "about" | "contact") => {
    if (type === "student" || type === "teacher") {
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
    setEmail("");
    setPassword("");
    setFullName("");
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (authMode === "signup") {
        const selectedRole = loginType === "teacher" ? "teacher" : "student";
        await signUp(email, password, fullName, selectedRole as any);
        toast({ title: "Account created!", description: "You're now signed in." });
      } else {
        await signIn(email, password);
        toast({ title: "Welcome back!" });
      }
      closeModal();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (user && role) return null;

  return (
    <div className="min-h-screen bg-[#0f1419] text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[1000] bg-[#0f1419]/95 backdrop-blur-[20px] py-5 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center px-10">
          <div className="text-[32px] font-light tracking-wide">EduTech</div>
          <nav className="flex list-none gap-12 items-center">
            <button onClick={() => openModal("student")} className="text-white/80 text-base font-normal transition-colors hover:text-teal cursor-pointer bg-transparent border-none">
              Student Login
            </button>
            <button onClick={() => openModal("teacher")} className="text-white/80 text-base font-normal transition-colors hover:text-teal cursor-pointer bg-transparent border-none">
              Teacher Login
            </button>
            <button onClick={() => openModal("about")} className="text-white/80 text-base font-normal transition-colors hover:text-teal cursor-pointer bg-transparent border-none">
              About
            </button>
            <button
              onClick={() => openModal("contact")}
              className="bg-teal text-white px-8 py-3 rounded-full font-semibold transition-all hover:bg-teal-light hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(0,212,170,0.3)]"
            >
              CONTACT
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen flex items-center relative overflow-hidden pt-[100px]">
        <div className="max-w-[1400px] mx-auto px-10 grid grid-cols-2 gap-[100px] items-center w-full">
          <div className="z-10">
            <div className="text-2xl text-teal mb-5 font-light italic">Empowering Minds.</div>
            <h1 className="text-[72px] font-bold leading-[1.1] mb-8 text-white">
              The Right Learning.<br />
              The Right Future.™
            </h1>
            <p className="text-xl text-white/70 leading-relaxed font-light">
              A trusted educational technology platform that bridges the gap between students and teachers, fostering collaborative learning for tomorrow's leaders.
            </p>
          </div>
        </div>

        {/* Background Animation */}
        <div className="absolute top-0 right-0 w-[60%] h-full z-[1]">
          <div className="absolute w-full h-full opacity-10">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-teal"
                style={{
                  width: `${[8, 12, 6, 10, 8, 14, 6, 10, 8][i]}px`,
                  height: `${[8, 12, 6, 10, 8, 14, 6, 10, 8][i]}px`,
                  left: `${(i + 1) * 10}%`,
                  animation: `floatSquares 20s infinite linear`,
                  animationDelay: `${-i * 2}s`,
                }}
              />
            ))}
          </div>

          <svg className="absolute top-1/2 right-0 w-[800px] h-[600px] -translate-y-1/2 z-[2]" viewBox="0 0 800 600">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d4aa" />
                <stop offset="50%" stopColor="#0984e3" />
                <stop offset="100%" stopColor="#6c5ce7" />
              </linearGradient>
            </defs>
            {[
              "M 100 100 Q 300 50 500 150 T 700 200 Q 650 300 500 350 T 200 400 Q 150 500 300 550",
              "M 150 80 Q 350 30 550 130 T 750 180 Q 700 280 550 330 T 250 380 Q 200 480 350 530",
              "M 200 120 Q 400 70 600 170 T 800 220 Q 750 320 600 370 T 300 420 Q 250 520 400 570",
              "M 50 140 Q 250 90 450 190 T 650 240 Q 600 340 450 390 T 150 440 Q 100 540 250 590",
            ].map((d, i) => (
              <path
                key={i}
                d={d}
                strokeWidth={2}
                fill="none"
                stroke="url(#gradient)"
                opacity={0.8}
                style={{ animation: `drawLine 8s ease-in-out infinite`, animationDelay: `${-i * 2}s` }}
              />
            ))}
          </svg>
        </div>
      </main>

      {/* Login Modal */}
      {modalType === "login" && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-[10px] z-[2000] flex justify-center items-center" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="glass-dark rounded-[20px] p-[50px] w-[450px] text-center animate-modal-in relative">
            <button onClick={closeModal} className="absolute top-5 right-6 text-3xl cursor-pointer text-white/70 hover:text-white bg-transparent border-none">
              &times;
            </button>
            <h2 className="text-[2.5rem] mb-2 text-teal font-light">
              {loginType === "student" ? "Student Portal" : "Teacher Portal"}
            </h2>
            <p className="text-white/80 mb-10 text-base">
              {authMode === "login"
                ? loginType === "student" ? "Access your learning dashboard" : "Manage your classroom"
                : "Create your account"}
            </p>

            <form onSubmit={handleSubmit}>
              {authMode === "signup" && (
                <div className="mb-6">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="👤 Enter your full name"
                    className="w-full py-[18px] px-6 border-none rounded-full bg-white/15 text-white text-base outline-none border-2 border-transparent transition-all placeholder:text-white/60 focus:bg-white/20 focus:border-teal focus:shadow-[0_0_20px_rgba(0,212,170,0.3)]"
                  />
                </div>
              )}
              <div className="mb-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="📧 Enter your email"
                  className="w-full py-[18px] px-6 border-none rounded-full bg-white/15 text-white text-base outline-none border-2 border-transparent transition-all placeholder:text-white/60 focus:bg-white/20 focus:border-teal focus:shadow-[0_0_20px_rgba(0,212,170,0.3)]"
                />
              </div>
              <div className="mb-6">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="🔒 Enter your password"
                  className="w-full py-[18px] px-6 border-none rounded-full bg-white/15 text-white text-base outline-none border-2 border-transparent transition-all placeholder:text-white/60 focus:bg-white/20 focus:border-teal focus:shadow-[0_0_20px_rgba(0,212,170,0.3)]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-[18px] border-none rounded-full bg-gradient-to-br from-teal to-teal-light text-white text-lg font-semibold cursor-pointer transition-all mt-5 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(0,212,170,0.4)] disabled:opacity-50"
              >
                {submitting ? "⏳ Authenticating..." : authMode === "login" ? "🚀 Access Portal" : "🚀 Create Account"}
              </button>
            </form>

            <div className="flex justify-between mt-6">
              <button className="text-white/70 text-sm transition-colors hover:text-teal bg-transparent border-none cursor-pointer">
                Forgot Password?
              </button>
              <button
                onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                className="text-white/70 text-sm transition-colors hover:text-teal bg-transparent border-none cursor-pointer"
              >
                {authMode === "login" ? "Register Now" : "Sign In Instead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {modalType === "about" && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-[10px] z-[2000] flex justify-center items-center" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="glass-dark rounded-[20px] p-[50px] w-[600px] max-w-[90%] max-h-[80vh] overflow-y-auto text-left animate-modal-in relative">
            <button onClick={closeModal} className="absolute top-5 right-6 text-3xl cursor-pointer text-white/70 hover:text-white bg-transparent border-none">
              &times;
            </button>
            <h2 className="text-[2.5rem] mb-5 text-teal font-light text-center">About EduTech</h2>
            <div className="text-white/90 leading-relaxed text-base space-y-5">
              <p>
                <strong className="text-teal">EduTech</strong> is a cutting-edge educational technology platform designed to revolutionize the way students learn and teachers educate. Our mission is to bridge the digital divide in education by providing intuitive, accessible, and powerful tools that enhance the learning experience for everyone involved.
              </p>
              <p>
                Built with modern web technologies and user-centered design principles, EduTech offers separate, tailored experiences for both students and educators. Students can access interactive learning materials, track their progress, collaborate with peers, and receive personalized feedback. Teachers benefit from comprehensive classroom management tools, analytics dashboards, assignment creation capabilities, and seamless communication channels with their students.
              </p>
              <p>
                Our platform emphasizes <strong className="text-teal">collaborative learning</strong>, <strong className="text-teal">data-driven insights</strong>, and <strong className="text-teal">personalized education paths</strong>. Whether you're a student seeking to excel in your studies or an educator looking to create impactful learning experiences, EduTech provides the technological foundation to achieve your educational goals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {modalType === "contact" && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-[10px] z-[2000] flex justify-center items-center" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="glass-dark rounded-[20px] p-[50px] w-[550px] max-w-[90%] text-center animate-modal-in relative">
            <button onClick={closeModal} className="absolute top-5 right-6 text-3xl cursor-pointer text-white/70 hover:text-white bg-transparent border-none">
              &times;
            </button>
            <h2 className="text-[2.5rem] mb-8 text-teal font-light">Get in Touch</h2>
            <div className="text-white/90 leading-relaxed text-base text-left space-y-5">
              {[
                { icon: "📧", title: "Developer Email", desc: "mg3labs@gmail.com" },
                { icon: "🚀", title: "MG3 Labs", desc: "Innovation in Educational Technology" },
                { icon: "💡", title: "Support & Inquiries", desc: "For technical support, feature requests, or partnership opportunities" },
                { icon: "⚡", title: "Response Time", desc: "We typically respond within 24-48 hours" },
                { icon: "🌐", title: "Available Services", desc: "Custom development, integration support, and consultation" },
              ].map((item, i) => (
                <div key={i} className="flex items-center p-4 bg-white/5 rounded-[10px] border border-white/10">
                  <div className="text-2xl mr-4 text-teal w-8">{item.icon}</div>
                  <div>
                    <h4 className="text-teal mb-1 text-lg">{item.title}</h4>
                    <p className="text-white/80 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
