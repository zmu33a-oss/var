import { useState } from "react";
import { loginAdmin } from "../lib/appwrite-auth";

type LoginPageProps = {
  onLogin: () => void;
  onError: (message: string) => void;
};

export function LoginPage(props: LoginPageProps) {
  const [email, setEmail] = useState("zmu33a@gmail.com");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-badge">VAR / ADMIN</div>
        <h1 className="login-title">لوحة التحكم الرئيسية</h1>
        <p className="login-subtitle">
          سجّل الدخول بحساب الأدمن في Appwrite. العمليات الإدارية تتطلب أيضاً
          APPWRITE_API_KEY على السيرفر.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              setIsSubmitting(true);
              try {
                await loginAdmin(email, password);
                props.onLogin();
              } catch (error) {
                props.onError(
                  error instanceof Error
                    ? error.message
                    : "تعذر تسجيل الدخول.",
                );
              } finally {
                setIsSubmitting(false);
              }
            })();
          }}
        >
          <div className="field">
            <label htmlFor="admin-email">البريد الإلكتروني</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="admin-password">كلمة المرور</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "جاري الدخول..." : "دخول لوحة الأدمن"}
          </button>
        </form>

        <p className="login-footnote">
          للتطوير المحلي: شغّل <code>npx vercel dev --listen 3000</code> بجانب
          لوحة الأدمن لتفعيل /api.
        </p>
      </div>
    </div>
  );
}
