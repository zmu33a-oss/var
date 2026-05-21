import type { MockAdminUser } from "../types";

export const MOCK_ADMIN_SESSION: MockAdminUser = {
  displayName: "VAR Control",
  email: "admin@var.local",
  roleLabel: "أدمن رئيسي",
  varId: "VAR-00000001",
};

export const MOCK_STATS = [
  { label: "المستخدمون", value: "1,284", accent: "#63C6FF" },
  { label: "منشورات اليوم", value: "96", accent: "#41F17B" },
  { label: "بلاغات مفتوحة", value: "12", accent: "#F4C565" },
  { label: "حسابات موثّقة", value: "318", accent: "#F985FF" },
];

export const MOCK_HEALTH = [
  { label: "Appwrite", ready: true, detail: "متصل — واجهة فقط" },
  { label: "قاعدة البيانات", ready: true, detail: "جاهز للربط لاحقاً" },
  { label: "منشورات X", ready: false, detail: "بانتظار تفعيل Collection" },
  { label: "سجل التدقيق", ready: false, detail: "المرحلة القادمة" },
];

export const MOCK_USER_LOOKUP = {
  displayName: "أحمد المنصور",
  username: "ahmed_var",
  displayVarId: "VAR-12345678",
  internalVarId: "usr_9f2a1c",
  role: "عضو",
  verified: false,
  status: "نشط",
  posts: 42,
  points: 1280,
};

export const MOCK_POSTS = [
  {
    id: "p1",
    author: "VAR-12345678",
    title: "تحليل مباراة اليوم",
    excerpt: "توقعات قوية على الشوط الثاني مع ضغط عالي من الجمهور...",
    time: "منذ 12 دقيقة",
  },
  {
    id: "p2",
    author: "VAR-88221004",
    title: "نقاش حول التحكيم",
    excerpt: "هل القرار الأخير كان صحيحاً؟ شاركونا رأيكم...",
    time: "منذ ساعة",
  },
  {
    id: "p3",
    author: "VAR-44190021",
    title: "تنبيه إداري",
    excerpt: "محتوى قيد المراجعة — زر الحذف سيُفعّل بعد ربط API.",
    time: "منذ 3 ساعات",
  },
];
