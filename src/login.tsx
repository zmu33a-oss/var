ممتاز.

هذا محتوى صفحة لوق إن جديدة كواجهة فقط، انسخه داخل الملف الفارغ في `htt`:

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>تسجيل الدخول</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: "Tahoma", Arial, sans-serif;
    }

    body {
      background: linear-gradient(135deg, #0f172a, #1e293b, #334155);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .login-container {
      width: 100%;
      max-width: 420px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(12px);
      border-radius: 20px;
      padding: 35px 28px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
      color: #fff;
    }

    .login-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .login-header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .login-header p {
      color: #cbd5e1;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: #e2e8f0;
    }

    .form-group input {
      width: 100%;
      padding: 14px 15px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      font-size: 15px;
      outline: none;
      transition: 0.3s;
    }

    .form-group input::placeholder {
      color: #94a3b8;
    }

    .form-group input:focus {
      border-color: #38bdf8;
      background: rgba(255, 255, 255, 0.12);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18);
    }

    .options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      font-size: 13px;
      color: #cbd5e1;
      gap: 10px;
      flex-wrap: wrap;
    }

    .options a {
      color: #38bdf8;
      text-decoration: none;
    }

    .options a:hover {
      text-decoration: underline;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .login-btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #0ea5e9, #2563eb);
      color: white;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: 0.3s;
    }

    .login-btn:hover {
      transform: translateY(-1px);
      opacity: 0.95;
    }

    .footer-text {
      text-align: center;
      margin-top: 22px;
      font-size: 14px;
      color: #cbd5e1;
    }

    .footer-text a {
      color: #38bdf8;
      text-decoration: none;
      font-weight: bold;
    }

    .footer-text a:hover {
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .login-container {
        padding: 28px 20px;
      }

      .login-header h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-header">
      <h1>تسجيل الدخول</h1>
      <p>أدخل بياناتك للوصول إلى حسابك</p>
    </div>

    <form>
      <div class="form-group">
        <label for="email">البريد الإلكتروني</label>
        <input type="email" id="email" placeholder="أدخل البريد الإلكتروني" />
      </div>

      <div class="form-group">
        <label for="password">كلمة المرور</label>
        <input type="password" id="password" placeholder="أدخل كلمة المرور" />
      </div>

      <div class="options">
        <label class="remember-me">
          <input type="checkbox" />
          <span>تذكرني</span>
        </label>
        <a href="#">نسيت كلمة المرور؟</a>
      </div>

      <button type="submit" class="login-btn">دخول</button>
    </form>

    <div class="footer-text">
      ليس لديك حساب؟ <a href="#">إنشاء حساب</a>
    </div>
  </div>
</body>
</html>

إذا تريد، الخطوة الجاية أجهز لك:
1. نسخة أفخم
2. نسخة بسيطة جدًا
3. نسخة متوافقة مع Bootstrap/Tailwind