import { useEffect, useMemo, useRef, useState } from "react";
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
  Ellipse,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

const MAX_POINTS = 300;
const POINTER_WIDTH = 58;

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
  { id: "gold", label: "أسطوري", points: 300, tone: "gold" },
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

function RewardBadge(props: {
  animatedScale: Animated.Value;
  compact?: boolean;
  milestone: RewardMilestone;
  unlocked: boolean;
}) {
  const size = props.compact
    ? props.milestone.tone === "gold"
      ? 56
      : 44
    : props.milestone.tone === "gold"
      ? 86
      : 68;

  return (
    <Animated.View
      style={[
        styles.badgeWrap,
        props.unlocked ? styles.badgeWrapUnlocked : styles.badgeWrapLocked,
        { transform: [{ scale: props.animatedScale }] },
      ]}
    >
      {props.milestone.tone === "gold" ? (
        <GoldCrownBadge size={size} unlocked={props.unlocked} />
      ) : props.milestone.tone === "silver" ? (
        <SilverMedalBadge size={size} unlocked={props.unlocked} />
      ) : (
        <BronzeShieldBadge size={size} unlocked={props.unlocked} />
      )}
    </Animated.View>
  );
}

function BronzeShieldBadge(props: { size: number; unlocked: boolean }) {
  return (
    <Svg width={props.size} height={props.size} viewBox="0 0 96 96">
      <Defs>
        <LinearGradient id="bronzeFill" x1="22" y1="8" x2="72" y2="84">
          <Stop offset="0" stopColor={props.unlocked ? "#FFD3A0" : "#9CA3AF"} />
          <Stop
            offset="0.55"
            stopColor={props.unlocked ? "#C47A35" : "#6B7280"}
          />
          <Stop offset="1" stopColor={props.unlocked ? "#7C3F16" : "#374151"} />
        </LinearGradient>
        <RadialGradient id="bronzeGlow" cx="48" cy="48" r="46">
          <Stop
            offset="0"
            stopColor="#F6B56D"
            stopOpacity={props.unlocked ? "0.72" : "0"}
          />
          <Stop offset="1" stopColor="#F6B56D" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="48" cy="48" r="45" fill="url(#bronzeGlow)" />
      <Path
        d="M48 7 76 19v23c0 21-12 37-28 46C32 79 20 63 20 42V19L48 7Z"
        fill="url(#bronzeFill)"
        stroke={props.unlocked ? "#FFE2BD" : "#AEB5C2"}
        strokeWidth="3"
      />
      <Circle
        cx="48"
        cy="40"
        r="18"
        fill={props.unlocked ? "#FFE4BF" : "#CBD5E1"}
        opacity="0.92"
      />
      <Path
        d="M48 27 52.5 36.3 62.7 37.8 55.4 45l1.7 10.1L48 50.3l-9.1 4.8L40.6 45l-7.3-7.2 10.2-1.5L48 27Z"
        fill={props.unlocked ? "#7C3F16" : "#4B5563"}
      />
      <Path
        d="M34 65h28"
        stroke={props.unlocked ? "#FFE7C8" : "#D1D5DB"}
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.76"
      />
    </Svg>
  );
}

function SilverMedalBadge(props: { size: number; unlocked: boolean }) {
  return (
    <Svg width={props.size} height={props.size} viewBox="0 0 96 96">
      <Defs>
        <LinearGradient id="silverFill" x1="18" y1="12" x2="78" y2="84">
          <Stop offset="0" stopColor={props.unlocked ? "#FFFFFF" : "#9CA3AF"} />
          <Stop
            offset="0.52"
            stopColor={props.unlocked ? "#AEB8C7" : "#6B7280"}
          />
          <Stop offset="1" stopColor={props.unlocked ? "#EEF4FF" : "#374151"} />
        </LinearGradient>
        <RadialGradient id="silverGlow" cx="48" cy="48" r="45">
          <Stop
            offset="0"
            stopColor="#E7F0FF"
            stopOpacity={props.unlocked ? "0.74" : "0"}
          />
          <Stop offset="1" stopColor="#E7F0FF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="48" cy="48" r="44" fill="url(#silverGlow)" />
      <Circle
        cx="48"
        cy="48"
        r="32"
        fill="url(#silverFill)"
        stroke={props.unlocked ? "#FFFFFF" : "#AEB5C2"}
        strokeWidth="3"
      />
      <Path
        d="M48 24 54.6 39l16.2 1.4-12.3 10.7 3.7 15.9L48 58.5 33.8 67l3.7-15.9-12.3-10.7L41.4 39 48 24Z"
        fill={props.unlocked ? "#334155" : "#4B5563"}
      />
      <Path
        d="M30 35c9-10 26-11 36-1"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        opacity={props.unlocked ? "0.42" : "0.16"}
      />
    </Svg>
  );
}

function GoldCrownBadge(props: { size: number; unlocked: boolean }) {
  return (
    <Svg width={props.size} height={props.size} viewBox="0 0 112 112">
      <Defs>
        <LinearGradient id="goldFill" x1="20" y1="12" x2="90" y2="96">
          <Stop offset="0" stopColor={props.unlocked ? "#FFF7B0" : "#9CA3AF"} />
          <Stop
            offset="0.45"
            stopColor={props.unlocked ? "#FFC83D" : "#6B7280"}
          />
          <Stop offset="1" stopColor={props.unlocked ? "#B87400" : "#374151"} />
        </LinearGradient>
        <RadialGradient id="goldGlow" cx="56" cy="56" r="53">
          <Stop
            offset="0"
            stopColor="#FFE66B"
            stopOpacity={props.unlocked ? "0.98" : "0"}
          />
          <Stop offset="1" stopColor="#FFE66B" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="56" cy="56" r="52" fill="url(#goldGlow)" />
      <Ellipse
        cx="56"
        cy="61"
        rx="38"
        ry="34"
        fill={
          props.unlocked ? "rgba(255,218,71,0.16)" : "rgba(255,255,255,0.07)"
        }
      />
      <Polygon
        points="19,44 38,61 56,24 74,61 93,44 84,85 28,85"
        fill="url(#goldFill)"
        stroke={props.unlocked ? "#FFF4B8" : "#AEB5C2"}
        strokeWidth="3.3"
        strokeLinejoin="round"
      />
      <Circle
        cx="19"
        cy="42"
        r="7"
        fill={props.unlocked ? "#FFEB79" : "#8E96A5"}
      />
      <Circle
        cx="56"
        cy="22"
        r="8"
        fill={props.unlocked ? "#FFF8B8" : "#AEB5C2"}
      />
      <Circle
        cx="93"
        cy="42"
        r="7"
        fill={props.unlocked ? "#FFEB79" : "#8E96A5"}
      />
      <Rect
        x="33"
        y="76"
        width="46"
        height="12"
        rx="6"
        fill={props.unlocked ? "#724900" : "#4B5563"}
        opacity="0.72"
      />
      <Path
        d="M39 53 56 37l17 16"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={props.unlocked ? "0.4" : "0.14"}
      />
    </Svg>
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
                const slotWidth = isCompactProfile
                  ? milestone.tone === "gold"
                    ? 68
                    : 54
                  : milestone.tone === "gold"
                    ? 112
                    : 94;
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
                    <RewardBadge
                      animatedScale={badgeScales[index]}
                      compact={isCompactProfile}
                      milestone={milestone}
                      unlocked={isUnlocked}
                    />
                    <View
                      style={[
                        styles.checkBadge,
                        isCompactProfile
                          ? styles.checkBadgeCompactProfile
                          : null,
                        isUnlocked ? styles.checkBadgeUnlocked : null,
                      ]}
                    >
                      {isUnlocked ? (
                        <Text
                          style={[
                            styles.checkText,
                            isCompactProfile
                              ? styles.checkTextCompactProfile
                              : null,
                            styles.checkTextUnlocked,
                          ]}
                        >
                          ✓
                        </Text>
                      ) : (
                        <View
                          style={[
                            styles.lockedCheckDot,
                            isCompactProfile
                              ? styles.lockedCheckDotCompactProfile
                              : null,
                          ]}
                        />
                      )}
                    </View>
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
    color: "rgba(244,197,101,0.72)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  compactProfileTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
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
    height: 132,
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
    minHeight: 118,
  },
  badgeWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrapUnlocked: {
    opacity: 1,
    shadowColor: "#FDE68A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },
  badgeWrapLocked: {
    opacity: 0.4,
  },
  checkBadge: {
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  checkBadgeCompactProfile: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 0,
  },
  checkBadgeUnlocked: {
    backgroundColor: "#22C55E",
    borderColor: "rgba(187,247,208,0.9)",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 10,
    elevation: 6,
  },
  checkText: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 14,
  },
  checkTextCompactProfile: {
    fontSize: 9,
    lineHeight: 11,
  },
  checkTextUnlocked: {
    color: "#FFFFFF",
  },
  lockedCheckDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  lockedCheckDotCompactProfile: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  milestoneLabel: {
    width: "100%",
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 6,
    textAlign: "center",
    writingDirection: "rtl",
  },
  milestoneLabelCompactProfile: {
    fontSize: 9,
    marginTop: 4,
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
    fontSize: 8,
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
