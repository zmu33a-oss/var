import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
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
import type { MembershipCardTier } from "../../../../lib/membershipCardTier";
import {
  getMembershipCardTheme,
  getMembershipCardTierLabel,
} from "../../../../lib/membershipCardTier";
import {
  getArabicFontStyle,
  resolveProfileAvatarUri,
} from "../../profile.helpers";
import {
  buildVarQrPayload,
  generateTightVarQrDataUrl,
  scaleVarQrDisplaySize,
} from "../../profileCardConnect.utils";

const CARD_ASPECT_RATIO = 0.57;

type VarIdentityCardProps = {
  width: number;
  avatarUri: string;
  displayName: string;
  displayVarId: string;
  association: string;
  joinDate: string;
  nationalityArabic: string;
  nationalityEnglish: string;
  arabicFontFamily?: string;
  cardTier?: MembershipCardTier;
};

function resolveQrRenderLightColor(
  qrBackground: string,
  cardTier: MembershipCardTier,
) {
  if (qrBackground !== "transparent") {
    return qrBackground;
  }

  return getMembershipCardTheme(cardTier).frontGradient[0];
}

function TightVarQr(props: {
  value: string;
  size: number;
  cardTier: MembershipCardTier;
  qrColor: string;
  qrBackground: string;
}) {
  const [qrUri, setQrUri] = useState<string | null>(null);
  const useSvgFallback = Platform.OS !== "web" || !qrUri;
  const renderLightColor = resolveQrRenderLightColor(
    props.qrBackground,
    props.cardTier,
  );

  useEffect(() => {
    if (Platform.OS !== "web") {
      return undefined;
    }

    let cancelled = false;

    generateTightVarQrDataUrl(props.value, props.size, {
      dark: props.qrColor,
      light: renderLightColor,
    })
      .then((uri) => {
        if (!cancelled) {
          setQrUri(uri);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrUri(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [props.value, props.size, props.qrColor, renderLightColor]);

  return (
    <View
      style={{
        width: props.size,
        height: props.size,
        overflow: "hidden",
        borderRadius: 2,
        backgroundColor: "transparent",
      }}
    >
      {useSvgFallback ? (
        <QRCode
          value={props.value}
          size={props.size}
          color={props.qrColor}
          backgroundColor={props.qrBackground}
          quietZone={0}
          ecl="M"
        />
      ) : (
        <Image
          source={{ uri: qrUri! }}
          style={{ width: props.size, height: props.size }}
          resizeMode="stretch"
        />
      )}
    </View>
  );
}

function CardFrontQr(props: {
  value: string;
  compact: boolean;
  cardTier: MembershipCardTier;
  qrColor: string;
  qrBackground: string;
}) {
  const size = scaleVarQrDisplaySize(props.compact ? 58 : 66);

  return (
    <View style={styles.frontQrPlate}>
      <TightVarQr
        value={props.value}
        size={size}
        cardTier={props.cardTier}
        qrColor={props.qrColor}
        qrBackground={props.qrBackground}
      />
    </View>
  );
}

function CardFront(props: {
  width: number;
  displayVarId: string;
  cardTier: MembershipCardTier;
}) {
  const theme = getMembershipCardTheme(props.cardTier);
  const cardHeight = props.width * CARD_ASPECT_RATIO;
  const compact = props.width < 360;
  const qrPayload = buildVarQrPayload(props.displayVarId);
  const tierLabel = getMembershipCardTierLabel(props.cardTier);
  const showIdBadge = props.cardTier === "classic";

  return (
    <LinearGradient
      colors={theme.frontGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        {
          width: props.width,
          height: cardHeight,
          borderColor: theme.borderColor,
          shadowColor: theme.shadowColor,
        },
      ]}
    >
      <LinearGradient
        colors={theme.sheenGradient}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.watermarkContainer}>
        <Text style={[styles.watermarkText, { color: theme.watermark }]}>
          VAR
        </Text>
      </View>

      <View style={styles.topLeftContainer}>
        <Text style={[styles.tierText, { color: theme.primaryText }]}>
          {tierLabel}
        </Text>
      </View>

      <View style={styles.logoRow}>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoMainText, { color: theme.primaryText }]}>
            VAR
          </Text>
          <Text style={[styles.logoSubText, { color: theme.secondaryText }]}>
            VAR BANK FOR FANS
          </Text>
        </View>

        <CardFrontQr
          value={qrPayload}
          compact={compact}
          cardTier={props.cardTier}
          qrColor={theme.qrColor}
          qrBackground={theme.qrBackground}
        />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerRight}>
          {showIdBadge ? (
            <View
              style={[
                styles.idBadge,
                { backgroundColor: theme.idBadgeBackground },
              ]}
            >
              <Text style={[styles.idBadgeText, { color: theme.idBadgeText }]}>
                {props.displayVarId || "VAR-0000000"}
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.farIdText, { color: theme.idBadgeText }]}>
                {props.displayVarId || "VAR-0000000"}
              </Text>
              <Text style={[styles.idSubtitle, { color: theme.mutedText }]}>
                VAR ID
              </Text>
            </>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

function CardBack(props: {
  width: number;
  avatarUri: string;
  displayName: string;
  displayVarId: string;
  association: string;
  joinDate: string;
  nationalityArabic: string;
  nationalityEnglish: string;
  arabicTextStyle: object | undefined;
  cardTier: MembershipCardTier;
}) {
  const theme = getMembershipCardTheme(props.cardTier);
  const cardHeight = props.width * CARD_ASPECT_RATIO;
  const qrSize = scaleVarQrDisplaySize(props.width < 340 ? 64 : 72);
  const qrPayload = buildVarQrPayload(props.displayVarId);

  return (
    <LinearGradient
      colors={theme.backGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        styles.cardBack,
        {
          width: props.width,
          height: cardHeight,
          borderColor: theme.borderColor,
          shadowColor: theme.shadowColor,
        },
      ]}
    >
      <LinearGradient
        colors={theme.sheenGradient}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.backHeader}>
        <Text style={[styles.backTitle, { color: theme.primaryText }]}>
          MEMBER DETAILS
        </Text>
        <Text style={[styles.backSubtitle, { color: theme.mutedText }]}>
          VAR PRIVATE ID
        </Text>
      </View>

      <View style={styles.backBody}>
        <View
          style={[styles.backAvatarWrap, { borderColor: theme.borderColor }]}
        >
          <Image
            source={{ uri: resolveProfileAvatarUri(props.avatarUri) }}
            style={styles.backAvatarImage}
          />
        </View>

        <View style={styles.backInfoBlock}>
          <View style={styles.backInfoRow}>
            <Text style={[styles.backInfoLabel, { color: theme.mutedText }]}>
              MEMBER NAME
            </Text>
            <Text
              style={[
                styles.backInfoValue,
                props.arabicTextStyle,
                { color: theme.primaryText },
              ]}
            >
              {props.displayName || "—"}
            </Text>
          </View>

          <View style={styles.backInfoRow}>
            <Text style={[styles.backInfoLabel, { color: theme.mutedText }]}>
              ASSOCIATION
            </Text>
            <Text
              style={[
                styles.backInfoValue,
                props.arabicTextStyle,
                { color: theme.primaryText },
              ]}
            >
              {props.association || "—"}
            </Text>
          </View>

          <View style={styles.backInfoRow}>
            <Text style={[styles.backInfoLabel, { color: theme.mutedText }]}>
              MEMBER SINCE
            </Text>
            <Text
              style={[
                styles.backInfoValue,
                props.arabicTextStyle,
                { color: theme.primaryText },
              ]}
            >
              {props.joinDate || "—"}
            </Text>
          </View>

          <View style={styles.backInfoRow}>
            <Text style={[styles.backInfoLabel, { color: theme.mutedText }]}>
              NATIONALITY
            </Text>
            <Text
              style={[
                styles.backInfoValue,
                props.arabicTextStyle,
                { color: theme.primaryText },
              ]}
            >
              {props.nationalityArabic || "—"}
            </Text>
            {props.nationalityEnglish ? (
              <Text
                style={[
                  styles.backInfoSubValue,
                  { color: theme.secondaryText },
                ]}
              >
                {props.nationalityEnglish}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.backQrPlate}>
          <TightVarQr
            value={qrPayload}
            size={qrSize}
            cardTier={props.cardTier}
            qrColor={theme.qrColor}
            qrBackground={theme.qrBackground}
          />
        </View>
      </View>

      <View style={styles.backFooter}>
        <Text style={[styles.backFooterId, { color: theme.idBadgeText }]}>
          {props.displayVarId || "VAR-0000000"}
        </Text>
      </View>
    </LinearGradient>
  );
}

export function VarIdentityCard(props: VarIdentityCardProps) {
  const cardTier = props.cardTier ?? "classic";
  const theme = getMembershipCardTheme(cardTier);
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
            <CardFront
              width={props.width}
              displayVarId={props.displayVarId}
              cardTier={cardTier}
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
            <CardBack
              width={props.width}
              avatarUri={props.avatarUri}
              displayName={props.displayName}
              displayVarId={props.displayVarId}
              association={props.association}
              joinDate={props.joinDate}
              nationalityArabic={props.nationalityArabic}
              nationalityEnglish={props.nationalityEnglish}
              arabicTextStyle={arabicTextStyle}
              cardTier={cardTier}
            />
          </View>
        </Animated.View>
      </View>

      <Pressable
        style={[
          styles.flipButton,
          {
            borderColor: theme.flipButtonBorder,
          },
        ]}
        onPress={toggleFlip}
      >
        <Ionicons
          name="sync-outline"
          size={16}
          color={theme.flipButtonText}
          style={isFlipped ? styles.flipIconFlipped : null}
        />
        <Text style={[styles.flipButtonText, { color: theme.flipButtonText }]}>
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardBack: {},
  watermarkContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  watermarkText: {
    fontSize: 120,
    fontWeight: "900",
  },
  topLeftContainer: {
    position: "absolute",
    top: 18,
    left: 20,
    alignItems: "flex-start",
  },
  tierText: {
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "800",
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
    letterSpacing: -1,
  },
  logoSubText: {
    fontSize: 8.5,
    fontWeight: "700",
    marginTop: -2,
    letterSpacing: 0.3,
  },
  frontQrPlate: {
    marginTop: 28,
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
  idBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  idBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  farIdText: {
    fontSize: 12.5,
    fontWeight: "bold",
    letterSpacing: 0.8,
  },
  idSubtitle: {
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: 0.6,
  },
  backHeader: {
    alignItems: "flex-end",
  },
  backTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  backSubtitle: {
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
    backgroundColor: "rgba(255,255,255,0.08)",
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
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1,
  },
  backInfoValue: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "right",
  },
  backInfoSubValue: {
    fontSize: 8.5,
    fontWeight: "600",
    marginTop: 1,
    textAlign: "right",
  },
  backQrPlate: {
    borderRadius: 2,
    overflow: "hidden",
  },
  backFooter: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  backFooterId: {
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
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  flipButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  flipIconFlipped: {
    transform: [{ rotate: "180deg" }],
  },
});
