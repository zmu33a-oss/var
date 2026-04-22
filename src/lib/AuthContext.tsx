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
  avatar_frame_enabled: boolean;
  username: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
}

async function saveUserRecord(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const existing = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing.data?.id) {
    await supabase.from("users").update(payload).eq("id", userId);
    return;
  }

  await supabase.from("users").insert({ id: userId, ...payload });
}

function normalizeProfile(
  data: Partial<UserProfile> | null | undefined,
  authUser?: User | null,
): UserProfile | null {
  if (!data?.id && !authUser?.id) return null;

  return {
    id: data?.id ?? authUser?.id ?? "",
    email: data?.email ?? authUser?.email ?? null,
    full_name:
      data?.full_name ??
      authUser?.user_metadata?.full_name ??
      authUser?.user_metadata?.name ??
      null,
    avatar_url: data?.avatar_url ?? authUser?.user_metadata?.avatar_url ?? null,
    avatar_frame_enabled:
      Boolean(data?.avatar_frame_enabled) ||
      Boolean(authUser?.user_metadata?.avatar_frame_enabled),
    username: data?.username ?? null,
    bio: data?.bio ?? null,
    phone: data?.phone ?? null,
    location: data?.location ?? null,
    created_at:
      data?.created_at ?? authUser?.created_at ?? new Date().toISOString(),
  };
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
  await saveUserRecord(authUser.id, {
    email: authUser.email ?? null,
    full_name: meta.full_name ?? meta.name ?? null,
  });
}

async function loadProfileFromDB(authUser: User): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  return normalizeProfile((data as Partial<UserProfile>) ?? null, authUser);
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
    const p = await loadProfileFromDB(authUser);
    setProfile(p);
  };

  const refreshProfile = async () => {
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user ?? user;
    if (!currentUser) return;

    setUser(currentUser);
    const p = await loadProfileFromDB(currentUser);
    setProfile(p);
  };

  useEffect(() => {
    // تحميل الجلسة الموجودة عند بدء التطبيق
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);

        if (s?.user) {
          void syncUser(s.user).catch(() => {
            setProfile(normalizeProfile(null, s.user));
          });
        }
      })
      .catch(() => {
        setLoading(false);
      });

    // الاستماع لكل تغييرات حالة المصادقة
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);

      if (event === "PASSWORD_RECOVERY") {
        // المستخدم وصل عبر رابط إعادة تعيين كلمة المرور
        setIsRecovery(true);
        return;
      }

      if (s?.user) {
        try {
          await syncUser(s.user);
        } catch {
          setProfile(normalizeProfile(null, s.user));
        }
      } else {
        setProfile(null);
      }
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
