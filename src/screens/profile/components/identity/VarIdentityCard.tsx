import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import QRCode from "react-native-qrcode-svg";
import type { MembershipCardTier, MembershipCardTheme } from "../../../../lib/membershipCardTier";
import {
  getMembershipCardTheme,
  getMembershipCardTierLabel,
} from "../../../../lib/membershipCardTier";
import { getArabicFontStyle } from "../../profile.helpers";
import {
  buildVarQrPayload,
  generateTightVarQrDataUrl,
  scaleVarQrDisplaySize,
} from "../../profileCardConnect.utils";

const WALLET_SLIDE_TRACK_HEIGHT = 38;
const WALLET_SLIDE_TRACK_WIDTH = 138;
const WALLET_SLIDE_TRACK_BORDER = 1;
const WALLET_SLIDE_THUMB_SIZE = 48;
const WALLET_SLIDE_THUMB_HEIGHT =
  WALLET_SLIDE_TRACK_HEIGHT - WALLET_SLIDE_TRACK_BORDER * 2;
const WALLET_SLIDE_PADDING = 0;
const WALLET_SLIDE_THRESHOLD = 0.72;

const CARD_ASPECT_RATIO = 0.57;

type VarIdentityCardProps = {
  width: number;
  displayVarId: string;
  arabicFontFamily?: string;
  cardTier?: MembershipCardTier;
  onWalletSwipe?: () => void;
  onSharePress?: () => void;
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
          source={{ uri: qrUri }}
          resizeMode="contain"
          style={{ width: props.size, height: props.size }}
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
  onWalletSwipe?: () => void;
  onSharePress?: () => void;
}) {
  const theme = getMembershipCardTheme(props.cardTier);
  const cardHeight = props.width * CARD_ASPECT_RATIO;
  const compact = props.width < 360;
  const qrPayload = buildVarQrPayload(props.displayVarId);
  const tierLabel = getMembershipCardTierLabel(props.cardTier);

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
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
      />

      <View pointerEvents="none" style={styles.watermarkContainer}>
        <Text style={[styles.watermarkText, { color: theme.watermark }]}>
          VAR
        </Text>
      </View>

      <View style={styles.topHeaderRow}>
        <Text style={[styles.tierText, { color: theme.primaryText }]}>
          {tierLabel}
        </Text>

        {props.onSharePress ? (
          <TouchableOpacity
            accessibilityLabel="مشاركة بطاقة VAR"
            activeOpacity={0.72}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            onPress={props.onSharePress}
            style={styles.shareCornerButton}
          >
            <Ionicons
              color={theme.primaryText}
              name="share-outline"
              size={17}
            />
          </TouchableOpacity>
        ) : null}
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
          <Text style={[styles.idSubtitle, { color: theme.mutedText }]}>
            VAR ID
          </Text>
          <Text style={[styles.farIdText, { color: theme.idBadgeText }]}>
            {props.displayVarId || "VAR-0000000"}
          </Text>
        </View>
      </View>

      {props.onWalletSwipe && (
        <CardWalletSlide onComplete={props.onWalletSwipe} theme={theme} />
      )}
    </LinearGradient>
  );
}

function CardWalletSlide(props: {
  onComplete: () => void;
  theme: MembershipCardTheme;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const maxOffset = Math.max(
    0,
    trackWidth - WALLET_SLIDE_THUMB_SIZE - WALLET_SLIDE_PADDING * 2,
  );

  const resetThumb = () => {
    Animated.spring(translateX, {
      toValue: 0,
      bounciness: 0,
      speed: 20,
      useNativeDriver: false,
    }).start();
  };

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponderCapture: () => maxOffset > 0,
    onStartShouldSetPanResponder: () => maxOffset > 0,
    onMoveShouldSetPanResponderCapture: (_event, gestureState) =>
      maxOffset > 0 &&
      gestureState.dx > 3 &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onMoveShouldSetPanResponder: (_event, gestureState) =>
      maxOffset > 0 &&
      gestureState.dx > 3 &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderMove: (_event, gestureState) => {
      const nextOffset = Math.max(0, Math.min(maxOffset, gestureState.dx));
      translateX.setValue(nextOffset);
    },
    onPanResponderRelease: (_event, gestureState) => {
      const nextOffset = Math.max(0, Math.min(maxOffset, gestureState.dx));

      if (nextOffset >= maxOffset * WALLET_SLIDE_THRESHOLD) {
        Animated.timing(translateX, {
          toValue: maxOffset,
          duration: 170,
          useNativeDriver: false,
        }).start(() => {
          props.onComplete();
          resetThumb();
        });
        return;
      }

      resetThumb();
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: resetThumb,
  });

  return (
    <View style={styles.walletSlideTrack} onLayout={handleTrackLayout}>
      <View style={styles.walletSlideTextRow}>
        <Ionicons name="wallet-outline" size={12} color="#F4C565" />
        <Text style={styles.walletSlideText}>walIt</Text>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.walletSlideThumb,
          {
            transform: [{ translateX }],
            borderColor: "#FFFFFF",
            shadowColor: props.theme.shadowColor,
          },
        ]}
      >
        <LinearGradient
          colors={props.theme.frontGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={props.theme.sheenGradient}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

export function VarIdentityCard(props: VarIdentityCardProps) {
  const cardTier = props.cardTier ?? "classic";
  const cardHeight = props.width * CARD_ASPECT_RATIO;

  return (
    <View style={[styles.wrapper, { width: props.width }]}>
      <View style={{ height: cardHeight }}>
        <CardFront
          width={props.width}
          displayVarId={props.displayVarId}
          cardTier={cardTier}
          onWalletSwipe={props.onWalletSwipe}
          onSharePress={props.onSharePress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "center",
    marginTop: 10,
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
  watermarkContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  watermarkText: {
    fontSize: 120,
    fontWeight: "900",
  },
  topHeaderRow: {
    position: "absolute",
    top: 4,
    left: 18,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 30,
    elevation: 30,
  },
  shareCornerButton: {
    marginRight: -2,
    paddingHorizontal: 2,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
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
    zIndex: 5,
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
    zIndex: 10,
    elevation: 10,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    position: "absolute",
    bottom: 18,
    right: 6,
  },
  footerRight: {
    alignItems: "flex-end",
  },
  farIdText: {
    fontSize: 12.5,
    fontWeight: "bold",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  idSubtitle: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  walletSlideTrack: {
    position: "absolute",
    bottom: 14,
    left: 14,
    height: WALLET_SLIDE_TRACK_HEIGHT,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(8,14,24,0.84)",
    borderWidth: WALLET_SLIDE_TRACK_BORDER,
    borderColor: "rgba(255,255,255,0.92)",
    flexDirection: "row",
    alignItems: "center",
    width: WALLET_SLIDE_TRACK_WIDTH,
    zIndex: 20,
    elevation: 20,
  },
  walletSlideTextRow: {
    position: "absolute",
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  walletSlideText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  walletSlideThumb: {
    position: "absolute",
    left: 0,
    top: 0,
    width: WALLET_SLIDE_THUMB_SIZE,
    height: WALLET_SLIDE_THUMB_HEIGHT,
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
    overflow: "hidden",
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: WALLET_SLIDE_TRACK_BORDER,
    borderBottomWidth: WALLET_SLIDE_TRACK_BORDER,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});
