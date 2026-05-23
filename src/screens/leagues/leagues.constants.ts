import { Platform } from "react-native";
import type { GradientPair } from "../../app.types";
import type {
  IoniconName,
  LeagueOverviewCard,
  LeaguePollTweet,
  LeagueStandingRow,
  LeagueTopScorerRow,
  MatchDetailTabKey,
} from "./leagues.types";

export const MONO_FONT = Platform.OS === "ios" ? "Courier" : "monospace";
export const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== "web";
export const LEAGUES_ARABIC_FONT_FAMILY = "LeaguesArabic";
export const LEAGUES_ARABIC_FONT = require("../../../assets/images/alfont_com_KA-Hand-Naskh.ttf");
export const LEAGUE_HEADER_ARABIC_FONT_FAMILY = "LeagueHeaderArabic";
export const LEAGUE_HEADER_ARABIC_FONT = require("../../../assets/images/alfont_com_zainpcv2mob600-zainpcv2.ttf");

export const HILAL_ICON = require("../../../assets/icons/alhilal.png.png");
export const NASSR_ICON = require("../../../assets/icons/alnassr.png.png");
export const KSA_ICON = require("../../../assets/icons/ksa.png");
export const ROSHN_ICON = require("../../../assets/icons/ROSHN.png");
export const LIVE_STREAM_ICON = require("../../../assets/icons/live-stream.png");
export const SMARTPHONE_ICON = require("../../../assets/icons/smartphone.png");
export const PREVENTION_ICON = require("../../../assets/icons/prevention.png");
export const VAR_WORDMARK_ICON = require("../../../assets/icons/var.png");
export const CLICK_SOUND = require("../../../assets/audio/click.mp3.mp3");

export const POLL_TWEET_COMPACT_BREAKPOINT = 390;
export const COMPACT_POLL_TWEET_CARD_HEIGHT = 146;
export const REGULAR_POLL_TWEET_CARD_HEIGHT = 160;
export const POLL_TWEET_MACHINE_STEPS = 8;
export const POLL_TWEET_MACHINE_STEP_DURATION = 170;
export const POLL_TWEET_MACHINE_STEP_PAUSE = 55;
export const POLL_TWEET_MACHINE_SETTLE_PAUSE = 420;
export const MATCH_KICKOFF_COUNTDOWN_SECONDS = 3600;
export const ACTION_SUCCESS_COLOR = "rgba(65,241,123,0.16)";
export const ACTION_SUCCESS_FOREGROUND = "#D7FFE6";

export const MATCH_DETAIL_TABS: Array<{
  key: MatchDetailTabKey;
  label: string;
  iconName: IoniconName;
  accentColor: string;
  accentSurface: string;
}> = [
  {
    key: "lineup",
    label: "التشكيلة",
    iconName: "apps-outline",
    accentColor: "#FFB85C",
    accentSurface: "rgba(255,214,126,0.12)",
  },
  {
    key: "statistics",
    label: "الإحصائيات",
    iconName: "stats-chart-outline",
    accentColor: "#FFB85C",
    accentSurface: "rgba(255,184,92,0.14)",
  },
  {
    key: "headToHead",
    label: "وجهاً لوجه",
    iconName: "swap-horizontal-outline",
    accentColor: "#FFB85C",
    accentSurface: "rgba(255,184,92,0.14)",
  },
];

export const LEAGUE_OVERVIEW_CARDS: LeagueOverviewCard[] = [
  {
    id: "spl",
    title: "دوري روشن السعودي",
    summary: "الجولة الحالية تقترب من الحسم مع صراع مباشر بين القمة والوصافة.",
    metricLabel: "مباريات الجولة",
    metricValue: "09",
    accent: "#63C6FF",
  },
  {
    id: "king-cup",
    title: "كأس خادم الحرمين",
    summary: "نصف النهائي يقترب والأنظار على جاهزية الأسماء الثقيلة قبل الحسم.",
    metricLabel: "المواجهات",
    metricValue: "02",
    accent: "#FFB85C",
  },
  {
    id: "acl",
    title: "دوري أبطال آسيا",
    summary:
      "الأندية السعودية تدخل المرحلة القادمة بزخم فني وأسماء هجومية حاسمة.",
    metricLabel: "الأندية",
    metricValue: "03",
    accent: "#41F17B",
  },
  {
    id: "yelo",
    title: "دوري يلو للدرجة الأولى",
    summary:
      "المنافسة على بطاقات الصعود صارت مفتوحة وكل جولة تغيّر شكل الجدول.",
    metricLabel: "المتأهلون",
    metricValue: "04",
    accent: "#8FD3FF",
  },
  {
    id: "saudi-super",
    title: "كأس السوبر السعودي",
    summary:
      "مواجهات قصيرة وحاسمة ترفع الإيقاع وتضغط على جودة التفاصيل الفنية.",
    metricLabel: "الفرق",
    metricValue: "04",
    accent: "#FFD16A",
  },
  {
    id: "premier-league",
    title: "الدوري الإنجليزي الممتاز",
    summary: "السباق على القمة يشتد مع ضغط المباريات وارتفاع نسق التحولات.",
    metricLabel: "الجولات",
    metricValue: "38",
    accent: "#7A7CFF",
  },
  {
    id: "laliga",
    title: "الدوري الإسباني",
    summary: "التفاصيل التكتيكية الصغيرة تحسم الصدارة مع ثبات أكبر في الكبار.",
    metricLabel: "القمم",
    metricValue: "05",
    accent: "#FF8A80",
  },
  {
    id: "serie-a",
    title: "الدوري الإيطالي",
    summary:
      "تنوع الحلول الهجومية واضح هذا الموسم مع صلابة دفاعية أعلى من المعتاد.",
    metricLabel: "الأهداف",
    metricValue: "71",
    accent: "#9BE7C4",
  },
  {
    id: "bundesliga",
    title: "الدوري الألماني",
    summary:
      "الإيقاع العالي والضغط المبكر جعلا كل جولة مفتوحة حتى الدقائق الأخيرة.",
    metricLabel: "المعدل",
    metricValue: "3.1",
    accent: "#FFB36B",
  },
  {
    id: "ligue-1",
    title: "الدوري الفرنسي",
    summary:
      "الرهان على السرعات الكبيرة يمنح أطراف الجدول فرصًا مفاجئة كل أسبوع.",
    metricLabel: "السباق",
    metricValue: "06",
    accent: "#56D5D0",
  },
  {
    id: "ucl",
    title: "دوري أبطال أوروبا",
    summary:
      "الأدوار الإقصائية تعيد صياغة الحسابات مع تفضيل الخبرة في اللحظات الحاسمة.",
    metricLabel: "المقاعد",
    metricValue: "08",
    accent: "#6CA8FF",
  },
  {
    id: "egypt-premier",
    title: "الدوري المصري الممتاز",
    summary: "الضغط الجماهيري الكبير ينعكس مباشرة على إيقاع المواجهات الكبرى.",
    metricLabel: "القمم",
    metricValue: "04",
    accent: "#F26F63",
  },
  {
    id: "uae-pro",
    title: "دوري أدنوك للمحترفين",
    summary:
      "الفوارق الفنية تقلصت وأصبح الحسم مرتبطًا أكثر بالحلول الفردية المؤثرة.",
    metricLabel: "الفرق",
    metricValue: "14",
    accent: "#B38CFF",
  },
];

export const LEAGUE_STANDINGS: LeagueStandingRow[] = [
  {
    position: 1,
    team: "الهلال",
    played: 28,
    goalDifference: "+42",
    points: 71,
    accent: "#63C6FF",
  },
  {
    position: 2,
    team: "النصر",
    played: 28,
    goalDifference: "+33",
    points: 65,
    accent: "#FFB85C",
  },
  {
    position: 3,
    team: "الأهلي",
    played: 28,
    goalDifference: "+19",
    points: 55,
    accent: "#41F17B",
  },
  {
    position: 4,
    team: "الاتحاد",
    played: 28,
    goalDifference: "+16",
    points: 51,
    accent: "#FFD16A",
  },
  {
    position: 5,
    team: "التعاون",
    played: 28,
    goalDifference: "+11",
    points: 47,
    accent: "#C8CDD4",
  },
];

export const LEAGUE_TOP_SCORERS: LeagueTopScorerRow[] = [
  {
    rank: 1,
    player: "ميتروفيتش",
    club: "الهلال",
    goals: 22,
    shotsOnTarget: 48,
    accent: "#63C6FF",
  },
  {
    rank: 2,
    player: "رونالدو",
    club: "النصر",
    goals: 21,
    shotsOnTarget: 45,
    accent: "#FFB85C",
  },
  {
    rank: 3,
    player: "فراس البريكان",
    club: "الأهلي",
    goals: 17,
    shotsOnTarget: 33,
    accent: "#41F17B",
  },
  {
    rank: 4,
    player: "عبدالرزاق حمدالله",
    club: "الاتحاد",
    goals: 16,
    shotsOnTarget: 30,
    accent: "#FFD16A",
  },
  {
    rank: 5,
    player: "موسى بارو",
    club: "التعاون",
    goals: 14,
    shotsOnTarget: 27,
    accent: "#C8CDD4",
  },
];

export const LEAGUE_POLL_AVATAR_GRADIENTS: GradientPair[] = [
  ["#8C959E", "#3D434A"],
  ["#A2AAB2", "#50565E"],
  ["#7B848D", "#31373D"],
];

export const LEAGUE_POLL_TWEETS: LeaguePollTweet[] = [
  {
    id: "thread-1",
    author: "أبو نواف",
    handle: "@abunawaf11",
    replyTo: "@matchpulse",
    body: "إذا دخل الهلال أول عشر دقائق بنفس هدوئه المعتاد بيقلب رتم المباراة لصالحه، لكن أول افتكاك صحيح من النصر سيغيّر المزاج كله.",
    timeLabel: "قبل 3 د",
    replies: 23,
    reposts: 9,
    likes: 188,
    views: 1300,
    avatarLabel: "أن",
    gradient: ["#8C959E", "#3D434A"],
  },
  {
    id: "thread-2",
    author: "مدرج أزرق",
    handle: "@bluecurve",
    replyTo: "@abunawaf11",
    body: "أتفق معك في البداية، لكن لو النصر كسر الضغط الأول وطلع بالكرة مرتين فقط، الجمهور سيدخل المباراة قبل اللاعبين ويقلب الصوت داخل الملعب.",
    timeLabel: "قبل 2 د",
    replies: 18,
    reposts: 6,
    likes: 142,
    views: 902,
    avatarLabel: "مز",
    gradient: ["#A2AAB2", "#50565E"],
  },
  {
    id: "thread-3",
    author: "صوت المدرج",
    handle: "@soutalmadraj",
    replyTo: "@bluecurve",
    body: "الديربي هذا لن يحسمه الاستحواذ وحده، سيحسمه من يقرأ لحظة الارتباك أسرع، لأن المساحات ستظهر فجأة وتختفي فجأة أيضًا.",
    timeLabel: "الآن",
    replies: 11,
    reposts: 4,
    likes: 97,
    views: 611,
    avatarLabel: "صم",
    gradient: ["#7B848D", "#31373D"],
  },
];

export const AHLI_ITTIHAD_REPLACEMENTS: Array<[string, string]> = [
  ["الهلال", "الأهلي"],
  ["النصر", "الاتحاد"],
];
