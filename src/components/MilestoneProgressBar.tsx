import { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
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
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

const MAX_POINTS = 300;
const POINTER_WIDTH = 58;
const COMPACT_TRACK_TOP = 54;
const COMPACT_TRACK_HEIGHT = 14;
const COMPACT_BADGE_SIZE = 32;
const COMPACT_CHECK_SIZE = 17;
const COMPACT_CHECK_TOP =
  COMPACT_TRACK_TOP + COMPACT_TRACK_HEIGHT / 2 - COMPACT_CHECK_SIZE / 2;

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
  const compactBadgeSize = 32;
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
        <LinearGradient id={fillId} x1="24" y1="24" x2="72" y2="82">
          <Stop offset="0" stopColor={palette.fillTop} />
          <Stop offset="0.55" stopColor={palette.fillMid} />
          <Stop offset="1" stopColor={palette.fillBottom} />
        </LinearGradient>
        <LinearGradient id={ribbonId} x1="30" y1="8" x2="66" y2="28">
          <Stop offset="0" stopColor={palette.ribbon} />
          <Stop offset="1" stopColor={palette.ribbonDark} />
        </LinearGradient>
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

function MilestoneTrackCheck(props: { compact?: boolean; unlocked: boolean }) {
  const size = props.compact ? COMPACT_CHECK_SIZE : 20;
  const iconSize = props.compact ? 11 : 13;

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
            <View style={styles.compactProfileDivider} />
            <View style={styles.compactProfileHeader}>
              <View style={styles.compactProfilePointsChip}>
                <Text style={styles.compactProfilePointsValue}>
                  {currentPoints}
                </Text>
                <Text style={styles.compactProfilePointsLabel}>نقطة</Text>
              </View>
              <View style={styles.compactProfileHeaderCopy}>
                <Text style={styles.compactProfileEyebrow}>REWARDS TRACK</Text>
                <Text style={[styles.compactProfileTitle, titleTextStyle]}>
                  الجوائز والمكافآت
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
          <View
            style={[
              styles.trackOuter,
              isCompactProfile ? styles.trackOuterCompactProfile : null,
            ]}
          >
            <Animated.View
              style={[
                styles.trackFill,
                isCompactProfile ? styles.trackFillCompactProfile : null,
                { width: fillWidth },
              ]}
            />
            <View
              style={[
                styles.trackHighlight,
                isCompactProfile ? styles.trackHighlightCompactProfile : null,
              ]}
            />
            <Animated.View
              style={[
                styles.pointer,
                isCompactProfile ? styles.pointerCompactProfile : null,
                { right: pointerRight, width: pointerWidth },
              ]}
            >
              {isCompactProfile ? null : (
                <Text style={styles.pointerText}>{currentPoints} نقطة</Text>
              )}
            </Animated.View>
          </View>

          {trackWidth > 0
            ? REWARD_MILESTONES.map((milestone, index) => {
                const isUnlocked = currentPoints >= milestone.points;
                const slotWidth = isCompactProfile ? 50 : milestone.tone === "gold" ? 112 : 94;
                const slotLeft = resolveSlotLeft(
                  trackWidth,
                  milestone.points,
                  slotWidth,
                );

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
    marginBottom: 12,
  },
  compactProfileDivider: {
    height: 1,
    borderRadius: 999,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  compactProfileHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  compactProfileHeaderCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
  },
  compactProfileEyebrow: {
    color: "rgba(244,197,101,0.78)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  compactProfileTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3,
    textAlign: "right",
    writingDirection: "rtl",
  },
  compactProfilePointsChip: {
    minWidth: 54,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "rgba(244,197,101,0.12)",
    borderWidth: 1,
    borderColor: "rgba(244,197,101,0.32)",
  },
  compactProfilePointsValue: {
    color: "#F4C565",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 20,
  },
  compactProfilePointsLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 9,
    fontWeight: "800",
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
  trackOuterCompactProfile: {
    top: 54,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
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
  trackFillCompactProfile: {
    backgroundColor: "#F4C565",
    shadowColor: "#F4C565",
    shadowOpacity: 0.45,
    shadowRadius: 10,
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
  trackHighlightCompactProfile: {
    top: 2,
    right: 6,
    left: 6,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.22)",
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
  pointerCompactProfile: {
    top: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#F4C565",
    shadowColor: "#F4C565",
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 6,
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
    minHeight: 108,
  },
  medalAnchorCompactProfile: {
    position: "absolute",
    top: 6,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  trackCheckAnchorCompactProfile: {
    position: "absolute",
    top: COMPACT_CHECK_TOP,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 4,
  },
  trackCheckAnchorDefault: {
    alignItems: "center",
    marginTop: 2,
  },
  milestoneMetaCompactProfile: {
    position: "absolute",
    top: COMPACT_TRACK_TOP + COMPACT_TRACK_HEIGHT + 8,
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
    backgroundColor: "rgba(0,0,0,0.55)",
    borderColor: "rgba(255,255,255,0.28)",
  },
  trackCheckUnlocked: {
    backgroundColor: "#22C55E",
    borderColor: "#BBF7D0",
    borderWidth: 2,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
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
    fontSize: 8,
    fontWeight: "800",
    marginTop: 0,
  },
  milestoneLabelUnlocked: {
    color: "#FFFFFF",
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
    color: "rgba(244,197,101,0.72)",
    fontSize: 7,
    fontWeight: "900",
    marginTop: 1,
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
