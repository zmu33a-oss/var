{
  "action": "edit_file",
  "source": "htt",
  "target_page": "login",
  "mode": "create_or_replace",
  "data": {
    "page_title": "تسجيل الدخول",
    "sections": [
      {
        "type": "header",
        "title": "مرحباً بعودتك",
        "subtitle": "سجل دخولك للوصول إلى حسابك"
      },
      {
        "type": "form",
        "fields": [
          {
            "type": "text",
            "name": "username",
            "label": "البريد الإلكتروني أو اسم المستخدم",
            "placeholder": "أدخل البريد الإلكتروني أو اسم المستخدم",
            "required": true
          },
          {
            "type": "password",
            "name": "password",
            "label": "كلمة المرور",
            "placeholder": "أدخل كلمة المرور",
            "required": true
          },
          {
            "type": "checkbox",
            "name": "remember_me",
            "label": "تذكرني"
          }
        ],
        "actions": [
          {
            "type": "link",
            "label": "نسيت كلمة المرور؟",
            "target": "forgot_password"
          },
          {
            "type": "submit",
            "label": "تسجيل الدخول"
          }
        ]
      },
      {
        "type": "footer",
        "text": "ليس لديك حساب؟",
        "link_label": "إنشاء حساب جديد",
        "link_target": "register"
      }
    ],
    "features": [
      "تصميم متجاوب",
      "التحقق من الحقول",
      "رسائل خطأ واضحة",
      "حالة تحميل عند الإرسال"
    ]
  }
}