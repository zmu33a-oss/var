import React, { ReactNode, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

const MONO_FONT = Platform.OS === "ios" ? "Courier" : "monospace";
const SHELL_WIDTH = 430;

type GradientPair = [string, string];
type MainTab = "home" | "fans" | "leagues" | "account";
type Tab = MainTab | "chat";
type HomeMode = "tiktok" | "x";
type AuthMode = "login" | "signup";
type LeagueTab = "events" | "lineup" | "poll";
type FanClubId = "hilal" | "nassr" | "ittihad";
type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Palette = {
  accent: string;
  panel: string;
  gradient: GradientPair;
  label: string;
};

type Video = {
  id: number;
  creatorName: string;
  creatorHandle: string;
  caption: string;
  likes: number;
  saves: number;
  shares: number;
  comments: number;
  likedByMe: boolean;
  theme: GradientPair;
  tag: string;
};

type Post = {
  id: number;
  author: string;
  handle: string;
  time: string;
  content: string;
  likes: number;
  replies: number;
  reposts: number;
  shares: number;
  likedByMe: boolean;
};

type FanClub = {
  id: FanClubId;
  title: string;
  crowdLabel: string;
  summary: string;
  trendLabel: string;
  gradient: GradientPair;
  icon: IconName;
};

type TacticalPlayer = {
  id: string;
  name: string;
  number: number;
  x: number;
  y: number;
  gradient: GradientPair;
};

type BenchPlayer = {
  id: string;
  name: string;
  number: number;
};

type NewsItem = {
  id: string;
  badge: string;
  title: string;
  summary: string;
  time: string;
  accent: string;
};

type MatchEvent = {
  id: string;
  minute: string;
  title: string;
  detail: string;
};

type ProfileData = {
  displayName: string;
  username: string;
  bio: string;
  location: string;
  email: string;
  joinDate: string;
  avatarFrameEnabled: boolean;
  isVerified: boolean;
};

type MetricTile = {
  id: string;
  label: string;
  value: string;
  color: string;
  icon: IconName;
};

type ChatGroup = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  icon: IconName;
};

type ChatMessage = {
  id: string;
  sender: string;
  content: string;
  time: string;
  mine: boolean;
};

const HOME_PALETTES: Record<HomeMode, Palette> = {
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

const INITIAL_VIDEOS: Video[] = [
  {
    id: 1,
    creatorName: "Xtik",
    creatorHandle: "@xtik",
    caption:
      "لقطة سريعة من نبض المباراة مع نفس المزاج الكامل لواجهة TikTok في SwiftUI.",
    likes: 128,
    saves: 24,
    shares: 11,
    comments: 19,
    likedByMe: false,
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
    theme: ["#FF6C58", "#32110E"],
    tag: "Ember",
  },
  {
    id: 3,
    creatorName: "Match Hub",
    creatorHandle: "@matchhub",
    caption:
      "الخلفيات ما زالت تجريبية، لكن لغة الحركة والزجاج الداكنة صارت أقرب للشاشة الأصلية في Swift.",
    likes: 67,
    saves: 13,
    shares: 4,
    comments: 7,
    likedByMe: false,
    theme: ["#14D691", "#051915"],
    tag: "Neon",
  },
];

const INITIAL_POSTS: Post[] = [
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
      "الهدف الآن ليس فقط تشغيل المشروع، بل تقريب التفاصيل البصرية من Swift: header bar، drawer، وتكوين المنشور.",
    likes: 9,
    replies: 1,
    reposts: 2,
    shares: 0,
    likedByMe: true,
  },
  {
    id: 3,
    author: "Swift Build",
    handle: "@swift_build",
    time: "قبل 12 دقيقة",
    content:
      "تبقى ملفات Swift موجودة كمرجع حتى تكتمل مطابقة التفاعلات الدقيقة خطوة بخطوة.",
    likes: 6,
    replies: 0,
    reposts: 1,
    shares: 0,
    likedByMe: false,
  },
];

const FAN_CLUBS: FanClub[] = [
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

const INITIAL_SUPPORTERS: Record<FanClubId, number> = {
  hilal: 1842,
  nassr: 1634,
  ittihad: 1278,
};

const MATCH_NEWS: NewsItem[] = [
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

const MATCH_EVENTS: MatchEvent[] = [
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

const PRESSURE_BARS = [20, 20, 21, 22, 24, 25, 27, 29, 31, 29, 24, 20];
const HOME_SUPPORT = 2578;
const AWAY_SUPPORT = 1950;

const HOME_LINEUP: TacticalPlayer[] = [
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

const AWAY_LINEUP: TacticalPlayer[] = [
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

const HOME_BENCH: BenchPlayer[] = [
  { id: "hb1", name: "بديل الهلال 1", number: 18 },
  { id: "hb2", name: "بديل الهلال 2", number: 24 },
  { id: "hb3", name: "بديل الهلال 3", number: 31 },
  { id: "hb4", name: "بديل الهلال 4", number: 70 },
  { id: "hb5", name: "بديل الهلال 5", number: 88 },
];

const AWAY_BENCH: BenchPlayer[] = [
  { id: "ab1", name: "بديل النصر 1", number: 19 },
  { id: "ab2", name: "بديل النصر 2", number: 21 },
  { id: "ab3", name: "بديل النصر 3", number: 27 },
  { id: "ab4", name: "بديل النصر 4", number: 30 },
  { id: "ab5", name: "بديل النصر 5", number: 80 },
];

const INITIAL_PROFILE: ProfileData = {
  displayName: "Xtik User",
  username: "@xtik",
  bio: "تغيير الخلفية وتعديل الملف الشخصي",
  location: "الرياض، السعودية",
  email: "user@webplus.app",
  joinDate: "مايو 2026",
  avatarFrameEnabled: false,
  isVerified: true,
};

const INITIAL_CHAT_GROUPS: ChatGroup[] = [
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

const INITIAL_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
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
      content: "الـ profile والـ leagues صاروا أقرب بصريًا من Swift.",
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

const X_GROUP_PREVIEW = ["زميع :", "عائلة البرمجة", "مشروع X-New"];

export default function ExpoSwiftPort() {
  const { height } = useWindowDimensions();
  const [currentTab, setCurrentTab] = useState<Tab>("home");
  const [chatBaseTab, setChatBaseTab] = useState<MainTab>("home");
  const [homeMode, setHomeMode] = useState<HomeMode>("tiktok");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canOpenAdmin, setCanOpenAdmin] = useState(false);
  const [notice, setNotice] = useState(
    "تم البدء بنقل اللغة البصرية من Swift إلى Expo.",
  );
  const [videos, setVideos] = useState(INITIAL_VIDEOS);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [supporters, setSupporters] = useState(INITIAL_SUPPORTERS);
  const [supportedTeams, setSupportedTeams] = useState<FanClubId[]>([]);
  const [profile, setProfile] = useState(INITIAL_PROFILE);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = setTimeout(() => {
      setNotice("");
    }, 2600);

    return () => clearTimeout(timeout);
  }, [notice]);

  const visibleTab: MainTab = currentTab === "chat" ? chatBaseTab : currentTab;
  const palette = HOME_PALETTES[homeMode];

  const requireAuth = (message = "سجل الدخول أولاً") => {
    setAuthMode("login");
    setCurrentTab("account");
    setNotice(message);
  };

  const selectMainTab = (tab: MainTab) => {
    setChatBaseTab(tab);
    setCurrentTab(tab);
  };

  const openChat = () => {
    if (!isLoggedIn) {
      requireAuth("سجل الدخول لفتح الدردشة.");
      return;
    }

    setChatBaseTab(visibleTab);
    setCurrentTab("chat");
  };

  const prependPost = (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    setPosts((currentPosts) => [
      {
        id: Date.now(),
        author: "VAR X",
        handle: "@varx",
        time: "الآن",
        content: trimmedContent,
        likes: 0,
        replies: 0,
        reposts: 0,
        shares: 0,
        likedByMe: false,
      },
      ...currentPosts,
    ]);
  };

  const handleHomeAction = () => {
    if (!isLoggedIn) {
      requireAuth(
        homeMode === "x"
          ? "سجل الدخول لإنشاء منشور X."
          : "سجل الدخول لإضافة فيديو جديد.",
      );
      return;
    }

    if (homeMode === "x") {
      prependPost(
        "تم إنشاء منشور جديد من زر VAR المركزي بعد نقل التصميم إلى Expo.",
      );
      setNotice("تمت إضافة منشور X جديد.");
      return;
    }

    setVideos((currentVideos) => [
      {
        id: Date.now(),
        creatorName: "WEBPLUS Expo",
        creatorHandle: "@expo",
        caption:
          "فيديو تجريبي جديد من زر VAR المركزي، بنفس الروح الداكنة للواجهة الأصلية.",
        likes: 0,
        saves: 0,
        shares: 0,
        comments: 0,
        likedByMe: false,
        theme: ["#6647FF", "#160B2E"],
        tag: "Night",
      },
      ...currentVideos,
    ]);
    setNotice("تمت إضافة فيديو تجريبي جديد.");
  };

  const toggleVideoLike = (videoId: number) => {
    setVideos((currentVideos) =>
      currentVideos.map((video) => {
        if (video.id !== videoId) {
          return video;
        }

        const nextLiked = !video.likedByMe;

        return {
          ...video,
          likedByMe: nextLiked,
          likes: Math.max(0, video.likes + (nextLiked ? 1 : -1)),
        };
      }),
    );
  };

  const togglePostLike = (postId: number) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        const nextLiked = !post.likedByMe;

        return {
          ...post,
          likedByMe: nextLiked,
          likes: Math.max(0, post.likes + (nextLiked ? 1 : -1)),
        };
      }),
    );
  };

  const toggleSupport = (clubId: FanClubId) => {
    if (!isLoggedIn) {
      requireAuth("سجل الدخول لدعم الرابطة.");
      return;
    }

    const alreadySupported = supportedTeams.includes(clubId);

    setSupportedTeams((currentTeams) =>
      alreadySupported
        ? currentTeams.filter((teamId) => teamId !== clubId)
        : [...currentTeams, clubId],
    );
    setSupporters((currentCounts) => ({
      ...currentCounts,
      [clubId]: Math.max(
        0,
        currentCounts[clubId] + (alreadySupported ? -1 : 1),
      ),
    }));
    setNotice(
      alreadySupported
        ? "تمت إزالة الدعم من الرابطة."
        : "تم تسجيل دعمك للرابطة.",
    );
  };

  const completeAuthFlow = () => {
    setIsLoggedIn(true);
    setCanOpenAdmin(true);
    setCurrentTab("account");
    setNotice("تم تسجيل الدخول إلى نسخة Expo.");
  };

  const shareVarXBoard = (content: string) => {
    if (!isLoggedIn) {
      requireAuth("سجل الدخول لمشاركة لوحة VAR X.");
      return;
    }

    prependPost(content);
    setHomeMode("x");
    setChatBaseTab("home");
    setCurrentTab("home");
    setNotice("تمت مشاركة لوحة VAR X داخل صفحة X.");
  };

  const signOut = () => {
    setIsLoggedIn(false);
    setCanOpenAdmin(false);
    setCurrentTab("home");
    setNotice("تم تسجيل الخروج من النسخة الحالية.");
  };

  let screen: ReactNode;

  switch (visibleTab) {
    case "home":
      screen = (
        <HomeScreen
          homeMode={homeMode}
          isLoggedIn={isLoggedIn}
          palette={palette}
          posts={posts}
          videos={videos}
          windowHeight={height}
          onChangeMode={setHomeMode}
          onCreatePost={handleHomeAction}
          onOpenChat={openChat}
          onRequireAuth={requireAuth}
          onTogglePostLike={togglePostLike}
          onToggleVideoLike={toggleVideoLike}
        />
      );
      break;
    case "fans":
      screen = (
        <FansScreen
          isLoggedIn={isLoggedIn}
          supporters={supporters}
          supportedTeams={supportedTeams}
          onRequireAuth={requireAuth}
          onToggleSupport={toggleSupport}
        />
      );
      break;
    case "leagues":
      screen = <LeaguesScreen onShareVarXBoard={shareVarXBoard} />;
      break;
    case "account":
      screen = isLoggedIn ? (
        <ProfileScreen
          canOpenAdmin={canOpenAdmin}
          posts={posts}
          profile={profile}
          onSaveProfile={setProfile}
          onSignOut={signOut}
        />
      ) : (
        <AuthScreen
          authMode={authMode}
          onChangeMode={setAuthMode}
          onSuccess={completeAuthFlow}
        />
      );
      break;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.appRoot}>
        <View pointerEvents="none" style={styles.backgroundLayer}>
          <View
            style={[
              styles.blurOrb,
              styles.primaryOrb,
              { backgroundColor: palette.accent },
            ]}
          />
          <View style={styles.secondaryOrb} />
          <View style={styles.tertiaryOrb} />
        </View>

        <View style={styles.shell}>
          {notice ? (
            <View style={styles.noticeWrap}>
              <View style={styles.noticePill}>
                <Ionicons name="sparkles-outline" size={16} color="#E8F6FF" />
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            </View>
          ) : null}

          {screen}

          {visibleTab === "home" ? (
            <View style={styles.themeSwitchLayer}>
              <FloatingThemeSwitch
                selection={homeMode}
                onChange={setHomeMode}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.bottomDock}>
          <BottomNav
            current={visibleTab}
            homeMode={homeMode}
            onHomeAction={handleHomeAction}
            onSelect={selectMainTab}
          />
        </View>

        {currentTab === "chat" ? (
          <ChatOverlay onClose={() => setCurrentTab(chatBaseTab)} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function HomeScreen(props: {
  homeMode: HomeMode;
  isLoggedIn: boolean;
  palette: Palette;
  posts: Post[];
  videos: Video[];
  windowHeight: number;
  onChangeMode: (mode: HomeMode) => void;
  onCreatePost: () => void;
  onOpenChat: () => void;
  onRequireAuth: (message?: string) => void;
  onTogglePostLike: (postId: number) => void;
  onToggleVideoLike: (videoId: number) => void;
}) {
  const {
    homeMode,
    isLoggedIn,
    palette,
    posts,
    videos,
    windowHeight,
    onChangeMode,
    onCreatePost,
    onOpenChat,
    onRequireAuth,
    onTogglePostLike,
    onToggleVideoLike,
  } = props;

  const topPadding = 124;

  if (homeMode === "tiktok") {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.screenContent,
          { paddingTop: topPadding },
        ]}
      >
        {videos.map((video) => (
          <TikTokVideoCard
            key={video.id}
            cardHeight={Math.max(windowHeight - 250, 520)}
            isLoggedIn={isLoggedIn}
            video={video}
            onRequireAuth={onRequireAuth}
            onToggleLike={() => {
              if (!isLoggedIn) {
                onRequireAuth("سجل الدخول للتفاعل مع الفيديو.");
                return;
              }

              onToggleVideoLike(video.id);
            }}
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.screenContent, { paddingTop: topPadding }]}
    >
      <GlassCard style={styles.xDrawerCard}>
        <View style={styles.drawerTopRow}>
          <Pressable style={styles.drawerChip} onPress={onOpenChat}>
            <Text style={styles.drawerChipText}>فتح الدردشة</Text>
          </Pressable>

          <View style={styles.drawerTitleBlock}>
            <Text style={styles.drawerKicker}>X GROUPS</Text>
            <Text style={styles.drawerTitle}>المساحات السريعة</Text>
          </View>
        </View>

        <View style={styles.drawerChipsRow}>
          {X_GROUP_PREVIEW.map((group) => (
            <View key={group} style={styles.xSpaceChip}>
              <Text style={styles.xSpaceChipText}>{group}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <View style={styles.xHeaderCard}>
        <LinearGradient
          colors={["rgba(0,0,0,0.92)", "rgba(0,0,0,0.74)"]}
          style={styles.xHeaderGradient}
        >
          <View style={styles.xHeaderRow}>
            <Pressable
              style={styles.xAvatarButton}
              onPress={
                isLoggedIn
                  ? onCreatePost
                  : () => onRequireAuth("سجل الدخول لفتح خيارات X.")
              }
            >
              <LinearGradient
                colors={["#51C7FF", "#16386F"]}
                style={styles.xAvatarCircle}
              >
                <Text style={styles.xAvatarLetter}>V</Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.xHeaderTitleBlock}>
              <Text style={styles.xHeaderBrand}>VAR X</Text>
              <Text style={styles.xHeaderSubtitle}>
                #الهلال × النصر — الأجواء حماسية قبل بداية المباراة
              </Text>
            </View>

            <Pressable
              style={[
                styles.xComposerButton,
                { backgroundColor: palette.panel },
              ]}
              onPress={
                isLoggedIn
                  ? onCreatePost
                  : () => onRequireAuth("سجل الدخول لإنشاء منشور X.")
              }
            >
              <Text style={styles.xComposerText}>منشور جديد</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.modeStrip}>
        <ModeSwitchButton
          label="TikTok"
          isActive={false}
          onPress={() => onChangeMode("tiktok")}
        />
        <ModeSwitchButton
          label="X"
          isActive
          onPress={() => onChangeMode("x")}
        />
      </View>

      {posts.map((post) => (
        <XPostCard
          key={post.id}
          post={post}
          onLike={() => {
            if (!isLoggedIn) {
              onRequireAuth("سجل الدخول للتفاعل مع منشورات X.");
              return;
            }

            onTogglePostLike(post.id);
          }}
        />
      ))}
    </ScrollView>
  );
}

function FansScreen(props: {
  isLoggedIn: boolean;
  supporters: Record<FanClubId, number>;
  supportedTeams: FanClubId[];
  onRequireAuth: (message?: string) => void;
  onToggleSupport: (clubId: FanClubId) => void;
}) {
  const {
    isLoggedIn,
    supporters,
    supportedTeams,
    onRequireAuth,
    onToggleSupport,
  } = props;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.screenContent}
    >
      <SectionHeader
        eyebrow="FANS"
        title="الرابطة"
        description="بطاقات الرابطة والترندات نُقلت بنفس المزاج الداكن واللمسات المعدنية من نسخة Swift."
      />

      <GlassCard style={styles.fansHeroCard}>
        <LinearGradient
          colors={["#101D39", "#09111E"]}
          style={styles.fansHeroGradient}
        >
          <Text style={styles.fansHeroEyebrow}>FAN PULSE</Text>
          <Text style={styles.fansHeroTitle}>الموجة الأعلى هذا الأسبوع</Text>
          <Text style={styles.fansHeroText}>
            الهلال يتصدر التفاعل، والنصر يلاحق بسرعة، والاتحاد يحافظ على ثبات
            يومي في المشاركات.
          </Text>
        </LinearGradient>
      </GlassCard>

      {FAN_CLUBS.map((club) => {
        const isSupported = supportedTeams.includes(club.id);

        return (
          <GlassCard key={club.id} style={styles.clubCard}>
            <LinearGradient colors={club.gradient} style={styles.clubBanner}>
              <View style={styles.clubBannerRow}>
                <Ionicons name={club.icon} size={20} color="#FFFFFF" />
                <Text style={styles.clubBannerTag}>{club.trendLabel}</Text>
              </View>
              <Text style={styles.clubBannerTitle}>{club.title}</Text>
              <Text style={styles.clubBannerSummary}>{club.summary}</Text>
            </LinearGradient>

            <View style={styles.clubFooter}>
              <View style={styles.clubMeta}>
                <Text style={styles.clubMetaLabel}>{club.crowdLabel}</Text>
                <Text style={styles.clubMetaValue}>
                  {supporters[club.id]} داعم
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  if (!isLoggedIn) {
                    onRequireAuth("سجل الدخول لدعم الرابطة.");
                    return;
                  }

                  onToggleSupport(club.id);
                }}
                style={[
                  styles.supportButton,
                  isSupported ? styles.supportButtonActive : null,
                ]}
              >
                <Text style={styles.supportButtonText}>
                  {isSupported ? "مدعوم" : "ادعم الآن"}
                </Text>
              </Pressable>
            </View>
          </GlassCard>
        );
      })}
    </ScrollView>
  );
}

function LeaguesScreen(props: { onShareVarXBoard: (content: string) => void }) {
  const [newsOpen, setNewsOpen] = useState(false);
  const [leagueTab, setLeagueTab] = useState<LeagueTab>("events");
  const [lineupTeam, setLineupTeam] = useState<"home" | "away">("home");
  const homeShare = HOME_SUPPORT / (HOME_SUPPORT + AWAY_SUPPORT);
  const selectedPlayers = lineupTeam === "home" ? HOME_LINEUP : AWAY_LINEUP;
  const selectedBench = lineupTeam === "home" ? HOME_BENCH : AWAY_BENCH;
  const selectedTeamLabel = lineupTeam === "home" ? "الهلال" : "النصر";

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.screenContent}
    >
      <View style={styles.newsWrap}>
        {newsOpen ? (
          <GlassCard style={styles.newsExpandedCard}>
            <View style={styles.newsExpandedTop}>
              <Pressable
                style={styles.closeCircle}
                onPress={() => setNewsOpen(false)}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </Pressable>

              <View style={styles.newsExpandedTitleBlock}>
                <Text style={styles.newsExpandedKicker}>
                  آخر الأخبار الرياضية
                </Text>
                <Text style={styles.newsExpandedTitle}>
                  موجز الأخبار السريعة
                </Text>
              </View>
            </View>

            {MATCH_NEWS.map((item) => (
              <View key={item.id} style={styles.newsItem}>
                <View style={styles.newsItemTop}>
                  <Text style={styles.newsItemTime}>{item.time}</Text>
                  <View
                    style={[styles.newsBadge, { backgroundColor: item.accent }]}
                  >
                    <Text style={styles.newsBadgeText}>{item.badge}</Text>
                  </View>
                </View>
                <Text style={styles.newsItemTitle}>{item.title}</Text>
                <Text style={styles.newsItemSummary}>{item.summary}</Text>
              </View>
            ))}
          </GlassCard>
        ) : null}

        <Pressable
          style={styles.newsToggle}
          onPress={() => setNewsOpen((value) => !value)}
        >
          <Ionicons
            name={newsOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.newsToggleTitle}>آخر الأخبار الرياضية</Text>
          <View style={styles.newsLiveBadge}>
            <Text style={styles.newsLiveBadgeText}>عاجل</Text>
          </View>
        </Pressable>
      </View>

      <GlassCard style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <Pressable style={styles.iconCircle}>
            <Ionicons name="notifications" size={16} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.matchLeagueName}>وضع تجريبي VAR X</Text>

          <Pressable
            style={styles.varXButton}
            onPress={() =>
              props.onShareVarXBoard(
                "لوحة VAR X: الهلال 2 - 1 النصر، ضغط متقلب وتحديثات مباشرة من نسخة Expo.",
              )
            }
          >
            <Text style={styles.varXButtonText}>VAR X</Text>
          </Pressable>
        </View>

        <View style={styles.scoreRow}>
          <TeamColumn
            title="النصر"
            shortName="ن"
            gradient={["#FFD16A", "#9A4E1A"]}
          />

          <View style={styles.scoreBlock}>
            <View style={styles.scoreDigitsRow}>
              <Text style={styles.scoreDigit}>2</Text>
              <Text style={styles.scoreDash}>-</Text>
              <Text style={styles.scoreDigit}>1</Text>
            </View>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>DEMO</Text>
            </View>
          </View>

          <TeamColumn
            title="الهلال"
            shortName="هـ"
            gradient={["#67C7FF", "#1A48AF"]}
          />
        </View>

        <View style={styles.pressureSection}>
          <View style={styles.pressureHeader}>
            <Text style={styles.pressureLabel}>R L</Text>
            <Text style={styles.pressureTitle}>Pressure Bar</Text>
          </View>

          <View style={styles.pressureRail}>
            <LinearGradient
              colors={["rgba(255,97,92,0.24)", "rgba(99,198,255,0.18)"]}
              style={styles.pressureGlow}
            />
            <View style={styles.pressureBarsRow}>
              {PRESSURE_BARS.map((bar, index) => (
                <View
                  key={`${bar}-${index}`}
                  style={[
                    styles.pressureBar,
                    {
                      height: bar,
                      backgroundColor: index < 7 ? "#FF7059" : "#67C7FF",
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.demoMessageWrap}>
          <Text style={styles.demoMessageText}>
            وضع تجريبي واضح لتجربة التشكيلة وVAR X والمشاركة على X. هذه البيانات
            ليست مباراة مباشرة.
          </Text>
        </View>

        <View style={styles.leagueTabsRow}>
          <LeagueModeButton
            label="الاحداث"
            isActive={leagueTab === "events"}
            onPress={() => setLeagueTab("events")}
          />
          <LeagueModeButton
            label="التشكيله"
            isActive={leagueTab === "lineup"}
            onPress={() => setLeagueTab("lineup")}
          />
          <LeagueModeButton
            label="التصويت"
            isActive={leagueTab === "poll"}
            onPress={() => setLeagueTab("poll")}
          />
        </View>

        {leagueTab === "events" ? (
          <View>
            {MATCH_EVENTS.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventMinuteBadge}>
                  <Text style={styles.eventMinuteText}>{event.minute}</Text>
                </View>
                <View style={styles.eventTextBlock}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDetail}>{event.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {leagueTab === "lineup" ? (
          <View>
            <View style={styles.lineupSwitchRow}>
              <ModeSwitchButton
                label="الهلال"
                isActive={lineupTeam === "home"}
                onPress={() => setLineupTeam("home")}
              />
              <ModeSwitchButton
                label="النصر"
                isActive={lineupTeam === "away"}
                onPress={() => setLineupTeam("away")}
              />
            </View>

            <View style={styles.lineupSummaryCard}>
              <Text style={styles.lineupSummaryTitle}>{selectedTeamLabel}</Text>
              <Text style={styles.lineupSummaryText}>
                التشكيلة الأساسية جاهزة · 11 لاعبًا ظاهرين على الملعب
              </Text>
            </View>

            <Pitch players={selectedPlayers} />

            <View style={styles.benchWrap}>
              <Text style={styles.benchTitle}>دكة البدلاء</Text>
              <View style={styles.benchGrid}>
                {selectedBench.map((player) => (
                  <View key={player.id} style={styles.benchPill}>
                    <Text style={styles.benchPillNumber}>#{player.number}</Text>
                    <Text style={styles.benchPillName}>{player.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {leagueTab === "poll" ? (
          <View>
            <View style={styles.pollSummaryRow}>
              <View style={styles.pollMetaBlock}>
                <Text style={styles.pollMetaValue}>
                  {HOME_SUPPORT.toLocaleString("en-US")}
                </Text>
                <Text style={styles.pollMetaLabel}>الهلال</Text>
              </View>
              <View style={styles.pollMetaBlock}>
                <Text style={styles.pollMetaValue}>
                  {AWAY_SUPPORT.toLocaleString("en-US")}
                </Text>
                <Text style={styles.pollMetaLabel}>النصر</Text>
              </View>
            </View>

            <View style={styles.pollRail}>
              <View
                style={[styles.pollFillHome, { width: `${homeShare * 100}%` }]}
              />
              <View
                style={[
                  styles.pollFillAway,
                  { width: `${(1 - homeShare) * 100}%` },
                ]}
              />
            </View>

            <View style={styles.pollLabelsRow}>
              <Text style={styles.pollSideLabel}>
                الهلال {Math.round(homeShare * 100)}%
              </Text>
              <Text style={styles.pollSideLabel}>
                النصر {Math.round((1 - homeShare) * 100)}%
              </Text>
            </View>

            <Pressable
              style={styles.shareBoardButton}
              onPress={() =>
                props.onShareVarXBoard(
                  "تصويت الجمهور: الهلال 57% - النصر 43%، تم نشرها من شاشة الدوريات داخل Expo.",
                )
              }
            >
              <Text style={styles.shareBoardButtonText}>مشاركة لوحة VAR X</Text>
            </Pressable>
          </View>
        ) : null}
      </GlassCard>
    </ScrollView>
  );
}

function AuthScreen(props: {
  authMode: AuthMode;
  onChangeMode: (mode: AuthMode) => void;
  onSuccess: () => void;
}) {
  const { authMode, onChangeMode, onSuccess } = props;
  const [audioOn, setAudioOn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.authScreenContent}
    >
      <ScanlineOverlay />

      {authMode === "login" ? (
        <View style={styles.authSurface}>
          <View style={styles.loginAudioRow}>
            <Pressable
              style={styles.audioButton}
              onPress={() => setAudioOn((value) => !value)}
            >
              <Ionicons
                name={audioOn ? "headset" : "headset-outline"}
                size={18}
                color={audioOn ? "#00FF6B" : "#5F7E69"}
              />
            </Pressable>
          </View>

          <View style={styles.loginSplashBlock}>
            <Text style={styles.loginSplashTitle}>Welcome to Xtik</Text>
            <Text style={styles.loginSplashSubtitle}>
              Loading secure terminal
            </Text>
            <View style={styles.loginProgressTrack}>
              <View style={styles.loginProgressFill} />
            </View>
          </View>

          <View style={styles.terminalLinesBlock}>
            <TerminalLine text="Route /auth/login initialized" />
            <TerminalLine text="Neon gateway ready" />
            <TerminalLine text="User input channel active" />
          </View>

          <NeonField
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <NeonField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            icon={showPassword ? "eye-off-outline" : "eye-outline"}
            onIconPress={() => setShowPassword((value) => !value)}
          />

          <Pressable
            style={styles.neonPrimaryButton}
            onPress={() => {
              setMessage("تمت المصادقة محليًا داخل نسخة Expo.");
              onSuccess();
            }}
          >
            <Text style={styles.neonPrimaryButtonText}>Login</Text>
          </Pressable>

          <Pressable style={styles.neonGhostButton}>
            <Text style={styles.neonGhostButtonText}>G with Google</Text>
          </Pressable>

          {message ? <Text style={styles.authMessage}>{message}</Text> : null}

          <View style={styles.authLinksRow}>
            <Pressable
              onPress={() =>
                setMessage("تم تجهيز مسار استعادة محلي بشكل بصري فقط.")
              }
            >
              <Text style={styles.authLinkText}>نسيت كلمة المرور</Text>
            </Pressable>
            <Pressable onPress={() => onChangeMode("signup")}>
              <Text style={styles.authLinkText}>حساب جديد</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.authSurface}>
          <View style={styles.signupStatusBar}>
            <View style={styles.signupStatusDot} />
            <Text style={styles.signupStatusText}>
              SECURE CONNECTION ACTIVE
            </Text>
          </View>

          <View style={styles.signupHeader}>
            <Text style={styles.signupHeaderTitle}>[ REGISTER ]</Text>
            <View style={styles.signupHeaderSubRow}>
              <View style={styles.signupCursor} />
              <Text style={styles.signupHeaderSubtitle}>
                إنشاء هوية جديدة... النظام جاهز للتسجيل
              </Text>
            </View>
          </View>

          <NeonField
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
          />
          <NeonField
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <NeonField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            icon={showPassword ? "eye-off-outline" : "eye-outline"}
            onIconPress={() => setShowPassword((value) => !value)}
          />
          <NeonField
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            icon={showConfirm ? "eye-off-outline" : "eye-outline"}
            onIconPress={() => setShowConfirm((value) => !value)}
          />

          <Pressable
            style={styles.neonPrimaryButton}
            onPress={() => {
              if (!fullName.trim() || !email.trim() || !password.trim()) {
                setMessage("أكمل البيانات أولاً.");
                return;
              }

              if (password !== confirmPassword) {
                setMessage("كلمتا المرور غير متطابقتين.");
                return;
              }

              setMessage("تم إنشاء الحساب محليًا داخل نسخة Expo.");
              onSuccess();
            }}
          >
            <Text style={styles.neonPrimaryButtonText}>Create Account</Text>
          </Pressable>

          <Pressable style={styles.neonGhostButton}>
            <Text style={styles.neonGhostButtonText}>G with Google</Text>
          </Pressable>

          {message ? <Text style={styles.authMessage}>{message}</Text> : null}

          <View style={styles.authLinksRowSingle}>
            <Pressable onPress={() => onChangeMode("login")}>
              <Text style={styles.authLinkText}>عندي حساب بالفعل</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function ProfileScreen(props: {
  canOpenAdmin: boolean;
  posts: Post[];
  profile: ProfileData;
  onSaveProfile: (profile: ProfileData) => void;
  onSignOut: () => void;
}) {
  const { canOpenAdmin, posts, profile, onSaveProfile, onSignOut } = props;
  const [showEditor, setShowEditor] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const likes = posts.reduce(
    (total, post) => total + Math.max(0, post.likes),
    0,
  );
  const comments = Math.max(posts.length * 2, 18);
  const shares = Math.max(posts.length, 6);
  const reposts = Math.max(Math.floor(posts.length / 2), 4);

  const tiles: MetricTile[] = [
    {
      id: "followers",
      label: "المتابعون",
      value: "2,578",
      color: "#FFFFFF",
      icon: "people",
    },
    {
      id: "following",
      label: "يتابع",
      value: "1,950",
      color: "#FFFFFF",
      icon: "person-add",
    },
    {
      id: "likes",
      label: "اعجاب",
      value: String(likes),
      color: "#2D8CFF",
      icon: "heart",
    },
    {
      id: "comments",
      label: "تعليق",
      value: String(comments),
      color: "#A4F542",
      icon: "chatbubble",
    },
    {
      id: "shares",
      label: "مشاركة",
      value: String(shares),
      color: "#FFB53A",
      icon: "paper-plane",
    },
    {
      id: "reposts",
      label: "إعادة نشر",
      value: String(reposts),
      color: "#FF6E62",
      icon: "repeat",
    },
    {
      id: "tools",
      label: "الأدوات",
      value: String(5 + (canOpenAdmin ? 1 : 0)),
      color: "#63D6FF",
      icon: "shield-checkmark",
    },
  ];

  const profileCode =
    profile.username.replace("@", "").slice(0, 3).toUpperCase() || "VAR";
  const heroSubtitle = profile.isVerified
    ? "حساب موثق بالشارة الذهبية"
    : `عضو منذ ${profile.joinDate}`;
  const heroHint =
    profile.bio || profile.location || "تغيير الخلفية وتعديل الملف الشخصي";

  return (
    <View style={styles.profileRoot}>
      <View pointerEvents="none" style={styles.profileBackgroundLayer}>
        <LinearGradient
          colors={["#051121", "#03060E", "#02040A"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.profileGlowOrb} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.profileContent}
      >
        <Pressable
          style={styles.profileHeroCard}
          onPress={() => setShowEditor((value) => !value)}
        >
          <View style={styles.profileHeroLeft}>
            <LinearGradient
              colors={["#FFCF6B", "#D76D18"]}
              style={styles.profileAvatarHalo}
            >
              <View
                style={[
                  styles.profileAvatarInner,
                  profile.avatarFrameEnabled
                    ? styles.profileAvatarInnerFramed
                    : null,
                ]}
              >
                <Text style={styles.profileAvatarInitial}>
                  {profile.displayName.slice(0, 1).toUpperCase()}
                </Text>
              </View>
            </LinearGradient>
            <Text style={styles.profileCode}>{profileCode}</Text>
          </View>

          <View style={styles.profileHeroText}>
            <View style={styles.profileHeroTitleRow}>
              {profile.isVerified ? <VerifiedBadge label="موثق" /> : null}
              <Text style={styles.profileHeroTitle}>الملف الشخصي</Text>
            </View>
            <Text style={styles.profileHeroSubtitle}>{heroSubtitle}</Text>

            <View style={styles.profileIconCard}>
              <Ionicons name="card" size={22} color="rgba(255,255,255,0.82)" />
            </View>

            <Text numberOfLines={1} style={styles.profileHeroHint}>
              {heroHint}
            </Text>
          </View>
        </Pressable>

        <View style={styles.profileTileGrid}>
          {tiles.map((tile) => (
            <MetricTileCard key={tile.id} tile={tile} />
          ))}
        </View>

        {showEditor ? (
          <GlassCard style={styles.profileEditorCard}>
            <Text style={styles.profileEditorTitle}>تعديل الملف الشخصي</Text>
            <Text style={styles.profileEditorSubtitle}>
              نفس فكرة sheet في Swift لكن بصيغة inline داخل Expo.
            </Text>

            <ProfileInput
              label="الاسم المعروض"
              value={draft.displayName}
              onChangeText={(text) => setDraft({ ...draft, displayName: text })}
            />
            <ProfileInput
              label="اسم المستخدم"
              value={draft.username}
              onChangeText={(text) => setDraft({ ...draft, username: text })}
            />
            <ProfileInput
              label="النبذة"
              value={draft.bio}
              onChangeText={(text) => setDraft({ ...draft, bio: text })}
              multiline
            />
            <ProfileInput
              label="الموقع"
              value={draft.location}
              onChangeText={(text) => setDraft({ ...draft, location: text })}
            />
            <ProfileInput
              label="البريد"
              value={draft.email}
              onChangeText={(text) => setDraft({ ...draft, email: text })}
            />

            <View style={styles.profileEditorChipsRow}>
              <ProfileChip
                label="إطار"
                active={draft.avatarFrameEnabled}
                onPress={() =>
                  setDraft({
                    ...draft,
                    avatarFrameEnabled: !draft.avatarFrameEnabled,
                  })
                }
              />
              <ProfileChip
                label="توثيق"
                active={draft.isVerified}
                onPress={() =>
                  setDraft({ ...draft, isVerified: !draft.isVerified })
                }
              />
              {canOpenAdmin ? (
                <ProfileChip
                  label="الأدمن"
                  active={false}
                  onPress={() =>
                    setSaveMessage("شريحة الأدمن ظهرت بصريًا داخل Expo.")
                  }
                />
              ) : null}
            </View>

            {saveMessage ? (
              <Text style={styles.profileSaveMessage}>{saveMessage}</Text>
            ) : null}

            <Pressable
              style={styles.profileSaveButton}
              onPress={() => {
                onSaveProfile(draft);
                setSaveMessage("تم حفظ التعديلات محليًا داخل نسخة Expo.");
                setShowEditor(false);
              }}
            >
              <Text style={styles.profileSaveButtonText}>حفظ التعديلات</Text>
            </Pressable>
          </GlassCard>
        ) : null}
      </ScrollView>

      <View style={styles.signOutRailWrap}>
        <Pressable style={styles.signOutRail} onPress={onSignOut}>
          <View style={styles.signOutFill} />
          <Text style={styles.signOutLabel}>اسحب الشريط</Text>
          <View style={styles.signOutThumb}>
            <Ionicons name="power" size={18} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function ChatOverlay(props: { onClose: () => void }) {
  const [groups, setGroups] = useState(INITIAL_CHAT_GROUPS);
  const [messagesByGroup, setMessagesByGroup] = useState(INITIAL_CHAT_MESSAGES);
  const [activeGroupId, setActiveGroupId] = useState(
    INITIAL_CHAT_GROUPS[0]?.id ?? "",
  );
  const [groupSearch, setGroupSearch] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = setTimeout(() => {
      setFeedback("");
    }, 1800);

    return () => clearTimeout(timeout);
  }, [feedback]);

  const filteredGroups = groups.filter((group) => {
    const query = groupSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      group.name.toLowerCase().includes(query) ||
      group.lastMessage.toLowerCase().includes(query)
    );
  });

  const activeGroup =
    groups.find((group) => group.id === activeGroupId) ?? groups[0];
  const activeMessages = activeGroup
    ? (messagesByGroup[activeGroup.id] ?? [])
    : [];

  const sendMessage = () => {
    const trimmed = messageDraft.trim();
    if (!trimmed || !activeGroup) {
      return;
    }

    const nextMessage: ChatMessage = {
      id: `${activeGroup.id}-${Date.now()}`,
      sender: "VAR X",
      content: trimmed,
      time: "الآن",
      mine: true,
    };

    setMessagesByGroup((current) => ({
      ...current,
      [activeGroup.id]: [...(current[activeGroup.id] ?? []), nextMessage],
    }));
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === activeGroup.id
          ? { ...group, lastMessage: trimmed, time: "الآن", unread: 0 }
          : group,
      ),
    );
    setMessageDraft("");
    setFeedback("تم إرسال الرسالة داخل النسخة المحلية.");
  };

  return (
    <View style={styles.chatOverlayWrap}>
      <Pressable style={styles.chatBackdrop} onPress={props.onClose} />

      <View style={styles.chatShellWrap}>
        <View style={styles.chatShell}>
          <View style={styles.chatSidebar}>
            <View style={styles.chatSidebarTop}>
              <Pressable style={styles.closeCircle} onPress={props.onClose}>
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.chatSidebarTitle}>الدردشة</Text>
            </View>

            <TextInput
              placeholder="بحث"
              placeholderTextColor="rgba(255,255,255,0.48)"
              style={styles.chatSearchInput}
              value={groupSearch}
              onChangeText={setGroupSearch}
            />

            <View style={styles.chatSidebarActions}>
              <Pressable
                style={styles.chatSidebarChip}
                onPress={() => setFeedback("تم تجهيز إنشاء قروب جديد بصريًا.")}
              >
                <Text style={styles.chatSidebarChipText}>قروب</Text>
              </Pressable>
              <Pressable
                style={styles.chatSidebarChip}
                onPress={() => setFeedback("تم تجهيز إنشاء رسالة خاصة بصريًا.")}
              >
                <Text style={styles.chatSidebarChipText}>DM</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.chatGroupList}
            >
              {filteredGroups.map((group) => (
                <Pressable
                  key={group.id}
                  style={[
                    styles.chatGroupCard,
                    activeGroup?.id === group.id
                      ? styles.chatGroupCardActive
                      : null,
                  ]}
                  onPress={() => setActiveGroupId(group.id)}
                >
                  <View style={styles.chatGroupIconWrap}>
                    <Ionicons name={group.icon} size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.chatGroupTextBlock}>
                    <Text style={styles.chatGroupName}>{group.name}</Text>
                    <Text numberOfLines={1} style={styles.chatGroupMessage}>
                      {group.lastMessage}
                    </Text>
                  </View>
                  <View style={styles.chatGroupMeta}>
                    <Text style={styles.chatGroupTime}>{group.time}</Text>
                    {group.unread > 0 ? (
                      <View style={styles.chatUnreadBadge}>
                        <Text style={styles.chatUnreadText}>
                          {group.unread}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.chatThread}>
            <View style={styles.chatThreadTop}>
              <View style={styles.chatThreadTitleBlock}>
                <Text style={styles.chatThreadTitle}>
                  {activeGroup?.name ?? "بدون مجموعة"}
                </Text>
                <Text style={styles.chatThreadSubtitle}>
                  نسخة Expo تحاكي بطاقة الدردشة الداكنة في Swift
                </Text>
              </View>
              <Pressable
                style={styles.chatThreadAction}
                onPress={() => setFeedback("سيتم ربط مؤلف منشور X هنا لاحقًا.")}
              >
                <Text style={styles.chatThreadActionText}>منشور X</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.chatMessagesList}
            >
              {activeMessages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.chatBubble,
                    message.mine
                      ? styles.chatBubbleMine
                      : styles.chatBubbleOther,
                  ]}
                >
                  <Text style={styles.chatBubbleSender}>{message.sender}</Text>
                  <Text style={styles.chatBubbleText}>{message.content}</Text>
                  <Text style={styles.chatBubbleTime}>{message.time}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.chatComposerRow}>
              <Pressable style={styles.chatSendButton} onPress={sendMessage}>
                <Text style={styles.chatSendButtonText}>إرسال</Text>
              </Pressable>

              <TextInput
                placeholder="اكتب رسالتك"
                placeholderTextColor="rgba(255,255,255,0.48)"
                style={styles.chatComposerInput}
                value={messageDraft}
                onChangeText={setMessageDraft}
              />
            </View>
          </View>

          {feedback ? (
            <View style={styles.chatFeedbackWrap}>
              <Text style={styles.chatFeedbackText}>{feedback}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function FloatingThemeSwitch(props: {
  selection: HomeMode;
  onChange: (mode: HomeMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const alternateMode: HomeMode = props.selection === "x" ? "tiktok" : "x";

  return (
    <View style={styles.themeSwitchWrap}>
      <Pressable
        style={styles.themeSwitchButton}
        onPress={() => setOpen((value) => !value)}
      >
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={12}
          color="#FFFFFF"
        />
        <Text style={styles.themeSwitchText}>
          {props.selection === "x" ? "VAR X" : "VAR TIK"}
        </Text>
      </Pressable>

      {open ? (
        <Pressable
          style={styles.themeSwitchAltButton}
          onPress={() => {
            props.onChange(alternateMode);
            setOpen(false);
          }}
        >
          <Text style={styles.themeSwitchText}>
            {alternateMode === "x" ? "VAR X" : "VAR TIK"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function TikTokVideoCard(props: {
  cardHeight: number;
  isLoggedIn: boolean;
  video: Video;
  onRequireAuth: (message?: string) => void;
  onToggleLike: () => void;
}) {
  const { cardHeight, isLoggedIn, video, onRequireAuth, onToggleLike } = props;

  return (
    <View style={[styles.tiktokCard, { minHeight: cardHeight }]}>
      <LinearGradient
        colors={video.theme}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.tiktokTopRow}>
        <Pressable style={styles.tiktokSoundButton}>
          <Ionicons name="volume-medium" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.tiktokDockWrap}>
        <View style={styles.tiktokVarTab}>
          <Text style={styles.tiktokVarTabText}>VAR</Text>
        </View>

        <View style={styles.tiktokDockRail}>
          <TikTokDockStat
            icon="heart"
            value={video.likes}
            active={video.likedByMe}
            onPress={onToggleLike}
          />
          <TikTokDockStat
            icon="chatbubble"
            value={video.comments}
            active={false}
            onPress={() =>
              onRequireAuth(
                isLoggedIn
                  ? "نقل التعليقات التفصيلية يأتي في خطوة لاحقة."
                  : "سجل الدخول لفتح التعليقات.",
              )
            }
          />
          <TikTokDockStat
            icon="paper-plane"
            value={video.shares}
            active={false}
            onPress={() =>
              onRequireAuth(
                isLoggedIn
                  ? "المشاركة جاهزة بصريًا في هذه المرحلة."
                  : "سجل الدخول للمشاركة.",
              )
            }
          />
          <TikTokDockStat
            icon="bookmark"
            value={video.saves}
            active={false}
            onPress={() =>
              onRequireAuth(
                isLoggedIn
                  ? "الحفظ سيُنقل في خطوة تالية."
                  : "سجل الدخول للحفظ.",
              )
            }
          />
        </View>
      </View>

      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.86)"]}
        style={styles.tiktokBottomFade}
      />

      <View style={styles.tiktokInfoBlock}>
        <View style={styles.tiktokCreatorRow}>
          <View style={styles.tiktokCreatorText}>
            <View style={styles.tiktokNameRow}>
              <Text style={styles.tiktokCreatorName}>{video.creatorName}</Text>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.tiktokHandle}>{video.creatorHandle}</Text>
          </View>

          <View style={styles.tiktokCreatorBadge}>
            <Text style={styles.tiktokCreatorBadgeText}>{video.tag}</Text>
          </View>
        </View>

        <Text style={styles.tiktokCaption}>{video.caption}</Text>

        <View style={styles.tiktokTagRow}>
          <Tag label="#VAR" />
          <Tag label="#WEBPLUS" />
          <Tag label="#Expo" />
        </View>
      </View>
    </View>
  );
}

function XPostCard(props: { post: Post; onLike: () => void }) {
  const { post, onLike } = props;
  const verified =
    post.handle.includes("var") || post.handle.includes("webplus");
  const showMedia = post.id % 2 === 1 || post.content.length > 60;

  return (
    <GlassCard style={styles.xPostCard}>
      <View style={styles.xPostRow}>
        <View style={styles.xAvatarTiny}>
          <Text style={styles.xAvatarTinyText}>{post.author.slice(0, 1)}</Text>
        </View>

        <View style={styles.xPostContent}>
          <View style={styles.xPostHead}>
            <Pressable style={styles.xEllipsisButton}>
              <Ionicons
                name="ellipsis-horizontal"
                size={14}
                color="rgba(255,255,255,0.8)"
              />
            </Pressable>

            <View style={styles.xPostMetaBlock}>
              <View style={styles.xPostMetaLine}>
                <Text style={styles.xPostTime}>• {post.time}</Text>
                <Text style={styles.xPostHandle}>{post.handle}</Text>
                {verified ? (
                  <Ionicons name="checkmark-circle" size={14} color="#6ED4FF" />
                ) : null}
                <Text style={styles.xPostAuthor}>{post.author}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.xPostBody}>{post.content}</Text>

          {showMedia ? (
            <LinearGradient
              colors={["#0F2942", "#06121D"]}
              style={styles.xMediaCard}
            >
              <Text style={styles.xMediaCardText}>
                لوحة سريعة مرفقة بالمنشور
              </Text>
            </LinearGradient>
          ) : null}

          <View style={styles.xActionRow}>
            <XActionPill
              icon="chatbubble"
              value={post.replies}
              activeColor="#65D884"
              onPress={() => undefined}
            />
            <XActionPill
              icon="repeat"
              value={post.reposts}
              activeColor="#6DE5AA"
              onPress={() => undefined}
            />
            <XActionPill
              icon="heart"
              value={post.likes}
              activeColor="#FF607B"
              onPress={onLike}
              active={post.likedByMe}
            />
            <XActionPill
              icon="paper-plane"
              value={post.shares}
              activeColor="#68CBFF"
              onPress={() => undefined}
            />
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

function BottomNav(props: {
  current: MainTab;
  homeMode: HomeMode;
  onHomeAction: () => void;
  onSelect: (tab: MainTab) => void;
}) {
  const palette = HOME_PALETTES[props.homeMode];

  return (
    <View style={styles.bottomBar}>
      <BottomItem
        label="الحساب"
        icon={props.current === "account" ? "person" : "person-outline"}
        active={props.current === "account"}
        onPress={() => props.onSelect("account")}
      />
      <BottomItem
        label="الدوريات"
        icon={props.current === "leagues" ? "trophy" : "trophy-outline"}
        active={props.current === "leagues"}
        onPress={() => props.onSelect("leagues")}
      />

      <Pressable
        style={styles.bottomCenterActionWrap}
        onPress={props.onHomeAction}
      >
        <LinearGradient
          colors={palette.gradient}
          style={styles.bottomCenterAction}
        >
          <Text style={styles.bottomCenterActionText}>VAR</Text>
        </LinearGradient>
      </Pressable>

      <BottomItem
        label="الرابطة"
        icon={props.current === "fans" ? "people" : "people-outline"}
        active={props.current === "fans"}
        onPress={() => props.onSelect("fans")}
      />
      <BottomItem
        label="الرئيسية"
        icon={props.current === "home" ? "home" : "home-outline"}
        active={props.current === "home"}
        onPress={() => props.onSelect("home")}
      />
    </View>
  );
}

function BottomItem(props: {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.bottomItem} onPress={props.onPress}>
      <Ionicons
        name={props.icon}
        size={18}
        color={props.active ? "#FFFFFF" : "rgba(255,255,255,0.64)"}
      />
      <Text
        style={[
          styles.bottomItemLabel,
          props.active ? styles.bottomItemLabelActive : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function GlassCard(props: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.glassCard, props.style]}>{props.children}</View>;
}

function SectionHeader(props: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEyebrow}>{props.eyebrow}</Text>
      <Text style={styles.sectionTitle}>{props.title}</Text>
      <Text style={styles.sectionDescription}>{props.description}</Text>
    </View>
  );
}

function ModeSwitchButton(props: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.modeSwitchButton,
        props.isActive ? styles.modeSwitchButtonActive : null,
      ]}
      onPress={props.onPress}
    >
      <Text
        style={[
          styles.modeSwitchButtonText,
          props.isActive ? styles.modeSwitchButtonTextActive : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function TeamColumn(props: {
  title: string;
  shortName: string;
  gradient: GradientPair;
}) {
  return (
    <View style={styles.teamColumn}>
      <LinearGradient colors={props.gradient} style={styles.teamCircle}>
        <Text style={styles.teamCircleText}>{props.shortName}</Text>
      </LinearGradient>
      <Text style={styles.teamColumnTitle}>{props.title}</Text>
    </View>
  );
}

function LeagueModeButton(props: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.leagueTabButton,
        props.isActive ? styles.leagueTabButtonActive : null,
      ]}
      onPress={props.onPress}
    >
      <Text
        style={[
          styles.leagueTabButtonText,
          props.isActive ? styles.leagueTabButtonTextActive : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function Pitch(props: { players: TacticalPlayer[] }) {
  return (
    <View style={styles.pitchCard}>
      <View style={styles.pitchCenterLine} />
      <View style={styles.pitchCenterCircle} />
      <View style={styles.pitchTopBox} />
      <View style={styles.pitchBottomBox} />

      {props.players.map((player) => (
        <View
          key={player.id}
          style={[
            styles.pitchPlayerWrap,
            { left: `${player.x * 100}%`, top: `${player.y * 100}%` },
          ]}
        >
          <LinearGradient
            colors={player.gradient}
            style={styles.pitchPlayerCircle}
          >
            <Text style={styles.pitchPlayerNumber}>{player.number}</Text>
          </LinearGradient>
        </View>
      ))}
    </View>
  );
}

function NeonField(props: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  icon?: IconName;
  onIconPress?: () => void;
}) {
  return (
    <View style={styles.neonFieldWrap}>
      {props.icon ? (
        <Pressable
          style={styles.neonFieldIconButton}
          onPress={props.onIconPress}
        >
          <Ionicons name={props.icon} size={18} color="#00FF6B" />
        </Pressable>
      ) : null}
      <TextInput
        placeholder={props.placeholder}
        placeholderTextColor="rgba(0,255,107,0.5)"
        style={styles.neonFieldInput}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        value={props.value}
        onChangeText={props.onChangeText}
      />
    </View>
  );
}

function TerminalLine(props: { text: string }) {
  return (
    <View style={styles.terminalLine}>
      <View style={styles.terminalCursor} />
      <Text style={styles.terminalLineText}>{props.text}</Text>
    </View>
  );
}

function ScanlineOverlay() {
  return (
    <View pointerEvents="none" style={styles.scanlineOverlay}>
      {Array.from({ length: 22 }).map((_, index) => (
        <View key={index} style={[styles.scanline, { top: index * 28 }]} />
      ))}
    </View>
  );
}

function VerifiedBadge(props: { label: string }) {
  return (
    <View style={styles.verifiedBadge}>
      <Ionicons name="checkmark-circle" size={12} color="#182134" />
      <Text style={styles.verifiedBadgeText}>{props.label}</Text>
    </View>
  );
}

function MetricTileCard(props: { tile: MetricTile }) {
  return (
    <View style={styles.metricTileCard}>
      <Ionicons name={props.tile.icon} size={16} color={props.tile.color} />
      <Text style={[styles.metricTileValue, { color: props.tile.color }]}>
        {props.tile.value}
      </Text>
      <Text style={styles.metricTileLabel}>{props.tile.label}</Text>
    </View>
  );
}

function ProfileInput(props: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.profileInputWrap}>
      <Text style={styles.profileInputLabel}>{props.label}</Text>
      <TextInput
        placeholder={props.label}
        placeholderTextColor="rgba(255,255,255,0.38)"
        multiline={props.multiline}
        style={[
          styles.profileInput,
          props.multiline ? styles.profileInputMultiline : null,
        ]}
        value={props.value}
        onChangeText={props.onChangeText}
      />
    </View>
  );
}

function ProfileChip(props: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.profileChip,
        props.active ? styles.profileChipActive : null,
      ]}
      onPress={props.onPress}
    >
      <Text
        style={[
          styles.profileChipText,
          props.active ? styles.profileChipTextActive : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function Tag(props: { label: string }) {
  return (
    <View style={styles.tagWrap}>
      <Text style={styles.tagText}>{props.label}</Text>
    </View>
  );
}

function TikTokDockStat(props: {
  icon: IconName;
  value: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tiktokDockButton} onPress={props.onPress}>
      <Ionicons
        name={props.icon}
        size={18}
        color={props.active ? "#FFFFFF" : "rgba(255,255,255,0.88)"}
      />
      <Text style={styles.tiktokDockValue}>{props.value}</Text>
    </Pressable>
  );
}

function XActionPill(props: {
  icon: IconName;
  value: number;
  activeColor: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable style={styles.xActionPill} onPress={props.onPress}>
      <Ionicons
        name={props.icon}
        size={14}
        color={props.active ? props.activeColor : "rgba(255,255,255,0.72)"}
      />
      <Text
        style={[
          styles.xActionPillText,
          {
            color: props.active ? props.activeColor : "rgba(255,255,255,0.72)",
          },
        ]}
      >
        {props.value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#04070D",
  },
  appRoot: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  blurOrb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.16,
  },
  primaryOrb: {
    width: 260,
    height: 260,
    top: -70,
    right: -40,
  },
  secondaryOrb: {
    position: "absolute",
    width: 300,
    height: 300,
    left: -90,
    bottom: 160,
    borderRadius: 999,
    backgroundColor: "#17325E",
    opacity: 0.12,
  },
  tertiaryOrb: {
    position: "absolute",
    width: 160,
    height: 160,
    right: 30,
    bottom: 260,
    borderRadius: 999,
    backgroundColor: "#421A33",
    opacity: 0.1,
  },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: SHELL_WIDTH,
    alignSelf: "center",
  },
  noticeWrap: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  noticePill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(22, 57, 83, 0.74)",
    borderWidth: 1,
    borderColor: "rgba(148,216,255,0.18)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  noticeText: {
    flex: 1,
    marginRight: 8,
    color: "#E8F6FF",
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
  },
  themeSwitchLayer: {
    position: "absolute",
    top: 70,
    alignSelf: "center",
    zIndex: 10,
  },
  themeSwitchWrap: {
    alignItems: "center",
  },
  themeSwitchButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    borderRadius: 999,
  },
  themeSwitchAltButton: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.64)",
    borderRadius: 14,
  },
  themeSwitchText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginRight: 6,
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 82,
    paddingBottom: 128,
  },
  glassCard: {
    backgroundColor: "rgba(9, 14, 24, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 18,
  },
  sectionEyebrow: {
    color: "#64B9F8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textAlign: "right",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 8,
  },
  sectionDescription: {
    color: "#8BA0B5",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
    marginTop: 8,
  },
  tiktokCard: {
    marginBottom: 18,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tiktokTopRow: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 2,
  },
  tiktokSoundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  tiktokDockWrap: {
    position: "absolute",
    left: 0,
    top: "33%",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
  },
  tiktokVarTab: {
    width: 32,
    height: 108,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    backgroundColor: "rgba(0,0,0,0.84)",
    alignItems: "center",
    justifyContent: "center",
  },
  tiktokVarTabText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    transform: [{ rotate: "90deg" }],
  },
  tiktokDockRail: {
    width: 72,
    marginLeft: 8,
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tiktokDockButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  tiktokDockValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
  },
  tiktokBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
  },
  tiktokInfoBlock: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
  },
  tiktokCreatorRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tiktokCreatorText: {
    alignItems: "flex-end",
  },
  tiktokNameRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  tiktokCreatorName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginLeft: 8,
  },
  tiktokHandle: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  tiktokCreatorBadge: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tiktokCreatorBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  tiktokCaption: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "right",
    marginTop: 12,
  },
  tiktokTagRow: {
    flexDirection: "row-reverse",
    marginTop: 14,
  },
  tagWrap: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  xDrawerCard: {
    padding: 18,
  },
  drawerTopRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  drawerChip: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  drawerChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  drawerTitleBlock: {
    alignItems: "flex-end",
  },
  drawerKicker: {
    color: "#7CAFD2",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  drawerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
  },
  drawerChipsRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    marginTop: 14,
    marginHorizontal: -4,
  },
  xSpaceChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  xSpaceChipText: {
    color: "#D8E8F5",
    fontSize: 12,
    fontWeight: "700",
  },
  xHeaderCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
  },
  xHeaderGradient: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  xHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  xHeaderTitleBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginHorizontal: 12,
  },
  xHeaderBrand: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    letterSpacing: 1.8,
  },
  xHeaderSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: MONO_FONT,
    marginTop: 4,
    textAlign: "right",
  },
  xAvatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  xAvatarCircle: {
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  xAvatarLetter: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  xComposerButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  xComposerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  modeStrip: {
    flexDirection: "row-reverse",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 6,
    marginBottom: 16,
  },
  modeSwitchButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modeSwitchButtonActive: {
    backgroundColor: "#F5F9FF",
  },
  modeSwitchButtonText: {
    color: "#8092A6",
    fontSize: 14,
    fontWeight: "800",
  },
  modeSwitchButtonTextActive: {
    color: "#08111B",
  },
  xPostCard: {
    padding: 14,
  },
  xPostRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  xAvatarTiny: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#102844",
  },
  xAvatarTinyText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  xPostContent: {
    flex: 1,
    marginRight: 12,
  },
  xPostHead: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  xEllipsisButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  xPostMetaBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 10,
  },
  xPostMetaLine: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexWrap: "wrap",
  },
  xPostAuthor: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 6,
  },
  xPostHandle: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  xPostTime: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 6,
  },
  xPostBody: {
    color: "rgba(255,255,255,0.94)",
    fontSize: 14,
    lineHeight: 23,
    textAlign: "right",
    marginTop: 10,
  },
  xMediaCard: {
    minHeight: 118,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  xMediaCardText: {
    color: "#E6F6FF",
    fontSize: 13,
    fontWeight: "800",
  },
  xActionRow: {
    flexDirection: "row-reverse",
    marginTop: 14,
  },
  xActionPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 8,
  },
  xActionPillText: {
    fontSize: 12,
    fontWeight: "800",
    marginRight: 6,
  },
  fansHeroCard: {
    padding: 0,
  },
  fansHeroGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  fansHeroEyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    textAlign: "right",
  },
  fansHeroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 8,
  },
  fansHeroText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
    marginTop: 12,
  },
  clubCard: {
    padding: 16,
  },
  clubBanner: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  clubBannerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  clubBannerTag: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    marginRight: 8,
  },
  clubBannerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 10,
  },
  clubBannerSummary: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
    marginTop: 10,
  },
  clubFooter: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  clubMeta: {
    alignItems: "flex-end",
    flex: 1,
  },
  clubMetaLabel: {
    color: "#7E98AF",
    fontSize: 12,
    fontWeight: "700",
  },
  clubMetaValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 6,
  },
  supportButton: {
    minWidth: 110,
    minHeight: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#173148",
    marginLeft: 12,
  },
  supportButtonActive: {
    backgroundColor: "#2E7DD8",
  },
  supportButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  newsWrap: {
    marginBottom: 14,
  },
  newsExpandedCard: {
    padding: 16,
  },
  newsExpandedTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  newsExpandedTitleBlock: {
    alignItems: "flex-end",
    flex: 1,
  },
  newsExpandedKicker: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "700",
  },
  newsExpandedTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  closeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  newsItem: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginTop: 10,
  },
  newsItemTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newsItemTime: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "700",
  },
  newsBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  newsBadgeText: {
    color: "#111111",
    fontSize: 10,
    fontWeight: "900",
  },
  newsItemTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 12,
  },
  newsItemSummary: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "right",
    marginTop: 8,
  },
  newsToggle: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  newsToggleTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginHorizontal: 10,
  },
  newsLiveBadge: {
    backgroundColor: "#FF6259",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  newsLiveBadgeText: {
    color: "#111111",
    fontSize: 10,
    fontWeight: "900",
  },
  matchCard: {
    padding: 16,
  },
  matchHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  matchLeagueName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },
  varXButton: {
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  varXButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  scoreRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
  },
  teamColumn: {
    alignItems: "center",
    width: 88,
  },
  teamCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  teamCircleText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  teamColumnTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 10,
  },
  scoreBlock: {
    alignItems: "center",
  },
  scoreDigitsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  scoreDigit: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
  },
  scoreDash: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 36,
    fontWeight: "900",
    marginHorizontal: 8,
  },
  livePill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4859",
    marginLeft: 6,
  },
  livePillText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: "900",
  },
  pressureSection: {
    marginTop: 22,
  },
  pressureHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pressureLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 12,
    fontWeight: "900",
  },
  pressureTitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "900",
  },
  pressureRail: {
    height: 76,
    borderRadius: 16,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pressureGlow: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 12,
    bottom: 12,
    borderRadius: 14,
  },
  pressureBarsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  pressureBar: {
    width: 10,
    borderRadius: 999,
    marginHorizontal: 3.5,
  },
  demoMessageWrap: {
    marginTop: 18,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(99,198,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(99,198,255,0.14)",
  },
  demoMessageText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
    lineHeight: 18,
  },
  leagueTabsRow: {
    flexDirection: "row-reverse",
    marginTop: 18,
  },
  leagueTabButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  leagueTabButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  leagueTabButtonText: {
    color: "#DCE8F4",
    fontSize: 13,
    fontWeight: "900",
  },
  leagueTabButtonTextActive: {
    color: "#08111B",
  },
  eventCard: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },
  eventMinuteBadge: {
    minWidth: 56,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  eventMinuteText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  eventTextBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginRight: 12,
  },
  eventTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
  },
  eventDetail: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
    marginTop: 6,
  },
  lineupSwitchRow: {
    flexDirection: "row-reverse",
    marginTop: 16,
    marginBottom: 14,
  },
  lineupSummaryCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  lineupSummaryTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
  },
  lineupSummaryText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  pitchCard: {
    height: 320,
    borderRadius: 24,
    backgroundColor: "#0C3A1F",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    position: "relative",
  },
  pitchCenterLine: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  pitchCenterCircle: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.14)",
    transform: [{ translateX: -42 }, { translateY: -42 }],
  },
  pitchTopBox: {
    position: "absolute",
    left: "23%",
    right: "23%",
    top: 0,
    height: 64,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: "rgba(255,255,255,0.14)",
  },
  pitchBottomBox: {
    position: "absolute",
    left: "23%",
    right: "23%",
    bottom: 0,
    height: 64,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.14)",
  },
  pitchPlayerWrap: {
    position: "absolute",
    transform: [{ translateX: -18 }, { translateY: -18 }],
  },
  pitchPlayerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  pitchPlayerNumber: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  benchWrap: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 14,
  },
  benchTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 12,
  },
  benchGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  benchPill: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginHorizontal: "1%",
    marginVertical: 4,
  },
  benchPillNumber: {
    color: "#63C6FF",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
  },
  benchPillName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 4,
  },
  pollSummaryRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 18,
  },
  pollMetaBlock: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 4,
    alignItems: "flex-end",
  },
  pollMetaValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  pollMetaLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  pollRail: {
    height: 18,
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 18,
  },
  pollFillHome: {
    backgroundColor: "#63C6FF",
  },
  pollFillAway: {
    backgroundColor: "#FFB85C",
  },
  pollLabelsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 10,
  },
  pollSideLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  shareBoardButton: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  shareBoardButtonText: {
    color: "#07101A",
    fontSize: 14,
    fontWeight: "900",
  },
  authScreenContent: {
    minHeight: "100%",
    paddingHorizontal: 20,
    paddingTop: 82,
    paddingBottom: 130,
    justifyContent: "center",
  },
  authSurface: {
    minHeight: 640,
    backgroundColor: "rgba(0,0,0,0.88)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,255,107,0.18)",
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  scanlineOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scanline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,255,107,0.06)",
  },
  loginAudioRow: {
    alignItems: "flex-start",
  },
  audioButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0,255,107,0.54)",
  },
  loginSplashBlock: {
    alignItems: "center",
    marginTop: 42,
  },
  loginSplashTitle: {
    color: "#00FF6B",
    fontSize: 32,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    textShadowColor: "rgba(0,255,107,0.72)",
    textShadowRadius: 8,
  },
  loginSplashSubtitle: {
    color: "rgba(0,255,107,0.82)",
    fontSize: 16,
    fontFamily: MONO_FONT,
    marginTop: 8,
  },
  loginProgressTrack: {
    width: 240,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,255,107,0.16)",
    overflow: "hidden",
    marginTop: 14,
  },
  loginProgressFill: {
    width: "72%",
    height: "100%",
    backgroundColor: "#00FF6B",
  },
  terminalLinesBlock: {
    marginTop: 48,
    marginBottom: 24,
  },
  terminalLine: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 32,
  },
  terminalCursor: {
    width: 10,
    height: 18,
    backgroundColor: "#00FF6B",
    marginLeft: 8,
  },
  terminalLineText: {
    color: "#00FF6B",
    fontSize: 18,
    fontFamily: MONO_FONT,
  },
  neonFieldWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,107,0.78)",
    backgroundColor: "rgba(0,0,0,0.5)",
    marginBottom: 10,
  },
  neonFieldIconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  neonFieldInput: {
    flex: 1,
    height: 42,
    color: "#00FF6B",
    textAlign: "right",
    fontSize: 16,
    fontFamily: MONO_FONT,
    paddingHorizontal: 12,
  },
  neonPrimaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,107,0.92)",
    backgroundColor: "rgba(0,255,107,0.12)",
    marginTop: 10,
  },
  neonPrimaryButtonText: {
    color: "#00FF6B",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: MONO_FONT,
  },
  neonGhostButton: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,107,0.84)",
    marginTop: 10,
  },
  neonGhostButtonText: {
    color: "#00FF6B",
    fontSize: 18,
    fontFamily: MONO_FONT,
  },
  authMessage: {
    color: "#00FF6B",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: MONO_FONT,
    marginTop: 14,
  },
  authLinksRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    marginTop: 16,
  },
  authLinksRowSingle: {
    alignItems: "center",
    marginTop: 16,
  },
  authLinkText: {
    color: "#00FF6B",
    fontSize: 16,
    fontFamily: MONO_FONT,
    marginHorizontal: 12,
  },
  signupStatusBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  signupStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#00FF6B",
    marginLeft: 8,
  },
  signupStatusText: {
    color: "rgba(0,255,107,0.68)",
    fontSize: 13,
    fontFamily: MONO_FONT,
    letterSpacing: 1.5,
  },
  signupHeader: {
    alignItems: "center",
    marginTop: 64,
    marginBottom: 28,
  },
  signupHeaderTitle: {
    color: "#00FF6B",
    fontSize: 30,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    textShadowColor: "rgba(0,255,107,0.72)",
    textShadowRadius: 8,
  },
  signupHeaderSubRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 10,
  },
  signupCursor: {
    width: 9,
    height: 18,
    backgroundColor: "#00FF6B",
    marginLeft: 6,
  },
  signupHeaderSubtitle: {
    color: "rgba(0,255,107,0.82)",
    fontSize: 16,
    fontFamily: MONO_FONT,
  },
  profileRoot: {
    flex: 1,
  },
  profileBackgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  profileGlowOrb: {
    position: "absolute",
    top: 10,
    left: 40,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(30,80,160,0.22)",
  },
  profileContent: {
    paddingHorizontal: 16,
    paddingTop: 82,
    paddingBottom: 150,
  },
  profileHeroCard: {
    flexDirection: "row-reverse",
    backgroundColor: "rgba(7,12,22,0.86)",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.84)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  profileHeroLeft: {
    width: 92,
    alignItems: "center",
  },
  profileAvatarHalo: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#102037",
  },
  profileAvatarInnerFramed: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.86)",
  },
  profileAvatarInitial: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  profileCode: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 10,
  },
  profileHeroText: {
    flex: 1,
    alignItems: "flex-end",
  },
  profileHeroTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  profileHeroTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    marginLeft: 8,
  },
  profileHeroSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
  },
  profileIconCard: {
    width: 56,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 10,
  },
  profileHeroHint: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 10,
  },
  verifiedBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#FFD787",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  verifiedBadgeText: {
    color: "#182134",
    fontSize: 10,
    fontWeight: "900",
    marginRight: 4,
  },
  profileTileGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  metricTileCard: {
    width: "31.33%",
    height: 74,
    marginHorizontal: "1%",
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.88)",
    backgroundColor: "rgba(6,10,18,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricTileValue: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 6,
  },
  metricTileLabel: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 4,
  },
  profileEditorCard: {
    padding: 18,
  },
  profileEditorTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
  },
  profileEditorSubtitle: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "right",
    marginTop: 8,
    marginBottom: 12,
  },
  profileInputWrap: {
    marginBottom: 12,
  },
  profileInputLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 6,
  },
  profileInput: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: "#FFFFFF",
    textAlign: "right",
    paddingHorizontal: 14,
    fontSize: 14,
  },
  profileInputMultiline: {
    minHeight: 92,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  profileEditorChipsRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    marginHorizontal: -4,
    marginTop: 6,
  },
  profileChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  profileChipActive: {
    backgroundColor: "#2C74D8",
  },
  profileChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  profileChipTextActive: {
    color: "#FFFFFF",
  },
  profileSaveMessage: {
    color: "#7BD0FF",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
    marginTop: 12,
    marginBottom: 4,
  },
  profileSaveButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  profileSaveButtonText: {
    color: "#08111B",
    fontSize: 14,
    fontWeight: "900",
  },
  signOutRailWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 96,
    width: "100%",
    maxWidth: SHELL_WIDTH,
    alignSelf: "center",
  },
  signOutRail: {
    height: 56,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.94)",
    backgroundColor: "rgba(6,10,18,0.96)",
    justifyContent: "center",
    overflow: "hidden",
  },
  signOutFill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 6,
    width: 108,
    borderRadius: 14,
    backgroundColor: "rgba(67,138,255,0.18)",
  },
  signOutLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  signOutThumb: {
    position: "absolute",
    left: 6,
    top: 8,
    width: 52,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
    backgroundColor: "#09121E",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomDock: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 16,
  },
  bottomBar: {
    width: "100%",
    maxWidth: SHELL_WIDTH,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(5,8,15,0.98)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  bottomItem: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomItemLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  bottomItemLabelActive: {
    color: "#FFFFFF",
  },
  bottomCenterActionWrap: {
    marginHorizontal: 4,
  },
  bottomCenterAction: {
    width: 88,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomCenterActionText: {
    color: "#09111C",
    fontSize: 15,
    fontWeight: "900",
  },
  chatOverlayWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  chatBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.54)",
  },
  chatShellWrap: {
    width: "100%",
    maxWidth: SHELL_WIDTH,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingBottom: 90,
  },
  chatShell: {
    minHeight: 520,
    maxHeight: 640,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0B0D12",
    flexDirection: "row-reverse",
  },
  chatSidebar: {
    width: 156,
    paddingTop: 16,
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.06)",
  },
  chatSidebarTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatSidebarTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  chatSearchInput: {
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: "#FFFFFF",
    textAlign: "right",
    paddingHorizontal: 14,
    marginTop: 12,
  },
  chatSidebarActions: {
    flexDirection: "row-reverse",
    marginTop: 12,
  },
  chatSidebarChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    marginLeft: 6,
  },
  chatSidebarChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  chatGroupList: {
    paddingBottom: 16,
  },
  chatGroupCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 10,
    marginTop: 10,
  },
  chatGroupCardActive: {
    backgroundColor: "rgba(80,151,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(117,198,255,0.18)",
  },
  chatGroupIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    alignSelf: "flex-end",
  },
  chatGroupTextBlock: {
    alignItems: "flex-end",
  },
  chatGroupName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  chatGroupMessage: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "right",
    marginTop: 6,
  },
  chatGroupMeta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  chatGroupTime: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
  },
  chatUnreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4BC5FF",
  },
  chatUnreadText: {
    color: "#06111C",
    fontSize: 10,
    fontWeight: "900",
  },
  chatThread: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  chatThreadTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  chatThreadTitleBlock: {
    alignItems: "flex-end",
    flex: 1,
  },
  chatThreadTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
  },
  chatThreadSubtitle: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 4,
  },
  chatThreadAction: {
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  chatThreadActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  chatMessagesList: {
    paddingTop: 14,
    paddingBottom: 14,
  },
  chatBubble: {
    maxWidth: "86%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  chatBubbleMine: {
    alignSelf: "flex-start",
    backgroundColor: "#23558A",
  },
  chatBubbleOther: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  chatBubbleSender: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
  },
  chatBubbleText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
    marginTop: 4,
  },
  chatBubbleTime: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  chatComposerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  chatSendButton: {
    minWidth: 72,
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  chatSendButtonText: {
    color: "#08111B",
    fontSize: 12,
    fontWeight: "900",
  },
  chatComposerInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: "#FFFFFF",
    textAlign: "right",
    paddingHorizontal: 14,
  },
  chatFeedbackWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: "center",
  },
  chatFeedbackText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    backgroundColor: "rgba(0,0,0,0.82)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
