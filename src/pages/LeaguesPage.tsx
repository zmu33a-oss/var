import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  BarChart3,
  Bell,
  Flag,
  LayoutGrid,
  RotateCcw,
  Share2,
  X,
} from "lucide-react";
import {
  fetchLeaguesLiveMatch,
  type LiveLeaguesMatch,
  type LiveLeaguesResponseStatus,
  type LiveLeaguesTeamLineup,
} from "../lib/leaguesLiveApi";
import styles from "../pages-css/LeaguesPage.module.css";

const pressureBars = [20, 20, 21, 22, 24, 25, 27, 29, 31, 29, 24, 20];

type SheetTab = "lineup" | "events" | "poll";
type LineupTeamKey = "home" | "away";
type TacticalBoardPlayer = {
  id: string | number | null;
  name: string;
  number: number | null;
  image: string | null;
  left: number;
  top: number;
  primaryColor: string;
  secondaryColor: string;
};

type LeaguesPageProps = {
  onShareVarXBoard?: (payload: { content: string; image?: string }) => void;
};

const liveLineupColors: Record<LineupTeamKey, [string, string]> = {
  home: ["#69c8ff", "#2448a9"],
  away: ["#ffc172", "#a24f1a"],
};
const varXWatermarkLabel = "VAR X";

type PollOption = {
  label: string;
  percentage: number;
  votes: string;
  accent: string;
};

const pollOptions: PollOption[] = [
  {
    label: "فوز الهلال",
    percentage: 54,
    votes: "16.9 ألف صوت",
    accent: "#69c8ff",
  },
  {
    label: "فوز النصر",
    percentage: 34,
    votes: "10.7 ألف صوت",
    accent: "#ffb14a",
  },
  {
    label: "تعادل",
    percentage: 12,
    votes: "3.8 ألف صوت",
    accent: "#d68dff",
  },
];

type DemoLineupSeed = {
  name: string;
  number: number;
  formationRow: number;
};

function buildDemoStarters(
  teamPrefix: string,
  seeds: DemoLineupSeed[],
): LiveLeaguesTeamLineup["starters"] {
  return seeds.map((seed, index) => ({
    id: `${teamPrefix}-starter-${index + 1}`,
    name: seed.name,
    image: null,
    number: seed.number,
    formationRow: seed.formationRow,
    formationColumn: null,
    formationPosition: index + 1,
    role: "starter",
  }));
}

function buildDemoBench(
  teamPrefix: string,
  seeds: Array<{ name: string; number: number }>,
): LiveLeaguesTeamLineup["bench"] {
  return seeds.map((seed, index) => ({
    id: `${teamPrefix}-bench-${index + 1}`,
    name: seed.name,
    image: null,
    number: seed.number,
    formationRow: null,
    formationColumn: null,
    formationPosition: null,
    role: "bench",
  }));
}

const demoLeaguesMatch: LiveLeaguesMatch = {
  fixtureId: "varx-demo",
  leagueName: "وضع تجريبي VAR X",
  liveLabel: "DEMO",
  home: {
    name: "الهلال",
    logo: "/teams/alhilal.png",
    score: 2,
  },
  away: {
    name: "النصر",
    logo: "/teams/alnassr.png",
    score: 1,
  },
  events: [
    {
      minute: "12'",
      title: "ضغط عالٍ",
      detail: "الهلال يغلق العمق ويستعيد الكرة بسرعة في الثلث الأوسط.",
    },
    {
      minute: "29'",
      title: "فرصة خطرة",
      detail: "النصر يصل خلف الظهير الأيسر بتبادل سريع على الطرف.",
    },
    {
      minute: "53'",
      title: "تعديل تكتيكي",
      detail: "تحويل الجناح إلى العمق لخلق زيادة عددية أمام منطقة الجزاء.",
    },
    {
      minute: "77'",
      title: "تبديل تجريبي",
      detail: "دخول جناح سريع لزيادة العرضيات والضغط على خط الدفاع.",
    },
  ],
  lineup: {
    home: {
      formation: "4-3-3",
      starters: buildDemoStarters("demo-home", [
        { name: "حارس الهلال", number: 37, formationRow: 1 },
        { name: "ظهير أيمن الهلال", number: 66, formationRow: 2 },
        { name: "قلب دفاع الهلال 1", number: 3, formationRow: 2 },
        { name: "قلب دفاع الهلال 2", number: 5, formationRow: 2 },
        { name: "ظهير أيسر الهلال", number: 12, formationRow: 2 },
        { name: "محور الهلال", number: 8, formationRow: 3 },
        { name: "وسط الهلال", number: 16, formationRow: 3 },
        { name: "صانع لعب الهلال", number: 10, formationRow: 3 },
        { name: "جناح أيمن الهلال", number: 77, formationRow: 4 },
        { name: "مهاجم الهلال", number: 9, formationRow: 4 },
        { name: "جناح أيسر الهلال", number: 29, formationRow: 4 },
      ]),
      bench: buildDemoBench("demo-home", [
        { name: "بديل الهلال 1", number: 18 },
        { name: "بديل الهلال 2", number: 24 },
        { name: "بديل الهلال 3", number: 31 },
        { name: "بديل الهلال 4", number: 70 },
        { name: "بديل الهلال 5", number: 88 },
      ]),
    },
    away: {
      formation: "4-2-3-1",
      starters: buildDemoStarters("demo-away", [
        { name: "حارس النصر", number: 44, formationRow: 1 },
        { name: "ظهير أيمن النصر", number: 2, formationRow: 2 },
        { name: "قلب دفاع النصر 1", number: 4, formationRow: 2 },
        { name: "قلب دفاع النصر 2", number: 17, formationRow: 2 },
        { name: "ظهير أيسر النصر", number: 13, formationRow: 2 },
        { name: "محور النصر 1", number: 6, formationRow: 3 },
        { name: "محور النصر 2", number: 14, formationRow: 3 },
        { name: "جناح أيمن النصر", number: 11, formationRow: 4 },
        { name: "صانع لعب النصر", number: 25, formationRow: 4 },
        { name: "جناح أيسر النصر", number: 7, formationRow: 4 },
        { name: "مهاجم النصر", number: 9, formationRow: 5 },
      ]),
      bench: buildDemoBench("demo-away", [
        { name: "بديل النصر 1", number: 19 },
        { name: "بديل النصر 2", number: 21 },
        { name: "بديل النصر 3", number: 27 },
        { name: "بديل النصر 4", number: 30 },
        { name: "بديل النصر 5", number: 80 },
      ]),
    },
  },
};

const demoModeMessage =
  "وضع تجريبي واضح لتجربة التشكيلة وVAR X والمشاركة على X. هذه البيانات ليست مباراة مباشرة.";

const emptyLeaguesMatch: LiveLeaguesMatch = {
  fixtureId: null,
  leagueName: "المباريات المباشرة",
  liveLabel: "LIVE",
  home: {
    name: "",
    logo: null,
    score: null,
  },
  away: {
    name: "",
    logo: null,
    score: null,
  },
  events: [],
  lineup: null,
};

function getLiveStatusTitle(
  isLoadingLiveMatch: boolean,
  liveStatus: LiveLeaguesResponseStatus,
) {
  if (isLoadingLiveMatch) {
    return "جاري البحث عن مباراة مباشرة";
  }

  if (liveStatus === "unconfigured") {
    return "المصدر الحي غير مهيأ";
  }

  if (liveStatus === "error") {
    return "تعذر تحميل المباريات المباشرة";
  }

  return "لا توجد مباراة مباشرة الآن";
}

function getLiveStatusMessage(
  isLoadingLiveMatch: boolean,
  liveStatus: LiveLeaguesResponseStatus,
  liveMessage: string,
) {
  if (isLoadingLiveMatch) {
    return "سنحدّث هذه البطاقة تلقائيًا فور العثور على مباراة live متاحة.";
  }

  if (liveStatus === "unconfigured") {
    return (
      liveMessage ||
      "أكمل إعدادات SportMonks لعرض المباراة الحية داخل هذه البطاقة."
    );
  }

  if (liveStatus === "error") {
    return liveMessage || "حدث خطأ أثناء محاولة جلب المباراة الحية من المصدر.";
  }

  return "المصدر متصل، لكن لا توجد مباراة مباشرة ضمن التغطية الحالية أو في هذا التوقيت.";
}

function renderScoreValue(score: number | null) {
  return score === null ? "-" : String(score);
}

function renderLineupPlayerNumber(number: number | null) {
  return number === null ? "•" : String(number);
}

function getPitchColumnPositions(count: number) {
  if (count <= 1) {
    return [50];
  }

  if (count === 2) {
    return [36, 64];
  }

  if (count === 3) {
    return [18, 50, 82];
  }

  if (count === 4) {
    return [18, 39, 61, 82];
  }

  if (count === 5) {
    return [10, 30, 50, 70, 90];
  }

  return Array.from(
    { length: count },
    (_, index) => 10 + (80 / (count - 1)) * index,
  );
}

function hasRenderablePlayerImage(image: string | null) {
  return Boolean(image && !/placeholder\.png(?:\?.*)?$/i.test(image));
}

function clampPitchCoordinate(value: number) {
  if (!Number.isFinite(value)) {
    return 50;
  }

  return Math.min(92, Math.max(8, value));
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapVarXNoteLines(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return ["ملاحظات تكتيكية من سبورة VAR X."];
  }

  const chunks = trimmedValue
    .split(/\r?\n/)
    .flatMap((line) => line.match(/.{1,34}/g) || [line])
    .map((line) => line.trim())
    .filter(Boolean);

  return chunks.slice(0, 5);
}

function getPitchMarkerStyle(player: TacticalBoardPlayer): CSSProperties {
  return {
    top: `${player.top}%`,
    left: `${player.left}%`,
    "--player-primary": player.primaryColor,
    "--player-secondary": player.secondaryColor,
  } as CSSProperties;
}

function buildLivePitchMarkers(
  players: LiveLeaguesTeamLineup["starters"],
  teamKey: LineupTeamKey,
) {
  const rowBuckets = new Map<
    number,
    Array<LiveLeaguesTeamLineup["starters"][number]>
  >();

  players.forEach((player, index) => {
    const rowKey = player.formationRow ?? player.formationPosition ?? index + 1;
    const currentRow = rowBuckets.get(rowKey) || [];
    currentRow.push(player);
    rowBuckets.set(rowKey, currentRow);
  });

  const orderedRows = [...rowBuckets.keys()].sort(
    (left, right) => left - right,
  );
  const [primaryColor, secondaryColor] = liveLineupColors[teamKey];

  return orderedRows.flatMap((rowKey, rowIndex) => {
    const rowPlayers = rowBuckets.get(rowKey) || [];
    const columnPositions = getPitchColumnPositions(rowPlayers.length);
    const top =
      orderedRows.length === 1
        ? 50
        : 84 - rowIndex * (68 / Math.max(orderedRows.length - 1, 1));

    return rowPlayers.map((player, playerIndex) => ({
      id: player.id,
      name: player.name,
      number: player.number,
      image: player.image,
      left: columnPositions[playerIndex] ?? 50,
      top,
      primaryColor,
      secondaryColor,
    }));
  });
}

function createVarXShareImage({
  leagueName,
  teamName,
  opponentName,
  formation,
  players,
  notes,
}: {
  leagueName: string;
  teamName: string;
  opponentName: string;
  formation: string;
  players: TacticalBoardPlayer[];
  notes: string;
}) {
  const width = 1080;
  const height = 1350;
  const pitchX = 72;
  const pitchY = 198;
  const pitchWidth = 936;
  const pitchHeight = 786;
  const noteLines = wrapVarXNoteLines(notes);

  const playerMarkup = players
    .map((player) => {
      const playerX = pitchX + (player.left / 100) * pitchWidth;
      const playerY = pitchY + (player.top / 100) * pitchHeight;
      const safeName = escapeSvgText(player.name);
      const safeNumber = escapeSvgText(renderLineupPlayerNumber(player.number));

      return `
        <g transform="translate(${playerX.toFixed(2)} ${playerY.toFixed(2)})">
          <circle r="34" fill="${player.primaryColor}" fill-opacity="0.92" stroke="rgba(255,255,255,0.22)" stroke-width="3" />
          <circle r="26" fill="#08101b" fill-opacity="0.34" />
          <text y="7" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">${safeNumber}</text>
          <text y="56" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#f8fbff">${safeName}</text>
        </g>`;
    })
    .join("");

  const notesMarkup = noteLines
    .map(
      (line, index) => `
        <text x="96" y="${1116 + index * 42}" font-family="Segoe UI, Arial, sans-serif" font-size="28" fill="#e7eef9">${escapeSvgText(line)}</text>`,
    )
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#111722" />
          <stop offset="100%" stop-color="#04080d" />
        </linearGradient>
        <linearGradient id="pitch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0d4124" />
          <stop offset="100%" stop-color="#081f13" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="42" fill="url(#bg)" />
      <text x="540" y="128" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="52" font-weight="700" fill="#ffffff">${escapeSvgText(leagueName)}</text>
      <text x="540" y="174" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#b7c7db">${escapeSvgText(teamName)} × ${escapeSvgText(opponentName)}</text>
      <rect x="${pitchX}" y="${pitchY}" width="${pitchWidth}" height="${pitchHeight}" rx="38" fill="url(#pitch)" stroke="rgba(255,255,255,0.16)" stroke-width="3" />
      <g opacity="0.08">
        <text x="540" y="620" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="220" font-weight="800" fill="#ffffff" transform="rotate(-14 540 620)">${escapeSvgText(varXWatermarkLabel)}</text>
      </g>
      <line x1="${pitchX}" y1="${pitchY + pitchHeight / 2}" x2="${pitchX + pitchWidth}" y2="${pitchY + pitchHeight / 2}" stroke="rgba(255,255,255,0.36)" stroke-width="3" />
      <circle cx="540" cy="${pitchY + pitchHeight / 2}" r="94" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" />
      <rect x="278" y="${pitchY}" width="524" height="118" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" />
      <rect x="396" y="${pitchY}" width="288" height="46" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" />
      <rect x="278" y="${pitchY + pitchHeight - 118}" width="524" height="118" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" />
      <rect x="396" y="${pitchY + pitchHeight - 46}" width="288" height="46" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" />
      <text x="540" y="232" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="26" fill="#dbe8f7">${escapeSvgText(formation || "سبورة تكتيكية")}</text>
      ${playerMarkup}
      <rect x="72" y="1024" width="936" height="240" rx="30" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
      <text x="96" y="1076" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">ملاحظات المدرب</text>
      ${notesMarkup}
    </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function LeaguesPage({ onShareVarXBoard }: LeaguesPageProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeSheetTab, setActiveSheetTab] = useState<SheetTab>("lineup");
  const [activeLineupTeamKey, setActiveLineupTeamKey] =
    useState<LineupTeamKey>("home");
  const [isVarXOpen, setIsVarXOpen] = useState(false);
  const [varXTeamKey, setVarXTeamKey] = useState<LineupTeamKey>("home");
  const [varXNotes, setVarXNotes] = useState("");
  const [varXPlayersByTeam, setVarXPlayersByTeam] = useState<
    Record<LineupTeamKey, TacticalBoardPlayer[]>
  >({ home: [], away: [] });
  const [draggingPlayerId, setDraggingPlayerId] = useState<
    string | number | null
  >(null);
  const [liveMatch, setLiveMatch] = useState<LiveLeaguesMatch | null>(null);
  const [liveStatus, setLiveStatus] =
    useState<LiveLeaguesResponseStatus>("empty");
  const [liveMessage, setLiveMessage] = useState("");
  const [isLoadingLiveMatch, setIsLoadingLiveMatch] = useState(true);
  const varXPitchRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    teamKey: LineupTeamKey;
    playerId: string | number | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLiveMatch = async () => {
      const response = await fetchLeaguesLiveMatch();

      if (cancelled) {
        return;
      }

      setIsLoadingLiveMatch(false);
      setLiveStatus(response.status);
      setLiveMessage(response.message ?? "");

      if (response.status === "live" && response.match) {
        setLiveMatch(response.match);
        return;
      }

      setLiveMatch(null);
    };

    void loadLiveMatch();

    const intervalId = window.setInterval(() => {
      void loadLiveMatch();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const toggleSheet = (tab: SheetTab) => {
    if (isSheetOpen && activeSheetTab === tab) {
      setIsSheetOpen(false);
      return;
    }

    setActiveSheetTab(tab);
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
  };

  const getActionButtonClass = (tab: SheetTab) =>
    `${styles["action-button"]} ${isSheetOpen && activeSheetTab === tab ? styles["action-button-active"] : ""}`;

  const hasLiveMatch = Boolean(liveMatch);
  const isDemoMode = !hasLiveMatch && !isLoadingLiveMatch;
  const hasDisplayMatch = hasLiveMatch || isDemoMode;
  const liveStatusTitle = getLiveStatusTitle(isLoadingLiveMatch, liveStatus);
  const liveStatusMessage = getLiveStatusMessage(
    isLoadingLiveMatch,
    liveStatus,
    liveMessage,
  );
  const displayedMatch =
    liveMatch || (isDemoMode ? demoLeaguesMatch : emptyLeaguesMatch);
  const displayedEvents = displayedMatch.events ?? [];
  const displayedLineup = displayedMatch.lineup ?? null;
  const homeLiveLineup = displayedLineup?.home ?? null;
  const awayLiveLineup = displayedLineup?.away ?? null;
  const hasLiveLineup = Boolean(
    homeLiveLineup?.starters.length ||
    awayLiveLineup?.starters.length ||
    homeLiveLineup?.bench.length ||
    awayLiveLineup?.bench.length,
  );
  const liveLineupSummary =
    [homeLiveLineup?.formation, awayLiveLineup?.formation]
      .filter(Boolean)
      .join(" · ") || "لا توجد تشكيلة بعد";
  const lineupCards: Array<{
    key: LineupTeamKey;
    team: LiveLeaguesMatch["home"];
    lineup: LiveLeaguesTeamLineup | null | undefined;
    fallbackLogo: string;
  }> = [
    {
      key: "home",
      team: displayedMatch.home,
      lineup: homeLiveLineup,
      fallbackLogo: "/teams/alhilal.png",
    },
    {
      key: "away",
      team: displayedMatch.away,
      lineup: awayLiveLineup,
      fallbackLogo: "/teams/alnassr.png",
    },
  ];
  const availableLiveLineupKeys = lineupCards
    .filter(({ lineup }) => lineup?.starters.length)
    .map(({ key }) => key);
  const effectiveLiveLineupTeamKey = availableLiveLineupKeys.includes(
    activeLineupTeamKey,
  )
    ? activeLineupTeamKey
    : (availableLiveLineupKeys[0] ?? "home");
  const selectedLiveLineupCard =
    lineupCards.find(({ key }) => key === effectiveLiveLineupTeamKey) ||
    lineupCards[0];
  const selectedLiveLineup = selectedLiveLineupCard?.lineup ?? null;
  const homeVarXPlayers = homeLiveLineup?.starters.length
    ? buildLivePitchMarkers(homeLiveLineup.starters, "home")
    : [];
  const awayVarXPlayers = awayLiveLineup?.starters.length
    ? buildLivePitchMarkers(awayLiveLineup.starters, "away")
    : [];
  const varXSeedKey = `${displayedMatch.fixtureId ?? (isDemoMode ? "demo" : "empty")}:${homeVarXPlayers.map((player) => player.id).join("-")}:${awayVarXPlayers.map((player) => player.id).join("-")}`;
  const selectedLivePitchPlayers = selectedLiveLineup
    ? buildLivePitchMarkers(
        selectedLiveLineup.starters,
        effectiveLiveLineupTeamKey,
      )
    : [];
  const effectiveVarXTeamKey = availableLiveLineupKeys.includes(varXTeamKey)
    ? varXTeamKey
    : (availableLiveLineupKeys[0] ?? "home");
  const selectedVarXLineupCard =
    lineupCards.find(({ key }) => key === effectiveVarXTeamKey) ||
    lineupCards[0];
  const selectedVarXLineup = selectedVarXLineupCard?.lineup ?? null;
  const selectedVarXPlayers = varXPlayersByTeam[effectiveVarXTeamKey] ?? [];
  const varXOpponentName =
    effectiveVarXTeamKey === "home"
      ? displayedMatch.away.name || "الخصم"
      : displayedMatch.home.name || "الخصم";
  const canShareVarXBoard = Boolean(
    onShareVarXBoard && selectedVarXPlayers.length,
  );

  useEffect(() => {
    setVarXPlayersByTeam({
      home: homeVarXPlayers,
      away: awayVarXPlayers,
    });
    setVarXTeamKey((currentKey) =>
      availableLiveLineupKeys.includes(currentKey)
        ? currentKey
        : (availableLiveLineupKeys[0] ?? "home"),
    );
    setVarXNotes("");
  }, [varXSeedKey]);

  useEffect(() => {
    if (!isVarXOpen) {
      dragStateRef.current = null;
      setDraggingPlayerId(null);
      document.body.style.userSelect = "";
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const activeDrag = dragStateRef.current;
      const pitch = varXPitchRef.current;

      if (!activeDrag || !pitch) {
        return;
      }

      event.preventDefault();

      const pitchRect = pitch.getBoundingClientRect();
      const nextLeft = clampPitchCoordinate(
        ((event.clientX - pitchRect.left) / pitchRect.width) * 100,
      );
      const nextTop = clampPitchCoordinate(
        ((event.clientY - pitchRect.top) / pitchRect.height) * 100,
      );

      setVarXPlayersByTeam((currentPlayers) => ({
        ...currentPlayers,
        [activeDrag.teamKey]: currentPlayers[activeDrag.teamKey].map(
          (player) =>
            player.id === activeDrag.playerId
              ? {
                  ...player,
                  left: nextLeft,
                  top: nextTop,
                }
              : player,
        ),
      }));
    };

    const stopDragging = () => {
      dragStateRef.current = null;
      setDraggingPlayerId(null);
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
      document.body.style.userSelect = "";
    };
  }, [isVarXOpen]);

  const openVarXBoard = () => {
    setVarXTeamKey(effectiveLiveLineupTeamKey);
    setIsVarXOpen(true);
  };

  const closeVarXBoard = () => {
    dragStateRef.current = null;
    setDraggingPlayerId(null);
    setIsVarXOpen(false);
  };

  const handleVarXPlayerPointerDown = (
    teamKey: LineupTeamKey,
    playerId: string | number | null,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = {
      teamKey,
      playerId,
    };
    setDraggingPlayerId(playerId);
    document.body.style.userSelect = "none";
  };

  const resetVarXBoard = () => {
    dragStateRef.current = null;
    setDraggingPlayerId(null);
    setVarXPlayersByTeam({
      home: homeVarXPlayers,
      away: awayVarXPlayers,
    });
  };

  const shareVarXBoard = () => {
    if (!onShareVarXBoard || !selectedVarXPlayers.length) {
      return;
    }

    const teamName = selectedVarXLineupCard.team.name || "الفريق";
    const content = [
      `سبورة VAR X | ${teamName}`,
      displayedMatch.leagueName || "المباريات المباشرة",
      `${teamName} × ${varXOpponentName}`,
      selectedVarXLineup?.formation
        ? `التشكيلة: ${selectedVarXLineup.formation}`
        : null,
      varXNotes.trim()
        ? `ملاحظات المدرب:\n${varXNotes.trim()}`
        : "رسم تكتيكي قابل للتحريك من داخل VAR X.",
    ]
      .filter(Boolean)
      .join("\n");

    onShareVarXBoard({
      content,
      image: createVarXShareImage({
        leagueName: displayedMatch.leagueName || "VAR X",
        teamName,
        opponentName: varXOpponentName,
        formation: selectedVarXLineup?.formation || "سبورة المدرب",
        players: selectedVarXPlayers,
        notes: varXNotes,
      }),
    });

    closeVarXBoard();
  };

  return (
    <section className={styles.page} dir="ltr">
      <div className={styles["card-stack"]}>
        <article className={styles["match-card"]}>
          <header className={styles.header}>
            <button
              type="button"
              aria-label="VAR X"
              aria-pressed={isVarXOpen}
              className={styles["var-x-button"]}
              onClick={openVarXBoard}
            >
              <span className={styles["var-x-button-wordmark-wrap"]}>
                <img
                  src="/VAR%20X.png"
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className={styles["var-x-button-wordmark"]}
                />
              </span>
            </button>

            <div className={styles["header-copy"]}>
              <h1>{displayedMatch.leagueName}</h1>
            </div>

            <button
              type="button"
              aria-label="Match notifications"
              className={styles["bell-button"]}
            >
              <Bell size={15} strokeWidth={2.2} />
            </button>
          </header>

          {hasDisplayMatch ? (
            <>
              <section className={styles.scoreboard}>
                <div className={styles.team}>
                  <div className={styles["team-logo-wrap"]}>
                    <img
                      src={displayedMatch.home.logo || "/teams/alhilal.png"}
                      alt={displayedMatch.home.name}
                      className={styles["team-logo"]}
                    />
                  </div>
                  <span className={styles["team-name"]}>
                    {displayedMatch.home.name}
                  </span>
                </div>

                <div className={styles["score-block"]}>
                  <div className={styles.score}>
                    <span>{renderScoreValue(displayedMatch.home.score)}</span>
                    <span className={styles.dash}>-</span>
                    <span>{renderScoreValue(displayedMatch.away.score)}</span>
                  </div>

                  <div className={styles.live}>
                    <span className={styles["live-dot"]} />
                    {displayedMatch.liveLabel}
                  </div>
                </div>

                <div className={styles.team}>
                  <div className={styles["team-logo-wrap"]}>
                    <img
                      src={displayedMatch.away.logo || "/teams/alnassr.png"}
                      alt={displayedMatch.away.name}
                      className={styles["team-logo"]}
                    />
                  </div>
                  <span className={styles["team-name"]}>
                    {displayedMatch.away.name}
                  </span>
                </div>
              </section>

              <section className={styles["pressure-section"]}>
                <div className={styles["pressure-labels"]}>
                  <span>Pressure Bar</span>
                  <span className={styles["pressure-markers"]}>
                    R&nbsp;&nbsp;&nbsp;L
                  </span>
                </div>

                <div className={styles["pressure-track"]}>
                  <div className={styles["pressure-core"]} />
                  <div className={styles["pressure-glow-left"]} />
                  <div className={styles["pressure-glow-right"]} />

                  <div className={styles["pressure-bars"]}>
                    {pressureBars.map((height, index) => (
                      <span
                        key={`${height}-${index}`}
                        className={`${styles["pressure-bar"]} ${index < 7 ? styles["pressure-bar-left"] : styles["pressure-bar-right"]}`}
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {isDemoMode ? (
                <div className={styles["demo-note"]} dir="rtl">
                  {demoModeMessage}
                </div>
              ) : null}
            </>
          ) : (
            <div
              className={`${styles["empty-state"]} ${styles["match-empty-state"]}`}
              dir="rtl"
            >
              <strong>{liveStatusTitle}</strong>
              <span>{liveStatusMessage}</span>
            </div>
          )}

          <footer className={styles.footer}>
            <button
              type="button"
              className={getActionButtonClass("events")}
              onClick={() => toggleSheet("events")}
            >
              <LayoutGrid size={13} strokeWidth={2.2} />
              <span>الاحداث</span>
            </button>

            <button
              type="button"
              className={getActionButtonClass("lineup")}
              onClick={() => toggleSheet("lineup")}
            >
              <Flag size={13} strokeWidth={2.2} />
              <span>التشكيله</span>
            </button>

            <button
              type="button"
              className={getActionButtonClass("poll")}
              onClick={() => toggleSheet("poll")}
            >
              <BarChart3 size={13} strokeWidth={2.2} />
              <span>التصويت</span>
            </button>
          </footer>
        </article>

        <div
          className={`${styles["sheet-layer"]} ${isSheetOpen ? styles["sheet-layer-open"] : ""}`}
          dir="rtl"
          aria-hidden={!isSheetOpen}
        >
          <div className={styles["sheet-clip"]}>
            <section
              className={styles["bottom-sheet"]}
              aria-label="تفاصيل المباراة"
            >
              <header className={styles["sheet-header"]}>
                <button
                  type="button"
                  className={styles["sheet-close"]}
                  aria-label="إغلاق اللوحة"
                  onClick={closeSheet}
                >
                  <X size={15} strokeWidth={2.4} />
                </button>

                <div className={styles["sheet-header-copy"]}>
                  <strong>
                    {activeSheetTab === "lineup"
                      ? "التشكيلة الأساسية"
                      : activeSheetTab === "events"
                        ? "أحداث المباراة"
                        : "تصويت الجمهور"}
                  </strong>
                  <span>
                    {activeSheetTab === "lineup"
                      ? hasDisplayMatch
                        ? liveLineupSummary
                        : liveStatusTitle
                      : activeSheetTab === "events"
                        ? hasDisplayMatch
                          ? displayedEvents.length
                            ? isDemoMode
                              ? "أحداث تجريبية جاهزة"
                              : "أحداث حية مباشرة"
                            : "لا توجد أحداث بعد"
                          : liveStatusTitle
                        : "31.4 ألف مشاركة"}
                  </span>
                </div>
              </header>

              {activeSheetTab === "lineup" ? (
                hasDisplayMatch ? (
                  <div
                    className={`${styles["sheet-body"]} ${styles["lineup-view"]}`}
                  >
                    {hasLiveLineup ? (
                      <>
                        <div className={styles["lineup-team-switch"]}>
                          {lineupCards.map(
                            ({ key, team, lineup, fallbackLogo }) => (
                              <button
                                key={key}
                                type="button"
                                className={`${styles["lineup-team-button"]} ${effectiveLiveLineupTeamKey === key ? styles["lineup-team-button-active"] : ""}`}
                                onClick={() => setActiveLineupTeamKey(key)}
                                disabled={!lineup?.starters.length}
                              >
                                <img
                                  src={team.logo || fallbackLogo}
                                  alt={team.name}
                                  className={styles["lineup-team-button-logo"]}
                                />
                                <span>{team.name}</span>
                              </button>
                            ),
                          )}
                        </div>

                        {selectedLiveLineup?.starters.length ? (
                          <>
                            <article
                              className={styles["live-lineup-summary-card"]}
                            >
                              <div
                                className={styles["live-lineup-summary-team"]}
                              >
                                <img
                                  src={
                                    selectedLiveLineupCard.team.logo ||
                                    selectedLiveLineupCard.fallbackLogo
                                  }
                                  alt={selectedLiveLineupCard.team.name}
                                  className={styles["live-lineup-summary-logo"]}
                                />

                                <div
                                  className={styles["live-lineup-summary-copy"]}
                                >
                                  <strong>
                                    {selectedLiveLineupCard.team.name}
                                  </strong>
                                  <span>
                                    {selectedLiveLineup.formation ||
                                      "التشكيلة الأساسية"}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={styles["live-lineup-summary-meta"]}
                              >
                                {selectedLiveLineup.starters.length} لاعب أساسي
                              </span>
                            </article>

                            <div className={styles.pitch}>
                              <span className={styles["pitch-half-line"]} />
                              <span className={styles["pitch-center-circle"]} />
                              <span
                                className={`${styles["pitch-box"]} ${styles["pitch-box-top"]}`}
                              />
                              <span
                                className={`${styles["pitch-box"]} ${styles["pitch-box-bottom"]}`}
                              />
                              <span
                                className={`${styles["pitch-goal-box"]} ${styles["pitch-goal-box-top"]}`}
                              />
                              <span
                                className={`${styles["pitch-goal-box"]} ${styles["pitch-goal-box-bottom"]}`}
                              />
                              <span
                                className={`${styles["pitch-arc"]} ${styles["pitch-arc-top"]}`}
                              />
                              <span
                                className={`${styles["pitch-arc"]} ${styles["pitch-arc-bottom"]}`}
                              />

                              {selectedLivePitchPlayers.map((player) => (
                                <div
                                  key={`${player.id}-${player.name}`}
                                  className={styles["player-marker"]}
                                  style={getPitchMarkerStyle(player)}
                                >
                                  <span className={styles["player-disc"]}>
                                    <span className={styles["player-number"]}>
                                      {renderLineupPlayerNumber(player.number)}
                                    </span>

                                    <span
                                      className={`${styles["player-portrait"]} ${hasRenderablePlayerImage(player.image) ? styles["player-portrait-photo"] : ""}`}
                                    >
                                      {hasRenderablePlayerImage(
                                        player.image,
                                      ) ? (
                                        <img
                                          src={player.image || undefined}
                                          alt={player.name}
                                          className={styles["player-photo"]}
                                        />
                                      ) : (
                                        <>
                                          <span
                                            className={styles["portrait-head"]}
                                          />
                                          <span
                                            className={styles["portrait-body"]}
                                          />
                                        </>
                                      )}
                                    </span>
                                  </span>

                                  <span className={styles["player-name"]}>
                                    {player.name}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className={styles["lineup-details"]}>
                              <article className={styles["coach-card"]}>
                                <span className={styles["details-label"]}>
                                  الفريق المعروض
                                </span>
                                <strong>
                                  {selectedLiveLineupCard.team.name}
                                </strong>
                              </article>

                              <section className={styles["bench-card"]}>
                                <div className={styles["details-heading"]}>
                                  <span className={styles["details-label"]}>
                                    البدلاء
                                  </span>
                                  <strong>دكة البدلاء</strong>
                                </div>

                                {selectedLiveLineup.bench.length ? (
                                  <div className={styles["bench-list"]}>
                                    {selectedLiveLineup.bench.map((player) => (
                                      <span
                                        key={`${player.id}-${player.name}`}
                                        className={styles["bench-chip"]}
                                      >
                                        {renderLineupPlayerNumber(
                                          player.number,
                                        )}{" "}
                                        {player.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p
                                    className={
                                      styles["live-lineup-inline-empty"]
                                    }
                                  >
                                    لا توجد بيانات بدلاء حتى الآن.
                                  </p>
                                )}
                              </section>
                            </div>
                          </>
                        ) : (
                          <div className={styles["empty-state"]}>
                            <strong>لا توجد تشكيلة أساسية بعد</strong>
                            <span>
                              سنظهرها على أرضية الملعب فور وصولها من المصدر.
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className={styles["empty-state"]}>
                        <strong>التشكيلة غير متاحة بعد</strong>
                        <span>
                          {isDemoMode
                            ? demoModeMessage
                            : "الواجهة متصلة بالمصدر الحي، لكن هذه المباراة لم ترجع تشكيلتها بعد."}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`${styles["sheet-body"]} ${styles["lineup-view"]}`}
                  >
                    <div className={styles["empty-state"]}>
                      <strong>{liveStatusTitle}</strong>
                      <span>{liveStatusMessage}</span>
                    </div>
                  </div>
                )
              ) : activeSheetTab === "events" ? (
                <div
                  className={`${styles["sheet-body"]} ${styles["events-view"]}`}
                >
                  <div className={styles["sheet-meta"]}>
                    <span>ضغط وتبديلات</span>
                    <strong>الاحداث</strong>
                  </div>

                  {hasDisplayMatch && displayedEvents.length ? (
                    <div className={styles["events-list"]}>
                      {displayedEvents.map((event, index) => (
                        <article
                          key={`${event.minute}-${event.title}`}
                          className={styles["event-row"]}
                        >
                          <div className={styles["event-time"]}>
                            {event.minute}
                          </div>

                          <div
                            className={`${styles["event-rail"]} ${index === displayedEvents.length - 1 ? styles["event-rail-end"] : ""}`}
                            aria-hidden="true"
                          >
                            <span className={styles["event-dot"]} />
                          </div>

                          <div className={styles["event-card"]}>
                            <p className={styles["event-summary"]}>
                              {event.title} · {event.detail}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className={styles["empty-state"]}>
                      <strong>
                        {hasDisplayMatch
                          ? "لا توجد أحداث بعد"
                          : liveStatusTitle}
                      </strong>
                      <span>
                        {hasDisplayMatch
                          ? isDemoMode
                            ? demoModeMessage
                            : "سنحدث هذا القسم تلقائيًا مع أول حدث مباشر في المباراة."
                          : liveStatusMessage}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`${styles["sheet-body"]} ${styles["poll-view"]}`}
                >
                  <div className={styles["sheet-meta"]}>
                    <span>اختيار الجمهور</span>
                    <strong>التصويت</strong>
                  </div>

                  <div className={styles["poll-list"]}>
                    {pollOptions.map((option) => (
                      <article
                        key={option.label}
                        className={styles["poll-card"]}
                        style={
                          {
                            "--poll-value": option.percentage,
                            "--poll-accent": option.accent,
                          } as CSSProperties
                        }
                      >
                        <div className={styles["poll-card-head"]}>
                          <strong>{option.label}</strong>
                          <span>{option.percentage}%</span>
                        </div>

                        <div className={styles["poll-track"]}>
                          <span className={styles["poll-fill"]} />
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        <div
          className={`${styles["var-board-layer"]} ${isVarXOpen ? styles["var-board-layer-open"] : ""}`}
          dir="rtl"
          aria-hidden={!isVarXOpen}
        >
          <section
            className={styles["var-board-shell"]}
            aria-label="سبورة VAR X"
          >
            <header className={styles["var-board-header"]}>
              <div className={styles["var-board-header-copy"]}>
                <strong>VAR X سبورة المدرب</strong>
                <span>
                  {hasLiveLineup
                    ? isDemoMode
                      ? demoModeMessage
                      : "اسحب اللاعبين بحرية واكتب ملاحظاتك ثم شاركها على X."
                    : liveStatusTitle}
                </span>
              </div>

              <button
                type="button"
                className={styles["sheet-close"]}
                aria-label="إغلاق VAR X"
                onClick={closeVarXBoard}
              >
                <X size={15} strokeWidth={2.4} />
              </button>
            </header>

            <div className={styles["var-board-body"]}>
              {hasLiveLineup ? (
                <>
                  <div className={styles["lineup-team-switch"]}>
                    {lineupCards.map(({ key, team, lineup, fallbackLogo }) => (
                      <button
                        key={key}
                        type="button"
                        className={`${styles["lineup-team-button"]} ${effectiveVarXTeamKey === key ? styles["lineup-team-button-active"] : ""}`}
                        onClick={() => setVarXTeamKey(key)}
                        disabled={!lineup?.starters.length}
                      >
                        <img
                          src={team.logo || fallbackLogo}
                          alt={team.name}
                          className={styles["lineup-team-button-logo"]}
                        />
                        <span>{team.name}</span>
                      </button>
                    ))}
                  </div>

                  {selectedVarXLineup?.starters.length ? (
                    <>
                      <article className={styles["live-lineup-summary-card"]}>
                        <div className={styles["live-lineup-summary-team"]}>
                          <img
                            src={
                              selectedVarXLineupCard.team.logo ||
                              selectedVarXLineupCard.fallbackLogo
                            }
                            alt={selectedVarXLineupCard.team.name}
                            className={styles["live-lineup-summary-logo"]}
                          />

                          <div className={styles["live-lineup-summary-copy"]}>
                            <strong>{selectedVarXLineupCard.team.name}</strong>
                            <span>
                              {selectedVarXLineup.formation || "سبورة تكتيكية"}
                            </span>
                          </div>
                        </div>

                        <span className={styles["live-lineup-summary-meta"]}>
                          حرّك اللاعبين كما تريد
                        </span>
                      </article>

                      <div
                        ref={varXPitchRef}
                        className={`${styles.pitch} ${styles["var-board-pitch"]}`}
                      >
                        <img
                          src="/VAR%20X.png"
                          alt=""
                          aria-hidden="true"
                          draggable={false}
                          className={styles["var-board-watermark"]}
                        />
                        <span className={styles["pitch-half-line"]} />
                        <span className={styles["pitch-center-circle"]} />
                        <span
                          className={`${styles["pitch-box"]} ${styles["pitch-box-top"]}`}
                        />
                        <span
                          className={`${styles["pitch-box"]} ${styles["pitch-box-bottom"]}`}
                        />
                        <span
                          className={`${styles["pitch-goal-box"]} ${styles["pitch-goal-box-top"]}`}
                        />
                        <span
                          className={`${styles["pitch-goal-box"]} ${styles["pitch-goal-box-bottom"]}`}
                        />
                        <span
                          className={`${styles["pitch-arc"]} ${styles["pitch-arc-top"]}`}
                        />
                        <span
                          className={`${styles["pitch-arc"]} ${styles["pitch-arc-bottom"]}`}
                        />

                        {selectedVarXPlayers.map((player) => (
                          <button
                            key={`${player.id}-${player.name}`}
                            type="button"
                            aria-label={`حرك ${player.name}`}
                            className={`${styles["player-marker"]} ${styles["var-board-player"]} ${draggingPlayerId === player.id ? styles["var-board-player-active"] : ""}`}
                            style={getPitchMarkerStyle(player)}
                            onPointerDown={(event) =>
                              handleVarXPlayerPointerDown(
                                effectiveVarXTeamKey,
                                player.id,
                                event,
                              )
                            }
                          >
                            <span className={styles["player-disc"]}>
                              <span className={styles["player-number"]}>
                                {renderLineupPlayerNumber(player.number)}
                              </span>

                              <span
                                className={`${styles["player-portrait"]} ${hasRenderablePlayerImage(player.image) ? styles["player-portrait-photo"] : ""}`}
                              >
                                {hasRenderablePlayerImage(player.image) ? (
                                  <img
                                    src={player.image || undefined}
                                    alt={player.name}
                                    className={styles["player-photo"]}
                                  />
                                ) : (
                                  <>
                                    <span className={styles["portrait-head"]} />
                                    <span className={styles["portrait-body"]} />
                                  </>
                                )}
                              </span>
                            </span>

                            <span className={styles["player-name"]}>
                              {player.name}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className={styles["var-board-tip"]}>
                        اسحب أي لاعب على أرضية الملعب لصناعة الرسم التكتيكي
                        الخاص بك.
                      </div>

                      <article className={styles["var-board-notes-card"]}>
                        <div className={styles["details-heading"]}>
                          <span className={styles["details-label"]}>
                            ملاحظات قابلة للمشاركة
                          </span>
                          <strong>ملاحظات المدرب</strong>
                        </div>

                        <textarea
                          className={styles["var-board-notes-input"]}
                          value={varXNotes}
                          onChange={(event) => setVarXNotes(event.target.value)}
                          placeholder="اكتب ملاحظتك هنا: تقدم الظهير، ضغط عالٍ، تبديل الأدوار..."
                        />
                      </article>

                      <div className={styles["var-board-actions"]}>
                        <button
                          type="button"
                          className={styles["var-board-secondary"]}
                          onClick={resetVarXBoard}
                          disabled={!selectedVarXPlayers.length}
                        >
                          <RotateCcw size={15} strokeWidth={2.2} />
                          <span>إعادة الضبط</span>
                        </button>

                        <button
                          type="button"
                          className={styles["var-board-primary"]}
                          onClick={shareVarXBoard}
                          disabled={!canShareVarXBoard}
                        >
                          <Share2 size={15} strokeWidth={2.2} />
                          <span>مشاركة على X</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={styles["empty-state"]}>
                      <strong>لا توجد تشكيلة متاحة لـ VAR X</strong>
                      <span>
                        سنعرض اللاعبين هنا فور وصول التشكيلة من المصدر الحي.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles["empty-state"]}>
                  <strong>{liveStatusTitle}</strong>
                  <span>{liveStatusMessage}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
