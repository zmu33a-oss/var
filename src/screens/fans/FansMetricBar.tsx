import { useEffect, useRef, type ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SealCheckIcon from "../../components/SealCheckIcon";
import {
  createCompatStyleSheet,
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../../lib/crossPlatformStyles";

const BAR_RADIUS = 14;
const VERIFIED_BADGE_SIZE = 14;
const DEFAULT_EMBLEM = require("../../../assets/icons/alnassr.png.png");
export type FansMetricBarProps = {
  title: string;
  metrics: ReactNode;
  clubSlug?: string;
  clubVarId?: string;
  emblem?: number;
  trailing?: ReactNode;
};

function AnimatedOrangeBorder(props: {
  borderRadius: number;
  children: ReactNode;
}) {
  const rotatingBorderProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rotatingBorderProgress.setValue(0);

    const borderLoop = Animated.loop(
      Animated.timing(rotatingBorderProgress, {
        toValue: 1,
        duration: 5200,
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

  const rotatingBorderSpin = rotatingBorderProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={[
        "rgba(255,152,0,0.28)",
        "rgba(255,152,0,0.08)",
        "rgba(255,152,0,0.28)",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.borderRing, { borderRadius: props.borderRadius }]}
    >
      <Animated.View
        {...getNativePointerEventsProps("none")}
        style={[
          styles.borderSpinner,
          { transform: [{ rotate: rotatingBorderSpin }] },
          getWebPointerEventsStyle("none"),
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
            "rgba(255,152,0,0.98)",
            "rgba(255,193,7,1)",
            "rgba(255,152,0,0.98)",
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
          ]}
          locations={[0, 0.38, 0.47, 0.5, 0.53, 0.62, 1]}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 0.92, y: 1 }}
          style={styles.borderSpinnerGradient}
        />
      </Animated.View>

      <View
        style={[
          styles.borderShell,
          { borderRadius: props.borderRadius - 1 },
        ]}
      >
        {props.children}
      </View>
    </LinearGradient>
  );
}

function StartChip() {
  return (
    <Pressable style={styles.startChip}>
      <Text style={styles.startChipText}>Start</Text>
    </Pressable>
  );
}

export function FansVerifiedBadge(props: {
  verified?: boolean;
  label?: string;
}) {
  const verified = props.verified !== false;
  const label =
    props.label ?? (verified ? "موثق" : "غير موثق");

  return (
    <View style={styles.verifiedBlock}>
      <SealCheckIcon
        size={VERIFIED_BADGE_SIZE}
        style={verified ? styles.verifiedSeal : styles.unverifiedSeal}
      />
      <Text
        style={cardText([
          styles.verifiedCaption,
          !verified ? styles.unverifiedCaption : null,
        ])}
      >
        {label}
      </Text>
    </View>
  );
}
function cardText(style: object) {
  return [style, styles.boldText];
}

export function HashtagMetrics(props: { total: string; unit: string }) {
  return (
    <View style={styles.hashtagMetrics}>
      <Text style={cardText(styles.metricValue)}>{props.total}</Text>
      <Text style={cardText(styles.metricUnit)}>{props.unit}</Text>
    </View>
  );
}

export function ActiveUserMetrics(props: { name: string; varId: string }) {
  return (
    <View style={styles.activeMetrics}>
      <View style={styles.userAvatar}>
        <Ionicons name="person" size={14} color="#5C3D0A" />
      </View>

      <View style={styles.userCopy}>
        <Text style={cardText(styles.userName)} numberOfLines={1}>
          {props.name}
        </Text>
        <Text style={cardText(styles.userVarId)}>{props.varId}</Text>
      </View>
    </View>
  );
}

export default function FansMetricBar(props: FansMetricBarProps) {
  const emblem = props.emblem ?? DEFAULT_EMBLEM;
  const clubSlug = props.clubSlug ?? "alnaser";
  const clubVarId = props.clubVarId ?? "var-22000";

  return (
    <AnimatedOrangeBorder borderRadius={BAR_RADIUS}>
      <View style={styles.bar}>
        <View style={styles.barRow}>
          <View style={styles.logoBlock}>
            <Image source={emblem} resizeMode="contain" style={styles.clubLogo} />
            <Text style={cardText(styles.clubSlug)}>{clubSlug}</Text>
            <Text style={cardText(styles.clubVarId)}>{clubVarId}</Text>
          </View>

          <Text style={cardText(styles.barTitle)} numberOfLines={2}>
            {props.title}
          </Text>

          <View style={styles.metricsSlot}>{props.metrics}</View>

          <StartChip />

          {props.trailing ?? (
            <FansVerifiedBadge verified label="الحساب موثق" />
          )}        </View>
      </View>
    </AnimatedOrangeBorder>
  );
}

const styles = createCompatStyleSheet({
  boldText: {
    fontWeight: "900",
  },
  borderRing: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
    padding: 0.75,
  },
  borderSpinner: {
    position: "absolute",
    top: -180,
    right: -180,
    bottom: -180,
    left: -180,
    opacity: 0.98,
  },
  borderSpinnerGradient: {
    flex: 1,
  },
  borderShell: {
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  bar: {
    backgroundColor: "#000000",
    minHeight: 58,
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  barRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  logoBlock: {
    width: 44,
    alignItems: "center",
    flexShrink: 0,
  },
  clubLogo: {
    width: 28,
    height: 28,
  },
  clubSlug: {
    color: "#FFFFFF",
    fontSize: 7,
    textAlign: "center",
    marginTop: 1,
    lineHeight: 9,
  },
  clubVarId: {
    color: "#FF9800",
    fontSize: 7,
    textAlign: "center",
    lineHeight: 9,
  },
  barTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 9,
    textAlign: "right",
    lineHeight: 12,
    minWidth: 0,
  },
  metricsSlot: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: "34%",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  hashtagMetrics: {
    flexDirection: "row-reverse",
    alignItems: "baseline",
    gap: 4,
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 16,
  },
  metricUnit: {
    color: "#FFFFFF",
    fontSize: 9,
    lineHeight: 12,
  },
  activeMetrics: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    width: "100%",
  },
  userAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FF9800",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userCopy: {
    flexShrink: 1,
    minWidth: 0,
    alignItems: "flex-end",
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 8.5,
    textAlign: "right",
    lineHeight: 11,
  },
  userVarId: {
    color: "#FFFFFF",
    fontSize: 7.5,
    textAlign: "right",
    lineHeight: 10,
    marginTop: 1,
  },
  startChip: {    width: 38,
    height: 18,
    borderRadius: 3,
    backgroundColor: "#646464",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  startChipText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  verifiedBlock: {
    width: 40,
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
  },
  verifiedSeal: {
    opacity: 1,
  },
  unverifiedSeal: {
    opacity: 0.32,
  },
  verifiedCaption: {
    color: "#F5B942",
    fontSize: 6.5,
    textAlign: "center",
    lineHeight: 9,
  },
  unverifiedCaption: {
    color: "#8A8F98",
  },
});