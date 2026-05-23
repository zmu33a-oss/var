import {
  type ComponentProps,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  Easing,
  Image,
  type ImageStyle,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  Text as RNText,
  TextInput,
  useWindowDimensions,
  type TextProps,
  View,
  type ViewStyle,
} from "react-native";
import {
  createCompatStyleSheet,
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../lib/crossPlatformStyles";
import {
  AWAY_BENCH,
  AWAY_LINEUP,
  AWAY_SUPPORT,
  HOME_BENCH,
  HOME_LINEUP,
  HOME_SUPPORT,
  MATCH_EVENTS,
  PRESSURE_BARS,
} from "../app.data";
import type {
  BenchPlayer,
  GradientPair,
  LeagueTab,
  MatchEvent,
  Post,
  TacticalPlayer,
} from "../app.types";

type LeaguesScreenProps = {
  posts: Post[];
};

type LeaguePollTweet = {
  id: string;
  author: string;
  handle: string;
  replyTo?: string;
  body: string;
  timeLabel: string;
  replies: number;
  reposts: number;
  likes: number;
  views: number;
  avatarLabel: string;
  gradient: GradientPair;
};

type MatchDetailTabKey = "lineup" | "statistics" | "headToHead";
type IoniconName = ComponentProps<typeof Ionicons>["name"];

type MatchShowcaseTeam = {
  title: string;
  shortName: string;
  gradient: GradientPair;
  support: number;
  lineup: TacticalPlayer[];
  bench: BenchPlayer[];
  iconSource?: number;
};

type LeagueOverviewCard = {
  id: string;
  title: string;
  summary: string;
  metricLabel: string;
  metricValue: string;
  accent: string;
};

type LeagueStandingRow = {
  position: number;
  team: string;
  played: number;
  goalDifference: string;
  points: number;
  accent: string;
};

type LeagueTopScorerRow = {
  rank: number;
  player: string;
  club: string;
  goals: number;
  shotsOnTarget: number;
  accent: string;
};

type MatchShowcaseCardConfig = {
  id: string;
  leagueName: string;
  homeTeam: MatchShowcaseTeam;
  awayTeam: MatchShowcaseTeam;
  events: MatchEvent[];
  pollTweets: LeaguePollTweet[];
  hashtag: string;
  pressureBars: number[];
};

type WebAudioInstance = {
  currentTime: number;
  preload?: string;
  play?: () => Promise<void> | void;
  pause?: () => void;
};

type WebAudioConstructor = new (src?: string) => WebAudioInstance;

const MONO_FONT = Platform.OS === "ios" ? "Courier" : "monospace";
const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== "web";
const LEAGUES_ARABIC_FONT_FAMILY = "LeaguesArabic";
const LEAGUES_ARABIC_FONT = require("../../assets/images/alfont_com_KA-Hand-Naskh.ttf");
const LEAGUE_HEADER_ARABIC_FONT_FAMILY = "LeagueHeaderArabic";
const LEAGUE_HEADER_ARABIC_FONT = require("../../assets/images/alfont_com_zainpcv2mob600-zainpcv2.ttf");
const HILAL_ICON = require("../../assets/icons/alhilal.png.png");
const NASSR_ICON = require("../../assets/icons/alnassr.png.png");
const KSA_ICON = require("../../assets/icons/ksa.png");
const ROSHN_ICON = require("../../assets/icons/ROSHN.png");
const LIVE_STREAM_ICON = require("../../assets/icons/live-stream.png");
const SMARTPHONE_ICON = require("../../assets/icons/smartphone.png");
const PREVENTION_ICON = require("../../assets/icons/prevention.png");
const VAR_WORDMARK_ICON = require("../../assets/icons/var.png");
const CLICK_SOUND = require("../../assets/audio/click.mp3.mp3");
const POLL_TWEET_COMPACT_BREAKPOINT = 390;
const COMPACT_POLL_TWEET_CARD_HEIGHT = 146;
const REGULAR_POLL_TWEET_CARD_HEIGHT = 160;
const POLL_TWEET_MACHINE_STEPS = 8;
const POLL_TWEET_MACHINE_STEP_DURATION = 170;
const POLL_TWEET_MACHINE_STEP_PAUSE = 55;
const POLL_TWEET_MACHINE_SETTLE_PAUSE = 420;
const MATCH_KICKOFF_COUNTDOWN_SECONDS = 3600;
const ACTION_SUCCESS_COLOR = "rgba(65,241,123,0.16)";
const ACTION_SUCCESS_FOREGROUND = "#D7FFE6";

const LeagueArabicFontContext = createContext<string | undefined>(undefined);

function Text(props: TextProps) {
  const leaguesArabicFontFamily = useContext(LeagueArabicFontContext);

  return (
    <RNText
      {...props}
      style={[
        props.style,
        leaguesArabicFontFamily
          ? { fontFamily: leaguesArabicFontFamily }
          : null,
      ]}
    />
  );
}

const MATCH_DETAIL_TABS: Array<{
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

const LEAGUE_OVERVIEW_CARDS: LeagueOverviewCard[] = [
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

const LEAGUE_STANDINGS: LeagueStandingRow[] = [
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

const LEAGUE_TOP_SCORERS: LeagueTopScorerRow[] = [
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

const LEAGUE_POLL_AVATAR_GRADIENTS: GradientPair[] = [
  ["#8C959E", "#3D434A"],
  ["#A2AAB2", "#50565E"],
  ["#7B848D", "#31373D"],
];

const LEAGUE_POLL_TWEETS: LeaguePollTweet[] = [
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

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function sanitizePredictionValue(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 2);
}

function parsePredictionGoalCount(value: string) {
  const parsedValue = Number.parseInt(value || "0", 10);

  if (Number.isNaN(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

function resizePredictionSelections(
  playerIds: string[],
  expectedCount: number,
) {
  if (expectedCount <= 0) {
    return [];
  }

  const nextSelections = playerIds.slice(0, expectedCount);

  while (nextSelections.length < expectedCount) {
    nextSelections.push("");
  }

  return nextSelections;
}

function createLeaguePollAvatarLabel(author: string) {
  const compactAuthor = author.replace(/\s+/g, "").trim();

  return compactAuthor.slice(0, 2) || "VX";
}

function estimateLeaguePollViews(post: Post) {
  return Math.max(
    220,
    post.likes * 6 + post.replies * 14 + post.reposts * 18 + post.shares * 22,
  );
}

function mapPostToLeaguePollTweet(post: Post, index: number): LeaguePollTweet {
  return {
    id: String(post.id),
    author: post.author,
    handle: post.handle,
    body: post.content,
    timeLabel: post.time,
    replies: post.replies,
    reposts: post.reposts,
    likes: post.likes,
    views: estimateLeaguePollViews(post),
    avatarLabel: createLeaguePollAvatarLabel(post.author),
    gradient:
      LEAGUE_POLL_AVATAR_GRADIENTS[index % LEAGUE_POLL_AVATAR_GRADIENTS.length],
  };
}

const AHLI_ITTIHAD_REPLACEMENTS: Array<[string, string]> = [
  ["الهلال", "الأهلي"],
  ["النصر", "الاتحاد"],
];

function applyTeamNameReplacements(
  value: string,
  replacements: Array<[string, string]>,
) {
  return replacements.reduce(
    (currentValue, [from, to]) => currentValue.split(from).join(to),
    value,
  );
}

function remapMatchEvents(
  events: MatchEvent[],
  replacements: Array<[string, string]>,
) {
  return events.map((event) => ({
    ...event,
    title: applyTeamNameReplacements(event.title, replacements),
    detail: applyTeamNameReplacements(event.detail, replacements),
  }));
}

function remapLeaguePollTweets(
  tweets: LeaguePollTweet[],
  replacements: Array<[string, string]>,
) {
  return tweets.map((tweet) => ({
    ...tweet,
    body: applyTeamNameReplacements(tweet.body, replacements),
  }));
}

function remapTacticalPlayers(
  players: TacticalPlayer[],
  replacements: Array<[string, string]>,
) {
  return players.map((player) => ({
    ...player,
    name: applyTeamNameReplacements(player.name, replacements),
  }));
}

function remapBenchPlayers(
  players: BenchPlayer[],
  replacements: Array<[string, string]>,
) {
  return players.map((player) => ({
    ...player,
    name: applyTeamNameReplacements(player.name, replacements),
  }));
}

function getAveragePressureValue(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce(
    (runningTotal, currentValue) => runningTotal + currentValue,
    0,
  );

  return Math.round(total / values.length);
}

function findLeagueStandingRow(teamTitle: string) {
  return LEAGUE_STANDINGS.find((row) => row.team === teamTitle) ?? null;
}

function getRelatedTopScorers(teamTitles: string[]) {
  return LEAGUE_TOP_SCORERS.filter((player) =>
    teamTitles.includes(player.club),
  );
}

type ShowcaseLineupPlayer = TacticalPlayer & {
  displayY: number;
};

type ShowcaseBenchPlayer = BenchPlayer & {
  gradient: GradientPair;
};

type FieldLayerFrame = {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
};

function clampLineupCoordinate(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resolveFieldDropPosition(
  moveX: number,
  moveY: number,
  frame: FieldLayerFrame,
) {
  const isInsideX = moveX >= frame.pageX && moveX <= frame.pageX + frame.width;
  const isInsideY = moveY >= frame.pageY && moveY <= frame.pageY + frame.height;

  if (!isInsideX || !isInsideY) {
    return null;
  }

  return {
    x: clampLineupCoordinate(
      (moveX - frame.pageX) / Math.max(frame.width, 1),
      0.08,
      0.92,
    ),
    displayY: clampLineupCoordinate(
      (moveY - frame.pageY) / Math.max(frame.height, 1),
      0.06,
      0.94,
    ),
  };
}

function buildBenchShowcasePlayers(
  players: BenchPlayer[],
  gradient: GradientPair,
) {
  return players.map((player) => ({
    ...player,
    gradient,
  }));
}

function formatLineupKickoffDate(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hours24 >= 12 ? "م" : "ص";
  const hours12 = hours24 % 12 || 12;

  return `${year}/${month}/${day} ، ${hours12}:${minutes} ${meridiem}`;
}

function normalizeShowcaseLineupPlayers(players: TacticalPlayer[]) {
  const hasTopGoalkeeper =
    players.filter((player) => player.y <= 0.2).length === 1;

  return players.map((player) => ({
    ...player,
    displayY: hasTopGoalkeeper ? 1 - player.y : player.y,
  }));
}

function buildFormationLabel(players: TacticalPlayer[]) {
  const normalizedPlayers = normalizeShowcaseLineupPlayers(players)
    .slice()
    .sort((left, right) => left.displayY - right.displayY);

  if (normalizedPlayers.length <= 1) {
    return "-";
  }

  const outfieldPlayers = normalizedPlayers.slice(0, -1);

  if (!outfieldPlayers.length) {
    return "-";
  }

  const lines: number[] = [];
  let currentAnchor = outfieldPlayers[0].displayY;
  let currentCount = 0;

  outfieldPlayers.forEach((player) => {
    if (Math.abs(player.displayY - currentAnchor) > 0.11 && currentCount > 0) {
      lines.push(currentCount);
      currentAnchor = player.displayY;
      currentCount = 1;
      return;
    }

    currentCount += 1;
  });

  if (currentCount > 0) {
    lines.push(currentCount);
  }

  return lines.join("-");
}

function buildFormationLabelFromDisplayPlayers(
  players: ShowcaseLineupPlayer[],
) {
  const orderedPlayers = players
    .slice()
    .sort((left, right) => left.displayY - right.displayY);

  if (orderedPlayers.length <= 1) {
    return "-";
  }

  const outfieldPlayers = orderedPlayers.slice(0, -1);

  if (!outfieldPlayers.length) {
    return "-";
  }

  const lines: number[] = [];
  let currentAnchor = outfieldPlayers[0].displayY;
  let currentCount = 0;

  outfieldPlayers.forEach((player) => {
    if (Math.abs(player.displayY - currentAnchor) > 0.11 && currentCount > 0) {
      lines.push(currentCount);
      currentAnchor = player.displayY;
      currentCount = 1;
      return;
    }

    currentCount += 1;
  });

  if (currentCount > 0) {
    lines.push(currentCount);
  }

  return lines.join("-");
}

export default function LeaguesScreen(props: LeaguesScreenProps) {
  const [areLeaguesFontsLoaded] = useFonts({
    [LEAGUES_ARABIC_FONT_FAMILY]: LEAGUES_ARABIC_FONT,
    [LEAGUE_HEADER_ARABIC_FONT_FAMILY]: LEAGUE_HEADER_ARABIC_FONT,
  });
  const { width: viewportWidth } = useWindowDimensions();
  const layoutWidth = Math.min(viewportWidth, 430);
  const pollTweetCardHeight =
    layoutWidth < POLL_TWEET_COMPACT_BREAKPOINT
      ? COMPACT_POLL_TWEET_CARD_HEIGHT
      : REGULAR_POLL_TWEET_CARD_HEIGHT;
  const pollTweetViewportHeight = pollTweetCardHeight * 3;
  const pollTweetMachineStepDistance =
    pollTweetCardHeight / POLL_TWEET_MACHINE_STEPS;
  const leaguesArabicFontFamily = areLeaguesFontsLoaded
    ? LEAGUES_ARABIC_FONT_FAMILY
    : undefined;
  const leagueHeaderArabicFontFamily = areLeaguesFontsLoaded
    ? LEAGUE_HEADER_ARABIC_FONT_FAMILY
    : undefined;
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isLeagueDrawerOpen, setIsLeagueDrawerOpen] = useState(false);
  const [selectedLeagueOverviewId, setSelectedLeagueOverviewId] = useState(
    LEAGUE_OVERVIEW_CARDS[0]?.id ?? null,
  );
  const [kickoffCountdownSeconds, setKickoffCountdownSeconds] = useState(
    MATCH_KICKOFF_COUNTDOWN_SECONDS,
  );
  const leagueDrawerProgress = useRef(new Animated.Value(0)).current;

  const primaryLeaguePollTweets = useMemo(() => {
    if (!props.posts.length) {
      return LEAGUE_POLL_TWEETS;
    }

    return props.posts.slice(0, 3).map(mapPostToLeaguePollTweet);
  }, [props.posts]);

  const matchShowcaseCards = useMemo<MatchShowcaseCardConfig[]>(
    () => [
      {
        id: "hilal-nassr",
        leagueName: "الهلال VS النصر",
        homeTeam: {
          title: "الهلال",
          shortName: "هـ",
          gradient: ["#67C7FF", "#1A48AF"],
          support: HOME_SUPPORT,
          lineup: HOME_LINEUP,
          bench: HOME_BENCH,
          iconSource: HILAL_ICON,
        },
        awayTeam: {
          title: "النصر",
          shortName: "ن",
          gradient: ["#FFD16A", "#9A4E1A"],
          support: AWAY_SUPPORT,
          lineup: AWAY_LINEUP,
          bench: AWAY_BENCH,
          iconSource: NASSR_ICON,
        },
        events: MATCH_EVENTS,
        pollTweets: primaryLeaguePollTweets,
        hashtag: "#الهلال-النصر",
        pressureBars: PRESSURE_BARS,
      },
      {
        id: "ahli-ittihad",
        leagueName: "الأهلي VS الاتحاد",
        homeTeam: {
          title: "الأهلي",
          shortName: "أ",
          gradient: ["#41F17B", "#0F5F31"],
          support: HOME_SUPPORT,
          lineup: remapTacticalPlayers(HOME_LINEUP, AHLI_ITTIHAD_REPLACEMENTS),
          bench: remapBenchPlayers(HOME_BENCH, AHLI_ITTIHAD_REPLACEMENTS),
        },
        awayTeam: {
          title: "الاتحاد",
          shortName: "ا",
          gradient: ["#FFD16A", "#9A4E1A"],
          support: AWAY_SUPPORT,
          lineup: remapTacticalPlayers(AWAY_LINEUP, AHLI_ITTIHAD_REPLACEMENTS),
          bench: remapBenchPlayers(AWAY_BENCH, AHLI_ITTIHAD_REPLACEMENTS),
        },
        events: remapMatchEvents(MATCH_EVENTS, AHLI_ITTIHAD_REPLACEMENTS),
        pollTweets: remapLeaguePollTweets(
          primaryLeaguePollTweets,
          AHLI_ITTIHAD_REPLACEMENTS,
        ),
        hashtag: "#الأهلي-الاتحاد",
        pressureBars: PRESSURE_BARS,
      },
    ],
    [primaryLeaguePollTweets],
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setKickoffCountdownSeconds((currentSeconds) =>
        currentSeconds > 0 ? currentSeconds - 1 : 0,
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const animation = Animated.timing(leagueDrawerProgress, {
      toValue: isLeagueDrawerOpen ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isLeagueDrawerOpen, leagueDrawerProgress]);

  useEffect(() => {
    if (selectedMatchId) {
      setIsLeagueDrawerOpen(false);
    }
  }, [selectedMatchId]);

  const selectedMatch =
    matchShowcaseCards.find((matchCard) => matchCard.id === selectedMatchId) ??
    null;
  const kickoffCountdownLabel = formatCountdown(kickoffCountdownSeconds);
  const kickoffAt = new Date(Date.now() + kickoffCountdownSeconds * 1000);

  return (
    <LeagueArabicFontContext.Provider value={leaguesArabicFontFamily}>
      <View style={styles.root}>
        {!selectedMatch ? (
          <LeaguesListHeader
            drawerProgress={leagueDrawerProgress}
            headerFontFamily={leagueHeaderArabicFontFamily}
            isLeagueDrawerOpen={isLeagueDrawerOpen}
            leagueDrawerItems={LEAGUE_OVERVIEW_CARDS}
            onSelectLeague={(leagueId) => {
              setSelectedLeagueOverviewId(leagueId);
              setIsLeagueDrawerOpen(false);
            }}
            onToggleLeagueDrawer={() =>
              setIsLeagueDrawerOpen((currentState) => !currentState)
            }
            selectedLeagueId={selectedLeagueOverviewId}
          />
        ) : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.screenContent}
        >
          {matchShowcaseCards.map((matchCard) => (
            <MatchShowcaseCard
              key={matchCard.id}
              config={matchCard}
              kickoffCountdownLabel={kickoffCountdownLabel}
              onOpenDetails={() => setSelectedMatchId(matchCard.id)}
              pollTweetCardHeight={pollTweetCardHeight}
              pollTweetViewportHeight={pollTweetViewportHeight}
              pollTweetMachineStepDistance={pollTweetMachineStepDistance}
            />
          ))}
        </ScrollView>

        {selectedMatch ? (
          <View style={styles.matchDetailOverlay}>
            <MatchDetailPage
              config={selectedMatch}
              kickoffAt={kickoffAt}
              kickoffCountdownLabel={kickoffCountdownLabel}
              onBack={() => setSelectedMatchId(null)}
              headerFontFamily={leagueHeaderArabicFontFamily}
            />
          </View>
        ) : null}
      </View>
    </LeagueArabicFontContext.Provider>
  );
}

function getLeagueOverviewIconSource(leagueId: string) {
  switch (leagueId) {
    case "spl":
      return HILAL_ICON;
    case "king-cup":
      return NASSR_ICON;
    default:
      return KSA_ICON;
  }
}

function LeaguesListHeader(props: {
  headerFontFamily?: string;
  isLeagueDrawerOpen: boolean;
  leagueDrawerItems: LeagueOverviewCard[];
  selectedLeagueId: string | null;
  onToggleLeagueDrawer: () => void;
  onSelectLeague: (leagueId: string) => void;
  drawerProgress: Animated.Value;
}) {
  const { height: viewportHeight } = useWindowDimensions();
  const drawerMaxHeight = Math.min(
    props.leagueDrawerItems.length * 76 + 16,
    Math.max(520, viewportHeight - 138),
  );
  const drawerOpacity = props.drawerProgress.interpolate({
    inputRange: [0, 0.18, 1],
    outputRange: [0, 0.45, 1],
  });
  const drawerTranslateX = props.drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [96, 0],
  });
  const drawerTranslateY = props.drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 0],
  });
  const drawerScale = props.drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <View style={styles.leaguesListHeader}>
      <View style={styles.leaguesListHeaderRow}>
        <View style={styles.leaguesListHeaderCenterBlock}>
          <RNText
            style={[
              styles.leaguesListTitle,
              styles.leaguesListTitleCentered,
              props.headerFontFamily
                ? { fontFamily: props.headerFontFamily }
                : null,
            ]}
          >
            الدوريات
          </RNText>
        </View>
      </View>

      <View
        {...getNativePointerEventsProps("box-none")}
        style={[
          styles.leaguesListVarAnchor,
          getWebPointerEventsStyle("box-none"),
        ]}
      >
        <Pressable
          onPress={props.onToggleLeagueDrawer}
          style={({ pressed }) => [
            styles.leaguesListVarTrigger,
            props.isLeagueDrawerOpen
              ? styles.leaguesListVarTriggerActive
              : null,
            pressed ? styles.leaguesListVarTriggerPressed : null,
          ]}
        >
          <Image
            source={VAR_WORDMARK_ICON}
            resizeMode="contain"
            tintColor="#0B0D12"
            style={styles.leaguesListVarTriggerImage as ImageStyle}
          />
        </Pressable>

        <Animated.View
          {...getNativePointerEventsProps(
            props.isLeagueDrawerOpen ? "auto" : "none",
          )}
          style={[
            styles.leaguesListDrawerWrap,
            { maxHeight: drawerMaxHeight },
            {
              opacity: drawerOpacity,
              transform: [
                { translateX: drawerTranslateX },
                { translateY: drawerTranslateY },
                { scale: drawerScale },
              ],
            },
            getWebPointerEventsStyle(
              props.isLeagueDrawerOpen ? "auto" : "none",
            ),
          ]}
        >
          <ScrollView
            bounces={false}
            nestedScrollEnabled
            scrollEnabled={props.isLeagueDrawerOpen}
            showsVerticalScrollIndicator={false}
            style={styles.leaguesListDrawerScroll}
            contentContainerStyle={styles.leaguesListDrawerContent}
          >
            {props.leagueDrawerItems.map((card, index) => {
              const itemOpacity = props.drawerProgress.interpolate({
                inputRange: [0, Math.min(0.55 + index * 0.12, 0.9), 1],
                outputRange: [0, 0, 1],
                extrapolate: "clamp",
              });
              const itemTranslateX = props.drawerProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [44 + index * 10, 0],
              });
              const itemTranslateY = props.drawerProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [-(index + 1) * 3, 0],
              });

              return (
                <Animated.View
                  key={card.id}
                  style={[
                    styles.leaguesListDrawerItemWrap,
                    {
                      opacity: itemOpacity,
                      transform: [
                        { translateX: itemTranslateX },
                        { translateY: itemTranslateY },
                      ],
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => props.onSelectLeague(card.id)}
                    style={[
                      styles.leaguesListDrawerItem,
                      props.selectedLeagueId === card.id
                        ? styles.leaguesListDrawerItemActive
                        : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.leaguesListDrawerAccentLine,
                        { backgroundColor: card.accent },
                      ]}
                    />

                    <View style={styles.leaguesListDrawerTextBlock}>
                      <RNText style={styles.leaguesListDrawerTitle}>
                        {card.title}
                      </RNText>
                      <Text
                        numberOfLines={1}
                        style={styles.leaguesListDrawerSummary}
                      >
                        {card.summary}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.leaguesListDrawerIconWrap,
                        {
                          borderColor: `${card.accent}66`,
                          backgroundColor: `${card.accent}15`,
                        },
                      ]}
                    >
                      <Image
                        source={getLeagueOverviewIconSource(card.id)}
                        resizeMode="contain"
                        style={styles.leaguesListDrawerIconImage as ImageStyle}
                      />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

function MatchPreviewCard(props: {
  config: MatchShowcaseCardConfig;
  kickoffCountdownLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={props.onPress} style={styles.matchPreviewPressable}>
      <GlassCard style={styles.matchCard}>
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0)"]}
          end={{ x: 1, y: 1 }}
          style={styles.matchCardFrame}
        >
          <LinearGradient
            colors={[
              "rgba(34,52,84,0.20)",
              "rgba(20,31,50,0.20)",
              "rgba(10,16,28,0.20)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.matchCardInner}
          >
            <View style={styles.matchCardGlow} />
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.matchCardSheen}
            />

            <View style={styles.matchDemoPillWrap}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>MATCH</Text>
              </View>
            </View>

            <View style={styles.matchHeader}>
              <Text style={styles.matchLeagueName}>
                {props.config.leagueName}
              </Text>
            </View>

            <View style={styles.scoreRow}>
              <TeamColumn
                title={props.config.awayTeam.title}
                shortName={props.config.awayTeam.shortName}
                gradient={props.config.awayTeam.gradient}
                iconSource={props.config.awayTeam.iconSource}
              />

              <View style={styles.scoreBlock}>
                <View style={styles.scoreDigitsRow}>
                  <Text style={styles.scoreDigit}>0</Text>
                  <Text style={styles.scoreDash}>-</Text>
                  <Text style={styles.scoreDigit}>0</Text>
                </View>
                <Text style={styles.kickoffCountdownText}>
                  {props.kickoffCountdownLabel}
                </Text>
                <Text style={styles.kickoffCountdownCaption}>
                  اضغط لفتح التفاصيل
                </Text>
              </View>

              <TeamColumn
                title={props.config.homeTeam.title}
                shortName={props.config.homeTeam.shortName}
                gradient={props.config.homeTeam.gradient}
                iconSource={props.config.homeTeam.iconSource}
              />
            </View>

            <View style={styles.matchPreviewFooter}>
              <View style={styles.matchPreviewHintPill}>
                <Ionicons name="arrow-back" size={14} color="#FFDE97" />
                <Text style={styles.matchPreviewHintText}>
                  عرض التشكيلة والإحصائيات
                </Text>
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>
      </GlassCard>
    </Pressable>
  );
}

function MatchDetailShowcaseHero(props: {
  config: MatchShowcaseCardConfig;
  kickoffCountdownLabel: string;
  onBack: () => void;
  headerFontFamily?: string;
}) {
  return (
    <View style={styles.matchDetailShowcaseCard}>
      <View
        style={[
          styles.matchShowcaseShell,
          styles.matchDetailShowcaseShell,
          styles.matchDetailShowcaseShellSharp,
        ]}
      >
        <View
          style={[
            styles.matchShowcaseHeaderActionsRow,
            styles.matchDetailShowcaseHeaderRow,
          ]}
        >
          <View style={styles.matchShowcaseLiveBadge}>
            <View style={styles.matchShowcaseLiveDot} />
            <RNText style={styles.matchShowcaseLiveBadgeText}>DEMO LIVE</RNText>
          </View>

          <Pressable
            onPress={props.onBack}
            style={styles.matchDetailShowcaseBackButton}
          >
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            <RNText
              style={[
                styles.matchDetailShowcaseBackText,
                props.headerFontFamily
                  ? { fontFamily: props.headerFontFamily }
                  : null,
              ]}
            >
              رجوع
            </RNText>
          </Pressable>
        </View>

        <View
          style={[
            styles.matchShowcaseHeroPressable,
            styles.matchDetailShowcaseHero,
          ]}
        >
          <View style={styles.matchShowcaseContextBlock}>
            <View style={styles.matchShowcaseCompetitionLogoWrap}>
              <Image
                source={ROSHN_ICON}
                resizeMode="contain"
                style={styles.matchShowcaseCompetitionLogo as ImageStyle}
              />
            </View>

            <RNText
              style={[
                styles.matchShowcaseLeagueName,
                props.headerFontFamily
                  ? { fontFamily: props.headerFontFamily }
                  : null,
              ]}
            >
              {props.config.leagueName}
            </RNText>

            <RNText style={styles.matchDetailShowcaseMetaText}>
              نفس هوية كرت المباراة الرئيسية
            </RNText>
          </View>

          <View style={styles.matchShowcaseTeamsRow}>
            <MatchShowcaseHeroTeamPanel
              title={props.config.homeTeam.title}
              shortName={props.config.homeTeam.shortName}
              gradient={props.config.homeTeam.gradient}
              iconSource={props.config.homeTeam.iconSource}
              caption="المضيف"
            />

            <View style={styles.matchShowcaseScoreCenter}>
              <View style={styles.matchShowcaseScoreDigitsRow}>
                <RNText style={styles.matchShowcaseScoreDigit}>0</RNText>
                <RNText style={styles.matchShowcaseVersus}>VS</RNText>
                <RNText style={styles.matchShowcaseScoreDigit}>0</RNText>
              </View>

              <View style={styles.matchShowcaseCountdownBadge}>
                <RNText style={styles.matchShowcaseCountdownText}>
                  {props.kickoffCountdownLabel}
                </RNText>
              </View>

              <RNText style={styles.matchShowcaseCountdownCaption}>
                حتى بداية المباراة
              </RNText>
            </View>

            <MatchShowcaseHeroTeamPanel
              title={props.config.awayTeam.title}
              shortName={props.config.awayTeam.shortName}
              gradient={props.config.awayTeam.gradient}
              iconSource={props.config.awayTeam.iconSource}
              caption="الضيف"
            />
          </View>
        </View>

        <View style={styles.matchDetailShowcaseDivider} />
      </View>
    </View>
  );
}

function MatchDetailStickyTabsCard(props: {
  activeTab: MatchDetailTabKey;
  onTabChange: (tab: MatchDetailTabKey) => void;
}) {
  return (
    <View style={styles.matchDetailStickyTabsWrap}>
      <View style={styles.matchDetailStickyTabsCard}>
        <View
          style={[
            styles.matchShowcaseFooterTabsRow,
            styles.matchDetailStickyTabsRow,
          ]}
        >
          {MATCH_DETAIL_TABS.map((tab, index) => (
            <MatchDetailTabButton
              compact
              accentColor={tab.accentColor}
              accentSurface={tab.accentSurface}
              iconName={tab.iconName}
              key={tab.key}
              isActive={props.activeTab === tab.key}
              label={tab.label}
              onPress={() => props.onTabChange(tab.key)}
              showDivider={index < MATCH_DETAIL_TABS.length - 1}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function MatchDetailPage(props: {
  config: MatchShowcaseCardConfig;
  kickoffAt: Date;
  kickoffCountdownLabel: string;
  onBack: () => void;
  headerFontFamily?: string;
}) {
  const [activeTab, setActiveTab] = useState<MatchDetailTabKey>("lineup");
  const [lineupTeam, setLineupTeam] = useState<"home" | "away">("home");
  const [isVarEditorActive, setIsVarEditorActive] = useState(false);
  const borderSpinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsVarEditorActive(false);
  }, [activeTab, lineupTeam]);

  useEffect(() => {
    borderSpinValue.setValue(0);

    const animation = Animated.loop(
      Animated.timing(borderSpinValue, {
        toValue: 1,
        duration: 16000,
        easing: Easing.linear,
        useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      }),
      { resetBeforeIteration: true },
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [borderSpinValue]);

  const selectedPlayers =
    lineupTeam === "home"
      ? props.config.homeTeam.lineup
      : props.config.awayTeam.lineup;
  const selectedBench =
    lineupTeam === "home"
      ? props.config.homeTeam.bench
      : props.config.awayTeam.bench;
  const selectedTeamLabel =
    lineupTeam === "home"
      ? props.config.homeTeam.title
      : props.config.awayTeam.title;
  const supportTotal =
    props.config.homeTeam.support + props.config.awayTeam.support;
  const homeSupportShare =
    supportTotal === 0
      ? 50
      : Math.round((props.config.homeTeam.support / supportTotal) * 100);
  const awaySupportShare = 100 - homeSupportShare;
  const pressureAverage = getAveragePressureValue(props.config.pressureBars);
  const pressurePeak = Math.max(...props.config.pressureBars, 0);
  const homeStanding = findLeagueStandingRow(props.config.homeTeam.title);
  const awayStanding = findLeagueStandingRow(props.config.awayTeam.title);
  const relatedTopScorers = getRelatedTopScorers([
    props.config.homeTeam.title,
    props.config.awayTeam.title,
  ]);
  const rotatingBorderSpin = borderSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={[
        "rgba(255,255,255,0.38)",
        "rgba(255,255,255,0.14)",
        "rgba(255,255,255,0.05)",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.matchDetailPageBorderRing}
    >
      <Animated.View
        {...getNativePointerEventsProps("none")}
        style={[
          styles.matchDetailPageBorderSpinner,
          { transform: [{ rotate: rotatingBorderSpin }] },
          getWebPointerEventsStyle("none"),
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
            "rgba(255,255,255,0.96)",
            "rgba(255,255,255,0.96)",
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
          ]}
          locations={[0, 0.34, 0.45, 0.52, 0.58, 0.68, 1]}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 0.92, y: 1 }}
          style={styles.matchDetailPageBorderSpinnerGradient}
        />
      </Animated.View>

      <View style={styles.matchDetailShell}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.matchDetailContent}
          stickyHeaderIndices={[1]}
        >
          <MatchDetailShowcaseHero
            config={props.config}
            kickoffCountdownLabel={props.kickoffCountdownLabel}
            onBack={props.onBack}
            headerFontFamily={props.headerFontFamily}
          />

          <MatchDetailStickyTabsCard
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <View>
            {activeTab === "lineup" ? (
              <View>
                <View style={styles.lineupSwitchRow}>
                  <ModeSwitchButton
                    label={props.config.homeTeam.title}
                    isActive={lineupTeam === "home"}
                    onPress={() => setLineupTeam("home")}
                  />
                  <ModeSwitchButton
                    label={props.config.awayTeam.title}
                    isActive={lineupTeam === "away"}
                    onPress={() => setLineupTeam("away")}
                  />
                </View>

                <LineupShowcaseStage
                  homeTeam={props.config.homeTeam}
                  awayTeam={props.config.awayTeam}
                  kickoffAt={props.kickoffAt}
                  players={selectedPlayers}
                  benchPlayers={selectedBench}
                  selectedTeamLabel={selectedTeamLabel}
                  selectedTeamShortName={
                    lineupTeam === "home"
                      ? props.config.homeTeam.shortName
                      : props.config.awayTeam.shortName
                  }
                  selectedTeamGradient={
                    lineupTeam === "home"
                      ? props.config.homeTeam.gradient
                      : props.config.awayTeam.gradient
                  }
                  onEditorModeChange={setIsVarEditorActive}
                />
              </View>
            ) : null}

            {activeTab === "statistics" ? (
              <View>
                <View style={styles.detailStatsGrid}>
                  <GlassCard style={styles.detailMetricCard}>
                    <RNText style={styles.detailMetricValue}>
                      {pressureAverage}
                    </RNText>
                    <Text style={styles.detailMetricLabel}>متوسط الضغط</Text>
                  </GlassCard>
                  <GlassCard style={styles.detailMetricCard}>
                    <RNText style={styles.detailMetricValue}>
                      {props.config.events.length}
                    </RNText>
                    <Text style={styles.detailMetricLabel}>عدد الأحداث</Text>
                  </GlassCard>
                  <GlassCard style={styles.detailMetricCard}>
                    <RNText style={styles.detailMetricValue}>
                      {pressurePeak}
                    </RNText>
                    <Text style={styles.detailMetricLabel}>ذروة الإيقاع</Text>
                  </GlassCard>
                </View>

                <GlassCard style={styles.detailPressureCard}>
                  <View style={styles.detailSectionHeader}>
                    <Text style={styles.detailSectionTitle}>
                      مؤشر ضغط المباراة
                    </Text>
                    <Text style={styles.detailSectionHint}>
                      {props.config.hashtag}
                    </Text>
                  </View>
                  <View style={styles.detailPressureBarsRow}>
                    {props.config.pressureBars.map((barValue, index) => (
                      <View
                        key={`${props.config.id}-bar-${index}`}
                        style={styles.detailPressureBarTrack}
                      >
                        <View
                          style={[
                            styles.detailPressureBarFill,
                            {
                              height: `${Math.max(14, Math.round((barValue / Math.max(pressurePeak, 1)) * 100))}%`,
                              backgroundColor:
                                index % 2 === 0
                                  ? props.config.homeTeam.gradient[0]
                                  : props.config.awayTeam.gradient[0],
                            },
                          ]}
                        />
                      </View>
                    ))}
                  </View>
                </GlassCard>

                <Text style={styles.detailSectionTitleStandalone}>
                  مؤشرات الدوري
                </Text>
                {LEAGUE_OVERVIEW_CARDS.map((card) => (
                  <GlassCard key={card.id} style={styles.headerOverviewCard}>
                    <View style={styles.headerOverviewRow}>
                      <View style={styles.headerOverviewTextBlock}>
                        <Text style={styles.headerOverviewTitle}>
                          {card.title}
                        </Text>
                        <Text style={styles.headerOverviewSummary}>
                          {card.summary}
                        </Text>
                      </View>

                      <View style={styles.headerOverviewMetricBlock}>
                        <RNText style={styles.headerOverviewMetricValue}>
                          {card.metricValue}
                        </RNText>
                        <Text style={styles.headerOverviewMetricLabel}>
                          {card.metricLabel}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.headerOverviewAccent,
                          { backgroundColor: card.accent },
                        ]}
                      />
                    </View>
                  </GlassCard>
                ))}
              </View>
            ) : null}

            {activeTab === "headToHead" ? (
              <View>
                <GlassCard style={styles.detailHeadToHeadHero}>
                  <View style={styles.detailHeadToHeadRow}>
                    <View style={styles.detailHeadToHeadTeamBlock}>
                      <Text
                        style={styles.detailHeadToHeadPercentage}
                      >{`${awaySupportShare}%`}</Text>
                      <Text style={styles.detailHeadToHeadTeamName}>
                        {props.config.awayTeam.title}
                      </Text>
                    </View>

                    <View style={styles.detailHeadToHeadCenter}>
                      <Text style={styles.detailHeadToHeadLabel}>
                        وجهاً لوجه
                      </Text>
                      <Text style={styles.detailHeadToHeadSubLabel}>
                        تصويت الجمهور الحالي
                      </Text>
                    </View>

                    <View style={styles.detailHeadToHeadTeamBlock}>
                      <Text
                        style={styles.detailHeadToHeadPercentage}
                      >{`${homeSupportShare}%`}</Text>
                      <Text style={styles.detailHeadToHeadTeamName}>
                        {props.config.homeTeam.title}
                      </Text>
                    </View>
                  </View>
                </GlassCard>

                {homeStanding || awayStanding ? (
                  <GlassCard style={styles.headerTableCard}>
                    <View style={styles.headerTableHeaderRow}>
                      <Text
                        style={[
                          styles.headerTableHeaderText,
                          styles.headerTeamHeader,
                        ]}
                      >
                        الفريق
                      </Text>
                      <Text style={styles.headerTableHeaderText}>لعب</Text>
                      <Text style={styles.headerTableHeaderText}>+/-</Text>
                      <Text style={styles.headerTableHeaderAccent}>نقاط</Text>
                    </View>

                    {[homeStanding, awayStanding]
                      .filter((team): team is LeagueStandingRow =>
                        Boolean(team),
                      )
                      .map((team) => (
                        <View key={team.position} style={styles.headerTableRow}>
                          <View style={styles.headerTeamBlock}>
                            <View
                              style={[
                                styles.headerRankBadge,
                                { backgroundColor: team.accent },
                              ]}
                            >
                              <RNText style={styles.headerRankBadgeText}>
                                {team.position}
                              </RNText>
                            </View>
                            <Text style={styles.headerTeamName}>
                              {team.team}
                            </Text>
                          </View>
                          <RNText style={styles.headerTableValue}>
                            {team.played}
                          </RNText>
                          <RNText style={styles.headerTableValue}>
                            {team.goalDifference}
                          </RNText>
                          <RNText style={styles.headerTableValueAccent}>
                            {team.points}
                          </RNText>
                        </View>
                      ))}
                  </GlassCard>
                ) : null}

                {relatedTopScorers.length ? (
                  <GlassCard style={styles.headerTableCard}>
                    <View style={styles.headerTableHeaderRow}>
                      <Text
                        style={[
                          styles.headerTableHeaderText,
                          styles.headerTeamHeader,
                        ]}
                      >
                        اللاعب
                      </Text>
                      <Text style={styles.headerTableHeaderText}>النادي</Text>
                      <Text style={styles.headerTableHeaderText}>تسديدات</Text>
                      <Text style={styles.headerTableHeaderAccent}>أهداف</Text>
                    </View>

                    {relatedTopScorers.map((player) => (
                      <View key={player.rank} style={styles.headerTableRow}>
                        <View style={styles.headerTeamBlock}>
                          <View
                            style={[
                              styles.headerRankBadge,
                              { backgroundColor: player.accent },
                            ]}
                          >
                            <RNText style={styles.headerRankBadgeText}>
                              {player.rank}
                            </RNText>
                          </View>
                          <Text style={styles.headerTeamName}>
                            {player.player}
                          </Text>
                        </View>
                        <Text style={styles.headerClubName}>{player.club}</Text>
                        <RNText style={styles.headerTableValue}>
                          {player.shotsOnTarget}
                        </RNText>
                        <RNText style={styles.headerTableValueAccent}>
                          {player.goals}
                        </RNText>
                      </View>
                    ))}
                  </GlassCard>
                ) : null}

                <GlassCard style={styles.headerTableCard}>
                  <View style={styles.detailSectionHeader}>
                    <Text style={styles.detailSectionTitle}>
                      أبرز لقطات المواجهة
                    </Text>
                    <Text style={styles.detailSectionHint}>
                      {props.config.hashtag}
                    </Text>
                  </View>

                  {props.config.events.map((event) => (
                    <View key={event.id} style={styles.eventCard}>
                      <View style={styles.eventMinuteBadge}>
                        <Text style={styles.eventMinuteText}>
                          {event.minute}
                        </Text>
                      </View>
                      <View style={styles.eventTextBlock}>
                        <View style={styles.eventTextRow}>
                          <Text
                            style={styles.eventSummaryText}
                            numberOfLines={2}
                          >
                            {`${event.title} · ${event.detail}`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </GlassCard>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

function MatchDetailTabButton(props: {
  accentColor: string;
  accentSurface: string;
  iconName: IoniconName;
  label: string;
  isActive: boolean;
  onPress: () => void;
  compact?: boolean;
  showDivider?: boolean;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.96,
      useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      speed: 22,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      speed: 18,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.matchDetailTabButtonMotion,
        {
          transform: [
            { translateY: props.isActive ? -1 : 0 },
            { scale: pressScale },
          ],
        },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.matchShowcaseFooterTabButton,
          styles.matchDetailTabButton,
          props.compact ? styles.matchDetailTabButtonCompact : null,
          props.isActive ? styles.matchShowcaseFooterTabButtonActive : null,
          props.isActive
            ? [
                styles.matchDetailTabButtonActive,
                { backgroundColor: props.accentSurface },
              ]
            : null,
          pressed ? styles.matchDetailTabButtonPressed : null,
        ]}
        onPress={props.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[
            styles.matchShowcaseFooterTabIconWrap,
            styles.matchDetailTabIconWrap,
          ]}
        >
          <Ionicons
            color={props.isActive ? props.accentColor : "rgba(255,184,92,0.88)"}
            name={props.iconName}
            size={18}
          />
        </View>

        <RNText
          style={[
            styles.matchShowcaseFooterTabText,
            styles.matchDetailTabButtonText,
            props.compact ? styles.matchDetailTabButtonTextCompact : null,
            props.isActive
              ? [
                  styles.matchDetailTabButtonTextActive,
                  { color: props.accentColor },
                ]
              : null,
          ]}
        >
          {props.label}
        </RNText>
      </Pressable>
    </Animated.View>
  );
}

function MatchShowcaseCard(props: {
  config: MatchShowcaseCardConfig;
  kickoffCountdownLabel: string;
  onOpenDetails: () => void;
  pollTweetCardHeight: number;
  pollTweetViewportHeight: number;
  pollTweetMachineStepDistance: number;
}) {
  const [leagueTab, setLeagueTab] = useState<LeagueTab>(null);
  const [lineupTeam, setLineupTeam] = useState<"home" | "away">("home");
  const [isPredictionSaved, setIsPredictionSaved] = useState(false);
  const [selectedVoteTeam, setSelectedVoteTeam] = useState<
    "home" | "away" | null
  >(null);
  const [homePredictionScore, setHomePredictionScore] = useState("");
  const [awayPredictionScore, setAwayPredictionScore] = useState("");
  const [homePredictionScorers, setHomePredictionScorers] = useState<string[]>(
    [],
  );
  const [awayPredictionScorers, setAwayPredictionScorers] = useState<string[]>(
    [],
  );
  const [openScorerPicker, setOpenScorerPicker] = useState<{
    team: "home" | "away";
    slotIndex: number;
  } | null>(null);
  const clickSoundRef = useRef<WebAudioInstance | null>(null);
  const pollTickerProgress = useRef(new Animated.Value(0)).current;
  const rotatingBorderProgress = useRef(new Animated.Value(0)).current;
  const clickSoundUri = useMemo(() => {
    try {
      const resolvedSource = Image.resolveAssetSource(CLICK_SOUND);

      if (resolvedSource?.uri) {
        return resolvedSource.uri;
      }
    } catch {
      // Ignore asset resolution failures on unsupported platforms.
    }

    return typeof CLICK_SOUND === "string" ? CLICK_SOUND : null;
  }, []);

  const loopedLeaguePollTweets = useMemo(
    () => [...props.config.pollTweets, ...props.config.pollTweets],
    [props.config.pollTweets],
  );

  useEffect(() => {
    if (Platform.OS !== "web" || !clickSoundUri) {
      clickSoundRef.current = null;
      return;
    }

    const audioConstructor = (
      globalThis as typeof globalThis & { Audio?: WebAudioConstructor }
    ).Audio;

    if (!audioConstructor) {
      clickSoundRef.current = null;
      return;
    }

    const sound = new audioConstructor(clickSoundUri);
    sound.preload = "auto";
    clickSoundRef.current = sound;

    return () => {
      try {
        sound.pause?.();
      } catch {
        // Ignore teardown failures and keep the UI responsive.
      }

      clickSoundRef.current = null;
    };
  }, [clickSoundUri]);

  useEffect(() => {
    rotatingBorderProgress.setValue(0);

    const borderLoop = Animated.loop(
      Animated.timing(rotatingBorderProgress, {
        toValue: 1,
        duration: 9200,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web",
      }),
      { resetBeforeIteration: true },
    );

    borderLoop.start();

    return () => {
      borderLoop.stop();
      rotatingBorderProgress.stopAnimation();
      rotatingBorderProgress.setValue(0);
    };
  }, [rotatingBorderProgress]);

  useEffect(() => {
    if (leagueTab !== "live" || !props.config.pollTweets.length) {
      pollTickerProgress.stopAnimation();
      pollTickerProgress.setValue(0);
      return;
    }

    pollTickerProgress.setValue(0);

    const stepAnimations: Animated.CompositeAnimation[] = [];

    for (
      let tweetIndex = 0;
      tweetIndex < props.config.pollTweets.length;
      tweetIndex += 1
    ) {
      for (
        let stepIndex = 1;
        stepIndex <= POLL_TWEET_MACHINE_STEPS;
        stepIndex += 1
      ) {
        const nextOffset =
          -(tweetIndex * POLL_TWEET_MACHINE_STEPS + stepIndex) *
          props.pollTweetMachineStepDistance;

        stepAnimations.push(
          Animated.timing(pollTickerProgress, {
            toValue: nextOffset,
            duration: POLL_TWEET_MACHINE_STEP_DURATION,
            easing: Easing.linear,
            useNativeDriver: Platform.OS !== "web",
          }),
        );

        stepAnimations.push(
          Animated.delay(
            stepIndex === POLL_TWEET_MACHINE_STEPS
              ? POLL_TWEET_MACHINE_SETTLE_PAUSE
              : POLL_TWEET_MACHINE_STEP_PAUSE,
          ),
        );
      }
    }

    const animation = Animated.loop(Animated.sequence(stepAnimations), {
      resetBeforeIteration: true,
    });

    animation.start();

    return () => {
      animation.stop();
      pollTickerProgress.stopAnimation();
      pollTickerProgress.setValue(0);
    };
  }, [
    leagueTab,
    pollTickerProgress,
    props.config.pollTweets.length,
    props.pollTweetMachineStepDistance,
  ]);

  const selectedPlayers =
    lineupTeam === "home"
      ? props.config.homeTeam.lineup
      : props.config.awayTeam.lineup;
  const selectedBench =
    lineupTeam === "home"
      ? props.config.homeTeam.bench
      : props.config.awayTeam.bench;
  const selectedTeamLabel =
    lineupTeam === "home"
      ? props.config.homeTeam.title
      : props.config.awayTeam.title;
  const supportTotal =
    props.config.homeTeam.support + props.config.awayTeam.support;
  const homeShare =
    supportTotal === 0 ? 0.5 : props.config.homeTeam.support / supportTotal;
  const awayShare = 1 - homeShare;
  const homePredictionGoalCount = parsePredictionGoalCount(homePredictionScore);
  const awayPredictionGoalCount = parsePredictionGoalCount(awayPredictionScore);
  const rotatingBorderSpin = rotatingBorderProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    setIsPredictionSaved(false);
  }, [
    awayPredictionScore,
    awayPredictionScorers,
    homePredictionScore,
    homePredictionScorers,
  ]);

  useEffect(() => {
    setHomePredictionScorers((currentSelections) =>
      resizePredictionSelections(currentSelections, homePredictionGoalCount),
    );
    setOpenScorerPicker((currentPicker) => {
      if (
        currentPicker?.team === "home" &&
        currentPicker.slotIndex >= homePredictionGoalCount
      ) {
        return null;
      }

      return currentPicker;
    });
  }, [homePredictionGoalCount]);

  useEffect(() => {
    setAwayPredictionScorers((currentSelections) =>
      resizePredictionSelections(currentSelections, awayPredictionGoalCount),
    );
    setOpenScorerPicker((currentPicker) => {
      if (
        currentPicker?.team === "away" &&
        currentPicker.slotIndex >= awayPredictionGoalCount
      ) {
        return null;
      }

      return currentPicker;
    });
  }, [awayPredictionGoalCount]);

  const handleSelectPredictionScorer = (
    team: "home" | "away",
    slotIndex: number,
    playerId: string,
  ) => {
    const updateSelections = (currentSelections: string[]) => {
      const nextSelections = [...currentSelections];
      nextSelections[slotIndex] = playerId;
      return nextSelections;
    };

    if (team === "home") {
      setHomePredictionScorers(updateSelections);
    } else {
      setAwayPredictionScorers(updateSelections);
    }

    setOpenScorerPicker(null);
  };

  const toggleScorerPicker = (team: "home" | "away", slotIndex: number) => {
    setOpenScorerPicker((currentPicker) => {
      if (
        currentPicker?.team === team &&
        currentPicker.slotIndex === slotIndex
      ) {
        return null;
      }

      return { team, slotIndex };
    });
  };

  const toggleLeagueTab = (tab: Exclude<LeagueTab, null>) => {
    setLeagueTab((currentTab) => (currentTab === tab ? null : tab));
  };

  const playCardClickSound = async () => {
    const sound = clickSoundRef.current;

    if (!sound) {
      return;
    }

    try {
      sound.currentTime = 0;

      const playback = sound.play?.();

      if (
        playback &&
        typeof playback === "object" &&
        "catch" in playback &&
        typeof playback.catch === "function"
      ) {
        await playback.catch(() => undefined);
      }
    } catch {
      // Ignore playback failures so button feedback still completes.
    }
  };

  const handleSavePrediction = () => {
    setIsPredictionSaved(true);
    void playCardClickSound();
  };

  const handleVoteTeam = (team: "home" | "away") => {
    setSelectedVoteTeam(team);
    void playCardClickSound();
  };

  return (
    <GlassCard style={styles.matchCard}>
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.42)",
          "rgba(255,255,255,0.20)",
          "rgba(255,255,255,0.08)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.matchShowcaseBorderRing}
      >
        <Animated.View
          {...getNativePointerEventsProps("none")}
          style={[
            styles.matchShowcaseBorderSpinner,
            { transform: [{ rotate: rotatingBorderSpin }] },
            getWebPointerEventsStyle("none"),
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(0,0,0,0)",
              "rgba(0,0,0,0)",
              "rgba(255,255,255,0.96)",
              "rgba(255,255,255,0.96)",
              "rgba(0,0,0,0)",
              "rgba(0,0,0,0)",
              "rgba(0,0,0,0)",
            ]}
            locations={[0, 0.34, 0.45, 0.52, 0.58, 0.68, 1]}
            start={{ x: 0.08, y: 0 }}
            end={{ x: 0.92, y: 1 }}
            style={styles.matchShowcaseBorderSpinnerGradient}
          />
        </Animated.View>

        <View style={styles.matchShowcaseShell}>
          <View style={styles.matchShowcaseHeaderActionsRow}>
            <View style={styles.matchShowcaseLiveBadge}>
              <View style={styles.matchShowcaseLiveDot} />
              <RNText style={styles.matchShowcaseLiveBadgeText}>
                DEMO LIVE
              </RNText>
            </View>

            <View style={styles.matchShowcaseUtilityActions}>
              <Pressable
                onPress={() => {
                  void playCardClickSound();
                }}
                style={styles.matchShowcaseUtilityButton}
              >
                <Ionicons
                  name="share-social-outline"
                  size={15}
                  color="rgba(148,163,184,0.96)"
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  void playCardClickSound();
                }}
                style={styles.matchShowcaseUtilityButton}
              >
                <Ionicons
                  name="notifications-outline"
                  size={15}
                  color="rgba(148,163,184,0.96)"
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={props.onOpenDetails}
            style={styles.matchShowcaseHeroPressable}
          >
            <View style={styles.matchShowcaseContextBlock}>
              <View style={styles.matchShowcaseCompetitionLogoWrap}>
                <Image
                  source={ROSHN_ICON}
                  resizeMode="contain"
                  style={styles.matchShowcaseCompetitionLogo as ImageStyle}
                />
              </View>
            </View>

            <View style={styles.matchShowcaseTeamsRow}>
              <MatchShowcaseHeroTeamPanel
                title={props.config.homeTeam.title}
                shortName={props.config.homeTeam.shortName}
                gradient={props.config.homeTeam.gradient}
                iconSource={props.config.homeTeam.iconSource}
                caption="المضيف"
              />

              <View style={styles.matchShowcaseScoreCenter}>
                <View style={styles.matchShowcaseScoreDigitsRow}>
                  <RNText style={styles.matchShowcaseScoreDigit}>0</RNText>
                  <RNText style={styles.matchShowcaseVersus}>VS</RNText>
                  <RNText style={styles.matchShowcaseScoreDigit}>0</RNText>
                </View>

                <View style={styles.matchShowcaseCountdownBadge}>
                  <RNText style={styles.matchShowcaseCountdownText}>
                    {props.kickoffCountdownLabel}
                  </RNText>
                </View>
              </View>

              <MatchShowcaseHeroTeamPanel
                title={props.config.awayTeam.title}
                shortName={props.config.awayTeam.shortName}
                gradient={props.config.awayTeam.gradient}
                iconSource={props.config.awayTeam.iconSource}
                caption="الضيف"
              />
            </View>
          </Pressable>

          <View style={styles.matchShowcaseFooterTabsRow}>
            <MatchShowcaseFooterTabButton
              label="مباشر الآن"
              isActive={leagueTab === "live"}
              onPress={() => toggleLeagueTab("live")}
              showDivider
              accentColor="#FF6677"
              accentSurface="rgba(255,82,112,0.16)"
              icon={
                <Image
                  source={LIVE_STREAM_ICON}
                  resizeMode="contain"
                  style={styles.matchShowcaseFooterAssetIcon as ImageStyle}
                />
              }
            />
            <MatchShowcaseFooterTabButton
              label="التوقعات"
              isActive={leagueTab === "predictions"}
              onPress={() => toggleLeagueTab("predictions")}
              showDivider
              accentColor="#FFDE97"
              accentSurface="rgba(255,214,126,0.14)"
              icon={
                <Image
                  source={PREVENTION_ICON}
                  resizeMode="contain"
                  style={[
                    styles.matchShowcaseFooterAssetIcon as ImageStyle,
                    styles.matchShowcaseFooterAssetIconLarge as ImageStyle,
                    styles.matchShowcaseFooterPredictionIcon as ImageStyle,
                  ]}
                />
              }
            />
            <MatchShowcaseFooterTabButton
              label="الأحداث"
              isActive={leagueTab === "events"}
              onPress={() => toggleLeagueTab("events")}
              accentColor="#63C6FF"
              accentSurface="rgba(99,198,255,0.14)"
              icon={
                <Image
                  source={SMARTPHONE_ICON}
                  resizeMode="contain"
                  style={[
                    styles.matchShowcaseFooterAssetIcon as ImageStyle,
                    styles.matchShowcaseFooterAssetIconLarge as ImageStyle,
                  ]}
                />
              }
            />
          </View>

          {leagueTab === "events" ? (
            <View>
              {props.config.events.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventMinuteBadge}>
                    <Text style={styles.eventMinuteText}>{event.minute}</Text>
                  </View>
                  <View style={styles.eventTextBlock}>
                    <View style={styles.eventTextRow}>
                      <Text style={styles.eventSummaryText} numberOfLines={1}>
                        {`${event.title} · ${event.detail}`}
                      </Text>
                      <Text style={styles.eventMoreText}>المزيد</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {leagueTab === "lineup" ? (
            <View>
              <View style={styles.lineupSwitchRow}>
                <ModeSwitchButton
                  label={props.config.homeTeam.title}
                  isActive={lineupTeam === "home"}
                  onPress={() => setLineupTeam("home")}
                />
                <ModeSwitchButton
                  label={props.config.awayTeam.title}
                  isActive={lineupTeam === "away"}
                  onPress={() => setLineupTeam("away")}
                />
              </View>

              <View style={styles.lineupSummaryCard}>
                <Text style={styles.lineupSummaryTitle}>
                  {selectedTeamLabel}
                </Text>
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
                      <Text style={styles.benchPillNumber}>
                        #{player.number}
                      </Text>
                      <Text style={styles.benchPillName}>{player.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {leagueTab === "predictions" ? (
            <View>
              <View style={styles.predictionsBoard}>
                <View style={styles.predictionsTitleRow}>
                  <RNText style={styles.predictionsTitleText}>التوقع</RNText>
                </View>

                <View style={styles.predictionsScoreRow}>
                  <PredictionScoreColumn
                    side="left"
                    onChangeScore={(nextValue) =>
                      setHomePredictionScore(sanitizePredictionValue(nextValue))
                    }
                    scoreValue={homePredictionScore}
                    teamLabel={props.config.homeTeam.title}
                  />

                  <RNText style={styles.predictionsVsText}>VS</RNText>

                  <PredictionScoreColumn
                    side="right"
                    onChangeScore={(nextValue) =>
                      setAwayPredictionScore(sanitizePredictionValue(nextValue))
                    }
                    scoreValue={awayPredictionScore}
                    teamLabel={props.config.awayTeam.title}
                  />
                </View>

                {homePredictionGoalCount > 0 || awayPredictionGoalCount > 0 ? (
                  <View style={styles.predictionsScorersRow}>
                    <PredictionScorerColumn
                      side="left"
                      iconSource={props.config.homeTeam.iconSource}
                      isMenuOpen={(slotIndex) =>
                        openScorerPicker?.team === "home" &&
                        openScorerPicker.slotIndex === slotIndex
                      }
                      onSelectScorer={(slotIndex, playerId) =>
                        handleSelectPredictionScorer(
                          "home",
                          slotIndex,
                          playerId,
                        )
                      }
                      onTogglePicker={(slotIndex) =>
                        toggleScorerPicker("home", slotIndex)
                      }
                      players={props.config.homeTeam.lineup}
                      scorerIds={homePredictionScorers}
                      teamGradient={props.config.homeTeam.gradient}
                      teamLabel={props.config.homeTeam.title}
                      teamShortName={props.config.homeTeam.shortName}
                    />

                    <PredictionScorerColumn
                      side="right"
                      iconSource={props.config.awayTeam.iconSource}
                      isMenuOpen={(slotIndex) =>
                        openScorerPicker?.team === "away" &&
                        openScorerPicker.slotIndex === slotIndex
                      }
                      onSelectScorer={(slotIndex, playerId) =>
                        handleSelectPredictionScorer(
                          "away",
                          slotIndex,
                          playerId,
                        )
                      }
                      onTogglePicker={(slotIndex) =>
                        toggleScorerPicker("away", slotIndex)
                      }
                      players={props.config.awayTeam.lineup}
                      scorerIds={awayPredictionScorers}
                      teamGradient={props.config.awayTeam.gradient}
                      teamLabel={props.config.awayTeam.title}
                      teamShortName={props.config.awayTeam.shortName}
                    />
                  </View>
                ) : null}
              </View>

              <View style={styles.pollVotePanel}>
                <PollVoteRow
                  isSelected={selectedVoteTeam === "home"}
                  onPress={() => handleVoteTeam("home")}
                  teamLabel={props.config.homeTeam.title}
                  votes={props.config.homeTeam.support}
                  percentage={Math.round(homeShare * 100)}
                />
                <View style={styles.pollVoteDivider} />
                <PollVoteRow
                  isSelected={selectedVoteTeam === "away"}
                  onPress={() => handleVoteTeam("away")}
                  teamLabel={props.config.awayTeam.title}
                  votes={props.config.awayTeam.support}
                  percentage={Math.round(awayShare * 100)}
                />
              </View>

              <Pressable
                onPress={handleSavePrediction}
                style={[
                  styles.predictionsSaveButton,
                  isPredictionSaved ? styles.predictionsSaveButtonSaved : null,
                ]}
              >
                <View style={styles.actionButtonContent}>
                  <RNText style={styles.predictionsSaveButtonText}>
                    حفظ التوقع
                  </RNText>
                  {isPredictionSaved ? (
                    <Ionicons
                      color="#111111"
                      name="checkmark"
                      size={14}
                      style={styles.actionButtonSuccessIcon}
                    />
                  ) : null}
                </View>
              </Pressable>
            </View>
          ) : null}

          {leagueTab === "live" ? (
            <View>
              <View style={styles.pollTweetSection}>
                <View style={styles.pollTweetSectionHeader}>
                  <View style={styles.pollTweetSectionTitleRow}>
                    <View style={styles.pollTweetSectionLiveDot} />
                    <Text style={styles.pollTweetSectionKicker}>
                      مباشر الان
                    </Text>
                  </View>
                  <Text style={styles.pollTweetSectionHint}>
                    {props.config.hashtag}
                  </Text>
                </View>

                <View
                  style={[
                    styles.pollTweetViewport,
                    { height: props.pollTweetViewportHeight },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.pollTweetTrack,
                      {
                        transform: [{ translateY: pollTickerProgress }],
                      },
                    ]}
                  >
                    {loopedLeaguePollTweets.map((tweet, index) => (
                      <PollTweetCard
                        key={`${props.config.id}-${tweet.id}-${index}`}
                        cardHeight={props.pollTweetCardHeight}
                        tweet={tweet}
                      />
                    ))}
                  </Animated.View>

                  <LinearGradient
                    {...getNativePointerEventsProps("none")}
                    colors={["#05070D", "rgba(5,7,13,0.92)", "rgba(5,7,13,0)"]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={[
                      styles.pollTweetFadeTop,
                      getWebPointerEventsStyle("none"),
                    ]}
                  />

                  <LinearGradient
                    {...getNativePointerEventsProps("none")}
                    colors={["rgba(5,7,13,0)", "rgba(5,7,13,0.92)", "#05070D"]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={[
                      styles.pollTweetFadeBottom,
                      getWebPointerEventsStyle("none"),
                    ]}
                  />
                </View>
              </View>

              <View style={styles.pollCommentComposer}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={16}
                  color="rgba(255,255,255,0.58)"
                />
                <Text style={styles.pollCommentComposerText}>
                  اكتب تعليقًا سريعًا...
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </GlassCard>
  );
}

function PollVoteRow(props: {
  teamLabel: string;
  votes: number;
  percentage: number;
  isSelected?: boolean;
  onPress?: () => void;
}) {
  return (
    <View style={styles.pollVoteRow}>
      <View style={styles.pollVoteTeamBlock}>
        <RNText style={styles.pollVoteTeamLabel}>{props.teamLabel}</RNText>
      </View>

      <View style={styles.pollVoteMetricsWrap}>
        <View style={styles.pollVoteMetricGroup}>
          <RNText style={styles.pollVoteMetricLabel}>نسبة</RNText>
          <RNText style={styles.pollVoteMetricValue}>
            {`${props.percentage} %`}
          </RNText>
        </View>

        <Pressable
          onPress={props.onPress}
          style={[
            styles.pollVoteButton,
            props.isSelected ? styles.actionButtonSuccess : null,
          ]}
        >
          <View style={styles.actionButtonContent}>
            <RNText
              style={[
                styles.pollVoteButtonText,
                props.isSelected ? styles.actionButtonSuccessText : null,
              ]}
            >
              صوّت
            </RNText>
            {props.isSelected ? (
              <Ionicons
                color={ACTION_SUCCESS_FOREGROUND}
                name="checkmark"
                size={14}
                style={styles.actionButtonSuccessIcon}
              />
            ) : null}
          </View>
        </Pressable>

        <View style={styles.pollVoteMetricGroup}>
          <RNText style={styles.pollVoteMetricLabel}>الجمهور</RNText>
          <RNText style={styles.pollVoteMetricValue}>
            {props.votes.toLocaleString("en-US")}
          </RNText>
        </View>
      </View>
    </View>
  );
}

function PredictionScoreColumn(props: {
  side: "left" | "right";
  teamLabel: string;
  scoreValue: string;
  onChangeScore: (value: string) => void;
}) {
  const isLeftSide = props.side === "left";

  return (
    <View style={styles.predictionsScoreColumn}>
      <View
        style={[
          styles.predictionsScoreInlineRow,
          isLeftSide
            ? styles.predictionsScoreInlineRowLeft
            : styles.predictionsScoreInlineRowRight,
        ]}
      >
        {isLeftSide ? (
          <>
            <RNText style={styles.predictionsTeamSideText}>
              {props.teamLabel}
            </RNText>
            <View style={styles.predictionsScoreFieldWrap}>
              <TextInput
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={props.onChangeScore}
                placeholder=""
                placeholderTextColor="rgba(255,255,255,0.45)"
                style={styles.predictionsScoreInput}
                value={props.scoreValue}
              />
            </View>
            <RNText style={styles.predictionsResultText}>النتيجة</RNText>
          </>
        ) : (
          <>
            <RNText style={styles.predictionsResultText}>النتيجة</RNText>
            <View style={styles.predictionsScoreFieldWrap}>
              <TextInput
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={props.onChangeScore}
                placeholder=""
                placeholderTextColor="rgba(255,255,255,0.45)"
                style={styles.predictionsScoreInput}
                value={props.scoreValue}
              />
            </View>
            <RNText style={styles.predictionsTeamSideText}>
              {props.teamLabel}
            </RNText>
          </>
        )}
      </View>
    </View>
  );
}

function PredictionScorerColumn(props: {
  side: "left" | "right";
  teamLabel: string;
  teamShortName: string;
  teamGradient: GradientPair;
  players: TacticalPlayer[];
  scorerIds: string[];
  iconSource?: number;
  onTogglePicker: (slotIndex: number) => void;
  onSelectScorer: (slotIndex: number, playerId: string) => void;
  isMenuOpen: (slotIndex: number) => boolean;
}) {
  const isLeftSide = props.side === "left";

  if (props.scorerIds.length === 0) {
    return <View style={styles.predictionsScorerColumnHidden} />;
  }

  return (
    <View style={styles.predictionsScorerColumn}>
      <View
        style={[
          styles.predictionsScorerMetaRow,
          isLeftSide
            ? styles.predictionsScorerMetaRowLeft
            : styles.predictionsScorerMetaRowRight,
        ]}
      >
        <RNText style={styles.predictionsScorerMetaLabel}>الهداف</RNText>
      </View>

      <View style={styles.predictionsScorersCell}>
        {props.scorerIds.map((_, slotIndex) => (
          <View
            key={`${props.teamLabel}-${slotIndex}`}
            style={styles.predictionsScorerSlotWrap}
          >
            <PredictionScorerPicker
              iconSource={props.iconSource}
              isOpen={props.isMenuOpen(slotIndex)}
              onSelect={(selectedPlayerId) =>
                props.onSelectScorer(slotIndex, selectedPlayerId)
              }
              onToggle={() => props.onTogglePicker(slotIndex)}
              placeholderText="اختر الهداف"
              playerId={props.scorerIds[slotIndex] ?? ""}
              players={props.players}
              slotIndex={slotIndex}
              teamGradient={props.teamGradient}
              teamShortName={props.teamShortName}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function PredictionScorerPicker(props: {
  placeholderText: string;
  teamShortName: string;
  teamGradient: GradientPair;
  players: TacticalPlayer[];
  playerId: string;
  slotIndex: number;
  isOpen: boolean;
  iconSource?: number;
  onToggle: () => void;
  onSelect: (playerId: string) => void;
}) {
  const selectedPlayer = props.players.find(
    (player) => player.id === props.playerId,
  );

  return (
    <View
      style={[
        styles.predictionsPickerWrap,
        props.isOpen ? styles.predictionsPickerWrapOpen : null,
      ]}
    >
      {props.isOpen ? (
        <View style={styles.predictionsPickerMenu}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.predictionsPickerMenuScroll}
          >
            {props.players.map((player) => (
              <Pressable
                key={player.id}
                onPress={() => props.onSelect(player.id)}
                style={styles.predictionsPickerOption}
              >
                <PredictionPlayerAvatar
                  gradient={props.teamGradient}
                  iconSource={props.iconSource}
                  shortName={props.teamShortName}
                />
                <RNText style={styles.predictionsPickerOptionText}>
                  {player.name}
                </RNText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Pressable
        onPress={props.onToggle}
        style={styles.predictionsPickerTrigger}
      >
        <PredictionPlayerAvatar
          gradient={props.teamGradient}
          iconSource={props.iconSource}
          shortName={props.teamShortName}
        />
        <RNText
          numberOfLines={1}
          style={[
            styles.predictionsPickerValueText,
            !selectedPlayer ? styles.predictionsPickerValuePlaceholder : null,
          ]}
        >
          {selectedPlayer ? selectedPlayer.name : props.placeholderText}
        </RNText>
      </Pressable>
    </View>
  );
}

function PredictionPlayerAvatar(props: {
  shortName: string;
  gradient: GradientPair;
  iconSource?: number;
}) {
  if (props.iconSource) {
    return (
      <View style={styles.predictionsAvatarFrame}>
        <Image
          source={props.iconSource}
          resizeMode="contain"
          style={styles.predictionsAvatarImage as ImageStyle}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={props.gradient}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.predictionsAvatarFallback}
    >
      <RNText style={styles.predictionsAvatarFallbackText}>
        {props.shortName}
      </RNText>
    </LinearGradient>
  );
}

function GlassCard(props: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.glassCard, props.style]}>{props.children}</View>;
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
  iconSource?: number;
}) {
  return (
    <View style={styles.teamColumn}>
      {props.iconSource ? (
        <View style={styles.teamLogoWrap}>
          <Image
            source={props.iconSource}
            style={styles.teamCircleIcon as ImageStyle}
            resizeMode="contain"
          />
        </View>
      ) : (
        <LinearGradient colors={props.gradient} style={styles.teamCircle}>
          <Text style={styles.teamCircleText}>{props.shortName}</Text>
        </LinearGradient>
      )}
      <Text style={styles.teamColumnTitle}>{props.title}</Text>
    </View>
  );
}

function MatchShowcaseHeroTeamPanel(props: {
  title: string;
  shortName: string;
  gradient: GradientPair;
  iconSource?: number;
  caption: string;
}) {
  return (
    <View style={styles.matchShowcaseTeamPanel}>
      <RNText style={styles.matchShowcaseTeamName}>{props.title}</RNText>

      <View style={styles.matchShowcaseTeamArtWrap}>
        <View
          style={[
            styles.matchShowcaseTeamGlow,
            { backgroundColor: props.gradient[0] },
          ]}
        />

        <LinearGradient
          colors={[`${props.gradient[0]}24`, "rgba(8,14,26,0.96)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.matchShowcaseTeamBadge}
        >
          {props.iconSource ? (
            <Image
              source={props.iconSource}
              resizeMode="contain"
              style={styles.matchShowcaseTeamLogo as ImageStyle}
            />
          ) : (
            <LinearGradient
              colors={props.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.matchShowcaseTeamBadgeFallback}
            >
              <Text style={styles.matchShowcaseTeamBadgeFallbackText}>
                {props.shortName}
              </Text>
            </LinearGradient>
          )}
        </LinearGradient>
      </View>
    </View>
  );
}

function MatchShowcaseFooterTabButton(props: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  icon: ReactNode;
  accentColor: string;
  accentSurface: string;
  showDivider?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.matchShowcaseFooterTabButton,
        props.showDivider ? styles.matchShowcaseFooterTabButtonDivider : null,
        props.isActive ? styles.matchShowcaseFooterTabButtonActive : null,
      ]}
      onPress={props.onPress}
    >
      <View style={styles.matchShowcaseFooterTabIconWrap}>{props.icon}</View>

      <RNText
        style={[
          styles.matchShowcaseFooterTabText,
          props.isActive ? { color: props.accentColor } : null,
        ]}
      >
        {props.label}
      </RNText>
    </Pressable>
  );
}

function LeagueModeButton(props: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  showStatusDot?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.leagueTabButton,
        props.isActive ? styles.leagueTabButtonActive : null,
      ]}
      onPress={props.onPress}
    >
      <View style={styles.leagueTabButtonContent}>
        {props.showStatusDot ? (
          <View style={styles.leagueTabButtonLiveDot} />
        ) : null}
        <Text
          style={[
            styles.leagueTabButtonText,
            props.isActive ? styles.leagueTabButtonTextActive : null,
          ]}
        >
          {props.label}
        </Text>
      </View>
    </Pressable>
  );
}

function PollTweetCard(props: { tweet: LeaguePollTweet; cardHeight: number }) {
  return (
    <View style={[styles.pollTweetCard, { height: props.cardHeight }]}>
      <View style={styles.pollTweetCardHeader}>
        <LinearGradient
          colors={props.tweet.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pollTweetAvatar}
        >
          <RNText style={styles.pollTweetAvatarText}>
            {props.tweet.avatarLabel}
          </RNText>
        </LinearGradient>

        <View style={styles.pollTweetMetaBlock}>
          <View style={styles.pollTweetIdentityRow}>
            <RNText style={styles.pollTweetAuthor}>{props.tweet.author}</RNText>
            <RNText style={styles.pollTweetHandle}>{props.tweet.handle}</RNText>
            <RNText style={styles.pollTweetTimeLabel}>
              {props.tweet.timeLabel}
            </RNText>
          </View>
          {props.tweet.replyTo ? (
            <RNText style={styles.pollTweetReplyLine}>
              ردًا على {props.tweet.replyTo}
            </RNText>
          ) : null}
        </View>

        <Ionicons
          name="ellipsis-horizontal"
          size={16}
          color="rgba(255,255,255,0.34)"
        />
      </View>

      <RNText style={styles.pollTweetQuote} numberOfLines={3}>
        {props.tweet.body}
      </RNText>

      <View style={styles.pollTweetActionsRow}>
        <View style={styles.pollTweetActionItem}>
          <Ionicons
            name="chatbubble-outline"
            size={17}
            color="rgba(255,255,255,0.44)"
          />
          <RNText style={styles.pollTweetActionCount}>
            {props.tweet.replies}
          </RNText>
        </View>

        <View style={styles.pollTweetActionItem}>
          <Ionicons
            name="repeat-outline"
            size={18}
            color="rgba(255,255,255,0.44)"
          />
          <RNText style={styles.pollTweetActionCount}>
            {props.tweet.reposts}
          </RNText>
        </View>

        <View style={styles.pollTweetActionItem}>
          <Ionicons
            name="heart-outline"
            size={17}
            color="rgba(255,255,255,0.44)"
          />
          <RNText style={styles.pollTweetActionCount}>
            {props.tweet.likes}
          </RNText>
        </View>

        <View style={styles.pollTweetActionItem}>
          <Ionicons
            name="stats-chart-outline"
            size={17}
            color="rgba(255,255,255,0.44)"
          />
          <RNText style={styles.pollTweetActionCount}>
            {props.tweet.views}
          </RNText>
        </View>

        <View style={styles.pollTweetActionIconOnly}>
          <Ionicons
            name="bookmark-outline"
            size={17}
            color="rgba(255,255,255,0.44)"
          />
        </View>

        <View style={styles.pollTweetActionIconOnly}>
          <Ionicons
            name="share-social-outline"
            size={17}
            color="rgba(255,255,255,0.44)"
          />
        </View>
      </View>
    </View>
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

function LineupShowcaseStage(props: {
  homeTeam: MatchShowcaseTeam;
  awayTeam: MatchShowcaseTeam;
  kickoffAt: Date;
  players: TacticalPlayer[];
  benchPlayers: BenchPlayer[];
  selectedTeamLabel: string;
  selectedTeamShortName: string;
  selectedTeamGradient: GradientPair;
  onEditorModeChange?: (isActive: boolean) => void;
}) {
  const { width } = useWindowDimensions();
  const stageHeight = width < 390 ? 560 : 620;
  const normalizedPlayers = normalizeShowcaseLineupPlayers(props.players);
  const formationLabel = buildFormationLabel(props.players);
  const kickoffDateLabel = formatLineupKickoffDate(props.kickoffAt);
  const featurePulse = useRef(new Animated.Value(0)).current;
  const fieldLayerRef = useRef<View | null>(null);
  const [isVarEditorActive, setIsVarEditorActive] = useState(false);
  const [editorPlayers, setEditorPlayers] =
    useState<ShowcaseLineupPlayer[]>(normalizedPlayers);
  const [editorBenchPlayers, setEditorBenchPlayers] = useState<
    ShowcaseBenchPlayer[]
  >(() =>
    buildBenchShowcasePlayers(props.benchPlayers, props.selectedTeamGradient),
  );
  const [fieldLayerSize, setFieldLayerSize] = useState({
    width: 1,
    height: 1,
  });
  const [fieldLayerFrame, setFieldLayerFrame] = useState<FieldLayerFrame>({
    pageX: 0,
    pageY: 0,
    width: 1,
    height: 1,
  });

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(featurePulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(featurePulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [featurePulse]);

  useEffect(() => {
    setEditorPlayers(normalizeShowcaseLineupPlayers(props.players));
    setEditorBenchPlayers(
      buildBenchShowcasePlayers(props.benchPlayers, props.selectedTeamGradient),
    );
    setIsVarEditorActive(false);
    props.onEditorModeChange?.(false);
  }, [
    props.benchPlayers,
    props.onEditorModeChange,
    props.players,
    props.selectedTeamGradient,
  ]);

  const refreshFieldLayerFrame = useMemo(
    () => () => {
      requestAnimationFrame(() => {
        fieldLayerRef.current?.measureInWindow(
          (pageX, pageY, frameWidth, frameHeight) => {
            if (frameWidth > 0 && frameHeight > 0) {
              setFieldLayerFrame({
                pageX,
                pageY,
                width: frameWidth,
                height: frameHeight,
              });
            }
          },
        );
      });
    },
    [],
  );

  useEffect(() => {
    if (isVarEditorActive) {
      refreshFieldLayerFrame();
    }
  }, [isVarEditorActive, refreshFieldLayerFrame, width]);

  const featureIconScale = featurePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const featureGlowOpacity = featurePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.28],
  });
  const featureArrowShift = featurePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const displayedPlayers = editorPlayers;
  const displayedBenchPlayers = editorBenchPlayers;
  const displayedFormationLabel =
    buildFormationLabelFromDisplayPlayers(editorPlayers);
  const varEditorHintText =
    "اسحب أي لاعب داخل الملعب بحرية، واسحب أي بديل من الدكة ثم أفلته فوق الملعب ليأخذ مكانه مباشرة.";

  function handleToggleVarEditor() {
    setIsVarEditorActive((currentValue) => {
      const nextValue = !currentValue;
      props.onEditorModeChange?.(nextValue);
      return nextValue;
    });
  }

  function handleResetVarEditor() {
    setEditorPlayers(normalizeShowcaseLineupPlayers(props.players));
    setEditorBenchPlayers(
      buildBenchShowcasePlayers(props.benchPlayers, props.selectedTeamGradient),
    );
    refreshFieldLayerFrame();
  }

  function handleConfirmVarEditor() {
    setIsVarEditorActive(false);
    props.onEditorModeChange?.(false);
  }

  function handleFieldPlayerDrag(
    playerId: string,
    nextX: number,
    nextDisplayY: number,
  ) {
    setEditorPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === playerId
          ? {
              ...player,
              x: nextX,
              y: nextDisplayY,
              displayY: nextDisplayY,
            }
          : player,
      ),
    );
  }

  function handleBenchPlayerDrop(
    player: ShowcaseBenchPlayer,
    moveX: number,
    moveY: number,
  ) {
    const dropPosition = resolveFieldDropPosition(
      moveX,
      moveY,
      fieldLayerFrame,
    );

    if (!dropPosition) {
      return false;
    }

    setEditorBenchPlayers((currentPlayers) =>
      currentPlayers.filter((currentPlayer) => currentPlayer.id !== player.id),
    );
    setEditorPlayers((currentPlayers) => [
      ...currentPlayers.filter(
        (currentPlayer) => currentPlayer.id !== player.id,
      ),
      {
        ...player,
        x: dropPosition.x,
        y: dropPosition.displayY,
        displayY: dropPosition.displayY,
      },
    ]);

    return true;
  }

  return (
    <View>
      <View style={styles.lineupStageShell}>
        <View style={styles.lineupStageHeader}>
          <View
            style={[
              styles.lineupStageHeaderGlow,
              styles.lineupStageHeaderGlowLeft,
              { backgroundColor: props.awayTeam.gradient[0] },
            ]}
          />
          <View
            style={[
              styles.lineupStageHeaderGlow,
              styles.lineupStageHeaderGlowRight,
              { backgroundColor: props.homeTeam.gradient[0] },
            ]}
          />

          <View style={styles.lineupStageBrandWrap}>
            <Image
              source={VAR_WORDMARK_ICON}
              resizeMode="contain"
              style={styles.lineupStageBrandImage as ImageStyle}
            />
          </View>

          <View style={styles.lineupStageHeaderRow}>
            <LineupTeamBadge
              gradient={props.awayTeam.gradient}
              iconSource={props.awayTeam.iconSource}
              shortName={props.awayTeam.shortName}
            />

            <View style={styles.lineupStageHeaderCenter}>
              <RNText style={styles.lineupStageKickoffText}>
                {kickoffDateLabel}
              </RNText>
              <Text style={styles.lineupStageHeadline}>
                {`تشكيلة ${props.selectedTeamLabel} المتوقعة`}
              </Text>
            </View>

            <LineupTeamBadge
              gradient={props.homeTeam.gradient}
              iconSource={props.homeTeam.iconSource}
              shortName={props.homeTeam.shortName}
            />
          </View>
        </View>

        <View style={[styles.lineupStageFieldWrap, { height: stageHeight }]}>
          <View style={styles.lineupStageFeatureTabWrap}>
            <Pressable
              onPress={handleToggleVarEditor}
              style={({ pressed }) => [
                styles.lineupStageFeatureTabPressable,
                pressed ? styles.lineupStageFeatureTabPressableActive : null,
              ]}
            >
              {({ pressed }) => {
                const isFeatureTabActive = pressed || isVarEditorActive;

                return (
                  <LinearGradient
                    colors={
                      isFeatureTabActive
                        ? ["rgba(245,251,255,1)", "rgba(133,208,255,0.98)"]
                        : ["rgba(255,255,255,0.84)", "rgba(127,168,255,0.78)"]
                    }
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[
                      styles.lineupStageFeatureTabBorder,
                      isFeatureTabActive
                        ? styles.lineupStageFeatureTabBorderActive
                        : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.lineupStageFeatureTabInner,
                        isFeatureTabActive
                          ? styles.lineupStageFeatureTabInnerActive
                          : null,
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.lineupStageFeatureTabIconHalo,
                          {
                            opacity: featureGlowOpacity,
                            transform: [{ scale: featureIconScale }],
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.lineupStageFeatureTabIconWrap,
                          isFeatureTabActive
                            ? styles.lineupStageFeatureTabIconWrapActive
                            : null,
                          { transform: [{ scale: featureIconScale }] },
                        ]}
                      >
                        <Ionicons
                          name={isVarEditorActive ? "scan-outline" : "sparkles"}
                          size={14}
                          color={isFeatureTabActive ? "#07151D" : "#EAF6FF"}
                        />
                      </Animated.View>
                      <RNText
                        style={[
                          styles.lineupStageFeatureTabText,
                          isFeatureTabActive
                            ? styles.lineupStageFeatureTabTextActive
                            : null,
                        ]}
                      >
                        تشكيل VAR
                      </RNText>
                      <Animated.View
                        style={{
                          transform: [{ translateX: featureArrowShift }],
                        }}
                      >
                        <Ionicons
                          name={
                            isVarEditorActive ? "close-outline" : "chevron-back"
                          }
                          size={16}
                          color={
                            isFeatureTabActive
                              ? "#FFFFFF"
                              : "rgba(255,255,255,0.9)"
                          }
                        />
                      </Animated.View>
                    </View>
                  </LinearGradient>
                );
              }}
            </Pressable>
          </View>

          <View style={styles.lineupStageFieldShadow} />

          <View style={styles.lineupStageFieldPlane}>
            <LinearGradient
              colors={["#3F9B56", "#318C48", "#256E39"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.lineupStageFieldSurface}
            >
              <View style={styles.lineupStageTouchline} />
              <View style={styles.lineupStageHalfwayLine} />
              <View style={styles.lineupStageCenterCircle} />
              <View style={styles.lineupStageCenterMark} />
              <View style={styles.lineupStageTopBox} />
              <View style={styles.lineupStageBottomBox} />
              <View style={styles.lineupStageTopGoalArea} />
              <View style={styles.lineupStageBottomGoalArea} />
            </LinearGradient>
          </View>

          <View
            ref={fieldLayerRef}
            style={styles.lineupStagePlayerLayer}
            onLayout={(event) => {
              setFieldLayerSize({
                width: event.nativeEvent.layout.width,
                height: event.nativeEvent.layout.height,
              });
              refreshFieldLayerFrame();
            }}
          >
            {displayedPlayers.map((player) => (
              <LineupShowcasePlayer
                key={player.id}
                player={player}
                shortName={props.selectedTeamShortName}
                isInteractive={isVarEditorActive}
                fieldSize={fieldLayerSize}
                onDragCommit={(nextX, nextDisplayY) =>
                  handleFieldPlayerDrag(player.id, nextX, nextDisplayY)
                }
              />
            ))}
          </View>

          <View style={styles.lineupStageFormationPill}>
            <RNText style={styles.lineupStageFormationText}>
              {displayedFormationLabel}
            </RNText>
          </View>

          <View style={styles.lineupStageWatermarkWrap}>
            <Image
              source={VAR_WORDMARK_ICON}
              resizeMode="contain"
              style={styles.lineupStageWatermarkImage as ImageStyle}
            />
          </View>
        </View>

        <View style={styles.lineupVarEditorPanel}>
          {isVarEditorActive ? (
            <View style={styles.lineupVarEditorTopRow}>
              <View style={styles.lineupVarEditorActionsRow}>
                <Pressable
                  onPress={handleResetVarEditor}
                  style={styles.lineupVarEditorActionButton}
                >
                  <Text style={styles.lineupVarEditorActionText}>
                    إعادة الضبط
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmVarEditor}
                  style={[
                    styles.lineupVarEditorActionButton,
                    styles.lineupVarEditorActionButtonPrimary,
                  ]}
                >
                  <Text
                    style={[
                      styles.lineupVarEditorActionText,
                      styles.lineupVarEditorActionTextPrimary,
                    ]}
                  >
                    تثبيت التعديل
                  </Text>
                </Pressable>
              </View>

              <View style={styles.lineupVarEditorCopyWrap}>
                <Text style={styles.lineupVarEditorTitle}>دكة بدلاء VAR</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.lineupVarBenchTitle}>دكة البدلاء</Text>
          )}

          {displayedBenchPlayers.length ? (
            <View style={styles.lineupVarBenchRow}>
              {displayedBenchPlayers.map((player) => (
                <LineupBenchPlayerToken
                  key={player.id}
                  player={player}
                  shortName={props.selectedTeamShortName}
                  isInteractive={isVarEditorActive}
                  onDragStart={refreshFieldLayerFrame}
                  onDropToField={(moveX, moveY) =>
                    handleBenchPlayerDrop(player, moveX, moveY)
                  }
                />
              ))}
            </View>
          ) : (
            <Text style={styles.lineupVarBenchEmpty}>
              كل البدلاء موجودون على أرضية الملعب الآن.
            </Text>
          )}

          {isVarEditorActive ? (
            <View style={styles.lineupVarEditorHintWrap}>
              <Text style={styles.lineupVarEditorHint}>
                {varEditorHintText}
              </Text>
              <Text style={styles.lineupVarEditorHintSecondary}>
                المس نفس الأيقونة واسحبها مباشرة، وتم تشديد حساسية اللمس ليلتقط
                السحب من أول لمسة.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function LineupTeamBadge(props: {
  gradient: GradientPair;
  iconSource?: number;
  shortName: string;
}) {
  if (props.iconSource) {
    return (
      <View style={styles.lineupStageTeamBadgeWrap}>
        <Image
          source={props.iconSource}
          resizeMode="contain"
          style={styles.lineupStageTeamBadgeImage as ImageStyle}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={props.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.lineupStageTeamFallback}
    >
      <RNText style={styles.lineupStageTeamFallbackText}>
        {props.shortName}
      </RNText>
    </LinearGradient>
  );
}

function LineupShowcasePlayer(props: {
  player: ShowcaseLineupPlayer;
  shortName: string;
  isInteractive?: boolean;
  fieldSize: { width: number; height: number };
  onDragCommit?: (nextX: number, nextDisplayY: number) => void;
}) {
  const dragOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragLift = useRef(new Animated.Value(0)).current;
  const dragScale = dragLift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  useEffect(() => {
    dragOffset.setValue({ x: 0, y: 0 });
    dragLift.setValue(0);
  }, [
    dragLift,
    dragOffset,
    props.player.displayY,
    props.player.id,
    props.player.x,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => Boolean(props.isInteractive),
        onStartShouldSetPanResponderCapture: () => Boolean(props.isInteractive),
        onMoveShouldSetPanResponder: () => Boolean(props.isInteractive),
        onMoveShouldSetPanResponderCapture: () => Boolean(props.isInteractive),
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          Animated.spring(dragLift, {
            toValue: 1,
            speed: 18,
            bounciness: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderMove: Animated.event(
          [null, { dx: dragOffset.x, dy: dragOffset.y }],
          { useNativeDriver: false },
        ),
        onPanResponderRelease: (_, gestureState) => {
          Animated.spring(dragLift, {
            toValue: 0,
            speed: 18,
            bounciness: 0,
            useNativeDriver: true,
          }).start();

          Animated.spring(dragOffset, {
            toValue: { x: 0, y: 0 },
            speed: 20,
            bounciness: 0,
            useNativeDriver: false,
          }).start();

          if (!props.isInteractive) {
            return;
          }

          props.onDragCommit?.(
            clampLineupCoordinate(
              props.player.x +
                gestureState.dx / Math.max(props.fieldSize.width, 1),
              0.08,
              0.92,
            ),
            clampLineupCoordinate(
              props.player.displayY +
                gestureState.dy / Math.max(props.fieldSize.height, 1),
              0.06,
              0.94,
            ),
          );
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragLift, {
            toValue: 0,
            speed: 18,
            bounciness: 0,
            useNativeDriver: true,
          }).start();

          Animated.spring(dragOffset, {
            toValue: { x: 0, y: 0 },
            speed: 20,
            bounciness: 0,
            useNativeDriver: false,
          }).start();
        },
      }),
    [
      dragLift,
      dragOffset,
      props.fieldSize.height,
      props.fieldSize.width,
      props.isInteractive,
      props.onDragCommit,
      props.player.displayY,
      props.player.x,
    ],
  );

  return (
    <Animated.View
      style={[
        styles.lineupPlayerMarker,
        {
          left: `${props.player.x * 100}%`,
          top: `${props.player.displayY * 100}%`,
          transform: [
            { translateX: -34 },
            { translateY: -28 },
            { translateX: dragOffset.x },
            { translateY: dragOffset.y },
            { scale: dragScale },
          ],
        },
      ]}
      {...(props.isInteractive ? panResponder.panHandlers : {})}
    >
      <View style={styles.lineupPlayerPressable}>
        <View style={styles.lineupPlayerAvatarShell}>
          <LinearGradient
            colors={props.player.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.lineupPlayerAvatarCore}
          >
            <View style={styles.lineupPlayerAvatarHead} />
            <View style={styles.lineupPlayerAvatarBody} />
          </LinearGradient>
        </View>

        <View style={styles.lineupPlayerNumberBadge}>
          <RNText style={styles.lineupPlayerNumberText}>
            {props.player.number}
          </RNText>
        </View>

        <View style={styles.lineupPlayerTeamBadge}>
          <RNText style={styles.lineupPlayerTeamBadgeText}>
            {props.shortName}
          </RNText>
        </View>

        <Text numberOfLines={1} style={styles.lineupPlayerName}>
          {props.player.name}
        </Text>
      </View>
    </Animated.View>
  );
}

function LineupBenchPlayerToken(props: {
  player: ShowcaseBenchPlayer;
  shortName: string;
  isInteractive: boolean;
  onDragStart?: () => void;
  onDropToField: (moveX: number, moveY: number) => boolean;
}) {
  const dragOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragLift = useRef(new Animated.Value(0)).current;
  const dragScale = dragLift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  useEffect(() => {
    dragOffset.setValue({ x: 0, y: 0 });
    dragLift.setValue(0);
  }, [dragLift, dragOffset, props.player.id]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => props.isInteractive,
        onStartShouldSetPanResponderCapture: () => props.isInteractive,
        onMoveShouldSetPanResponder: () => props.isInteractive,
        onMoveShouldSetPanResponderCapture: () => props.isInteractive,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          props.onDragStart?.();
          Animated.spring(dragLift, {
            toValue: 1,
            speed: 18,
            bounciness: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderMove: Animated.event(
          [null, { dx: dragOffset.x, dy: dragOffset.y }],
          { useNativeDriver: false },
        ),
        onPanResponderRelease: (_, gestureState) => {
          const didDropIntoField = props.onDropToField(
            gestureState.moveX,
            gestureState.moveY,
          );

          Animated.spring(dragLift, {
            toValue: 0,
            speed: 18,
            bounciness: 0,
            useNativeDriver: true,
          }).start();

          if (didDropIntoField) {
            return;
          }

          Animated.spring(dragOffset, {
            toValue: { x: 0, y: 0 },
            speed: 20,
            bounciness: 0,
            useNativeDriver: false,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragLift, {
            toValue: 0,
            speed: 18,
            bounciness: 0,
            useNativeDriver: true,
          }).start();

          Animated.spring(dragOffset, {
            toValue: { x: 0, y: 0 },
            speed: 20,
            bounciness: 0,
            useNativeDriver: false,
          }).start();
        },
      }),
    [
      dragLift,
      dragOffset,
      props.isInteractive,
      props.onDragStart,
      props.onDropToField,
    ],
  );

  return (
    <Animated.View
      style={styles.lineupVarBenchToken}
      {...(props.isInteractive ? panResponder.panHandlers : {})}
    >
      <Animated.View
        style={{
          transform: [
            { translateX: dragOffset.x },
            { translateY: dragOffset.y },
            { scale: dragScale },
          ],
        }}
      >
        <View style={styles.lineupVarBenchAvatarShell}>
          <LinearGradient
            colors={props.player.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.lineupVarBenchAvatarCore}
          >
            <View style={styles.lineupVarBenchAvatarHead} />
            <View style={styles.lineupVarBenchAvatarBody} />
          </LinearGradient>
        </View>

        <View style={styles.lineupVarBenchNumberBadge}>
          <RNText style={styles.lineupVarBenchNumberText}>
            {props.player.number}
          </RNText>
        </View>

        <View style={styles.lineupVarBenchTeamBadge}>
          <RNText style={styles.lineupVarBenchTeamBadgeText}>
            {props.shortName}
          </RNText>
        </View>

        <Text numberOfLines={1} style={styles.lineupVarBenchName}>
          {props.player.name}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = createCompatStyleSheet({
  leagueTopHeader: {
    backgroundColor: "#020202",
    position: "relative",
    zIndex: 3,
  },
  leagueTopHeaderBlend: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 22,
  },
  leagueTopHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 48,
  },
  leagueTopHeaderLogoWrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  leagueTopHeaderLogoImage: {
    backgroundColor: "transparent",
  },
  leagueTopHeaderTabsRow: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    marginLeft: 2,
    marginRight: 0,
  },
  leagueTopHeaderTabGroup: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  leagueTopHeaderTab: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    minHeight: 36,
  },
  leagueTopHeaderTabDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginHorizontal: 6,
    borderRadius: 999,
  },
  leagueTopHeaderTabText: {
    color: "rgba(255,255,255,0.84)",
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.35,
    textShadowColor: "rgba(255,255,255,0.14)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  leagueTopHeaderTabTextActive: {
    color: "#FFFFFF",
  },
  leagueTopHeaderTabUnderline: {
    width: 14,
    height: 2,
    borderRadius: 999,
    backgroundColor: "transparent",
    marginTop: 4,
  },
  leagueTopHeaderTabUnderlineActive: {
    width: 20,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  leagueTopHeaderNotificationButton: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  leagueTopHeaderNotificationBadge: {
    position: "absolute",
    top: 1,
    right: -1,
    backgroundColor: "#E30015",
    borderWidth: 1,
    borderColor: "#020202",
  },
  root: {
    flex: 1,
    backgroundColor: "#05070D",
  },
  leaguesListHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#05070D",
    zIndex: 20,
    elevation: 14,
    position: "relative",
    overflow: "visible",
  },
  leaguesListHeaderRow: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
  },
  leaguesListHeaderSpacer: {
    width: 88,
    height: 34,
  },
  leaguesListHeaderCenterBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  leaguesListVarAnchor: {
    position: "absolute",
    top: 10,
    right: -28,
    width: 312,
    alignItems: "flex-end",
    zIndex: 24,
  },
  leaguesListTitleBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 12,
  },
  leaguesListKicker: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  leaguesListTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 4,
  },
  leaguesListTitleCentered: {
    textAlign: "center",
    marginTop: 1,
    fontSize: 24,
    lineHeight: 28,
  },
  leaguesListLogoWrap: {
    width: 92,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  leaguesListLogoImage: {
    width: 78,
    height: 28,
  },
  leaguesListVarTrigger: {
    width: 104,
    height: 40,
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 14,
    paddingRight: 22,
    backgroundColor: "#F5F5F2",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },
  leaguesListVarTriggerActive: {
    borderWidth: 1,
    borderColor: "rgba(11,13,18,0.08)",
    backgroundColor: "#FFFFFF",
  },
  leaguesListVarTriggerPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  leaguesListVarTriggerImage: {
    width: 70,
    height: 24,
    tintColor: "#0B0D12",
  },
  leaguesListDrawerWrap: {
    width: 286,
    marginTop: 22,
    marginRight: 18,
    zIndex: 26,
    elevation: 16,
  },
  leaguesListDrawerScroll: {
    flexGrow: 0,
  },
  leaguesListDrawerContent: {
    paddingTop: 4,
    paddingBottom: 18,
  },
  leaguesListDrawerItemWrap: {
    marginBottom: 8,
  },
  leaguesListDrawerItem: {
    minHeight: 68,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#071018",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 12,
  },
  leaguesListDrawerItemActive: {
    backgroundColor: "#0B1620",
    borderColor: "rgba(255,255,255,0.18)",
  },
  leaguesListDrawerAccentLine: {
    width: 0,
    alignSelf: "stretch",
    borderRadius: 999,
    marginRight: 0,
  },
  leaguesListDrawerTextBlock: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  leaguesListDrawerTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },
  leaguesListDrawerSummary: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 5,
  },
  leaguesListDrawerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    borderWidth: 1,
  },
  leaguesListDrawerIconImage: {
    width: 30,
    height: 30,
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 128,
  },
  matchDetailOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#05070D",
    zIndex: 12,
  },
  matchPreviewPressable: {
    marginBottom: 0,
  },
  matchPreviewFooter: {
    marginTop: 16,
    alignItems: "center",
  },
  matchPreviewTabsRow: {
    flexDirection: "row-reverse",
    marginTop: 14,
  },
  matchPreviewHintPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,214,126,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  matchPreviewHintText: {
    color: "#FFDE97",
    fontSize: 11,
    fontWeight: "900",
    marginRight: 7,
  },
  matchDetailShell: {
    flex: 1,
    backgroundColor: "#05070D",
    borderRadius: 23,
    overflow: "hidden",
  },
  matchDetailPageBorderRing: {
    flex: 1,
    padding: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#05070D",
  },
  matchDetailPageBorderSpinner: {
    position: "absolute",
    top: -320,
    right: -320,
    bottom: -320,
    left: -320,
    opacity: 0.92,
  },
  matchDetailPageBorderSpinnerGradient: {
    flex: 1,
  },
  matchDetailTopBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  matchDetailTitleBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  matchDetailKicker: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  matchDetailTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
  },
  matchDetailContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 128,
    backgroundColor: "#05070D",
  },
  matchDetailShowcaseCard: {
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: "#05070D",
    borderWidth: 0,
    borderColor: "transparent",
  },
  matchDetailShowcaseBorderRing: {
    borderRadius: 16,
  },
  matchDetailShowcaseShell: {
    paddingBottom: 4,
    backgroundColor: "#05070D",
  },
  matchDetailShowcaseShellSharp: {
    borderRadius: 16,
  },
  matchDetailShowcaseHeaderRow: {
    paddingBottom: 2,
  },
  matchDetailShowcaseBackButton: {
    minWidth: 88,
    height: 32,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  matchDetailShowcaseBackText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    marginRight: 6,
  },
  matchDetailShowcaseHero: {
    paddingBottom: 8,
  },
  matchDetailShowcaseDivider: {
    height: 0,
    marginHorizontal: 0,
    backgroundColor: "transparent",
  },
  matchDetailShowcaseMetaText: {
    color: "rgba(148,163,184,0.78)",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 5,
  },
  matchDetailStickyTabsWrap: {
    marginTop: -6,
    paddingBottom: 16,
    paddingHorizontal: 0,
    backgroundColor: "#05070D",
    zIndex: 6,
  },
  matchDetailStickyTabsCard: {
    marginBottom: 0,
    borderRadius: 18,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
    overflow: "visible",
  },
  matchDetailStickyTabsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 0,
    backgroundColor: "transparent",
  },
  matchDetailHeroCard: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 16,
  },
  matchDetailHeroRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  matchDetailCenterBlock: {
    minWidth: 138,
    alignItems: "center",
    marginHorizontal: 12,
  },
  matchDetailTabsRow: {
    flexDirection: "row-reverse",
    marginTop: 18,
  },
  matchDetailTabButton: {
    minHeight: 58,
    marginLeft: 0,
  },
  matchDetailTabButtonCompact: {
    minHeight: 58,
  },
  matchDetailTabButtonMotion: {
    flex: 1,
  },
  matchDetailTabButtonActive: {
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  matchDetailTabButtonMotionActive: {
    opacity: 1,
  },
  matchDetailTabButtonPressed: {
    opacity: 0.94,
  },
  matchDetailTabIconWrap: {
    marginBottom: 4,
  },
  matchDetailTabButtonText: {
    color: "rgba(148,163,184,0.92)",
    fontSize: 10,
    fontWeight: "900",
    fontFamily: LEAGUE_HEADER_ARABIC_FONT_FAMILY,
    letterSpacing: -0.25,
  },
  matchDetailTabButtonTextCompact: {
    fontSize: 10,
  },
  matchDetailTabButtonTextActive: {
    color: "#FFFFFF",
    textShadowColor: "rgba(255,255,255,0.22)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  detailStatsGrid: {
    flexDirection: "row-reverse",
    marginBottom: 16,
    marginHorizontal: -4,
  },
  detailMetricCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginHorizontal: 4,
  },
  detailMetricValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  detailMetricLabel: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
    textAlign: "center",
  },
  detailSectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  detailSectionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },
  detailSectionHint: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  detailPressureCard: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 16,
  },
  detailPressureBarsRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    height: 126,
    marginHorizontal: -3,
  },
  detailPressureBarTrack: {
    flex: 1,
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "flex-end",
    marginHorizontal: 3,
    overflow: "hidden",
  },
  detailPressureBarFill: {
    width: "100%",
    minHeight: 10,
    borderRadius: 999,
  },
  detailSectionTitleStandalone: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 4,
    marginBottom: 12,
  },
  detailHeadToHeadHero: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  detailHeadToHeadRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailHeadToHeadTeamBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeadToHeadPercentage: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  detailHeadToHeadTeamName: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 6,
  },
  detailHeadToHeadCenter: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  detailHeadToHeadLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  detailHeadToHeadSubLabel: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  headerPageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#05070D",
    zIndex: 8,
  },
  headerPageShell: {
    flex: 1,
  },
  headerPageTopRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 8,
  },
  headerPageBackButton: {
    minWidth: 78,
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  headerPageBackText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 6,
  },
  headerPageTitleBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  headerPageKicker: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "800",
  },
  headerPageTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
  },
  headerPageSummary: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  headerPageIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerPageContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 128,
  },
  headerOverviewCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerOverviewRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  headerOverviewTextBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginHorizontal: 12,
  },
  headerOverviewTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },
  headerOverviewSummary: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 18,
    marginTop: 6,
  },
  headerOverviewMetricBlock: {
    minWidth: 72,
    alignItems: "center",
  },
  headerOverviewMetricValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  headerOverviewMetricLabel: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 4,
  },
  headerOverviewAccent: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 999,
  },
  headerTableCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerTableHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  headerTableHeaderText: {
    color: "rgba(255,255,255,0.46)",
    fontSize: 10,
    fontWeight: "800",
    minWidth: 48,
    textAlign: "center",
  },
  headerTableHeaderAccent: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    minWidth: 48,
    textAlign: "center",
  },
  headerTeamHeader: {
    flex: 1,
    textAlign: "right",
  },
  headerTableRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTeamBlock: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  headerRankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  headerRankBadgeText: {
    color: "#05070D",
    fontSize: 11,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  headerTeamName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  headerClubName: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 12,
    fontWeight: "800",
    minWidth: 72,
    textAlign: "center",
  },
  headerTableValue: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    minWidth: 48,
    textAlign: "center",
  },
  headerTableValueAccent: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    minWidth: 48,
    textAlign: "center",
  },
  glassCard: {
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 16,
  },
  matchCard: {
    padding: 0,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 26,
    overflow: "hidden",
    marginTop: -6,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  matchCardFrame: {
    borderRadius: 26,
    padding: 0,
  },
  matchCardInner: {
    borderRadius: 26,
    overflow: "hidden",
    position: "relative",
    padding: 14,
    borderWidth: 0,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  matchCardGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "transparent",
    top: -70,
    left: -44,
    opacity: 0,
  },
  matchCardSheen: {
    position: "absolute",
    top: -18,
    right: -22,
    width: 144,
    height: 96,
    transform: [{ rotate: "12deg" }],
    opacity: 0,
  },
  matchShowcaseBorderRing: {
    borderRadius: 24,
    padding: 0.8,
    overflow: "hidden",
    position: "relative",
  },
  matchShowcaseBorderSpinner: {
    position: "absolute",
    top: -180,
    right: -180,
    bottom: -180,
    left: -180,
    opacity: 0.98,
  },
  matchShowcaseBorderSpinnerGradient: {
    flex: 1,
  },
  matchShowcaseShell: {
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    paddingTop: 6,
    paddingBottom: 4,
    backgroundColor: "rgba(5,10,18,0.98)",
  },
  matchShowcaseBackdropOrbPrimary: {
    position: "absolute",
    top: 58,
    left: -22,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(59,130,246,0.12)",
  },
  matchShowcaseBackdropOrbSecondary: {
    position: "absolute",
    top: 128,
    right: -30,
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: "rgba(234,179,8,0.10)",
  },
  matchShowcaseHeaderActionsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  matchShowcaseUtilityActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchShowcaseUtilityButton: {
    width: 31,
    height: 31,
    borderRadius: 10,
    marginLeft: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  matchShowcaseLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.22)",
  },
  matchShowcaseLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginRight: 5,
    backgroundColor: "#EF4444",
  },
  matchShowcaseLiveBadgeText: {
    color: "#EF4444",
    fontSize: 8,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    letterSpacing: 1,
  },
  matchShowcaseHeroPressable: {
    paddingHorizontal: 12,
    paddingBottom: 4,
    marginTop: -14,
    position: "relative",
    zIndex: 1,
  },
  matchShowcaseContextBlock: {
    alignItems: "center",
    marginTop: -12,
  },
  matchShowcaseCompetitionLogoWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    marginTop: -6,
  },
  matchShowcaseCompetitionLogo: {
    width: 50,
    height: 50,
    transform: [{ scale: 1.24 }],
  },
  matchShowcaseCompetitionLabel: {
    color: "rgba(148,163,184,0.82)",
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  matchShowcaseLeagueName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 0,
  },
  matchShowcaseMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  matchShowcaseMetaText: {
    color: "rgba(148,163,184,0.92)",
    fontSize: 9,
    fontWeight: "700",
    marginLeft: 4,
  },
  matchShowcaseTeamsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -8,
  },
  matchShowcaseTeamPanel: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 2,
  },
  matchShowcaseTeamArtWrap: {
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transform: [{ translateY: 3 }],
  },
  matchShowcaseTeamGlow: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    opacity: 0.18,
  },
  matchShowcaseTeamBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,15,26,0.92)",
  },
  matchShowcaseTeamLogo: {
    width: 38,
    height: 38,
  },
  matchShowcaseTeamBadgeFallback: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  matchShowcaseTeamBadgeFallbackText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  matchShowcaseTeamName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  matchShowcaseTeamCaption: {
    color: "rgba(148,163,184,0.70)",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 6,
  },
  matchShowcaseScoreCenter: {
    width: 104,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  matchShowcaseVersus: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    letterSpacing: 0.8,
    marginHorizontal: 10,
    marginTop: 5,
  },
  matchShowcaseScoreDigitsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  matchShowcaseScoreDigit: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  matchShowcaseScoreDash: {
    color: "rgba(71,85,105,0.92)",
    fontSize: 15,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    marginHorizontal: 7,
    marginTop: 3,
  },
  matchShowcaseCountdownBadge: {
    alignItems: "center",
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.34)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  matchShowcaseCountdownText: {
    color: "#FFDE97",
    fontSize: 14,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  matchShowcaseCountdownCaption: {
    color: "rgba(148,163,184,0.74)",
    fontSize: 7,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 3,
    letterSpacing: 0.3,
  },
  matchShowcaseFooterTabsRow: {
    flexDirection: "row-reverse",
    alignItems: "stretch",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.01)",
    position: "relative",
    zIndex: 4,
  },
  matchShowcaseFooterTabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  matchShowcaseFooterTabButtonDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "rgba(255,255,255,0.08)",
  },
  matchShowcaseFooterTabButtonActive: {
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  matchShowcaseFooterTabIconWrap: {
    minWidth: 28,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  matchShowcaseFooterAssetIcon: {
    width: 17,
    height: 17,
  },
  matchShowcaseFooterAssetIconLarge: {
    width: 19,
    height: 19,
  },
  matchShowcaseFooterPredictionIcon: {
    width: 26,
    height: 26,
  },
  matchShowcaseFooterTabText: {
    color: "rgba(148,163,184,0.92)",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },
  matchOpenDetailsArea: {
    position: "relative",
  },
  matchHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 54,
    minHeight: 30,
  },
  matchLeagueName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  scoreRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  teamColumn: {
    alignItems: "center",
    width: 68,
    marginHorizontal: 8,
  },
  teamCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  teamCircleText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  teamLogoWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  teamCircleIcon: {
    width: 34,
    height: 34,
  },
  teamColumnTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 7,
    width: "100%",
    textAlign: "center",
  },
  scoreBlock: {
    alignItems: "center",
    minWidth: 128,
    marginHorizontal: 12,
  },
  scoreDigitsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  matchDemoPillWrap: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 3,
  },
  scoreDigit: {
    color: "#FFCC68",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  scoreDash: {
    color: "rgba(255,212,122,0.72)",
    fontSize: 22,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    marginHorizontal: 7,
  },
  livePill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(255,214,126,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF4859",
    marginLeft: 5,
  },
  livePillText: {
    color: "#FFDE97",
    fontSize: 9,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  kickoffCountdownText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    marginTop: 8,
    letterSpacing: 0.4,
  },
  kickoffCountdownCaption: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
  },
  leagueTabsRow: {
    flexDirection: "row-reverse",
    marginTop: 10,
  },
  leagueTabButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 0.8,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  leagueTabButtonContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  leagueTabButtonLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#41F17B",
    marginLeft: 6,
    shadowColor: "#41F17B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 2,
  },
  leagueTabButtonActive: {
    backgroundColor: "rgba(255,214,126,0.14)",
    borderColor: "rgba(255,255,255,0.28)",
  },
  leagueTabButtonText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 10,
    fontWeight: "900",
  },
  leagueTabButtonTextActive: {
    color: "#FFDE97",
  },
  eventCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  eventMinuteBadge: {
    minWidth: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  eventMinuteText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  eventTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  eventTextRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  eventSummaryText: {
    flex: 1,
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  eventMoreText: {
    color: "#63C6FF",
    fontSize: 12,
    fontWeight: "900",
    marginRight: 10,
  },
  modeSwitchButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
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
  lineupStageShell: {
    marginBottom: 14,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#030507",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  lineupStageHeader: {
    position: "relative",
    backgroundColor: "#05070D",
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 20,
    overflow: "hidden",
  },
  lineupStageHeaderGlow: {
    position: "absolute",
    top: -18,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.18,
  },
  lineupStageHeaderGlowLeft: {
    left: -68,
  },
  lineupStageHeaderGlowRight: {
    right: -68,
  },
  lineupStageBrandWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  lineupStageBrandImage: {
    width: 84,
    height: 30,
    opacity: 0.92,
  },
  lineupStageHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  lineupStageHeaderCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  lineupStageKickoffText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    fontFamily: MONO_FONT,
  },
  lineupStageHeadline: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
  },
  lineupStageTeamBadgeWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  lineupStageTeamBadgeImage: {
    width: 32,
    height: 32,
  },
  lineupStageTeamFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  lineupStageTeamFallbackText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  lineupStageFieldWrap: {
    position: "relative",
    backgroundColor: "#040607",
    overflow: "hidden",
  },
  lineupStageFieldShadow: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 26,
    height: 180,
    borderRadius: 48,
    backgroundColor: "rgba(0,0,0,0.36)",
    transform: [{ scaleX: 0.88 }],
  },
  lineupStageFieldPlane: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 96,
    bottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  lineupStageFeatureTabWrap: {
    position: "absolute",
    top: 18,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 4,
  },
  lineupStageFeatureTabPressable: {
    borderRadius: 999,
  },
  lineupStageFeatureTabPressableActive: {
    transform: [{ translateY: 1 }, { scale: 0.985 }],
  },
  lineupStageFeatureTabBorder: {
    minWidth: 168,
    maxWidth: "72%",
    borderRadius: 999,
    padding: 1.25,
    shadowColor: "#9ED5FF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 7,
  },
  lineupStageFeatureTabBorderActive: {
    shadowOpacity: 0.26,
    shadowRadius: 22,
  },
  lineupStageFeatureTabInner: {
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: "#071018",
    paddingHorizontal: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  lineupStageFeatureTabInnerActive: {
    backgroundColor: "#0B1620",
  },
  lineupStageFeatureTabIconHalo: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    right: 12,
    backgroundColor: "#92D6FF",
  },
  lineupStageFeatureTabIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  lineupStageFeatureTabIconWrapActive: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderColor: "rgba(255,255,255,0.96)",
  },
  lineupStageFeatureTabText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginHorizontal: 8,
    letterSpacing: 0.2,
  },
  lineupStageFeatureTabTextActive: {
    color: "#FFFFFF",
  },
  lineupStageFieldSurface: {
    width: "92%",
    height: "100%",
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
    transform: [{ perspective: 900 }, { rotateX: "58deg" }],
  },
  lineupStageTouchline: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 14,
    bottom: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: 14,
  },
  lineupStageHalfwayLine: {
    position: "absolute",
    left: 14,
    right: 14,
    top: "50%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  lineupStageCenterCircle: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.18)",
    transform: [{ translateX: -48 }, { translateY: -48 }],
  },
  lineupStageCenterMark: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.28)",
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  lineupStageTopBox: {
    position: "absolute",
    left: "24%",
    right: "24%",
    top: 14,
    height: 96,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: "rgba(255,255,255,0.18)",
  },
  lineupStageBottomBox: {
    position: "absolute",
    left: "24%",
    right: "24%",
    bottom: 14,
    height: 96,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.18)",
  },
  lineupStageTopGoalArea: {
    position: "absolute",
    left: "34%",
    right: "34%",
    top: 14,
    height: 42,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: "rgba(255,255,255,0.18)",
  },
  lineupStageBottomGoalArea: {
    position: "absolute",
    left: "34%",
    right: "34%",
    bottom: 14,
    height: 42,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.18)",
  },
  lineupStagePlayerLayer: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 104,
    bottom: 46,
  },
  lineupStagePlacementLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  lineupPlayerMarker: {
    position: "absolute",
    width: 72,
    alignItems: "center",
    zIndex: 2,
  },
  lineupPlayerMarkerSelected: {
    zIndex: 4,
  },
  lineupPlayerPressable: {
    alignItems: "center",
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 8,
  },
  lineupPlayerPressableActive: {
    transform: [{ scale: 0.96 }],
  },
  lineupPlayerAvatarShell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  lineupPlayerAvatarShellSelected: {
    shadowColor: "#8BD6FF",
    shadowOpacity: 0.34,
    shadowRadius: 16,
    elevation: 9,
  },
  lineupPlayerAvatarCore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  lineupPlayerAvatarHead: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "rgba(255,255,255,0.9)",
    marginTop: 5,
  },
  lineupPlayerAvatarBody: {
    width: 34,
    height: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 3,
  },
  lineupPlayerNumberBadge: {
    position: "absolute",
    top: -3,
    left: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  lineupPlayerNumberBadgeSelected: {
    borderColor: "rgba(99,198,255,0.65)",
  },
  lineupPlayerNumberText: {
    color: "#0A1018",
    fontSize: 10,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  lineupPlayerTeamBadge: {
    position: "absolute",
    top: 0,
    right: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2FA357",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.38)",
  },
  lineupPlayerTeamBadgeSelected: {
    backgroundColor: "#0E6D96",
  },
  lineupPlayerTeamBadgeText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "900",
  },
  lineupPlayerName: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 5,
    width: "100%",
  },
  lineupPlayerNameSelected: {
    color: "#9EDCFF",
  },
  lineupStageFormationPill: {
    position: "absolute",
    right: 14,
    bottom: 12,
    minWidth: 74,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  lineupStageFormationText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  lineupStageWatermarkWrap: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  lineupStageWatermarkImage: {
    width: 80,
    height: 28,
    opacity: 0.14,
  },
  lineupVarEditorPanel: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  lineupVarEditorTopRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  lineupVarEditorActionsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginLeft: 10,
  },
  lineupVarEditorActionButton: {
    minHeight: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  lineupVarEditorActionButtonPrimary: {
    backgroundColor: "#F5F9FF",
    borderColor: "rgba(255,255,255,0.96)",
  },
  lineupVarEditorActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  lineupVarEditorActionTextPrimary: {
    color: "#08111B",
  },
  lineupVarEditorCopyWrap: {
    flex: 1,
  },
  lineupVarEditorTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },
  lineupVarEditorHint: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
    lineHeight: 18,
  },
  lineupVarEditorHintSecondary: {
    color: "rgba(158,220,255,0.88)",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 6,
  },
  lineupVarBenchTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 4,
  },
  lineupVarBenchRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginHorizontal: -4,
    paddingTop: 14,
    paddingBottom: 2,
  },
  lineupVarBenchToken: {
    width: 78,
    alignItems: "center",
    marginHorizontal: 4,
    marginBottom: 12,
    paddingTop: 4,
    paddingBottom: 6,
    transform: [{ scale: 1 }],
    zIndex: 4,
  },
  lineupVarBenchTokenSelected: {
    transform: [{ scale: 1.04 }],
  },
  lineupVarBenchTokenPressed: {
    transform: [{ scale: 0.97 }],
  },
  lineupVarBenchAvatarShell: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  lineupVarBenchAvatarShellSelected: {
    shadowColor: "#8BD6FF",
    shadowOpacity: 0.34,
    shadowRadius: 16,
    elevation: 8,
  },
  lineupVarBenchAvatarCore: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  lineupVarBenchAvatarHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    marginTop: 6,
  },
  lineupVarBenchAvatarBody: {
    width: 36,
    height: 21,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 3,
  },
  lineupVarBenchNumberBadge: {
    position: "absolute",
    top: 2,
    left: 12,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  lineupVarBenchNumberText: {
    color: "#0A1018",
    fontSize: 10,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  lineupVarBenchTeamBadge: {
    position: "absolute",
    top: 5,
    right: 14,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0E6D96",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
  },
  lineupVarBenchTeamBadgeText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "900",
  },
  lineupVarBenchName: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    width: "100%",
    marginTop: 8,
  },
  lineupVarBenchEmpty: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 12,
  },
  lineupVarEditorHintWrap: {
    marginTop: 2,
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
  varXPitchCard: {
    marginTop: 16,
    height: 360,
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
  pollVotePanel: {
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pollVoteRow: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
  },
  pollVoteDivider: {
    height: 6,
  },
  pollVoteTeamBlock: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  pollVoteTeamLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  pollVoteMetricsWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    width: "74%",
    maxWidth: 238,
  },
  pollVoteMetricGroup: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
  },
  pollVoteMetricLabel: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 4,
    flexShrink: 0,
  },
  pollVoteMetricValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    flexShrink: 1,
  },
  pollVoteMetricCenterWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  pollVoteMetricCenterText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  pollVoteButton: {
    minWidth: 86,
    width: 86,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#F3F5F8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonSuccess: {
    backgroundColor: ACTION_SUCCESS_COLOR,
    borderColor: "rgba(65,241,123,0.42)",
  },
  actionButtonSuccessText: {
    color: ACTION_SUCCESS_FOREGROUND,
  },
  actionButtonSuccessIcon: {
    marginRight: 6,
  },
  pollVoteButtonText: {
    color: "#102038",
    fontSize: 11,
    fontWeight: "900",
  },
  predictionsTitleRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  predictionsHeaderBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: -4,
    zIndex: 2,
  },
  predictionsHeaderBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  predictionsHeaderBadgeAccent: {
    backgroundColor: "#F8F5FF",
  },
  predictionsHeaderBadgeTrailing: {
    marginLeft: -6,
  },
  predictionsTitleText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  predictionsBoard: {
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  predictionsScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  predictionsScorerColumn: {
    width: "48%",
    minWidth: 0,
  },
  predictionsScorerColumnHidden: {
    width: "48%",
  },
  predictionsScoreColumn: {
    flex: 1,
    minWidth: 0,
  },
  predictionsScoreInlineRow: {
    alignItems: "center",
  },
  predictionsScoreInlineRowLeft: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  predictionsScoreInlineRowRight: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  predictionsTeamSideText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
  predictionsResultText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    marginHorizontal: 8,
  },
  predictionsVsText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginHorizontal: 12,
  },
  predictionsScoreFieldWrap: {
    width: 50,
    height: 26,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    backgroundColor: "rgba(11,29,53,0.26)",
    alignItems: "center",
    justifyContent: "center",
  },
  predictionsScoreInput: {
    width: "100%",
    height: "100%",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
  },
  predictionsScorersRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 14,
  },
  predictionsScorerMetaRow: {
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  predictionsScorerMetaRowLeft: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  predictionsScorerMetaRowRight: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  predictionsScorerMetaLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  predictionsScorerTeamChip: {
    minWidth: 108,
    minHeight: 28,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    backgroundColor: "rgba(11,29,53,0.26)",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  predictionsScorerTeamChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  predictionsScorerTeamChipChevron: {
    marginLeft: 6,
  },
  predictionsScorersCell: {
    width: "100%",
  },
  predictionsScorerSlotWrap: {
    marginTop: 8,
  },
  predictionsPickerWrap: {
    position: "relative",
    width: "100%",
  },
  predictionsPickerWrapOpen: {
    zIndex: 30,
  },
  predictionsPickerTrigger: {
    minHeight: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    backgroundColor: "rgba(11,29,53,0.26)",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 12,
  },
  predictionsPickerChevron: {
    marginRight: 6,
  },
  predictionsPickerValueText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    flex: 1,
  },
  predictionsPickerValuePlaceholder: {
    color: "rgba(255,255,255,0.72)",
  },
  predictionsPickerMenu: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "100%",
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: "rgba(12,35,63,0.98)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 12,
  },
  predictionsPickerMenuScroll: {
    maxHeight: 156,
  },
  predictionsPickerOption: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  predictionsPickerOptionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
    flex: 1,
  },
  predictionsAvatarFrame: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginLeft: 6,
  },
  predictionsAvatarImage: {
    width: 18,
    height: 18,
  },
  predictionsAvatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  predictionsAvatarFallbackText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  predictionsSaveButton: {
    alignSelf: "center",
    minWidth: 108,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.16)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  predictionsSaveButtonText: {
    color: "#111111",
    fontSize: 11,
    fontWeight: "900",
  },
  predictionsSaveButtonSaved: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(17,24,39,0.22)",
  },
  predictionsScorerHintWrap: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  predictionsScorerHintText: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 16,
  },
  predictionsNoteWrap: {
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  predictionsNoteText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 16,
  },
  pollTweetSection: {
    marginTop: 16,
  },
  pollTweetSectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pollTweetSectionTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  pollTweetSectionLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#41F17B",
    marginLeft: 7,
    shadowColor: "#41F17B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 3,
  },
  pollTweetSectionKicker: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  pollTweetSectionHint: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  pollTweetViewport: {
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(2,4,8,0.82)",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  pollTweetTrack: {
    paddingTop: 0,
  },
  pollTweetCard: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.32)",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  pollTweetCardHeader: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  pollTweetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pollTweetAvatarText: {
    color: "#F7FAFC",
    fontSize: 11,
    fontWeight: "900",
  },
  pollTweetMetaBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginHorizontal: 10,
  },
  pollTweetIdentityRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  pollTweetAuthor: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
  },
  pollTweetHandle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "right",
    marginRight: 6,
    fontFamily: MONO_FONT,
  },
  pollTweetTimeLabel: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
    fontWeight: "800",
    marginRight: 6,
  },
  pollTweetReplyLine: {
    color: "#2A93F4",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 4,
  },
  pollTweetQuote: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    lineHeight: 20,
    marginTop: 8,
  },
  pollTweetActionsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  pollTweetActionItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  pollTweetActionCount: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: "800",
    marginRight: 5,
  },
  pollTweetActionIconOnly: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  pollTweetFadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 28,
  },
  pollTweetFadeBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
  },
  pollCommentComposer: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 14,
    marginTop: 18,
  },
  pollCommentComposerText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    fontWeight: "800",
    marginRight: 10,
  },
});
