import { useEffect, useState, type CSSProperties } from "react";
import { BarChart3, Bell, Flag, LayoutGrid, X } from "lucide-react";
import {
  fetchLeaguesLiveMatch,
  type LiveLeaguesMatch,
  type LiveLeaguesTeamLineup,
} from "../lib/leaguesLiveApi";
import styles from "../pages-css/LeaguesPage.module.css";

const pressureBars = [20, 20, 21, 22, 24, 25, 27, 29, 31, 29, 24, 20];

type SheetTab = "lineup" | "events" | "poll";
type LineupTeamKey = "home" | "away";

const liveLineupColors: Record<LineupTeamKey, [string, string]> = {
  home: ["#69c8ff", "#2448a9"],
  away: ["#ffc172", "#a24f1a"],
};

type PlayerSpot = {
  name: string;
  number: number;
  top: string;
  left: string;
  colors: [string, string];
};

type MatchEvent = {
  minute: string;
  title: string;
  detail: string;
};

type PollOption = {
  label: string;
  percentage: number;
  votes: string;
  accent: string;
};

const lineupPlayers: PlayerSpot[] = [
  {
    name: "بونو",
    number: 37,
    top: "86%",
    left: "50%",
    colors: ["#64b5ff", "#2448a9"],
  },
  {
    name: "لودي",
    number: 6,
    top: "70%",
    left: "17%",
    colors: ["#8bb7ff", "#305fd6"],
  },
  {
    name: "كوليبالي",
    number: 3,
    top: "73%",
    left: "36%",
    colors: ["#9dc7ff", "#3f6dce"],
  },
  {
    name: "البليهي",
    number: 5,
    top: "73%",
    left: "64%",
    colors: ["#78a8ff", "#244eb2"],
  },
  {
    name: "كانسيلو",
    number: 20,
    top: "70%",
    left: "83%",
    colors: ["#99d3ff", "#4778ea"],
  },
  {
    name: "روبين نيفيز",
    number: 8,
    top: "56%",
    left: "38%",
    colors: ["#ffd5b2", "#d1712d"],
  },
  {
    name: "سافيتش",
    number: 22,
    top: "56%",
    left: "62%",
    colors: ["#ffe0bf", "#c77c1d"],
  },
  {
    name: "مالكوم",
    number: 77,
    top: "34%",
    left: "18%",
    colors: ["#ffa9ca", "#b53474"],
  },
  {
    name: "سالم",
    number: 29,
    top: "40%",
    left: "50%",
    colors: ["#ffd9a4", "#c57c1d"],
  },
  {
    name: "ليوناردو",
    number: 11,
    top: "34%",
    left: "82%",
    colors: ["#caa9ff", "#7441d8"],
  },
  {
    name: "ميتروفيتش",
    number: 9,
    top: "16%",
    left: "50%",
    colors: ["#ffd0d8", "#c04867"],
  },
];

const matchEvents: MatchEvent[] = [
  {
    minute: "12'",
    title: "اختراق مبكر من الجهة اليمنى",
    detail:
      "الهلال خلق أفضلية عددية على الطرف وهدد المرمى بعرضية سريعة داخل المنطقة.",
  },
  {
    minute: "33'",
    title: "ضغط عالٍ من منتصف الملعب",
    detail:
      "الثنائي روبين نيفيز وسافيتش رفعا النسق وأجبرا المنافس على التمرير للخلف.",
  },
  {
    minute: "57'",
    title: "تعديل في تمركز الأظهرة",
    detail:
      "كانسيلو ولودي تقدما أكثر لتوسيع الملعب وفتح مسارات بينية خلف خط الوسط.",
  },
  {
    minute: "79'",
    title: "هجمة حاسمة من العمق",
    detail:
      "سالم استلم بين الخطوط ثم مرر في نصف المسافة إلى ميتروفيتش داخل القوس الهجومي.",
  },
];

const lineupCoach = "خورخي خيسوس";

const lineupSubstitutes = [
  "21 ياسين بونو",
  "88 حمد اليامي",
  "16 ناصر الدوسري",
  "28 محمد كنو",
  "14 مصعب الجوير",
  "7 ميشيل",
  "99 عبدالله الحمدان",
];

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

const fallbackLeaguesMatch: LiveLeaguesMatch = {
  fixtureId: null,
  leagueName: "Champions League",
  liveLabel: "LIVE",
  home: {
    name: "Al Hilal",
    logo: "/teams/alhilal.png",
    score: 3,
  },
  away: {
    name: "Al Nassr",
    logo: "/teams/alnassr.png",
    score: 2,
  },
  events: matchEvents,
  lineup: null,
};

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
      style: {
        top: `${top}%`,
        left: `${columnPositions[playerIndex] ?? 50}%`,
        "--player-primary": primaryColor,
        "--player-secondary": secondaryColor,
      } as CSSProperties,
    }));
  });
}

export default function LeaguesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeSheetTab, setActiveSheetTab] = useState<SheetTab>("lineup");
  const [activeLineupTeamKey, setActiveLineupTeamKey] =
    useState<LineupTeamKey>("home");
  const [liveMatch, setLiveMatch] = useState<LiveLeaguesMatch | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLiveMatch = async () => {
      const response = await fetchLeaguesLiveMatch();

      if (cancelled) {
        return;
      }

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

  const displayedMatch = liveMatch || fallbackLeaguesMatch;
  const displayedEvents = liveMatch
    ? liveMatch.events
    : fallbackLeaguesMatch.events;
  const displayedLineup = liveMatch?.lineup ?? null;
  const hasLiveLineup = Boolean(
    displayedLineup?.home?.starters.length ||
    displayedLineup?.away?.starters.length ||
    displayedLineup?.home?.bench.length ||
    displayedLineup?.away?.bench.length,
  );
  const liveLineupSummary =
    [displayedLineup?.home?.formation, displayedLineup?.away?.formation]
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
      lineup: displayedLineup?.home,
      fallbackLogo: "/teams/alhilal.png",
    },
    {
      key: "away",
      team: displayedMatch.away,
      lineup: displayedLineup?.away,
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
  const selectedLivePitchPlayers = selectedLiveLineup
    ? buildLivePitchMarkers(
        selectedLiveLineup.starters,
        effectiveLiveLineupTeamKey,
      )
    : [];

  return (
    <section className={styles.page} dir="ltr">
      <div className={styles["card-stack"]}>
        <article className={styles["match-card"]}>
          <header className={styles.header}>
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
                      ? liveMatch
                        ? liveLineupSummary
                        : "4-2-3-1"
                      : activeSheetTab === "events"
                        ? liveMatch
                          ? displayedEvents.length
                            ? "أحداث حية مباشرة"
                            : "لا توجد أحداث بعد"
                          : "ضغط وتبديلات"
                        : "31.4 ألف مشاركة"}
                  </span>
                </div>
              </header>

              {activeSheetTab === "lineup" ? (
                liveMatch ? (
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
                                  style={player.style}
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
                          الواجهة متصلة بالمصدر الحي، لكن هذه المباراة لم ترجع
                          تشكيلتها بعد.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`${styles["sheet-body"]} ${styles["lineup-view"]}`}
                  >
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

                      {lineupPlayers.map((player) => (
                        <div
                          key={`${player.number}-${player.name}`}
                          className={styles["player-marker"]}
                          style={
                            {
                              top: player.top,
                              left: player.left,
                              "--player-primary": player.colors[0],
                              "--player-secondary": player.colors[1],
                            } as CSSProperties
                          }
                        >
                          <span className={styles["player-disc"]}>
                            <span className={styles["player-number"]}>
                              {player.number}
                            </span>

                            <span className={styles["player-portrait"]}>
                              <span className={styles["portrait-head"]} />
                              <span className={styles["portrait-body"]} />
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
                        <span className={styles["details-label"]}>المدرب</span>
                        <strong>{lineupCoach}</strong>
                      </article>

                      <section className={styles["bench-card"]}>
                        <div className={styles["details-heading"]}>
                          <span className={styles["details-label"]}>
                            البدلاء
                          </span>
                          <strong>قائمة الدكة</strong>
                        </div>

                        <div className={styles["bench-list"]}>
                          {lineupSubstitutes.map((substitute) => (
                            <span
                              key={substitute}
                              className={styles["bench-chip"]}
                            >
                              {substitute}
                            </span>
                          ))}
                        </div>
                      </section>
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

                  {displayedEvents.length ? (
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
                      <strong>لا توجد أحداث بعد</strong>
                      <span>
                        سنحدث هذا القسم تلقائيًا مع أول حدث مباشر في المباراة.
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

                        <div className={styles["poll-votes"]}>
                          {option.votes}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
