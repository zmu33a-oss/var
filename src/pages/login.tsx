import loginStyle from "../pages-css/login.module.css";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Headphones } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import loginAudio from "../assets/login.mp3";
import { supabase } from "./supabase";

interface LoginPageProps {
  onSuccess?: () => void;
  isRecovery?: boolean;
  onRecoveryDone?: () => void;
  onGoToSignup?: () => void;
}

const LoginPage = ({
  onSuccess,
  isRecovery = false,
  onRecoveryDone,
  onGoToSignup,
}: LoginPageProps) => {
  const phrases = [
    "نهكر الكوره ونهكر الملاعب .",
    "اذا متعصب لاتقرب .",
    "ابعد بعيد ولاتخرب .",
    "التعصب آآفه",
    "غير كذا ححححياك مليون .",
  ];

  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioOn, setAudioOn] = useState(true);
  const [splash, setSplash] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [displayedLines, setDisplayedLines] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const audio = new Audio(loginAudio);
    audio.loop = true;
    audio.volume = 0.2;
    audioRef.current = audio;

    const tryPlay = () => {
      audio.play().catch(() => {});
    };

    tryPlay();

    const handleFirstInteraction = () => {
      tryPlay();
    };

    window.addEventListener("pointerdown", handleFirstInteraction, {
      once: true,
    });

    return () => {
      audio.pause();
      audio.src = "";
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioOn) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setAudioOn((prev) => !prev);
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setAuthMessage("اكتب الإيميل وكلمة المرور أولاً");
      return;
    }

    setIsLoading(true);
    setAuthMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setAuthMessage(
          "يجب تفعيل البريد الإلكتروني أولاً. تفقد بريدك الواردة.",
        );
      } else if (
        error.message.toLowerCase().includes("invalid login credentials")
      ) {
        setAuthMessage("الإيميل أو كلمة المرور غير صحيحة.");
      } else {
        setAuthMessage(error.message);
      }
    } else if (data.user) {
      setAuthMessage("✅ تم تسجيل الدخول بنجاح");
      setTimeout(() => onSuccess?.(), 800);
    }

    setIsLoading(false);
  };

  const signInWithGoogle = async () => {
    setAuthMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setAuthMessage(error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setAuthMessage("كلمات المرور غير متطابقة");
      return;
    }
    if (newPassword.length < 6) {
      setAuthMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);
    if (error) {
      setAuthMessage(error.message);
    } else {
      setAuthMessage("✅ تم تحديث كلمة المرور بنجاح");
      setTimeout(() => onRecoveryDone?.(), 1200);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setAuthMessage("اكتب الإيميل أولاً لاستعادة كلمة المرور");
      return;
    }

    setAuthMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });

    if (error) {
      setAuthMessage(error.message);
    } else {
      setAuthMessage("تم إرسال رابط استعادة كلمة المرور إلى الإيميل");
    }
  };

  useEffect(() => {
    if (isResetting) {
      const timer = setTimeout(() => {
        setDisplayedLines(["", "", "", "", ""]);
        setCurrentLineIndex(0);
        setIsResetting(false);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (currentLineIndex < phrases.length) {
      const full = phrases[currentLineIndex];
      const current = displayedLines[currentLineIndex];

      if (current.length < full.length) {
        const timer = setTimeout(() => {
          const newLines = [...displayedLines];
          newLines[currentLineIndex] = full.substring(0, current.length + 1);
          setDisplayedLines(newLines);
        }, 100);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setCurrentLineIndex((prev) => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
      }
    } else {
      const timer = setTimeout(() => {
        setIsResetting(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [displayedLines, currentLineIndex, isResetting]);

  // ── شاشة تعيين كلمة مرور جديدة (عند الوصول عبر رابط الاستعادة) ──────────
  if (isRecovery) {
    return (
      <div className={loginStyle.container}>
        <div className={loginStyle.overlay} />
        <div className={loginStyle.inputBoxContainer}>
          <p
            className={loginStyle.authMessage}
            style={{ marginBottom: 16, fontSize: 15 }}
          >
            أدخل كلمة مرور جديدة لحسابك
          </p>
          <div className={loginStyle.passwordWrap}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="كلمة المرور الجديدة"
              className={loginStyle.inputField}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              className={loginStyle.eyeBtn}
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className={loginStyle.inputWrapper}>
            <input
              type="password"
              placeholder="تأكيد كلمة المرور"
              className={loginStyle.inputField}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordReset()}
            />
          </div>
          <button
            className={loginStyle.loginBtn}
            onClick={handlePasswordReset}
            disabled={isLoading}
          >
            {isLoading ? "...جاري التحديث" : "تحديث كلمة المرور"}
          </button>
          {authMessage && (
            <p className={loginStyle.authMessage}>{authMessage}</p>
          )}
        </div>
      </div>
    );
  }

  if (splash) {
    return (
      <div className={loginStyle.splashScreen}>
        <h1 className={loginStyle.splashTitle}>Welcome to Xtik</h1>
        <p className={loginStyle.splashLoading}>Loading</p>
        <div className={loginStyle.progressBar}>
          <div className={loginStyle.progressFill} />
        </div>
      </div>
    );
  }

  return (
    <div className={loginStyle.container}>
      <button
        className={`${loginStyle.audioBtn} ${audioOn ? loginStyle.audioBtnOn : loginStyle.audioBtnOff}`}
        onClick={toggleAudio}
        aria-label={audioOn ? "إيقاف الصوت" : "تشغيل الصوت"}
      >
        <Headphones size={18} />
      </button>
      <div className={loginStyle.overlay}></div>
      <div className={loginStyle.terminalHeader}>
        {displayedLines.map((line, index) => (
          <div key={index} className={loginStyle.line}>
            {line}
            {currentLineIndex === index && !isResetting && (
              <span className={loginStyle.cursor}></span>
            )}
          </div>
        ))}
      </div>

      <div className={loginStyle.inputBoxContainer}>
        <div className={loginStyle.inputWrapper}>
          <input
            type="email"
            placeholder="Email"
            className={loginStyle.inputField}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={loginStyle.passwordWrap}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className={loginStyle.inputField}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className={loginStyle.eyeBtn}
            aria-label={
              showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
            }
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          className={loginStyle.loginBtn}
          onClick={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? "...جاري التنفيذ" : "Login"}
        </button>

        <button
          className={loginStyle.googleBtn}
          onClick={signInWithGoogle}
          disabled={isLoading}
        >
          <span className={loginStyle.googleBtnInner}>
            <FaGoogle className={loginStyle.googleIcon} />
            <span>with Google</span>
          </span>
        </button>

        {authMessage && <p className={loginStyle.authMessage}>{authMessage}</p>}

        <div className={loginStyle.bottomLinks}>
          <button
            type="button"
            className={loginStyle.linkBtn}
            onClick={onGoToSignup}
          >
            حساب جديد
          </button>
          <button
            type="button"
            className={loginStyle.linkBtn}
            onClick={handleForgotPassword}
          >
            نسيت كلمة المرور
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
