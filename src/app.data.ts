import type {
  ChatGroup,
  ChatMessage,
  FanClub,
  FanClubId,
  HomeMode,
  MatchEvent,
  NewsItem,
  Palette,
  Post,
  ProfileData,
  TacticalPlayer,
  Video,
  BenchPlayer,
} from "./app.types";
import { getConfiguredWalletPassUrl } from "./wallet/pass-url";

export const HOME_PALETTES: Record<HomeMode, Palette> = {
  tiktok: {
    accent: "#FF7E67",
    panel: "#120C10",
    gradient: ["#F84868", "#FFAD54"],
    label: "TikTok",
  },
  x: {
    accent: "#7ADFFF",
    panel: "#081823",
    gradient: ["#4CC4FF", "#C0F4FF"],
    label: "X",
  },
};

export const INITIAL_VIDEOS: Video[] = [
  {
    id: 1,
    creatorName: "Xtik",
    creatorHandle: "@xtik",
    caption:
      "لقطة سريعة من نبض المباراة مع نفس المزاج الكامل لواجهة TikTok داخل التطبيق.",
    likes: 128,
    saves: 24,
    shares: 11,
    comments: 19,
    likedByMe: false,
    savedByMe: false,
    sharedByMe: false,
    theme: ["#187DD2", "#061427"],
    tag: "Ocean",
  },
  {
    id: 2,
    creatorName: "WEBPLUS",
    creatorHandle: "@webplus",
    caption:
      "نسخة Expo الآن تعرض البوستر الكبير، dock جانبي، ومعلومات المنشئ في أسفل المشهد.",
    likes: 94,
    saves: 16,
    shares: 8,
    comments: 11,
    likedByMe: true,
    savedByMe: true,
    sharedByMe: false,
    theme: ["#FF6C58", "#32110E"],
    tag: "Ember",
  },
  {
    id: 3,
    creatorName: "Match Hub",
    creatorHandle: "@matchhub",
    caption:
      "الخلفيات ما زالت تجريبية، لكن لغة الحركة والزجاج الداكنة صارت أقرب للهوية البصرية المستهدفة.",
    likes: 67,
    saves: 13,
    shares: 4,
    comments: 7,
    likedByMe: false,
    savedByMe: false,
    sharedByMe: false,
    theme: ["#14D691", "#051915"],
    tag: "Neon",
  },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    author: "VAR X",
    handle: "@varx",
    time: "الآن",
    content:
      "تم نقل شريط X العلوي والبطاقات الداكنة والحالة البصرية إلى Expo مع الاحتفاظ بنفس التبويب العام.",
    likes: 18,
    replies: 2,
    reposts: 5,
    shares: 1,
    likedByMe: false,
  },
  {
    id: 2,
    author: "WEBPLUS",
    handle: "@webplus",
    time: "قبل 5 دقائق",
    content:
      "الهدف الآن ليس فقط تشغيل المشروع، بل ضبط التفاصيل البصرية: header bar، drawer، وتكوين المنشور.",
    likes: 9,
    replies: 1,
    reposts: 2,
    shares: 0,
    likedByMe: true,
  },
  {
    id: 3,
    author: "Build Notes",
    handle: "@build_notes",
    time: "قبل 12 دقيقة",
    content:
      "النسخة الحالية صارت مركزة بالكامل على Expo مع الحفاظ على التدرج البصري نفسه خطوة بخطوة.",
    likes: 6,
    replies: 0,
    reposts: 1,
    shares: 0,
    likedByMe: false,
  },
];

export const FAN_CLUBS: FanClub[] = [
  {
    id: "hilal",
    title: "الهلال",
    crowdLabel: "جمهور الهلال",
    summary: "صعود ثابت في ترند الرابطة مع زخمة واضحة حول الملخصات السريعة.",
    trendLabel: "الأكثر تفاعلًا",
    gradient: ["#0B47BC", "#041125"],
    icon: "moon",
  },
  {
    id: "nassr",
    title: "النصر",
    crowdLabel: "جمهور النصر",
    summary: "موجة اقتباسات كبيرة مع حفظ مرتفع للمقاطع القصيرة.",
    trendLabel: "ترند صاعد",
    gradient: ["#B38727", "#231A05"],
    icon: "sunny",
  },
  {
    id: "ittihad",
    title: "الاتحاد",
    crowdLabel: "جمهور الاتحاد",
    summary: "ثبات يومي في التفاعل مع ارتفاع جيد لعدد المشاركات.",
    trendLabel: "ثبات قوي",
    gradient: ["#C59037", "#281806"],
    icon: "shield",
  },
];

export const INITIAL_SUPPORTERS: Record<FanClubId, number> = {
  hilal: 1842,
  nassr: 1634,
  ittihad: 1278,
};

export const MATCH_NEWS: NewsItem[] = [
  {
    id: "n1",
    badge: "عاجل",
    title: "الهلال يراجع شكل الضغط قبل المواجهة القادمة",
    summary:
      "الطاقم الفني ركز على الضغط العكسي وسرعة التحول بعد افتكاك الكرة في الثلث الأوسط.",
    time: "قبل 8 دقائق",
    accent: "#63C6FF",
  },
  {
    id: "n2",
    badge: "متابعة",
    title: "النصر يجهز خطة بديلة في الثلث الأخير",
    summary:
      "العمل الآن على زيادة الكثافة حول الصندوق وخلق حل ثالث خلف المهاجم.",
    time: "قبل 14 دقيقة",
    accent: "#FFBB5B",
  },
  {
    id: "n3",
    badge: "تقارير",
    title: "الاستعداد الصيفي يرفع أسهم بعض الأسماء المحلية",
    summary:
      "المنافسة اشتعلت على مركز الجناح والظهير مع ترقب نافذة انتقالات مبكرة.",
    time: "قبل ساعة",
    accent: "#D283FF",
  },
];

export const MATCH_EVENTS: MatchEvent[] = [
  {
    id: "e1",
    minute: "12'",
    title: "ضغط عالٍ",
    detail: "الهلال يغلق العمق ويستعيد الكرة بسرعة في الثلث الأوسط.",
  },
  {
    id: "e2",
    minute: "29'",
    title: "فرصة خطرة",
    detail: "النصر يصل خلف الظهير الأيسر بتبادل سريع على الطرف.",
  },
  {
    id: "e3",
    minute: "53'",
    title: "تعديل تكتيكي",
    detail: "تحويل الجناح إلى العمق لخلق زيادة عددية أمام منطقة الجزاء.",
  },
  {
    id: "e4",
    minute: "77'",
    title: "تبديل تجريبي",
    detail: "دخول جناح سريع لزيادة العرضيات والضغط على خط الدفاع.",
  },
];

export const PRESSURE_BARS = [20, 20, 21, 22, 24, 25, 27, 29, 31, 29, 24, 20];
export const HOME_SUPPORT = 2578;
export const AWAY_SUPPORT = 1950;

export const HOME_LINEUP: TacticalPlayer[] = [
  {
    id: "h1",
    name: "حارس الهلال",
    number: 37,
    x: 0.5,
    y: 0.12,
    gradient: ["#67C7FF", "#1A48AF"],
  },
  {
    id: "h2",
    name: "ظهير أيمن الهلال",
    number: 66,
    x: 0.18,
    y: 0.28,
    gradient: ["#67C7FF", "#1A48AF"],
  },
  {
    id: "h3",
    name: "قلب دفاع الهلال 1",
    number: 3,
    x: 0.4,
    y: 0.28,
    gradient: ["#67C7FF", "#1A48AF"],
  },
  {
    id: "h4",
    name: "قلب دفاع الهلال 2",
    number: 5,
    x: 0.6,
    y: 0.28,
    gradient: ["#67C7FF", "#1A48AF"],
  },
  {
    id: "h5",
    name: "ظهير أيسر الهلال",
    number: 12,
    x: 0.82,
    y: 0.28,
    gradient: ["#67C7FF", "#1A48AF"],
  },
  {
    id: "h6",
    name: "محور الهلال",
    number: 8,
    x: 0.28,
    y: 0.49,
    gradient: ["#67C7FF", "#1A48AF"],
  },
  {
    id: "h7",
    name: "وسط الهلال",
    number: 16,
    x: 0.5,
    y: 0.49,
    gradient: ["#67C7FF", "#1A48AF"],
  },
  {
    id: "h8",
    name: "صانع لعب الهلال",
    number: 10,
    x: 0.72,
    y: 0.49,
    gradient: ["#67C7FF", "#1A48AF"],
  },
  {
    id: "h9",
    name: "جناح أيمن الهلال",
    number: 77,
    x: 0.18,
    y: 0.73,
    gradient: ["#67C7FF", "#1A48AF"],
  },
  {
    id: "h10",
    name: "مهاجم الهلال",
    number: 9,
    x: 0.5,
    y: 0.78,
    gradient: ["#67C7FF", "#1A48AF"],
  },
  {
    id: "h11",
    name: "جناح أيسر الهلال",
    number: 29,
    x: 0.82,
    y: 0.73,
    gradient: ["#67C7FF", "#1A48AF"],
  },
];

export const AWAY_LINEUP: TacticalPlayer[] = [
  {
    id: "a1",
    name: "حارس النصر",
    number: 44,
    x: 0.5,
    y: 0.88,
    gradient: ["#FFD16A", "#9A4E1A"],
  },
  {
    id: "a2",
    name: "ظهير أيمن النصر",
    number: 2,
    x: 0.18,
    y: 0.72,
    gradient: ["#FFD16A", "#9A4E1A"],
  },
  {
    id: "a3",
    name: "قلب دفاع النصر 1",
    number: 4,
    x: 0.4,
    y: 0.72,
    gradient: ["#FFD16A", "#9A4E1A"],
  },
  {
    id: "a4",
    name: "قلب دفاع النصر 2",
    number: 17,
    x: 0.6,
    y: 0.72,
    gradient: ["#FFD16A", "#9A4E1A"],
  },
  {
    id: "a5",
    name: "ظهير أيسر النصر",
    number: 13,
    x: 0.82,
    y: 0.72,
    gradient: ["#FFD16A", "#9A4E1A"],
  },
  {
    id: "a6",
    name: "محور النصر 1",
    number: 6,
    x: 0.33,
    y: 0.54,
    gradient: ["#FFD16A", "#9A4E1A"],
  },
  {
    id: "a7",
    name: "محور النصر 2",
    number: 14,
    x: 0.67,
    y: 0.54,
    gradient: ["#FFD16A", "#9A4E1A"],
  },
  {
    id: "a8",
    name: "جناح أيمن النصر",
    number: 11,
    x: 0.18,
    y: 0.34,
    gradient: ["#FFD16A", "#9A4E1A"],
  },
  {
    id: "a9",
    name: "صانع لعب النصر",
    number: 25,
    x: 0.5,
    y: 0.38,
    gradient: ["#FFD16A", "#9A4E1A"],
  },
  {
    id: "a10",
    name: "جناح أيسر النصر",
    number: 7,
    x: 0.82,
    y: 0.34,
    gradient: ["#FFD16A", "#9A4E1A"],
  },
  {
    id: "a11",
    name: "مهاجم النصر",
    number: 9,
    x: 0.5,
    y: 0.18,
    gradient: ["#FFD16A", "#9A4E1A"],
  },
];

export const HOME_BENCH: BenchPlayer[] = [
  { id: "hb1", name: "بديل الهلال 1", number: 18 },
  { id: "hb2", name: "بديل الهلال 2", number: 24 },
  { id: "hb3", name: "بديل الهلال 3", number: 31 },
  { id: "hb4", name: "بديل الهلال 4", number: 70 },
  { id: "hb5", name: "بديل الهلال 5", number: 88 },
];

export const AWAY_BENCH: BenchPlayer[] = [
  { id: "ab1", name: "بديل النصر 1", number: 19 },
  { id: "ab2", name: "بديل النصر 2", number: 21 },
  { id: "ab3", name: "بديل النصر 3", number: 27 },
  { id: "ab4", name: "بديل النصر 4", number: 30 },
  { id: "ab5", name: "بديل النصر 5", number: 80 },
];

export const INITIAL_PROFILE: ProfileData = {
  displayName: "ناصر السبيعي",
  username: "@nasser",
  bio: "Software Engineer",
  location: "الرياض، السعودية",
  email: "nasser@xtik.app",
  phoneNumber: "055 248 7319",
  profession: "Software Engineer",
  nationalId: "1093478521",
  birthDate: "15/05/1990",
  nationality: "سعودي",
  joinDate: "مايو 2026",
  avatarFrameEnabled: false,
  isVerified: true,
  walletPassAdded: false,
  walletPassUrl: getConfiguredWalletPassUrl(),
};

export const INITIAL_CHAT_GROUPS: ChatGroup[] = [
  {
    id: "grp-hilal",
    name: "رابطة الهلال",
    lastMessage: "ثبتوا جملة التشجيع الأساسية قبل البداية.",
    time: "2د",
    unread: 1,
    icon: "moon",
  },
  {
    id: "grp-dev",
    name: "عائلة البرمجة",
    lastMessage: "تمت مزامنة صفحة Fans مع الهيكل الجديد.",
    time: "15د",
    unread: 0,
    icon: "code-slash",
  },
  {
    id: "grp-varx",
    name: "غرفة VAR X",
    lastMessage: "بطاقة المباراة جاهزة للمراجعة.",
    time: "1س",
    unread: 3,
    icon: "chatbubbles",
  },
];

export const INITIAL_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  "grp-hilal": [
    {
      id: "m-1",
      sender: "سلمان",
      content: "ثبتوا جملة التشجيع الأساسية قبل البداية.",
      time: "2د",
      mine: false,
    },
    {
      id: "m-2",
      sender: "VAR X",
      content: "تم تجهيز نسخة Expo بنفس الجو العام تقريبًا.",
      time: "الآن",
      mine: true,
    },
  ],
  "grp-dev": [
    {
      id: "m-3",
      sender: "WEBPLUS",
      content: "خط النقل الحالي يركز على التصميم قبل توصيل المنطق التفصيلي.",
      time: "12د",
      mine: false,
    },
    {
      id: "m-4",
      sender: "VAR X",
      content: "الـ profile والـ leagues صاروا أقرب بصريًا للشكل النهائي.",
      time: "8د",
      mine: true,
    },
  ],
  "grp-varx": [
    {
      id: "m-5",
      sender: "Room",
      content: "راجعوا زر VAR X داخل بطاقة المباراة.",
      time: "55د",
      mine: false,
    },
    {
      id: "m-6",
      sender: "VAR X",
      content: "تم ربطه الآن بمشاركة محلية إلى صفحة X داخل Expo.",
      time: "48د",
      mine: true,
    },
  ],
};

export const X_GROUP_PREVIEW = ["زميع :", "عائلة البرمجة", "مشروع X-New"];
