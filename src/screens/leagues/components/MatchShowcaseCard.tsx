import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  Easing,
  Image,
  type ImageStyle,
  Platform,
  Pressable,
  Text as RNText,
  View,
} from "react-native";
import {
  createElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import {
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../../../lib/crossPlatformStyles";
import {
  CLICK_SOUND,
  LIVE_STREAM_ICON,
  POLL_TWEET_MACHINE_SETTLE_PAUSE,
  POLL_TWEET_MACHINE_STEP_DURATION,
  POLL_TWEET_MACHINE_STEP_PAUSE,
  POLL_TWEET_MACHINE_STEPS,
  PREVENTION_ICON,
  SMARTPHONE_ICON,
  VAR_CHAT_ICON,
} from "../leagues.constants";
import {
  parsePredictionGoalCount,
  resizePredictionSelections,
  sanitizePredictionValue,
} from "../leagues.utils";
import type { LeagueTab } from "../../../app.types";
import type { MatchPredictionLockInput } from "../../../lib/predictions/matchPrediction.utils";
import type { MatchShowcaseCardConfig } from "../leagues.types";
import { LeagueText as Text } from "./common/LeagueText";
import { GlassCard } from "./common/GlassCard";
import { ModeSwitchButton } from "./common/ModeSwitchButton";
import { FooterTabButton as MatchShowcaseFooterTabButton } from "./common/FooterTabButton";
import { MatchShowcaseMetaStrip } from "./common/MatchShowcaseMetaStrip";
import { TeamHeroPanel as MatchShowcaseHeroTeamPanel } from "./common/TeamHeroPanel";
import { Pitch } from "./lineup/Pitch";
import { PollVoteRow } from "./polls/PollVoteRow";
import { PollTweetCard } from "./polls/PollTweetCard";
import { PredictionScoreColumn } from "./predictions/PredictionScoreColumn";
import { PredictionScorerColumn } from "./predictions/PredictionScorerColumn";
import { VarChatSettingsModal } from "./VarChatSettingsModal";
import { styles } from "../leagues.styles";

type WebAudioInstance = {
  currentTime: number;
  preload?: string;
  play?: () => Promise<void> | void;
  pause?: () => void;
};

type WebAudioConstructor = new (src?: string) => WebAudioInstance;

const PREDICTION_VIDEO_CLIP_SECONDS = 30;
const PREDICTION_VIDEO_URI = "https://media.w3.org/2010/05/sintel/trailer.mp4";
const PREDICTION_VIDEO_POSTER_URI =
  "https://media.w3.org/2010/05/sintel/poster.png";

function PredictionVideoCard(props: { matchupLabel: string }) {
  const handleTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {
    const videoElement = event.currentTarget;

    if (videoElement.currentTime >= PREDICTION_VIDEO_CLIP_SECONDS) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  };

  const videoPlayer =
    Platform.OS === "web"
      ? createElement("video", {
          controls: true,
          muted: true,
          onTimeUpdate: handleTimeUpdate,
          playsInline: true,
          poster: PREDICTION_VIDEO_POSTER_URI,
          preload: "metadata",
          src: PREDICTION_VIDEO_URI,
          style: {
            backgroundColor: "#02040A",
            display: "block",
            height: "100%",
            objectFit: "cover",
            width: "100%",
          },
        })
      : null;

  return (
    <View style={styles.predictionsVideoCard}>
      <View style={styles.predictionsVideoHeaderRow}>
        <View style={styles.predictionsVideoDurationBadge}>
          <RNText style={styles.predictionsVideoDurationText}>00:30</RNText>
        </View>

        <View style={styles.predictionsVideoTitleBlock}>
          <RNText style={styles.predictionsVideoTitle}>فيديو التوقع</RNText>
          <RNText style={styles.predictionsVideoSubtitle} numberOfLines={1}>
            {props.matchupLabel}
          </RNText>
        </View>
      </View>

      <View style={styles.predictionsVideoFrame}>
        {videoPlayer ?? (
          <LinearGradient
            colors={["#10213D", "#050A13", "#1D314F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.predictionsVideoFallback}
          >
            <View style={styles.predictionsVideoPlayHalo}>
              <Ionicons name="play" size={20} color="#111827" />
            </View>
          </LinearGradient>
        )}

        <View pointerEvents="none" style={styles.predictionsVideoOverlay}>
          <View style={styles.predictionsVideoLivePill}>
            <View style={styles.predictionsVideoLiveDot} />
            <RNText style={styles.predictionsVideoLiveText}>30 SEC</RNText>
          </View>
        </View>
      </View>
    </View>
  );
}

export function MatchShowcaseCard(props: {
  config: MatchShowcaseCardConfig;
  kickoffCountdownLabel: string;
  onOpenDetails: () => void;
  onLockMatchPrediction?: (input: MatchPredictionLockInput) => void;
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
  const [isVarChatSettingsOpen, setIsVarChatSettingsOpen] = useState(false);
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
    const homeScore = homePredictionScore.trim();
    const awayScore = awayPredictionScore.trim();

    if (!homeScore || !awayScore) {
      return;
    }

    props.onLockMatchPrediction?.({
      matchId: props.config.id,
      leagueName: props.config.leagueName,
      homeTeamTitle: props.config.homeTeam.title,
      awayTeamTitle: props.config.awayTeam.title,
      homeScore,
      awayScore,
      homeScorerIds: homePredictionScorers,
      awayScorerIds: awayPredictionScorers,
      homePlayers: props.config.homeTeam.lineup,
      awayPlayers: props.config.awayTeam.lineup,
      selectedVoteTeam,
    });

    setIsPredictionSaved(true);
    void playCardClickSound();
  };

  const handleVoteTeam = (team: "home" | "away") => {
    setSelectedVoteTeam(team);
    void playCardClickSound();
  };

  return (
    <>
      <GlassCard style={styles.matchCard}>
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.38)",
            "rgba(255,255,255,0.14)",
            "rgba(255,255,255,0.05)",
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
                    setIsVarChatSettingsOpen(true);
                  }}
                  style={styles.matchShowcaseVarChatButton}
                >
                  <Image
                    source={VAR_CHAT_ICON}
                    resizeMode="contain"
                    style={styles.matchShowcaseVarChatIcon as ImageStyle}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={props.onOpenDetails}
              style={styles.matchShowcaseHeroPressable}
            >
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

              <MatchShowcaseMetaStrip
                attendance={props.config.attendance}
                stadium={props.config.stadium}
              />
            </Pressable>

            <View style={styles.matchShowcaseFooterTabsRow}>
              <MatchShowcaseFooterTabButton
                label="مباشر الآن"
                isActive={leagueTab === "live"}
                onPress={() => toggleLeagueTab("live")}
                showDivider
                accentColor="#FF6677"
                accentSurface="rgba(255,82,112,0.16)"
                iconSource={LIVE_STREAM_ICON}
              />
              <MatchShowcaseFooterTabButton
                label="التوقعات"
                isActive={leagueTab === "predictions"}
                onPress={() => toggleLeagueTab("predictions")}
                showDivider
                accentColor="#FFDE97"
                accentSurface="rgba(255,214,126,0.14)"
                iconSource={PREVENTION_ICON}
                iconStyle={[
                  styles.matchShowcaseFooterAssetIconLarge as ImageStyle,
                  styles.matchShowcaseFooterPredictionIcon as ImageStyle,
                ]}
              />
              <MatchShowcaseFooterTabButton
                label="الأحداث"
                isActive={leagueTab === "events"}
                onPress={() => toggleLeagueTab("events")}
                accentColor="#63C6FF"
                accentSurface="rgba(99,198,255,0.14)"
                iconSource={SMARTPHONE_ICON}
                iconStyle={styles.matchShowcaseFooterAssetIconLarge as ImageStyle}
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
              <View style={styles.predictionsSection}>
                <View style={styles.predictionsBoard}>
                  <View style={styles.predictionsTitleRow}>
                    <View style={styles.predictionsHeaderBadge}>
                      <Ionicons name="flash" size={14} color="#111827" />
                    </View>
                    <View style={styles.predictionsTitleCopy}>
                      <RNText style={styles.predictionsTitleText}>
                        التوقع
                      </RNText>
                      <RNText
                        style={styles.predictionsMatchText}
                        numberOfLines={1}
                      >
                        {props.config.leagueName}
                      </RNText>
                    </View>
                  </View>

                  <View style={styles.predictionsScoreRow}>
                    <PredictionScoreColumn
                      side="left"
                      iconSource={props.config.homeTeam.iconSource}
                      onChangeScore={(nextValue) =>
                        setHomePredictionScore(
                          sanitizePredictionValue(nextValue),
                        )
                      }
                      scoreValue={homePredictionScore}
                      teamGradient={props.config.homeTeam.gradient}
                      teamLabel={props.config.homeTeam.title}
                      teamShortName={props.config.homeTeam.shortName}
                    />

                    <View style={styles.predictionsVsBadge}>
                      <RNText style={styles.predictionsVsText}>VS</RNText>
                    </View>

                    <PredictionScoreColumn
                      side="right"
                      iconSource={props.config.awayTeam.iconSource}
                      onChangeScore={(nextValue) =>
                        setAwayPredictionScore(
                          sanitizePredictionValue(nextValue),
                        )
                      }
                      scoreValue={awayPredictionScore}
                      teamGradient={props.config.awayTeam.gradient}
                      teamLabel={props.config.awayTeam.title}
                      teamShortName={props.config.awayTeam.shortName}
                    />
                  </View>

                  {homePredictionGoalCount > 0 ||
                  awayPredictionGoalCount > 0 ? (
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
                  onPress={() => {
                    void playCardClickSound();
                    toggleLeagueTab("lineup");
                  }}
                  style={styles.predictionsVarLineupButton}
                >
                  <View style={styles.predictionsVarLineupIconWrap}>
                    <Ionicons name="shirt-outline" size={20} color="#111827" />
                  </View>
                  <View style={styles.predictionsVarLineupCopy}>
                    <RNText style={styles.predictionsVarLineupTitle}>
                      تشكيلة VAR
                    </RNText>
                    <RNText style={styles.predictionsVarLineupSubtitle}>
                      عرض التشكيلة قبل تثبيت التوقع
                    </RNText>
                  </View>
                </Pressable>

                <PredictionVideoCard matchupLabel={props.config.leagueName} />

                <Pressable
                  onPress={handleSavePrediction}
                  style={[
                    styles.predictionsSaveButton,
                    isPredictionSaved
                      ? styles.predictionsSaveButtonSaved
                      : null,
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
                      colors={[
                        "#05070D",
                        "rgba(5,7,13,0.92)",
                        "rgba(5,7,13,0)",
                      ]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={[
                        styles.pollTweetFadeTop,
                        getWebPointerEventsStyle("none"),
                      ]}
                    />

                    <LinearGradient
                      {...getNativePointerEventsProps("none")}
                      colors={[
                        "rgba(5,7,13,0)",
                        "rgba(5,7,13,0.92)",
                        "#05070D",
                      ]}
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

      <VarChatSettingsModal
        visible={isVarChatSettingsOpen}
        onClose={() => setIsVarChatSettingsOpen(false)}
      />
    </>
  );
}
