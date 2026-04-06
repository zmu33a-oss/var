```json
{
  "files": [
    {
      "path": "json/login-page.json",
      "content": {
        "page": {
          "name": "LoginPage",
          "title": "تسجيل الدخول",
          "language": "ar",
          "direction": "rtl",
          "layout": {
            "type": "centered-card",
            "background": {
              "color": "#f5f7fb"
            }
          },
          "components": [
            {
              "type": "logo",
              "text": "MyApp",
              "style": {
                "fontSize": "32px",
                "fontWeight": "700",
                "color": "#1f2937",
                "marginBottom": "10px",
                "textAlign": "center"
              }
            },
            {
              "type": "heading",
              "text": "مرحباً بعودتك",
              "style": {
                "fontSize": "24px",
                "fontWeight": "700",
                "color": "#111827",
                "textAlign": "center",
                "marginBottom": "8px"
              }
            },
            {
              "type": "text",
              "text": "سجل الدخول للمتابعة إلى حسابك",
              "style": {
                "fontSize": "14px",
                "color": "#6b7280",
                "textAlign": "center",
                "marginBottom": "24px"
              }
            },
            {
              "type": "form",
              "name": "loginForm",
              "fields": [
                {
                  "type": "email",
                  "name": "email",
                  "label": "البريد الإلكتروني",
                  "placeholder": "example@email.com",
                  "required": true
                },
                {
                  "type": "password",
                  "name": "password",
                  "label": "كلمة المرور",
                  "placeholder": "********",
                  "required": true
                }
              ],
              "actions": [
                {
                  "type": "submit",
                  "text": "تسجيل الدخول",
                  "style": "primary"
                }
              ]
            },
            {
              "type": "divider",
              "text": "أو",
              "style": {
                "marginTop": "20px",
                "marginBottom": "20px",
                "color": "#9ca3af"
              }
            },
            {
              "type": "button",
              "name": "googleLogin",
              "text": "تسجيل الدخول عبر Google",
              "icon": "google",
              "action": "oauth-google",
              "style": "google"
            },
            {
              "type": "link",
              "text": "ليس لديك حساب؟ إنشاء حساب جديد",
              "href": "/register",
              "style": {
                "display": "block",
                "textAlign": "center",
                "marginTop": "20px",
                "fontSize": "14px",
                "color": "#2563eb"
              }
            }
          ]
        }
      }
    },
    {
      "path": "json/login-style.json",
      "content": {
        "theme": {
          "card": {
            "width": "420px",
            "backgroundColor": "#ffffff",
            "padding": "32px",
            "borderRadius": "18px",
            "boxShadow": "0 10px 30px rgba(0, 0, 0, 0.08)"
          },
          "input": {
            "width": "100%",
            "padding": "14px",
            "border": "1px solid #d1d5db",
            "borderRadius": "12px",
            "fontSize": "14px",
            "marginBottom": "16px",
            "outline": "none"
          },
          "label": {
            "display": "block",
            "marginBottom": "8px",
            "fontSize": "14px",
            "fontWeight": "600",
            "color": "#374151"
          },
          "buttonPrimary": {
            "width": "100%",
            "padding": "14px",
            "backgroundColor": "#2563eb",
            "color": "#ffffff",
            "border": "none",
            "borderRadius": "12px",
            "fontSize": "15px",
            "fontWeight": "600",
            "cursor": "pointer"
          },
          "buttonGoogle": {
            "width": "100%",
            "padding": "14px",
            "backgroundColor": "#ffffff",
            "color": "#111827",
            "border": "1px solid #d1d5db",
            "borderRadius": "12px",
            "fontSize": "15px",
            "fontWeight": "600",
            "cursor": "pointer"
          }
        }
      }
    },
    {
      "path": "json/login-config.json",
      "content": {
        "auth": {
          "emailPasswordLogin": true,
          "googleLogin": true,
          "googleOAuth": {
            "enabled": true,
            "provider": "google",
            "callbackUrl": "/auth/google/callback"
          },
          "redirectAfterLogin": "/dashboard"
        },
        "validation": {
          "email": {
            "required": true,
            "format": "email"
          },
          "password": {
            "required": true,
            "minLength": 6
          }
        }
      }
    }
  ]
}
```