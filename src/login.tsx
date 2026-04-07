import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("البيانات الجاهزة للإرسال:", { email, password });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">الكنج</div>
        <h1 className="login-title">zmu3a</h1>
        <p className="login-subtitle">سجل الدخول للمتابعة إلى حسابك</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label">البريد الإلكتروني</label>
          <input
            type="email"
            className="login-input"
            placeholder="example@email.com"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            required
          />

          <label className="login-label">كلمة المرور</label>
          <input
            type="password"
            className="login-input"
            placeholder="********"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            required
          />

          <button type="submit" className="login-button primary-button">
            تسجيل الدخول
          </button>
        </form>

        <div className="login-divider">
          <span>أو</span>
        </div>

        <button type="button" className="login-button google-button">
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="google"
            style={{ width: "20px", marginLeft: "8px" }}
          />
          تسجيل الدخول عبر Google
        </button>

        <a href="/register" className="login-register-link">
          ليس لديك حساب؟ إنشاء حساب جديد
        </a>
      </div>
    </div>
  );
}
