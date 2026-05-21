import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Circle, Line, Svg } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import {
  getArabicFontStyle,
  resolveProfileAvatarUri,
} from "../../profile.helpers";

/** ISO/IEC 7810 ID-1 — نفس نسبة بطاقات الائتمان و Apple Wallet */
const CARD_ASPECT_RATIO = 1.586;

type VarIdentityCardProps = {
  width: number;
  avatarUri: string;
  displayVarId: string;
  joinDate: string;
  nationalityArabic: string;
  nationalityEnglish: string;
  arabicFontFamily?: string;
  isVerified?: boolean;
};

function buildVarQrPayload(displayVarId: string) {
  const id = displayVarId.trim();
  if (!id) return "VAR";
  const appUrl = process.env.EXPO_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  return appUrl ? `${appUrl}/add/${encodeURIComponent(id)}` : id;
}

// ─── Shimmer sweep ────────────────────────────────────────────────────────────

function CardShimmer({ width }: { width: number }) {
  const tx = useSharedValue(-width * 1.6);

  useEffect(() => {
    tx.value = withRepeat(
      withDelay(
        3600,
        withTiming(width * 1.6, {
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
  }, [width, tx]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, style]}
    >
      <LinearGradient
        colors={[
          "transparent",
          "rgba(255,248,215,0.06)",
          "rgba(232,213,163,0.16)",
          "rgba(255,248,215,0.06)",
          "transparent",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.shimmerGrad}
      />
    </Animated.View>
  );
}

// ─── SVG dot-grid background ──────────────────────────────────────────────────

function CardBackground({ width }: { width: number }) {
  const h = width / CARD_ASPECT_RATIO;
  const cols = 10;
  const rows = 6;
  const dots: { cx: number; cy: number; key: string }[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      dots.push({
        cx: ((c + 0.5) * width) / cols,
        cy: ((r + 0.5) * h) / rows,
        key: `${c}-${r}`,
      });
    }
  }

  return (
    <Svg
      width={width}
      height={h}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      {dots.map((d) => (
        <Circle key={d.key} cx={d.cx} cy={d.cy} r={0.9} fill="rgba(232,213,163,0.18)" />
      ))}
      <Line
        x1={0}
        y1={h * 0.58}
        x2={width * 0.46}
        y2={0}
        stroke="rgba(232,213,163,0.09)"
        strokeWidth={0.8}
      />
      <Line
        x1={width * 0.28}
        y1={h}
        x2={width * 0.88}
        y2={0}
        stroke="rgba(232,213,163,0.06)"
        strokeWidth={0.5}
      />
      <Circle
        cx={width * 0.78}
        cy={h * 0.38}
        r={h * 0.52}
        fill="none"
        stroke="rgba(201,169,98,0.07)"
        strokeWidth={0.7}
      />
    </Svg>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function CardChip() {
  return (
    <View style={styles.chip}>
      <LinearGradient
        colors={["#D4B96A", "#F2DFA0", "#C9A84C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.chipGrad}
      >
        <View style={styles.chipInner}>
          <View style={styles.chipLine} />
          <View style={[styles.chipLine, styles.chipLineShort]} />
          <View style={styles.chipLine} />
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Footer with BlurView ─────────────────────────────────────────────────────

function CardFooter({
  joinDate,
  nationalityArabic,
  nationalityEnglish,
  compact,
  arabicTextStyle,
}: {
  joinDate: string;
  nationalityArabic: string;
  nationalityEnglish: string;
  compact: boolean;
  arabicTextStyle: object | undefined;
}) {
  const inner = (
    <View style={styles.footerInner}>
      <View style={styles.footerField}>
        <Text style={styles.footerLabel}>MEMBER SINCE</Text>
        <Text numberOfLines={1} style={[styles.footerValue, arabicTextStyle]}>
          {joinDate || "—"}
        </Text>
      </View>

      <View style={styles.footerDivider} />

      <View style={[styles.footerField, styles.footerFieldEnd]}>
        <Text style={styles.footerLabel}>NATIONALITY</Text>
        <Text
          numberOfLines={1}
          style={[styles.footerValue, arabicTextStyle]}
        >
          {nationalityArabic || "—"}
        </Text>
        {!compact && nationalityEnglish ? (
          <Text numberOfLines={1} style={styles.footerSubValue}>
            {nationalityEnglish}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (Platform.OS === "web") {
    return <View style={styles.footerWebFallback}>{inner}</View>;
  }

  return (
    <BlurView intensity={18} tint="dark" style={styles.footerBlur}>
      {inner}
    </BlurView>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function VarIdentityCard(props: VarIdentityCardProps) {
  const arabicTextStyle = getArabicFontStyle(props.arabicFontFamily);
  const qrPayload = buildVarQrPayload(props.displayVarId);
  const qrSize = props.width < 340 ? 46 : 52;
  const compact = props.width < 360;

  return (
    <View style={[styles.shadow, { width: props.width }]}>
      <View style={[styles.shell, { aspectRatio: CARD_ASPECT_RATIO }]}>
        <LinearGradient
          colors={["#2E2616", "#14171F", "#07090E", "#020305"]}
          locations={[0, 0.3, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.frame}
        >
          {/* base overlay tint */}
          <LinearGradient
            colors={[
              "rgba(201,169,98,0.20)",
              "transparent",
              "rgba(255,255,255,0.03)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* SVG dot grid + accent lines */}
          <CardBackground width={props.width} />

          {/* Animated shimmer sweep */}
          <CardShimmer width={props.width} />

          {/* ── top row ── */}
          <View style={styles.topRow}>
            <View style={styles.topLeading}>
              <CardChip />
              <View style={styles.brandCol}>
                <Text style={styles.brandMark}>VAR</Text>
                <Text style={styles.brandTier}>PRIVATE MEMBERSHIP</Text>
              </View>
            </View>

            {props.isVerified ? (
              <View style={styles.tierPill}>
                <Ionicons name="diamond-outline" size={11} color="#E8D5A3" />
                <Text style={styles.tierPillText}>VERIFIED</Text>
              </View>
            ) : (
              <View style={styles.tierPillMuted}>
                <Text style={styles.tierPillTextMuted}>MEMBER</Text>
              </View>
            )}
          </View>

          {/* ── body row ── */}
          <View style={styles.bodyRow}>
            <View style={styles.memberBlock}>
              <View style={styles.avatarRing}>
                <Image
                  source={{ uri: resolveProfileAvatarUri(props.avatarUri) }}
                  style={styles.avatarImage}
                />
                {/* gold rim gradient */}
                <LinearGradient
                  colors={[
                    "rgba(201,169,98,0.38)",
                    "transparent",
                    "rgba(201,169,98,0.18)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>

              <View style={styles.idBlock}>
                <Text style={styles.idLabel}>VAR ID</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  style={[
                    styles.idValue,
                    compact ? styles.idValueCompact : null,
                  ]}
                >
                  {props.displayVarId || "—"}
                </Text>
              </View>
            </View>

            <View style={styles.qrDock}>
              <View style={styles.qrPlate}>
                <QRCode
                  value={qrPayload}
                  size={qrSize}
                  color="#0A0C10"
                  backgroundColor="#F5F0E6"
                  quietZone={4}
                />
              </View>
            </View>
          </View>

          {/* ── frosted footer ── */}
          <View style={styles.footerWrap}>
            <View style={styles.footerRule} />
            <CardFooter
              joinDate={props.joinDate}
              nationalityArabic={props.nationalityArabic}
              nationalityEnglish={props.nationalityEnglish}
              compact={compact}
              arabicTextStyle={arabicTextStyle}
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shadow: {
    marginTop: 10,
    alignSelf: "center",
    shadowColor: "#C9A84C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  shell: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
  },
  frame: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.38)",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 0,
    overflow: "hidden",
  },
  shimmerGrad: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  // ── chip ──
  chip: {
    width: 40,
    height: 29,
    borderRadius: 7,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  chipGrad: {
    flex: 1,
    padding: 5,
  },
  chipInner: {
    flex: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(18,21,28,0.30)",
    justifyContent: "space-evenly",
    paddingHorizontal: 3,
  },
  chipLine: {
    height: 1,
    borderRadius: 999,
    backgroundColor: "rgba(18,21,28,0.45)",
  },
  chipLineShort: {
    width: "70%",
    alignSelf: "center",
  },
  // ── top row ──
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    zIndex: 2,
  },
  topLeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandCol: { gap: 2 },
  brandMark: {
    color: "#F8F4EA",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3.6,
  },
  brandTier: {
    color: "rgba(232,213,163,0.72)",
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.35)",
  },
  tierPillMuted: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tierPillText: {
    color: "#E8D5A3",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  tierPillTextMuted: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  // ── body ──
  bodyRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    zIndex: 2,
  },
  memberBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
    paddingRight: 8,
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(232,213,163,0.50)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  avatarImage: { width: "100%", height: "100%" },
  idBlock: { flex: 1, minWidth: 0 },
  idLabel: {
    color: "rgba(232,213,163,0.70)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  idValue: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  idValueCompact: { fontSize: 14, letterSpacing: 1.2 },
  qrDock: { alignItems: "flex-end", justifyContent: "center" },
  qrPlate: {
    borderRadius: 10,
    padding: 5,
    backgroundColor: "#F5F0E6",
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.45)",
  },
  // ── footer ──
  footerWrap: { zIndex: 2, marginTop: 8 },
  footerRule: {
    height: 1,
    backgroundColor: "rgba(201,169,98,0.22)",
  },
  footerBlur: {
    overflow: "hidden",
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
  },
  footerWebFallback: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
  },
  footerInner: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  footerField: { flex: 1, minWidth: 0 },
  footerFieldEnd: { alignItems: "flex-end" },
  footerDivider: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: 12,
    backgroundColor: "rgba(201,169,98,0.18)",
  },
  footerLabel: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  footerValue: {
    color: "#F3F0E8",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  footerSubValue: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 8,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "right",
  },
});
