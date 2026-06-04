import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import {
  createCompatStyleSheet,
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../lib/crossPlatformStyles";

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
        <LinearGradient
          colors={["#0F766E", "#0B1823", "#05080F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.glassOrbPrimary} />
        <View style={styles.glassOrbSecondary} />
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.18)",
            "rgba(255,255,255,0.05)",
            "rgba(255,255,255,0.04)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.edgeStroke}
        />
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.10)",
            "rgba(255,255,255,0.02)",
            "rgba(255,255,255,0.00)",
          ]}
          start={{ x: 0.08, y: 0.02 }}
          end={{ x: 0.72, y: 0.48 }}
          style={styles.topSheen}
        />

        <View style={styles.content}>
          <View style={styles.statusRow}>
            <View style={styles.badgesRow}>
              <View style={styles.goldBadge}>
                <Ionicons
                  name="card-outline"
                  size={14}
                  color="rgba(255,255,255,0.88)"
                  style={styles.goldBadgeIcon}
                />
                <Text style={styles.goldBadgeText}>APPLE PASS</Text>
              </View>
              <View style={[styles.mutedBadge, styles.badgeSpacing]}>
                <Text style={styles.mutedBadgeText}>PROFILE ID</Text>
              </View>
            </View>

            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>PRIVATE</Text>
            </View>
          </View>

          <View style={styles.identityRow}>
            <View style={styles.holderColumn}>
              <Text style={styles.holderName}>{holderName}</Text>
              <Text style={styles.holderHandle}>{holderHandle}</Text>
            </View>

            <View style={styles.qrColumn}>
              <View style={styles.qrPanel}>
                <DigitalIdQrMatrix />
              </View>
              <Text style={styles.qrLabel}>APPLE PRIVATE ENTRY</Text>
            </View>
          </View>

          <View style={styles.codeBlock}>
            <Text style={styles.codeLabel}>VAR ID</Text>
            <Text style={styles.codeText}>{idCode}</Text>
          </View>

          {swipeEnabled ? (
            <View style={styles.swipeTrack} onLayout={onSwipeLayout}>
              <View style={styles.swipeTrackTextRow}>
                <Ionicons
                  name="card-outline"
                  size={15}
                  color="rgba(255,255,255,0.96)"
                />
                <Text style={styles.swipeTrackText}>
                  {authenticating ? busyLabel : (swipeHintLabel ?? ctaLabel)}
                </Text>
              </View>

              <View
                {...getNativePointerEventsProps("none")}
                style={[
                  styles.swipeTrailIcons,
                  getWebPointerEventsStyle("none"),
                ]}
              >
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
                <Ionicons name="card-outline" size={18} color="#FFFFFF" />
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

const styles = createCompatStyleSheet({
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
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 18,
  },
  cardShell: {
    overflow: "hidden",
    borderRadius: 28,
  },
  glassOrbPrimary: {
    position: "absolute",
    top: -24,
    left: -18,
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  glassOrbSecondary: {
    position: "absolute",
    bottom: -92,
    right: -36,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(15,118,110,0.20)",
  },
  edgeStroke: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  topSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  content: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "transparent",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  statusRow: {
    marginTop: 0,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgesRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  goldBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.11)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goldBadgeIcon: {
    marginLeft: 6,
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
    backgroundColor: "rgba(255,255,255,0.08)",
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
    marginTop: 22,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  holderColumn: {
    flex: 1,
    alignItems: "flex-end",
    minHeight: 92,
    justifyContent: "center",
  },
  holderName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "right",
  },
  holderHandle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  qrColumn: {
    alignItems: "center",
    marginRight: 14,
  },
  qrPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
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
  codeBlock: {
    alignSelf: "stretch",
    marginTop: 22,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "flex-end",
  },
  codeLabel: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
    letterSpacing: 0.6,
  },
  codeText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 6,
    letterSpacing: 0.8,
  },
  ctaRow: {
    marginTop: 18,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
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
    marginTop: 18,
    height: 62,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
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
