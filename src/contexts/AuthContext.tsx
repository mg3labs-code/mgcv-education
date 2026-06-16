import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "student" | "teacher" | "admin";

const isAppRole = (value: unknown): value is AppRole =>
  value === "student" || value === "teacher" || value === "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  fullName: string;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole, className?: string, schoolName?: string, teacherAssignments?: { class_name: string; subject: string }[]) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string, fallback?: { role?: unknown; fullName?: unknown }) => {
    const fallbackRole = isAppRole(fallback?.role) ? fallback.role : null;
    const fallbackName = typeof fallback?.fullName === "string" ? fallback.fullName : "";

    try {
      const [{ data: roleData, error: roleError }, { data: profileData, error: profileError }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (roleError) throw roleError;
      if (profileError) throw profileError;

      setRole((roleData?.role as AppRole | null) ?? fallbackRole);
      setFullName(profileData?.full_name ?? fallbackName);
    } catch (e) {
      console.error("Error fetching user data:", e);
      setRole(fallbackRole);
      setFullName(fallbackName);
    }
  };

  // After sign-in, if this user is a teacher and their metadata carries
  // assignments selected during signup, persist them to teacher_assignments.
  // Idempotent thanks to the (teacher_id, class_name, subject) unique key.
  const syncTeacherAssignmentsFromMetadata = async (userId: string, metadata: any) => {
    try {
      const raw = metadata?.teacher_assignments;
      if (!Array.isArray(raw) || raw.length === 0) return;
      const rows = raw
        .filter((r: any) => r && typeof r.class_name === "string" && typeof r.subject === "string")
        .map((r: any) => ({
          teacher_id: userId,
          class_name: r.class_name,
          subject: r.subject,
          school_name: typeof metadata?.school_name === "string" ? metadata.school_name : null,
        }));
      if (rows.length === 0) return;
      await supabase.from("teacher_assignments").upsert(rows, {
        onConflict: "teacher_id,class_name,subject",
        ignoreDuplicates: true,
      });
    } catch (e) {
      console.error("Failed to sync teacher assignments from metadata", e);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const metadata = session.user.user_metadata ?? {};
          setRole(isAppRole(metadata.role) ? metadata.role : null);
          setFullName(typeof metadata.full_name === "string" ? metadata.full_name : "");
          setTimeout(() => {
            fetchUserData(session.user.id, metadata);
            if (isAppRole(metadata.role) && metadata.role === "teacher") {
              syncTeacherAssignmentsFromMetadata(session.user.id, metadata);
            }
          }, 0);
        } else {
          setRole(null);
          setFullName("");
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const metadata = session.user.user_metadata ?? {};
        setRole(isAppRole(metadata.role) ? metadata.role : null);
        setFullName(typeof metadata.full_name === "string" ? metadata.full_name : "");
        fetchUserData(session.user.id, metadata);
        if (isAppRole(metadata.role) && metadata.role === "teacher") {
          syncTeacherAssignmentsFromMetadata(session.user.id, metadata);
        }
      } else {
        setRole(null);
        setFullName("");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    selectedRole: AppRole,
    className?: string,
    schoolName?: string,
    teacherAssignments?: { class_name: string; subject: string }[],
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: selectedRole,
          class_name: selectedRole === 'teacher' ? '' : (className || ''),
          school_name: schoolName || '',
          teacher_assignments: selectedRole === 'teacher' ? (teacherAssignments || []) : [],
        },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;

    // If session was returned immediately (email confirmation disabled),
    // persist teacher class/subject pairs into the teacher_assignments table.
    if (selectedRole === 'teacher' && teacherAssignments && teacherAssignments.length > 0 && data.user) {
      const rows = teacherAssignments.map(a => ({
        teacher_id: data.user!.id,
        school_name: schoolName || null,
        class_name: a.class_name,
        subject: a.subject,
      }));
      // RLS allows the teacher to insert their own rows; safe to ignore conflicts.
      await supabase.from('teacher_assignments').upsert(rows, {
        onConflict: 'teacher_id,class_name,subject',
        ignoreDuplicates: true,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setFullName("");
  };

  return (
    <AuthContext.Provider value={{ user, session, role, fullName, loading, signUp, signIn, signInWithPhone, verifyPhoneOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
