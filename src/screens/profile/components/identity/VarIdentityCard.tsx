import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import QRCode from "react-native-qrcode-svg";
import {
  getArabicFontStyle,
  resolveProfileAvatarUri,
} from "../../profile.helpers";

const CARD_ASPECT_RATIO = 0.57;

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

function GoldenFrontQr(props: { value: string; compact: boolean }) {
  const size = props.compact ? 42 : 48;

  return (
    <View style={styles.frontQrPlate}>
      <QRCode
        value={props.value}
        size={size}
        color="#2A1E08"
        backgroundColor="transparent"
        quietZone={2}
      />
    </View>
  );
}

function GoldenCardFront(props: {
  width: number;
  displayVarId: string;
  isVerified?: boolean;
}) {
  const cardHeight = props.width * CARD_ASPECT_RATIO;
  const compact = props.width < 360;
  const qrPayload = buildVarQrPayload(props.displayVarId);

  return (
    <LinearGradient
      colors={["#D5B370", "#EED8A7", "#C29F5C", "#E6CC92", "#AF8C47"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { width: props.width, height: cardHeight }]}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.18)", "transparent"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.watermarkContainer}>
        <Text style={styles.watermarkText}>VAR</Text>
      </View>

      <View style={styles.topRightContainer}>
        <Text style={styles.varGoldText}>
          <Text style={styles.serifBold}>VAR</Text>{" "}
          {props.isVerified ? "GOLD" : "MEMBER"}
        </Text>
      </View>

      <View style={styles.logoRow}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoMainText}>VAR</Text>
          <Text style={styles.logoSubText}>VAR BANK FOR FANS</Text>
        </View>

        <GoldenFrontQr value={qrPayload} compact={compact} />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerRight}>
          <Text style={styles.farIdText}>
            {props.displayVarId || "VAR-0000000"}
          </Text>
          <Text style={styles.idSubtitle}>VAR ID</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function GoldenCardBack(props: {
  width: number;
  avatarUri: string;
  displayVarId: string;
  joinDate: string;
  nationalityArabic: string;
  nationalityEnglish: string;
  arabicTextStyle: object | undefined;
}) {
  const cardHeight = props.width * CARD_ASPECT_RATIO;
  const qrSize = props.width < 340 ? 54 : 62;
  const qrPayload = buildVarQrPayload(props.displayVarId);

  return (
    <LinearGradient
      colors={["#AF8C47", "#C29F5C", "#B8934E", "#9A7838"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        styles.cardBack,
        { width: props.width, height: cardHeight },
      ]}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.10)", "transparent"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.backHeader}>
        <Text style={styles.backTitle}>MEMBER DETAILS</Text>
        <Text style={styles.backSubtitle}>VAR PRIVATE ID</Text>
      </View>

      <View style={styles.backBody}>
        <View style={styles.backAvatarWrap}>
          <Image
            source={{ uri: resolveProfileAvatarUri(props.avatarUri) }}
            style={styles.backAvatarImage}
          />
        </View>

        <View style={styles.backInfoBlock}>
          <View style={styles.backInfoRow}>
            <Text style={styles.backInfoLabel}>MEMBER SINCE</Text>
            <Text style={[styles.backInfoValue, props.arabicTextStyle]}>
              {props.joinDate || "—"}
            </Text>
          </View>

          <View style={styles.backInfoRow}>
            <Text style={styles.backInfoLabel}>NATIONALITY</Text>
            <Text style={[styles.backInfoValue, props.arabicTextStyle]}>
              {props.nationalityArabic || "—"}
            </Text>
            {props.nationalityEnglish ? (
              <Text style={styles.backInfoSubValue}>
                {props.nationalityEnglish}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.backQrPlate}>
          <QRCode
            value={qrPayload}
            size={qrSize}
            color="#0A0C10"
            backgroundColor="#F5F0E6"
            quietZone={4}
          />
        </View>
      </View>

      <View style={styles.backFooter}>
        <Text style={styles.backFooterId}>
          {props.displayVarId || "VAR-0000000"}
        </Text>
      </View>
    </LinearGradient>
  );
}

export function VarIdentityCard(props: VarIdentityCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const rotation = useSharedValue(0);
  const arabicTextStyle = getArabicFontStyle(props.arabicFontFamily);
  const cardHeight = props.width * CARD_ASPECT_RATIO;

  const toggleFlip = () => {
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    rotation.value = withTiming(nextFlipped ? 180 : 0, {
      duration: 550,
      easing: Easing.inOut(Easing.cubic),
    });
  };

  const flipStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.wrapper, { width: props.width }]}>
      <View style={[styles.flipStage, { height: cardHeight }]}>
        <Animated.View
          style={[
            styles.flipInner,
            flipStyle,
            Platform.OS === "web"
              ? ({ transformStyle: "preserve-3d" } as object)
              : null,
          ]}
        >
          <View
            style={[
              styles.cardFace,
              Platform.OS === "web"
                ? ({ backfaceVisibility: "hidden" } as object)
                : null,
            ]}
          >
            <GoldenCardFront
              width={props.width}
              displayVarId={props.displayVarId}
              isVerified={props.isVerified}
            />
          </View>

          <View
            style={[
              styles.cardFace,
              styles.cardFaceBack,
              Platform.OS === "web"
                ? ({ backfaceVisibility: "hidden" } as object)
                : null,
            ]}
          >
            <GoldenCardBack
              width={props.width}
              avatarUri={props.avatarUri}
              displayVarId={props.displayVarId}
              joinDate={props.joinDate}
              nationalityArabic={props.nationalityArabic}
              nationalityEnglish={props.nationalityEnglish}
              arabicTextStyle={arabicTextStyle}
            />
          </View>
        </Animated.View>
      </View>

      <Pressable style={styles.flipButton} onPress={toggleFlip}>
        <Ionicons
          name="sync-outline"
          size={16}
          color="#E8D5A3"
          style={isFlipped ? styles.flipIconFlipped : null}
        />
        <Text style={styles.flipButtonText}>
          {isFlipped ? "عرض الوجه الأمامي" : "قلب البطاقة"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "center",
    marginTop: 10,
  },
  flipStage: {
    width: "100%",
  },
  flipInner: {
    width: "100%",
    height: "100%",
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
  },
  cardFaceBack: {
    transform: [{ rotateY: "180deg" }],
  },
  card: {
    borderRadius: 14,
    padding: 18,
    shadowColor: "#bca168",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cardBack: {
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  watermarkContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.05,
  },
  watermarkText: {
    fontSize: 120,
    fontWeight: "900",
    color: "#000000",
  },
  topRightContainer: {
    position: "absolute",
    top: 18,
    right: 20,
    alignItems: "flex-end",
  },
  varGoldText: {
    fontSize: 12,
    color: "#111111",
    letterSpacing: 1.2,
  },
  serifBold: {
    fontWeight: "bold",
  },
  logoRow: {
    marginTop: 35,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  logoContainer: {
    alignItems: "flex-start",
    paddingLeft: 4,
    flex: 1,
  },
  logoMainText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#0a0a0a",
    letterSpacing: -1,
  },
  logoSubText: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: -2,
    letterSpacing: 0.3,
  },
  frontQrPlate: {
    marginTop: 28,
    borderRadius: 8,
    padding: 2,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    position: "absolute",
    bottom: 18,
    right: 20,
  },
  footerRight: {
    alignItems: "flex-end",
  },
  farIdText: {
    fontSize: 12.5,
    fontWeight: "bold",
    color: "#050505",
    letterSpacing: 0.8,
  },
  idSubtitle: {
    fontSize: 8,
    fontWeight: "700",
    color: "rgba(17,17,17,0.72)",
    marginTop: 2,
    letterSpacing: 0.6,
  },
  backHeader: {
    alignItems: "flex-end",
  },
  backTitle: {
    color: "#111111",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  backSubtitle: {
    color: "rgba(17,17,17,0.72)",
    fontSize: 8.5,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginTop: 2,
  },
  backBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 10,
  },
  backAvatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(17,17,17,0.25)",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  backAvatarImage: {
    width: "100%",
    height: "100%",
  },
  backInfoBlock: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  backInfoRow: {
    alignItems: "flex-end",
  },
  backInfoLabel: {
    color: "rgba(17,17,17,0.55)",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1,
  },
  backInfoValue: {
    color: "#111111",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "right",
  },
  backInfoSubValue: {
    color: "rgba(17,17,17,0.62)",
    fontSize: 8.5,
    fontWeight: "600",
    marginTop: 1,
    textAlign: "right",
  },
  backQrPlate: {
    borderRadius: 10,
    padding: 5,
    backgroundColor: "#F5F0E6",
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.18)",
  },
  backFooter: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  backFooterId: {
    color: "#050505",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  flipButton: {
    marginTop: 14,
    alignSelf: "center",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.35)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  flipButtonText: {
    color: "#E8D5A3",
    fontSize: 13,
    fontWeight: "700",
  },
  flipIconFlipped: {
    transform: [{ rotate: "180deg" }],
  },
});
