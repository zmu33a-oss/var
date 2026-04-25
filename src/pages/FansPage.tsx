import { useEffect, useState } from "react";
import {
  Award,
  Check,
  ChevronDown,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Repeat2,
  Share,
} from "lucide-react";
import hilalMenuGif from "../assets/fans-menu/hilal.webp";
import nassrMenuGif from "../assets/fans-menu/nassr.webp";
import ittihadMenuGif from "../assets/fans-menu/ittihad.webp";
import { useAuth } from "../lib/AuthContext";
import {
  createEmptyFanSupportSnapshot,
  fetchFanSupportSnapshot,
  isFanSupportSchemaCacheMiss,
  setFanTeamSupport,
  toCounterDigits,
  type FanSupportSnapshot,
  type FanSupportTeamId,
} from "../lib/fanSupport";
import {
  fetchTikTokVideosFromDatabase,
  type TikTokVideo,
} from "../lib/tiktokTables";
import styles from "../pages-css/FansPage.module.css";

const trendRankLabels = ["1", "2", "3"] as const;

const normalizeVideoUrl = (rawUrl: string) => {
  const cleaned = rawUrl.trim().replace(/^[^a-zA-Z]+/, "");
  if (!cleaned) {
    return "";
  }

  const withScheme = /^https?:\/\//i.test(cleaned)
    ? cleaned
    : cleaned.startsWith("//")
      ? `https:${cleaned}`
      : `https://${cleaned}`;

  try {
    const parsed = new URL(withScheme);
    if (!parsed.hostname.includes(".")) {
      return "";
    }

    return parsed.toString();
  } catch {
    return "";
  }
};

const getTrendScore = (video: TikTokVideo) =>
  video.stats.likes +
  video.stats.comments +
  video.stats.saves +
  video.stats.shares;

const feedScreens = [
  {
    id: "hilal",
    title: "رابطة الهلال",
    headerLabel: "الهاشتاق المركز الاول",
    browserLabel: "#رابطة-الهلال",
    footer: "شاشة رابطة الهلال",
    tweets: [
      {
        id: 1,
        author: "سلمان الزهراني",
        handle: "@hilalvoice",
        avatar: "🧔🏻",
        time: "5m",
        text: "المدرج اليوم نار. نحتاج بداية ضغط عالية وأول ربع ساعة لازم يكون فيها حضور صوتي كامل.",
        likes: 284,
        replies: 46,
        reposts: 19,
        shares: 0,
      },
      {
        id: 2,
        author: "جود",
        handle: "@bluecurve",
        avatar: "👩🏻",
        time: "20m",
        text: "خلوا بداية الهتاف موحدة وخلو الرد يطلع من يمين المدرج ثم يكمل من النص بدون انقطاع.",
        likes: 167,
        replies: 22,
        reposts: 13,
        shares: 0,
      },
    ],
  },
  {
    id: "nassr",
    title: "رابطة النصر",
    headerLabel: "شاشة رابطة النصر",
    browserLabel: "#رابطة-النصر",
    footer: "المدرج الأصفر",
    tweets: [
      {
        id: 3,
        author: "عبدالله",
        handle: "@nassrwave",
        avatar: "🧑🏽",
        time: "8m",
        text: "إذا بدأ الضغط من بدري لازم يبان الرد في المدرج كامل ونرفع الإيقاع مع أول فرصة خطرة.",
        likes: 231,
        replies: 29,
        reposts: 16,
        shares: 0,
      },
      {
        id: 4,
        author: "رهف",
        handle: "@sunstand",
        avatar: "👩🏽",
        time: "12m",
        text: "ثبتوا جملة التشجيع الأساسية قبل النزول لأرضية الملعب بخمس دقائق عشان يدخل الصوت مرتب.",
        likes: 154,
        replies: 18,
        reposts: 9,
        shares: 0,
      },
    ],
  },
] as const;

const supportTeams = [
  {
    id: "hilal",
    name: "الهلال",
    logoSrc: "/teams/alhilal.png",
    backdropSrc: hilalMenuGif,
    cardClassName: styles.teamMenuCardHilal,
  },
  {
    id: "nassr",
    name: "النصر",
    logoSrc: "/teams/alnassr.png",
    backdropSrc: nassrMenuGif,
    cardClassName: styles.teamMenuCardNassr,
  },
  {
    id: "ittihad",
    name: "الاتحاد",
    logoSrc: "/teams/alittihad.svg",
    backdropSrc: ittihadMenuGif,
    cardClassName: styles.teamMenuCardIttihad,
  },
] as const;

const FansPage = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [supportSnapshot, setSupportSnapshot] = useState<FanSupportSnapshot>(
    createEmptyFanSupportSnapshot,
  );
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportTableReady, setSupportTableReady] = useState(true);
  const [pendingTeamId, setPendingTeamId] = useState<FanSupportTeamId | null>(
    null,
  );
  const [trendVideos, setTrendVideos] = useState<TikTokVideo[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [activeTrendId, setActiveTrendId] = useState<number | null>(null);
  const [isTopSheetPeekHidden, setIsTopSheetPeekHidden] = useState(false);

  useEffect(() => {
    let isDisposed = false;

    setSupportLoading(true);

    void fetchFanSupportSnapshot(user?.id)
      .then(({ snapshot, tableReady }) => {
        if (!isDisposed) {
          setSupportSnapshot(snapshot);
          setSupportTableReady(tableReady);
        }
      })
      .finally(() => {
        if (!isDisposed) {
          setSupportLoading(false);
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [user?.id]);

  useEffect(() => {
    let isDisposed = false;

    setTrendLoading(true);

    void fetchTikTokVideosFromDatabase(user?.id)
      .then((videos) => {
        if (isDisposed) {
          return;
        }

        const nextTrendVideos = videos
          .map((video) => ({
            ...video,
            video_url: normalizeVideoUrl(video.video_url),
          }))
          .filter((video) => Boolean(video.video_url))
          .sort((left, right) => getTrendScore(right) - getTrendScore(left))
          .slice(0, trendRankLabels.length);

        setTrendVideos(nextTrendVideos);
        setActiveTrendId((current) =>
          current && nextTrendVideos.some((video) => video.id === current)
            ? current
            : (nextTrendVideos[0]?.id ?? null),
        );
      })
      .catch((error) => {
        console.warn("Failed to load fan trend videos", error);

        if (!isDisposed) {
          setTrendVideos([]);
          setActiveTrendId(null);
        }
      })
      .finally(() => {
        if (!isDisposed) {
          setTrendLoading(false);
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (isOpen) {
      setIsTopSheetPeekHidden(false);
      return;
    }

    let lastScrollY = window.scrollY;
    let frameId = 0;

    const updateTopSheetPeek = () => {
      frameId = 0;

      const nextScrollY = window.scrollY;
      const scrollDelta = nextScrollY - lastScrollY;

      if (Math.abs(scrollDelta) < 6) {
        return;
      }

      setIsTopSheetPeekHidden(scrollDelta > 0 && nextScrollY > 24);
      lastScrollY = nextScrollY;
    };

    const handleScroll = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(updateTopSheetPeek);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isOpen]);

  const toggleTeamSupport = async (teamId: FanSupportTeamId) => {
    if (!user?.id || pendingTeamId === teamId || !supportTableReady) {
      return;
    }

    const nextSupported = !supportSnapshot.supportedByMe[teamId];

    setPendingTeamId(teamId);

    try {
      await setFanTeamSupport(teamId, user.id, nextSupported);
      const { snapshot, tableReady } = await fetchFanSupportSnapshot(user.id);
      setSupportSnapshot(snapshot);
      setSupportTableReady(tableReady);
    } catch (error) {
      console.warn("Failed to update fan support", error);

      if (isFanSupportSchemaCacheMiss(error)) {
        setSupportTableReady(false);
      }

      const { snapshot, tableReady } = await fetchFanSupportSnapshot(user.id);
      setSupportSnapshot(snapshot);
      setSupportTableReady(tableReady);
    } finally {
      setPendingTeamId(null);
    }
  };

  const triggerDigits = toCounterDigits(supportSnapshot.counts.hilal);
  const activeTrendVideo =
    trendVideos.find((video) => video.id === activeTrendId) ??
    trendVideos[0] ??
    null;

  return (
    <div className={styles.fansPage} dir="rtl">
      <div className={styles.backdropGlow} />

      <div
        className={`${styles.topSheet} ${
          isOpen ? styles.topSheetOpen : ""
        } ${!isOpen && isTopSheetPeekHidden ? styles.topSheetPeekHidden : ""}`}
      >
        <div className={styles.sheetContent}>
          <div className={styles.sheetFrame}>
            <div className={styles.sheetSectionHeader}>
              <p className={styles.sheetEyebrow}>لوحة التشجيع السريعة</p>
              <h3 className={styles.sheetTitle}>اختر الفريق وابدأ التشجيع</h3>
            </div>

            <div className={styles.sheetCards}>
              {supportTeams.map((team) => {
                const isSupported = supportSnapshot.supportedByMe[team.id];
                const teamDigits = toCounterDigits(
                  supportSnapshot.counts[team.id],
                );
                const isPending = pendingTeamId === team.id;

                return (
                  <article
                    key={team.id}
                    className={`${styles.teamMenuCard} ${team.cardClassName}`}
                  >
                    <img
                      src={team.backdropSrc}
                      alt={team.name}
                      className={styles.teamCardBackdrop}
                    />

                    <div className={styles.teamCardBody}>
                      <h4 className={styles.teamCardTitle}>{team.name}</h4>

                      <div className={styles.teamCardControls}>
                        <button
                          className={`${styles.cheerButton} ${isSupported ? styles.cheerButtonActive : ""}`}
                          onClick={() => {
                            void toggleTeamSupport(team.id);
                          }}
                          type="button"
                          aria-pressed={isSupported}
                          aria-busy={isPending}
                          disabled={
                            !user?.id ||
                            supportLoading ||
                            isPending ||
                            !supportTableReady
                          }
                          title={
                            !user?.id
                              ? "سجل الدخول للتشجيع"
                              : !supportTableReady
                                ? "جدول التشجيع لم يتفعّل بعد في Supabase"
                                : undefined
                          }
                        >
                          {isSupported ? (
                            <Check className={styles.cheerButtonIcon} />
                          ) : (
                            <Plus className={styles.cheerButtonIcon} />
                          )}
                          <span>{isSupported ? "تم" : "شجع"}</span>
                        </button>

                        <span
                          className={styles.teamCardDigits}
                          aria-hidden="true"
                        >
                          {teamDigits.map((digit, index) => (
                            <span
                              key={`${team.id}-${digit}-${index}`}
                              className={styles.teamCardDigit}
                            >
                              {digit}
                            </span>
                          ))}
                        </span>

                        <span
                          className={styles.teamCardLogoWrap}
                          aria-hidden="true"
                        >
                          <img
                            src={team.logoSrc}
                            alt=""
                            className={styles.teamCardLogo}
                          />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.triggerWrap}>
          <button
            className={styles.trigger}
            onClick={() => setIsOpen((prev) => !prev)}
            type="button"
            aria-label="جمهور الهلال"
          >
            <span className={styles.triggerChip}>شجع</span>

            <span className={styles.triggerDigits} aria-hidden="true">
              {triggerDigits.map((digit, index) => (
                <span key={`${digit}-${index}`} className={styles.triggerDigit}>
                  {digit}
                </span>
              ))}
            </span>

            <span className={styles.triggerLogoWrap} aria-hidden="true">
              <img
                src="/teams/alhilal.png"
                alt=""
                className={styles.triggerLogo}
              />
            </span>

            <span className={styles.triggerTail} aria-hidden="true">
              <ChevronDown
                className={`${styles.triggerArrow} ${isOpen ? styles.triggerArrowOpen : ""}`}
              />
            </span>

            <span className={styles.triggerBadge} aria-hidden="true">
              1
            </span>
            <span className={styles.triggerLabel}>جمهور الهلال</span>
          </button>
        </div>
      </div>

      {/* الأوفرلاي للإغلاق بالضغط خارج البانل */}
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} />
      )}

      {/* المحتوى الرئيسي */}
      <div className={styles.contentShell}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>الأكثر تفاعلاً اليوم</h2>
          <Award className={styles.sectionIcon} />
        </div>

        <div className={styles.trendStageWrap}>
          <article
            className={styles.trendStage}
            aria-label="اقتباس ترند تيك توك"
          >
            <div className={styles.trendStageChrome} aria-hidden="true">
              <div className={styles.trendStageDots}>
                <span
                  className={`${styles.trendStageDot} ${styles.trendStageDotRed}`}
                />
                <span
                  className={`${styles.trendStageDot} ${styles.trendStageDotAmber}`}
                />
                <span
                  className={`${styles.trendStageDot} ${styles.trendStageDotGreen}`}
                />
              </div>

              <div className={styles.trendStageAddress}>trend.tiktok.quote</div>
            </div>

            <div className={styles.trendStageBody}>
              <div className={styles.trendStageSidebar}>
                <div className={styles.trendSidebarHeader}>
                  <span className={styles.trendSidebarEyebrow}>اقتباس</span>
                  <h3 className={styles.trendSidebarTitle}>ترند تيك توك</h3>
                </div>

                <div className={styles.trendOptionList}>
                  {trendRankLabels.map((label, index) => {
                    const video = trendVideos[index] ?? null;
                    const isActive = video
                      ? video.id === activeTrendVideo?.id
                      : false;

                    return (
                      <button
                        key={label}
                        className={`${styles.trendOptionButton} ${isActive ? styles.trendOptionButtonActive : ""}`}
                        onClick={() => {
                          if (video) {
                            setActiveTrendId(video.id);
                          }
                        }}
                        type="button"
                        aria-pressed={isActive}
                        disabled={!video}
                      >
                        <span className={styles.trendOptionLabel}>{label}</span>
                        <span className={styles.trendOptionChip}>
                          {video ? "معاينة" : trendLoading ? "تحميل" : "فارغ"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.trendVideoPane}>
                <div className={styles.trendVideoShell}>
                  <div className={styles.trendVideoCanvas}>
                    {activeTrendVideo ? (
                      <video
                        key={activeTrendVideo.id}
                        className={styles.trendVideoMedia}
                        src={activeTrendVideo.video_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className={styles.trendVideoFallback} />
                    )}

                    <div className={styles.trendVideoOverlay}>
                      <div className={styles.trendOverlayTopRow}>
                        <span className={styles.trendOverlayBadge}>
                          Trending Now
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className={styles.feedList}>
          {feedScreens.map((screen) => {
            const animatedTweets = [...screen.tweets, ...screen.tweets];

            return (
              <article
                key={screen.id}
                className={styles.feedStage}
                aria-label={`شاشة ${screen.title}`}
              >
                <div className={styles.feedDeviceBar} aria-hidden="true">
                  <div className={styles.feedBrowserDots}>
                    <span
                      className={`${styles.feedBrowserDot} ${styles.feedBrowserDotRed}`}
                    />
                    <span
                      className={`${styles.feedBrowserDot} ${styles.feedBrowserDotAmber}`}
                    />
                    <span
                      className={`${styles.feedBrowserDot} ${styles.feedBrowserDotGreen}`}
                    />
                  </div>

                  <div className={styles.feedBrowserAddress}>
                    <span className={styles.feedBrowserAddressText}>
                      {screen.browserLabel}
                    </span>
                  </div>

                  <div className={styles.feedDeviceMetrics}>
                    <span className={styles.feedDeviceMetric}>X</span>
                    <span className={styles.feedDeviceMetric}>LIVE</span>
                  </div>
                </div>

                <div className={styles.feedWindow}>
                  <div className={styles.feedWindowHeader}>
                    <div className={styles.feedWindowMeta}>
                      <span className={styles.feedLiveBadge}>ON</span>

                      <div className={styles.feedHeaderCopy}>
                        <span className={styles.feedHeaderTitle}>
                          {screen.headerLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.feedRail}>
                    <div className={styles.feedRailTrack}>
                      {animatedTweets.map((post, index) => (
                        <article
                          key={`${screen.id}-${post.id}-${index}`}
                          className={styles.feedTweet}
                          aria-hidden={index >= screen.tweets.length}
                        >
                          <div className={styles.feedPostContent}>
                            <div className={styles.feedPostTopRow}>
                              <span
                                className={styles.feedPostMenuTrigger}
                                aria-hidden="true"
                              >
                                <MoreHorizontal size={18} />
                              </span>

                              <div className={styles.feedPostUserInfo}>
                                <span className={styles.feedPostUserName}>
                                  {post.author}
                                </span>
                                <span>{post.handle}</span>
                                <span>• {post.time}</span>
                              </div>
                            </div>

                            <p className={styles.feedPostText}>{post.text}</p>

                            <div className={styles.feedPostActions}>
                              <span className={styles.feedActionItem}>
                                <MessageCircle size={16} />
                                {post.replies}
                              </span>
                              <span className={styles.feedActionItem}>
                                <Repeat2 size={16} />
                                {post.reposts}
                              </span>
                              <span className={styles.feedActionItem}>
                                <Heart size={16} />
                                {post.likes}
                              </span>
                              <span className={styles.feedActionItem}>
                                <Share size={16} />
                                {post.shares}
                              </span>
                            </div>
                          </div>

                          <div
                            className={styles.feedPostAvatar}
                            aria-hidden="true"
                          >
                            {post.author.charAt(0)}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className={styles.feedFooter}>
                    <div className={styles.feedFooterStatus}>
                      <span
                        className={styles.feedFooterDot}
                        aria-hidden="true"
                      />
                      <span>{screen.footer}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FansPage;
