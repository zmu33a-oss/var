import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderHandlers,
  type LayoutChangeEvent,
} from "react-native";
import type { IconName } from "../app.types";

type DigitalIdCardProps = {
  onPress: () => void;
  authenticating?: boolean;
  disabled?: boolean;
  holderName?: string;
  holderHandle?: string;
  idCode?: string;
  ctaLabel?: string;
  busyLabel?: string;
  ctaArrowName?: IconName;
  ctaArrowOnRight?: boolean;
  swipeEnabled?: boolean;
  swipeCompleted?: boolean;
  swipeOffset?: Animated.Value;
  onSwipeLayout?: (event: LayoutChangeEvent) => void;
  swipePanHandlers?: GestureResponderHandlers;
  swipeHintLabel?: string;
};

const QR_PATTERN = [
  "11100111011",
  "10010101001",
  "10111101101",
  "00100100100",
  "11101110111",
  "00011010010",
  "10101101101",
  "11000110011",
  "10111011101",
  "10001000101",
  "11101110111",
];

export default function DigitalIdCard(props: DigitalIdCardProps) {
  const {
    onPress,
    authenticating = false,
    disabled = false,
    holderName = "Xtik ID",
    holderHandle = "@xtik",
    idCode = "XTK-25-2048",
    ctaLabel = "Sign in with Digital ID",
    busyLabel = "Authenticating...",
    ctaArrowName = "arrow-back",
    ctaArrowOnRight = false,
    swipeEnabled = false,
    swipeCompleted = false,
    swipeOffset,
    onSwipeLayout,
    swipePanHandlers,
    swipeHintLabel,
  } = props;
  const holderInitials =
    holderName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "XT";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || swipeEnabled}
      style={({ pressed }) => [
        styles.pressable,
        pressed && !disabled && !swipeEnabled ? styles.pressablePressed : null,
        disabled ? styles.pressableDisabled : null,
      ]}
    >
      <View style={[styles.shadowWrap, styles.cardShell]}>
        <View style={styles.glassOrbPrimary} />
        <View style={styles.glassOrbSecondary} />
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.36)",
            "rgba(255,255,255,0.12)",
            "rgba(255,255,255,0.04)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.edgeStroke}
        />
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.22)",
            "rgba(255,255,255,0.08)",
            "rgba(255,255,255,0.03)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <BlurView
          intensity={42}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.20)",
            "rgba(255,255,255,0.03)",
            "rgba(255,255,255,0.00)",
          ]}
          start={{ x: 0.08, y: 0.02 }}
          end={{ x: 0.72, y: 0.48 }}
          style={styles.topSheen}
        />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.brandRow}>
              <View style={styles.iconBubble}>
                <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.brandCopy}>
                <Text style={styles.brandKicker}>APPLE WALLET ID</Text>
                <Text style={styles.brandTitle}>Xtik Pass</Text>
              </View>
            </View>

            <View style={styles.verifiedPill}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#FFFFFF"
                style={styles.verifiedIcon}
              />
              <Text style={styles.verifiedText}>FACE ID</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.badgesRow}>
              <View style={styles.goldBadge}>
                <Text style={styles.goldBadgeText}>APPLE PASS</Text>
              </View>
              <View style={[styles.mutedBadge, styles.badgeSpacing]}>
                <Text style={styles.mutedBadgeText}>WALLET NATIVE</Text>
              </View>
            </View>

            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>PRIVATE</Text>
            </View>
          </View>

          <View style={styles.identityRow}>
            <View style={styles.holderColumn}>
              <View style={styles.avatarWrap}>
                <LinearGradient
                  colors={["#E9EDF4", "#C4CCD8", "#8C96A6"]}
                  start={{ x: 0.1, y: 0.1 }}
                  end={{ x: 0.9, y: 0.9 }}
                  style={styles.avatarFill}
                >
                  <Text style={styles.avatarInitials}>{holderInitials}</Text>
                </LinearGradient>
                <View style={styles.avatarStatusBadge}>
                  <Ionicons name="checkmark" size={10} color="#09111C" />
                </View>
              </View>

              <Text style={styles.holderName}>{holderName}</Text>
              <Text style={styles.holderHandle}>{holderHandle}</Text>

              <View style={styles.codePill}>
                <Text style={styles.codeText}>{idCode}</Text>
              </View>
            </View>

            <View style={styles.qrColumn}>
              <View style={styles.qrPanel}>
                <DigitalIdQrMatrix />
              </View>
              <Text style={styles.qrLabel}>APPLE PRIVATE ENTRY</Text>
            </View>
          </View>

          {swipeEnabled ? (
            <View style={styles.swipeTrack} onLayout={onSwipeLayout}>
              <View style={styles.swipeTrackTextRow}>
                <Ionicons
                  name="logo-apple"
                  size={15}
                  color="rgba(255,255,255,0.96)"
                />
                <Text style={styles.swipeTrackText}>
                  {authenticating ? busyLabel : (swipeHintLabel ?? ctaLabel)}
                </Text>
              </View>

              <View pointerEvents="none" style={styles.swipeTrailIcons}>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="rgba(255,255,255,0.28)"
                />
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="rgba(255,255,255,0.44)"
                  style={styles.swipeTrailIconSpacing}
                />
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="rgba(255,255,255,0.62)"
                  style={styles.swipeTrailIconSpacing}
                />
              </View>

              <Animated.View
                {...swipePanHandlers}
                style={[
                  styles.swipeThumb,
                  swipeCompleted ? styles.swipeThumbCompleted : null,
                  swipeOffset
                    ? {
                        transform: [{ translateX: swipeOffset }],
                      }
                    : null,
                ]}
              >
                <Ionicons
                  name={swipeCompleted ? "checkmark" : "chevron-forward"}
                  size={20}
                  color="#0C1420"
                />
              </Animated.View>
            </View>
          ) : (
            <View
              style={[
                styles.ctaRow,
                ctaArrowOnRight ? styles.ctaRowInline : null,
              ]}
            >
              {ctaArrowOnRight ? (
                <View style={styles.ctaIconWrap}>
                  <Ionicons
                    name={authenticating ? "scan-circle" : ctaArrowName}
                    size={18}
                    color="#F4C565"
                  />
                </View>
              ) : null}

              <View
                style={[
                  styles.ctaTextRow,
                  ctaArrowOnRight ? styles.ctaTextRowInline : null,
                ]}
              >
                <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
                <Text style={styles.ctaText}>
                  {authenticating ? busyLabel : ctaLabel}
                </Text>
              </View>

              {!ctaArrowOnRight ? (
                <View style={styles.ctaIconWrap}>
                  <Ionicons
                    name={authenticating ? "scan-circle" : ctaArrowName}
                    size={18}
                    color="#F4C565"
                  />
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function DigitalIdQrMatrix() {
  return (
    <View style={styles.qrGrid}>
      {QR_PATTERN.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={[
            styles.qrRow,
            rowIndex < QR_PATTERN.length - 1 ? styles.qrRowSpacing : null,
          ]}
        >
          {row.split("").map((cell, cellIndex) => (
            <View
              key={`${rowIndex}-${cellIndex}`}
              style={[
                styles.qrCell,
                {
                  backgroundColor: cell === "1" ? "#08111B" : "#FFFFFF",
                },
                cellIndex < row.length - 1 ? styles.qrCellSpacing : null,
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
  },
  pressablePressed: {
    opacity: 0.95,
  },
  pressableDisabled: {
    opacity: 0.9,
  },
  shadowWrap: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.28,
    shadowRadius: 34,
    elevation: 22,
  },
  cardShell: {
    overflow: "hidden",
    borderRadius: 32,
  },
  glassOrbPrimary: {
    position: "absolute",
    top: -48,
    left: -18,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  glassOrbSecondary: {
    position: "absolute",
    bottom: -64,
    right: -28,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(202,214,234,0.08)",
  },
  edgeStroke: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  topSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  content: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(24,31,43,0.56)",
    paddingHorizontal: 22,
    paddingVertical: 22,
  },
  topRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexShrink: 1,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  brandCopy: {
    marginRight: 12,
    alignItems: "flex-end",
  },
  brandKicker: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textAlign: "right",
  },
  brandTitle: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.2,
    textAlign: "right",
  },
  verifiedPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  verifiedText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statusRow: {
    marginTop: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgesRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  goldBadge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.11)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goldBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  mutedBadge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeSpacing: {
    marginRight: 8,
  },
  mutedBadgeText: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  statusPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },
  statusText: {
    marginRight: 8,
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  identityRow: {
    marginTop: 20,
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  holderColumn: {
    flex: 1,
    alignItems: "flex-end",
  },
  avatarWrap: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  avatarFill: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#16202B",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1,
  },
  avatarStatusBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  holderName: {
    marginTop: 16,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "right",
  },
  holderHandle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
  codePill: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  codeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  qrColumn: {
    alignItems: "center",
    marginRight: 16,
  },
  qrPanel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: 12,
  },
  qrLabel: {
    marginTop: 8,
    color: "rgba(255,255,255,0.64)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  ctaRow: {
    marginTop: 20,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ctaRowInline: {
    justifyContent: "flex-start",
  },
  ctaTextRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexShrink: 1,
  },
  ctaTextRowInline: {
    marginRight: 10,
  },
  ctaText: {
    marginRight: 8,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  ctaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  swipeTrack: {
    marginTop: 20,
    height: 62,
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
  },
  swipeTrackTextRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 108,
  },
  swipeTrackText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginRight: 8,
  },
  swipeTrailIcons: {
    position: "absolute",
    right: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  swipeTrailIconSpacing: {
    marginLeft: -4,
  },
  swipeThumb: {
    position: "absolute",
    left: 8,
    top: 8,
    width: 62,
    height: 46,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  swipeThumbCompleted: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(255,255,255,0.9)",
  },
  qrGrid: {
    alignItems: "center",
  },
  qrRow: {
    flexDirection: "row",
  },
  qrRowSpacing: {
    marginBottom: 2,
  },
  qrCell: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  qrCellSpacing: {
    marginRight: 2,
  },
});
