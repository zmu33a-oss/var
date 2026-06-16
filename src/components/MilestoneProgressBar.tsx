import { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { TextStyle, ViewStyle } from "react-native";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";

const MAX_POINTS = 300;
const POINTER_WIDTH = 58;
const COMPACT_CONNECTOR_HEIGHT = 2;
const COMPACT_BADGE_SIZE = 34;
const COMPACT_CHECK_SIZE = 18;
const COMPACT_MILESTONE_EDGE_INSET = COMPACT_BADGE_SIZE / 2 + 4;
const COMPACT_GOLD_OFFSET = 8;
const COMPACT_MILESTONE_TRACK_PROGRESS: Record<string, number> = {
  silver: 0.72,
  bronze: 0.44,
};
const COMPACT_MEDAL_TOP = 22;
const COMPACT_CHECK_TOP = COMPACT_MEDAL_TOP + COMPACT_BADGE_SIZE + 5;
const COMPACT_CONNECTOR_TOP =
  COMPACT_CHECK_TOP + (COMPACT_CHECK_SIZE - COMPACT_CONNECTOR_HEIGHT) / 2;
const COMPACT_META_TOP = COMPACT_CHECK_TOP + COMPACT_CHECK_SIZE + 8;
const COMPACT_TRACK_DARK = "#FFFFFF";

type RewardTone = "bronze" | "silver" | "gold";

type RewardMilestone = {
  id: string;
  label: string;
  points: number;
  tone: RewardTone;
};

export type MilestoneProgressBarProps = {
  compactProfile?: boolean;
  embedded?: boolean;
  initialPoints?: number;
  onPointsChange?: (points: number) => void;
  points?: number;
  showControls?: boolean;
  showHeader?: boolean;
  style?: ViewStyle;
  titleTextStyle?: TextStyle;
};

const REWARD_MILESTONES: RewardMilestone[] = [
  { id: "bronze", label: "برونزي", points: 100, tone: "bronze" },
  { id: "silver", label: "فضي", points: 200, tone: "silver" },
  { id: "gold", label: "ذهبي", points: 300, tone: "gold" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resolveRtlCenterX(trackWidth: number, points: number) {
  const ratio = clamp(points / MAX_POINTS, 0, 1);

  return trackWidth - ratio * trackWidth;
}

function resolveSlotLeft(
  trackWidth: number,
  points: number,
  slotWidth: number,
) {
  return clamp(
    resolveRtlCenterX(trackWidth, points) - slotWidth / 2,
    0,
    Math.max(0, trackWidth - slotWidth),
  );
}

function resolveCompactMilestoneCenterX(trackWidth: number, milestoneId: string) {
  if (milestoneId === "gold") {
    return COMPACT_BADGE_SIZE / 2 + COMPACT_GOLD_OFFSET;
  }

  const usable = Math.max(0, trackWidth - COMPACT_MILESTONE_EDGE_INSET * 2);
  const progress = COMPACT_MILESTONE_TRACK_PROGRESS[milestoneId] ?? 0;

  return trackWidth - COMPACT_MILESTONE_EDGE_INSET - progress * usable;
}

function resolveCompactStartCenterX(trackWidth: number) {
  return trackWidth - COMPACT_CHECK_SIZE / 2 - 4;
}

function resolveCompactSlotLeft(
  trackWidth: number,
  milestoneId: string,
  slotWidth: number,
) {
  return resolveCompactMilestoneCenterX(trackWidth, milestoneId) - slotWidth / 2;
}

type CompactConnectorSegment = {
  left: number;
  width: number;
};

function buildCompactConnectorSegments(trackWidth: number): CompactConnectorSegment[] {
  const goldX = resolveCompactMilestoneCenterX(trackWidth, "gold");
  const silverX = resolveCompactMilestoneCenterX(trackWidth, "silver");
  const bronzeX = resolveCompactMilestoneCenterX(trackWidth, "bronze");
  const startX = resolveCompactStartCenterX(trackWidth);
  const gap = COMPACT_CHECK_SIZE / 2 + 2;

  return [
    {
      left: goldX + gap,
      width: Math.max(0, silverX - goldX - gap * 2),
    },
    {
      left: silverX + gap,
      width: Math.max(0, bronzeX - silverX - gap * 2),
    },
    {
      left: bronzeX + gap,
      width: Math.max(0, startX - bronzeX - gap * 2),
    },
  ].filter((segment) => segment.width > 0);
}

function resolveSegmentFillWidths(
  segments: CompactConnectorSegment[],
  progressRatio: number,
) {
  const total = segments.reduce((sum, segment) => sum + segment.width, 0);

  if (total <= 0) {
    return segments.map(() => 0);
  }

  let remaining = total * clamp(progressRatio, 0, 1);

  return [...segments]
    .reverse()
    .map((segment) => {
      const filled = Math.min(segment.width, remaining);
      remaining -= filled;
      return filled;
    })
    .reverse();
}

const MEDAL_PALETTES: Record<
  RewardTone,
  {
    ribbon: string;
    ribbonDark: string;
    rim: string;
    fillTop: string;
    fillMid: string;
    fillBottom: string;
    star: string;
    highlight: string;
  }
> = {
  bronze: {
    ribbon: "#B8652D",
    ribbonDark: "#7A3F18",
    rim: "#FFD7A8",
    fillTop: "#F2B06A",
    fillMid: "#C9783D",
    fillBottom: "#8B4513",
    star: "#5C2E0A",
    highlight: "#FFE6C4",
  },
  silver: {
    ribbon: "#7D8FA6",
    ribbonDark: "#536173",
    rim: "#FFFFFF",
    fillTop: "#FFFFFF",
    fillMid: "#C7D2DE",
    fillBottom: "#8FA0B3",
    star: "#334155",
    highlight: "#F8FAFC",
  },
  gold: {
    ribbon: "#B8860B",
    ribbonDark: "#7A5200",
    rim: "#FFF3B0",
    fillTop: "#FFE566",
    fillMid: "#FFC107",
    fillBottom: "#C69200",
    star: "#7A5200",
    highlight: "#FFF9D6",
  },
};

function RewardBadge(props: {
  animatedScale: Animated.Value;
  compact?: boolean;
  milestone: RewardMilestone;
}) {
  const compactBadgeSize = COMPACT_BADGE_SIZE;
  const size = props.compact
    ? compactBadgeSize
    : props.milestone.tone === "gold"
      ? 86
      : 68;

  return (
    <Animated.View
      style={[
        styles.badgeWrap,
        { transform: [{ scale: props.animatedScale }] },
      ]}
    >
      <MedalBadge
        idSuffix={props.milestone.id}
        size={size}
        tone={props.milestone.tone}
      />
    </Animated.View>
  );
}

function MedalBadge(props: {
  idSuffix: string;
  size: number;
  tone: RewardTone;
}) {
  const palette = MEDAL_PALETTES[props.tone];
  const fillId = `medalFill-${props.idSuffix}`;
  const ribbonId = `medalRibbon-${props.idSuffix}`;

  return (
    <Svg width={props.size} height={props.size} viewBox="0 0 96 96">
      <Defs>
        <SvgLinearGradient id={fillId} x1="24" y1="24" x2="72" y2="82">
          <Stop offset="0" stopColor={palette.fillTop} />
          <Stop offset="0.55" stopColor={palette.fillMid} />
          <Stop offset="1" stopColor={palette.fillBottom} />
        </SvgLinearGradient>
        <SvgLinearGradient id={ribbonId} x1="30" y1="8" x2="66" y2="28">
          <Stop offset="0" stopColor={palette.ribbon} />
          <Stop offset="1" stopColor={palette.ribbonDark} />
        </SvgLinearGradient>
      </Defs>

      <Path
        d="M30 8 38 28 48 22 58 28 66 8 58 8 48 14 38 8Z"
        fill={`url(#${ribbonId})`}
      />
      <Path
        d="M34 10 40 24"
        stroke={palette.highlight}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <Path
        d="M62 10 56 24"
        stroke={palette.highlight}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.28"
      />

      <Circle
        cx="48"
        cy="54"
        r="28"
        fill={`url(#${fillId})`}
        stroke={palette.rim}
        strokeWidth="3"
      />
      <Circle
        cx="48"
        cy="54"
        r="21"
        fill="none"
        stroke={palette.highlight}
        strokeWidth="2"
        opacity="0.55"
      />
      <Path
        d="M48 38 51.8 47.2 61.6 48.4 54.2 55.2 56.2 65 48 60.2 39.8 65 41.8 55.2 34.4 48.4 44.2 47.2 48 38Z"
        fill={palette.star}
      />
      <Path
        d="M34 46c8-8 22-8 28 0"
        stroke={palette.highlight}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.42"
      />
    </Svg>
  );
}

function MilestoneTrackCheck(props: {
  compact?: boolean;
  unlocked: boolean;
  active?: boolean;
}) {
  const size = props.compact ? COMPACT_CHECK_SIZE : 20;
  const iconSize = props.compact ? 11 : 13;

  if (props.compact) {
    return (
      <View
        style={[
          styles.trackCheckCompactGhost,
          props.active ? styles.trackCheckCompactActive : null,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Ionicons
          name="checkmark"
          size={iconSize}
          color={
            props.active
              ? "#FFFFFF"
              : props.unlocked
                ? "rgba(255,255,255,0.55)"
                : "rgba(255,255,255,0.22)"
          }
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.trackCheck,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        props.compact ? styles.trackCheckCompact : null,
        props.unlocked ? styles.trackCheckUnlocked : null,
      ]}
    >
      {props.unlocked ? (
        <Ionicons name="checkmark" size={iconSize} color="#FFFFFF" />
      ) : null}
    </View>
  );
}

export function MilestoneProgressBar(props: MilestoneProgressBarProps) {
  const {
    compactProfile = false,
    embedded = false,
    initialPoints = 0,
    onPointsChange,
    points: externalPoints,
    showControls = !embedded,
    showHeader = !embedded && !compactProfile,
    style,
    titleTextStyle,
  } = props;
  const isCompactProfile = embedded && compactProfile;
  const pointerWidth = isCompactProfile ? 14 : POINTER_WIDTH;
  const { width: windowWidth } = useWindowDimensions();
  const [internalPoints, setInternalPoints] = useState(() =>
    clamp(initialPoints, 0, MAX_POINTS),
  );
  const currentPoints = clamp(externalPoints ?? internalPoints, 0, MAX_POINTS);
  const [trackWidth, setTrackWidth] = useState(0);
  const [animatedPoints, setAnimatedPoints] = useState(currentPoints);
  const progressAnim = useRef(new Animated.Value(currentPoints)).current;
  const badgeScales = useRef(
    REWARD_MILESTONES.map(() => new Animated.Value(1)),
  ).current;
  const unlockedSnapshot = useRef(
    REWARD_MILESTONES.map((milestone) => currentPoints >= milestone.points),
  );

  const maxWidth = useMemo(
    () => Math.min(720, Math.max(300, windowWidth - 28)),
    [windowWidth],
  );

  const compactSegments = useMemo(
    () => (trackWidth > 0 ? buildCompactConnectorSegments(trackWidth) : []),
    [trackWidth],
  );

  const compactSegmentFills = useMemo(
    () => resolveSegmentFillWidths(compactSegments, animatedPoints / MAX_POINTS),
    [animatedPoints, compactSegments],
  );

  const fillWidth = progressAnim.interpolate({
    inputRange: [0, MAX_POINTS],
    outputRange: [0, trackWidth],
    extrapolate: "clamp",
  });

  const pointerRight = progressAnim.interpolate({
    inputRange: [0, MAX_POINTS],
    outputRange: [0, Math.max(0, trackWidth - pointerWidth)],
    extrapolate: "clamp",
  });

  useEffect(() => {
    setAnimatedPoints(currentPoints);

    const listenerId = progressAnim.addListener(({ value }) => {
      setAnimatedPoints(value);
    });

    Animated.timing(progressAnim, {
      toValue: currentPoints,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    REWARD_MILESTONES.forEach((milestone, index) => {
      const isUnlocked = currentPoints >= milestone.points;
      const wasUnlocked = unlockedSnapshot.current[index];

      if (isUnlocked && !wasUnlocked) {
        badgeScales[index].setValue(0.78);
        Animated.sequence([
          Animated.spring(badgeScales[index], {
            toValue: 1.22,
            friction: 4,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.spring(badgeScales[index], {
            toValue: 1,
            friction: 6,
            tension: 95,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

    unlockedSnapshot.current = REWARD_MILESTONES.map(
      (milestone) => currentPoints >= milestone.points,
    );

    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [badgeScales, currentPoints, progressAnim]);

  const setPoints = (nextPoints: number) => {
    const clampedPoints = clamp(nextPoints, 0, MAX_POINTS);

    if (externalPoints === undefined) {
      setInternalPoints(clampedPoints);
    }

    onPointsChange?.(clampedPoints);
  };

  return (
    <View
      style={[
        styles.root,
        embedded ? styles.rootEmbedded : null,
        embedded ? null : { maxWidth },
        style,
      ]}
    >
      <View
        style={[
          styles.card,
          embedded ? styles.cardEmbedded : null,
          isCompactProfile ? styles.cardCompactProfile : null,
        ]}
      >
        {isCompactProfile ? (
          <View style={styles.compactProfileSection}>
            <LinearGradient
              colors={[
                "rgba(244,197,101,0.22)",
                "rgba(244,197,101,0.04)",
                "transparent",
              ]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.compactProfileDivider}
            />
            <View style={styles.compactProfileHeader}>
              <View style={styles.compactProfilePointsChip}>
                <Text style={styles.compactProfilePointsValue}>
                  {currentPoints}
                </Text>
                <Text style={styles.compactProfilePointsLabel}>
                  / {MAX_POINTS} نقطة
                </Text>
              </View>
              <View style={styles.compactProfileHeaderCopy}>
                <View style={styles.compactProfileTitleRow}>
                  <Ionicons name="ribbon" size={15} color="#F4C565" />
                  <Text style={[styles.compactProfileTitle, titleTextStyle]}>
                    الجوائز والمكافآت
                  </Text>
                </View>
                <Text style={[styles.compactProfileSubtitle, titleTextStyle]}>
                  اجمع النقاط وافتح أوسمة برونزي وفضي وذهبي
                </Text>
              </View>
            </View>
          </View>
        ) : showHeader ? (
          <View style={styles.headerRow}>
            <View style={styles.pointsChip}>
              <Text style={styles.pointsValue}>{currentPoints}</Text>
              <Text style={styles.pointsLabel}>نقطة</Text>
            </View>
            <View style={styles.headerTextBox}>
              <Text style={styles.eyebrow}>REWARD TRACK</Text>
              <Text style={[styles.title, titleTextStyle]}>مسار الجوائز</Text>
              <Text style={styles.subtitle}>
                افتح الأوسمة كلما ارتفع رصيد نقاطك
              </Text>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.timeline,
            embedded ? styles.timelineEmbedded : null,
            isCompactProfile ? styles.timelineCompactProfile : null,
          ]}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        >
          {isCompactProfile
            ? compactSegments.map((segment, segmentIndex) => (
                <View
                  key={`compact-connector-${segmentIndex}`}
                  style={[
                    styles.compactConnectorShell,
                    {
                      left: segment.left,
                      width: segment.width,
                      top: COMPACT_CONNECTOR_TOP,
                    },
                  ]}
                >
                  <View style={styles.compactConnectorBase} />
                  <View
                    style={[
                      styles.compactConnectorFill,
                      { width: compactSegmentFills[segmentIndex] ?? 0 },
                    ]}
                  />
                </View>
              ))
            : (
            <View style={styles.trackOuter}>
              <Animated.View style={[styles.trackFill, { width: fillWidth }]} />
              <View style={styles.trackHighlight} />
              <Animated.View
                style={[
                  styles.pointer,
                  { right: pointerRight, width: pointerWidth },
                ]}
              >
                <Text style={styles.pointerText}>{currentPoints} نقطة</Text>
              </Animated.View>
            </View>
          )}

          {isCompactProfile && trackWidth > 0 ? (
            <View
              style={[
                styles.milestoneSlot,
                styles.milestoneSlotCompactProfile,
                styles.compactStartSlot,
                {
                  left:
                    resolveCompactStartCenterX(trackWidth) -
                    (COMPACT_BADGE_SIZE + 8) / 2,
                  width: COMPACT_BADGE_SIZE + 8,
                },
              ]}
            >
              <View style={styles.trackCheckAnchorCompactProfile}>
                <MilestoneTrackCheck compact active unlocked />
              </View>
              <View style={styles.milestoneMetaCompactProfile}>
                <Text
                  style={[
                    styles.milestoneLabel,
                    styles.milestoneLabelCompactProfile,
                    styles.milestoneStartLabel,
                    titleTextStyle,
                  ]}
                >
                  ابدا
                </Text>
              </View>
            </View>
          ) : null}

          {trackWidth > 0
            ? (isCompactProfile
                ? [...REWARD_MILESTONES].sort(
                    (a, b) =>
                      (COMPACT_MILESTONE_TRACK_PROGRESS[b.id] ?? 1) -
                      (COMPACT_MILESTONE_TRACK_PROGRESS[a.id] ?? 1),
                  )
                : REWARD_MILESTONES
              ).map((milestone) => {
                const index = REWARD_MILESTONES.findIndex(
                  (item) => item.id === milestone.id,
                );
                const isUnlocked = currentPoints >= milestone.points;
                const slotWidth = isCompactProfile ? COMPACT_BADGE_SIZE + 8 : milestone.tone === "gold" ? 112 : 94;
                const slotLeft = isCompactProfile
                  ? resolveCompactSlotLeft(
                      trackWidth,
                      milestone.id,
                      slotWidth,
                    )
                  : resolveSlotLeft(trackWidth, milestone.points, slotWidth);

                return (
                  <View
                    key={milestone.id}
                    style={[
                      styles.milestoneSlot,
                      isCompactProfile
                        ? styles.milestoneSlotCompactProfile
                        : null,
                      { left: slotLeft, width: slotWidth },
                    ]}
                  >
                    <View
                      style={
                        isCompactProfile ? styles.medalAnchorCompactProfile : null
                      }
                    >
                      <RewardBadge
                        animatedScale={badgeScales[index]}
                        compact={isCompactProfile}
                        milestone={milestone}
                      />
                    </View>

                    <View
                      style={[
                        isCompactProfile
                          ? styles.trackCheckAnchorCompactProfile
                          : styles.trackCheckAnchorDefault,
                      ]}
                    >
                      <MilestoneTrackCheck
                        compact={isCompactProfile}
                        unlocked={isUnlocked}
                      />
                    </View>

                    <View
                      style={
                        isCompactProfile
                          ? styles.milestoneMetaCompactProfile
                          : styles.milestoneMetaDefault
                      }
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.milestoneLabel,
                          isCompactProfile
                            ? styles.milestoneLabelCompactProfile
                            : null,
                          isUnlocked ? styles.milestoneLabelUnlocked : null,
                          isCompactProfile && isUnlocked
                            ? styles.milestoneLabelCompactUnlocked
                            : null,
                        ]}
                      >
                        {milestone.label}
                      </Text>
                      <Text
                        style={[
                          styles.milestonePoints,
                          isCompactProfile
                            ? styles.milestonePointsCompactProfile
                            : null,
                        ]}
                      >
                        {milestone.points}
                      </Text>
                    </View>
                  </View>
                );
              })
            : null}
        </View>
      </View>

      {showControls ? (
        <View style={styles.controlsRow}>
          <ControlButton
            label="+25 pts"
            onPress={() => setPoints(currentPoints + 25)}
          />
          <ControlButton
            label="+100 pts"
            onPress={() => setPoints(currentPoints + 100)}
          />
          <ControlButton
            label="Max 300 pts"
            onPress={() => setPoints(MAX_POINTS)}
            accent
          />
          <ControlButton label="Reset" onPress={() => setPoints(0)} muted />
        </View>
      ) : null}
    </View>
  );
}

function ControlButton(props: {
  accent?: boolean;
  label: string;
  muted?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.controlButton,
        props.accent ? styles.controlButtonAccent : null,
        props.muted ? styles.controlButtonMuted : null,
        pressed ? styles.controlButtonPressed : null,
      ]}
    >
      <Text
        style={[
          styles.controlButtonText,
          props.accent ? styles.controlButtonTextAccent : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    alignSelf: "center",
    gap: 12,
  },
  rootEmbedded: {
    gap: 0,
  },
  card: {
    minHeight: 286,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: "#070A13",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 28,
    elevation: 16,
  },
  cardEmbedded: {
    minHeight: 180,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardCompactProfile: {
    minHeight: 0,
  },
  compactProfileSection: {
    marginBottom: 14,
  },
  compactProfileDivider: {
    height: 1,
    borderRadius: 999,
    marginBottom: 14,
  },
  compactProfileHeader: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 12,
  },
  compactProfileHeaderCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
    gap: 4,
  },
  compactProfileTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  compactProfileTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
    writingDirection: "rtl",
  },
  compactProfileSubtitle: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "right",
    writingDirection: "rtl",
  },
  compactProfilePointsChip: {
    minWidth: 58,
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(244,197,101,0.10)",
    borderWidth: 1,
    borderColor: "rgba(244,197,101,0.34)",
    shadowColor: "#F4C565",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  compactProfilePointsValue: {
    color: "#FDE68A",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22,
  },
  compactProfilePointsLabel: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 2,
    writingDirection: "rtl",
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  headerTextBox: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
  },
  eyebrow: {
    color: "rgba(125,211,252,0.78)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 3,
    textAlign: "right",
    writingDirection: "rtl",
  },
  subtitle: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "right",
    writingDirection: "rtl",
  },
  pointsChip: {
    width: 74,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,197,101,0.13)",
    borderWidth: 1,
    borderColor: "rgba(244,197,101,0.34)",
  },
  pointsValue: {
    color: "#FDE68A",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 25,
  },
  pointsLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 10,
    fontWeight: "800",
    writingDirection: "rtl",
  },
  timeline: {
    height: 182,
    marginTop: 22,
    position: "relative",
  },
  timelineEmbedded: {
    marginTop: 0,
  },
  timelineCompactProfile: {
    height: 108,
  },
  compactConnectorShell: {
    position: "absolute",
    height: COMPACT_CONNECTOR_HEIGHT,
    zIndex: 1,
  },
  compactConnectorBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
  },
  compactConnectorFill: {
    position: "absolute",
    right: 0,
    top: 0,
    height: COMPACT_CONNECTOR_HEIGHT,
    backgroundColor: COMPACT_TRACK_DARK,
    borderRadius: 999,
  },
  trackOuter: {
    position: "absolute",
    top: 78,
    left: 0,
    right: 0,
    height: 24,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  trackFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: "#38BDF8",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
  },
  trackHighlight: {
    position: "absolute",
    top: 3,
    right: 8,
    left: 8,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.26)",
  },
  pointer: {
    position: "absolute",
    top: 2,
    width: POINTER_WIDTH,
    height: 19,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(253,230,138,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
    shadowColor: "#FDE68A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.48,
    shadowRadius: 12,
    elevation: 8,
  },
  pointerText: {
    color: "#241900",
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
    writingDirection: "rtl",
  },
  milestoneSlot: {
    position: "absolute",
    top: 0,
    minHeight: 166,
    alignItems: "center",
  },
  milestoneSlotCompactProfile: {
    minHeight: 116,
    zIndex: 4,
  },
  compactStartSlot: {
    zIndex: 9,
  },
  medalAnchorCompactProfile: {
    position: "absolute",
    top: COMPACT_MEDAL_TOP,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 6,
  },
  trackCheckAnchorCompactProfile: {
    position: "absolute",
    top: COMPACT_CHECK_TOP,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 8,
  },
  trackCheckAnchorDefault: {
    alignItems: "center",
    marginTop: 2,
  },
  milestoneMetaCompactProfile: {
    position: "absolute",
    top: COMPACT_META_TOP,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  milestoneMetaDefault: {
    alignItems: "center",
  },
  badgeWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  trackCheck: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
  },
  trackCheckCompact: {
    backgroundColor: "rgba(0,0,0,0.62)",
    borderColor: "rgba(255,255,255,0.24)",
  },
  trackCheckCompactGhost: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  trackCheckCompactActive: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  trackCheckUnlocked: {
    backgroundColor: "#22C55E",
    borderColor: "#DCFCE7",
    borderWidth: 2,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 10,
  },
  milestoneLabel: {
    width: "100%",
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 5,
    textAlign: "center",
    writingDirection: "rtl",
  },
  milestoneLabelCompactProfile: {
    fontSize: 9,
    fontWeight: "900",
    marginTop: 0,
    letterSpacing: 0.2,
  },
  milestoneLabelUnlocked: {
    color: "#FFFFFF",
  },
  milestoneLabelCompactUnlocked: {
    color: "#FDE68A",
  },
  milestoneStartLabel: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  milestonePoints: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
    textAlign: "center",
    writingDirection: "rtl",
  },
  milestonePointsCompactProfile: {
    color: "rgba(255,255,255,0.46)",
    fontSize: 8,
    fontWeight: "900",
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  controlButton: {
    flexGrow: 1,
    minWidth: 104,
    minHeight: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  controlButtonAccent: {
    backgroundColor: "rgba(244,197,101,0.16)",
    borderColor: "rgba(244,197,101,0.36)",
  },
  controlButtonMuted: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  controlButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.86,
  },
  controlButtonText: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  controlButtonTextAccent: {
    color: "#FDE68A",
  },
});

export default MilestoneProgressBar;
