import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { supabase } from "./supabase";
import styles from "../pages-css/SignUpPage.module.css";

interface SignUpPageProps {
  onGoToLogin?: () => void;
  onSuccess?: () => void;
}

const phrases = [
  "إنشاء هوية جديدة...",
  "البيانات مشفرة بالكامل ✓",
  "اختر كلمة سر قوية",
  "مرحبًا بالهكر الجديد !",
  "النظام جاهز للتسجيل ▌",
];

export default function SignUpPage({
  onGoToLogin,
  onSuccess,
}: SignUpPageProps) {
  // ─── Typewriter ───────────────────────────────────────────────────────────
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    const full = phrases[phraseIdx];
    if (!erasing && charIdx < full.length) {
      const t = setTimeout(() => {
        setDisplayed(full.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      }, 65);
      return () => clearTimeout(t);
    }
    if (!erasing && charIdx === full.length) {
      const t = setTimeout(() => setErasing(true), 1800);
      return () => clearTimeout(t);
    }
    if (erasing && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed((d) => d.slice(0, -1)), 35);
      return () => clearTimeout(t);
    }
    if (erasing && displayed.length === 0) {
      const nextIdx = (phraseIdx + 1) % phrases.length;
      setPhraseIdx(nextIdx);
      setCharIdx(0);
      setErasing(false);
    }
  }, [charIdx, erasing, displayed, phraseIdx]);

  // ─── Form state ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ─── Auth state ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [done, setDone] = useState(false);

  const setMsg = (text: string, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSignUp = async () => {
    setMsg("");
    if (!fullName.trim()) {
      setMsg("أدخل الاسم الكامل", true);
      return;
    }
    if (!email.trim()) {
      setMsg("أدخل الإيميل", true);
      return;
    }
    if (password.length < 6) {
      setMsg("كلمة المرور يجب أن تكون 6 أحرف على الأقل", true);
      return;
    }
    if (password !== confirmPassword) {
      setMsg("كلمة المرور غير متطابقة", true);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim() },
      },
    });
    setLoading(false);

    if (error) {
      setMsg(error.message, true);
      return;
    }

    // إذا كان الإيميل مسجلاً مسبقاً Supabase يُعيد identities فارغة
    if ((data.user?.identities?.length ?? 1) === 0) {
      setMsg("هذا الإيميل مسجل مسبقاً. جرّب تسجيل الدخول.", true);
      return;
    }

    setMsg("✅ تم إنشاء الحساب! تحقق من بريدك لتفعيل الحساب.");
    setDone(true);
    // بعد ثانيتين ارجع للـ login
    setTimeout(() => onSuccess?.(), 2500);
  };

  const handleGoogle = async () => {
    setMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setMsg(error.message, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignUp();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.scanline} />

      {/* شريط الحالة */}
      <div className={styles.statusBar}>
        <span className={styles.statusDot} />
        <span>SECURE CONNECTION ACTIVE</span>
      </div>

      {/* الهيدر */}
      <div className={styles.terminalHeader}>
        <h1 className={styles.terminalTitle}>[ REGISTER ]</h1>
        <p className={styles.terminalLine}>
          {displayed}
          <span className={styles.cursor} />
        </p>
      </div>

      {/* الفورم */}
      <div className={styles.form} onKeyDown={handleKeyDown}>
        {/* الاسم الكامل */}
        <input
          className={styles.inputField}
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          dir="ltr"
        />

        {/* الإيميل */}
        <input
          className={styles.inputField}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          dir="ltr"
        />

        {/* كلمة المرور */}
        <div className={styles.passwordWrap}>
          <input
            className={styles.inputField}
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            dir="ltr"
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowPass((p) => !p)}
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* تأكيد كلمة المرور */}
        <div className={styles.passwordWrap}>
          <input
            className={styles.inputField}
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            dir="ltr"
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowConfirm((p) => !p)}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* زر إنشاء الحساب */}
        <button
          className={styles.submitBtn}
          onClick={handleSignUp}
          disabled={loading}
        >
          {loading ? "...جاري التسجيل" : "Create Account"}
        </button>

        {/* زر Google */}
        <button
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={loading}
          type="button"
        >
          <FaGoogle />
          <span>with Google</span>
        </button>

        {/* رسالة النجاح / الخطأ */}
        {message && (
          <>
            <p
              className={`${styles.message} ${isError ? styles.messageError : styles.messageSuccess}`}
            >
              {message}
            </p>
            {done && <div className={styles.successBar} />}
          </>
        )}

        {/* رابط للدخول */}
        <div className={styles.bottomLinks}>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={onGoToLogin}
          >
            عندي حساب بالفعل
          </button>
        </div>
      </div>
    </div>
  );
}
