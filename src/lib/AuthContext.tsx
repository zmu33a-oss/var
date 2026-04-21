/**
 * AuthContext — مركز إدارة حالة المصادقة للتطبيق كله
 * يتعامل مع: تسجيل الدخول، التسجيل، استعادة كلمة المرور، الجلسة، وبيانات المستخدم
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../pages/supabase";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  isRecovery: boolean;
  clearRecovery: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  isRecovery: false,
  clearRecovery: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * يُدرج أو يُحدّث سجل المستخدم في جدول users بعد كل حدث مصادقة
 */
async function upsertUser(authUser: User): Promise<void> {
  const meta = authUser.user_metadata ?? {};
  await supabase.from("users").upsert(
    {
      id: authUser.id,
      email: authUser.email ?? null,
      full_name: meta.full_name ?? meta.name ?? null,
      avatar_url: meta.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
}

async function loadProfileFromDB(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("users")
    .select(
      "id, email, full_name, avatar_url, username, bio, phone, location, created_at",
    )
    .eq("id", userId)
    .single();
  return (data as UserProfile) ?? null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);

  const clearRecovery = () => setIsRecovery(false);

  const syncUser = async (authUser: User) => {
    await upsertUser(authUser);
    const p = await loadProfileFromDB(authUser.id);
    setProfile(p);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await loadProfileFromDB(user.id);
    setProfile(p);
  };

  useEffect(() => {
    // تحميل الجلسة الموجودة عند بدء التطبيق
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        syncUser(s.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // الاستماع لكل تغييرات حالة المصادقة
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (event === "PASSWORD_RECOVERY") {
        // المستخدم وصل عبر رابط إعادة تعيين كلمة المرور
        setIsRecovery(true);
        setLoading(false);
        return;
      }

      if (s?.user) {
        await syncUser(s.user);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsRecovery(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        profile,
        isRecovery,
        clearRecovery,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
