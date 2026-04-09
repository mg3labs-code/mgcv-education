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
  signUp: (email: string, password: string, fullName: string, role: AppRole, className?: string, schoolName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const metadata = session.user.user_metadata ?? {};
          setRole(isAppRole(metadata.role) ? metadata.role : null);
          setFullName(typeof metadata.full_name === "string" ? metadata.full_name : "");
          setTimeout(() => fetchUserData(session.user.id, metadata), 0);
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
      } else {
        setRole(null);
        setFullName("");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, selectedRole: AppRole, className?: string, schoolName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: name, 
          role: selectedRole, 
          class_name: selectedRole === 'teacher' ? '' : (className || ''),
          school_name: schoolName || '',
        },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setFullName("");
  };

  return (
    <AuthContext.Provider value={{ user, session, role, fullName, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
