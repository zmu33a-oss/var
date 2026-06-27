import { useEffect, useMemo, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
  Animated,
  Easing,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SealCheckIcon from "../../components/SealCheckIcon";
import type { FanClubId } from "../../app.types";
import { createCompatStyleSheet } from "../../lib/crossPlatformStyles";
import { useCheerClickSound } from "./fans.cheerSound";
import { resolveLeadingFanClub } from "./fans.leader";
import {
  FANS_HERO_META_MIN_HEIGHT,
  FANS_HERO_PADDING_BOTTOM,
  FANS_HERO_PADDING_TOP,
} from "./fans.layout.constants";

const HERO_ASSOCIATION_FONT_FAMILY = "FansHeroZain";
const HERO_ASSOCIATION_FONT = require("../../../assets/images/alfont_com_zainpcv2mob600-zainpcv2.ttf");

const SWIPE_TRACK_WIDTH = 74;
const SWIPE_THUMB_SIZE = 26;
const SWIPE_TRACK_PADDING = 3;
const SWIPE_LABEL_INSET = SWIPE_THUMB_SIZE + 6;
const SWIPE_TRIGGER_RATIO = 0.58;
const SWIPE_HINT_SHIFT = 5;
const SWIPE_HINT_BACK_OFFSET = -2;
const SWIPE_HINT_DURATION_MS = 1000;
const SWIPE_THUMB_BACK_NUDGE = -2;

type FansAssociationHeroProps = {
  supporters: Record<FanClubId, number>;
  supportedTeams: FanClubId[];
  isLoggedIn: boolean;
  onRequireAuth: (message?: string) => void;
  onToggleSupport: (clubId: FanClubId) => void;
  overrideClubId?: FanClubId;
  onTitlePress?: () => void;
  onDotsPress?: () => void;
};

function HeroClubLogo(props: {
  emblem?: number;
  gradient: [string, string];
  icon: string;
}) {
  if (props.emblem) {
    return (
      <Image
        source={props.emblem}
        resizeMode="contain"
        style={styles.clubLogoImage}
      />
    );
  }

  return (
    <LinearGradient colors={props.gradient} style={styles.clubLogoFallback}>
      <Ionicons
        name={props.icon as "moon"}
        size={18}
        color="#FFFFFF"
      />
    </LinearGradient>
  );
}

function FansCheerSwipeButton(props: {
  clubId: FanClubId;
  isSupported: boolean;
  alreadySupportingAnother: boolean;
  isLoggedIn: boolean;
  onRequireAuth: (message?: string) => void;
  onToggleSupport: (clubId: FanClubId) => void;
}) {
  const dragX = useRef(new Animated.Value(0)).current;
  const hintShift = useRef(new Animated.Value(0)).current;
  const hintLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const playCheerClickSound = useCheerClickSound();
  const swipeTravel =
    SWIPE_TRACK_WIDTH - SWIPE_THUMB_SIZE - SWIPE_TRACK_PADDING * 2;

  const startHintLoop = () => {
    hintLoopRef.current?.stop();
    hintShift.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintShift, {
          toValue: 1,
          duration: SWIPE_HINT_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(hintShift, {
          toValue: 0,
          duration: SWIPE_HINT_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    hintLoopRef.current = loop;
    loop.start();
  };

  const stopHintLoop = () => {
    hintLoopRef.current?.stop();
    hintLoopRef.current = null;
    hintShift.stopAnimation();
    hintShift.setValue(0);
  };

  useEffect(() => {
    if (props.isSupported) {
      stopHintLoop();
      return;
    }

    startHintLoop();

    return () => {
      stopHintLoop();
    };
  }, [props.isSupported]);

  const hintTranslateX = hintShift.interpolate({
    inputRange: [0, 1],
    outputRange: [SWIPE_HINT_BACK_OFFSET, SWIPE_HINT_SHIFT + SWIPE_HINT_BACK_OFFSET],
  });

  const snapToStart = () => {
    Animated.spring(dragX, {
      toValue: 0,
      useNativeDriver: false,
      friction: 7,
      tension: 90,
    }).start();
  };

  const playClickSound = () => {
    void playCheerClickSound();
  };

  const resolveSwipeDelta = (dx: number) =>
    Math.max(0, Math.min(swipeTravel, Math.abs(dx)));

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          if (!props.isLoggedIn) {
            props.onRequireAuth("سجّل الدخول لدعم الرابطة.");
            return;
          }

          stopHintLoop();
          dragX.setValue(0);
        },
        onPanResponderMove: (_, gesture) => {
          if (!props.isLoggedIn) {
            return;
          }

          dragX.setValue(resolveSwipeDelta(gesture.dx));
        },
        onPanResponderRelease: (_, gesture) => {
          if (!props.isLoggedIn) {
            snapToStart();
            return;
          }

          const total = resolveSwipeDelta(gesture.dx);
          const didToggle = total >= swipeTravel * SWIPE_TRIGGER_RATIO;

          if (didToggle) {
            if (props.alreadySupportingAnother) {
              Alert.alert(
                "لا يمكن التشجيع",
                "أنت بالفعل تشجّع ناديًا آخر. كل يوزر يحق له تشجيع فريق واحد فقط.",
                [{ text: "حسناً", style: "default" }],
              );
              snapToStart();
              startHintLoop();
              return;
            }
            playClickSound();
            props.onToggleSupport(props.clubId);
          }

          snapToStart();

          if (!didToggle && !props.isSupported) {
            startHintLoop();
          }
        },
        onPanResponderTerminate: () => {
          snapToStart();

          if (!props.isSupported) {
            startHintLoop();
          }
        },
      }),
    [props.clubId, props.isLoggedIn, props.isSupported, props.alreadySupportingAnother, props.onToggleSupport, swipeTravel],
  );

  const trackBackground = props.isSupported ? "#000000" : "#1D9BF0";
  const trackLabel = props.isSupported ? "إلغاء" : "شجع";

  return (
    <View
      style={[
        styles.swipeTrack,
        props.isSupported ? styles.swipeTrackSupported : null,
        Platform.OS === "web" ? styles.swipeTrackWeb : null,
        {
          backgroundColor: trackBackground,
          width: SWIPE_TRACK_WIDTH,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.swipeTrackLabelHost} pointerEvents="none">
        <Text
          style={[
            styles.swipeTrackLabel,
            props.isSupported ? styles.swipeTrackLabelSupported : null,
          ]}
        >
          {trackLabel}
        </Text>
      </View>
      <Animated.View
        style={[
          styles.swipeThumb,
          {
            marginLeft: SWIPE_THUMB_BACK_NUDGE,
            transform: [{ translateX: dragX }],
          },
        ]}
        pointerEvents="none"
      >
        {props.isSupported ? (
          <Ionicons name="checkmark" size={15} color="#000000" />
        ) : (
          <Animated.View
            style={{
              transform: [{ translateX: hintTranslateX }],
            }}
          >
            <Ionicons name="chevron-forward" size={16} color="#1D9BF0" />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

export { FansCheerSwipeButton };

/** شعار/اسم/توثيق/VAR — أسفل اللسان. */
export default function FansAssociationHero(props: FansAssociationHeroProps) {
  const [areHeroFontsLoaded] = useFonts({
    [HERO_ASSOCIATION_FONT_FAMILY]: HERO_ASSOCIATION_FONT,
  });
  const associationFontFamily = areHeroFontsLoaded
    ? HERO_ASSOCIATION_FONT_FAMILY
    : undefined;
  const leader = useMemo(
    () => resolveLeadingFanClub(props.supporters),
    [props.supporters],
  );

  const displayClub = useMemo(() => {
    if (!props.overrideClubId) return leader;
    return resolveLeadingFanClub(
      Object.fromEntries(
        Object.keys(props.supporters).map((id) => [
          id,
          id === props.overrideClubId
            ? (props.supporters[id as FanClubId] ?? 0)
            : 0,
        ]),
      ) as Record<FanClubId, number>,
    );
  }, [props.overrideClubId, props.supporters, leader]);

  if (!displayClub) {
    return null;
  }

  const isSupported = props.supportedTeams.includes(displayClub.club.id);
  const alreadySupportingAnother =
    !isSupported &&
    props.supportedTeams.length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.metaRow}>
        <View style={styles.gearSlot}>
          <Pressable
            style={({ pressed }) => [styles.dotsButton, pressed && styles.dotsButtonPressed]}
            onPress={props.onDotsPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="خيارات"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.65)" />
          </Pressable>
        </View>

        <View style={styles.associationCenter} pointerEvents="box-none">
          <Pressable
            onPress={props.onTitlePress}
            hitSlop={8}
            style={styles.titlePressable}
          >
            <View style={styles.titleRow}>
              <Text
                style={[
                  associationFontFamily
                    ? { fontFamily: associationFontFamily }
                    : null,
                  styles.associationTitle,
                ]}
                numberOfLines={1}
              >
                {`رابطة ${displayClub.club.title}`}
              </Text>
              <SealCheckIcon size={16} style={styles.verifiedIcon} />
            </View>
          </Pressable>
        </View>

        <View style={styles.brandGroup}>
          <View style={styles.cheerSlot}>
            <View style={styles.logoFloating}>
              <HeroClubLogo
                emblem={displayClub.emblem}
                gradient={displayClub.club.gradient}
                icon={displayClub.club.icon}
              />
            </View>

            <FansCheerSwipeButton
              clubId={displayClub.club.id}
              isSupported={isSupported}
              alreadySupportingAnother={alreadySupportingAnother}
              isLoggedIn={props.isLoggedIn}
              onRequireAuth={props.onRequireAuth}
              onToggleSupport={props.onToggleSupport}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = createCompatStyleSheet({
  root: {
    paddingHorizontal: 14,
    paddingTop: FANS_HERO_PADDING_TOP,
    paddingBottom: FANS_HERO_PADDING_BOTTOM,
    backgroundColor: "#000000",
    overflow: "visible",
  },
  metaRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: FANS_HERO_META_MIN_HEIGHT,
    paddingHorizontal: 2,
    overflow: "visible",
  },
  brandGroup: {
    alignSelf: "center",
    flexShrink: 0,
    zIndex: 2,
  },
  cheerSlot: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logoFloating: {
    position: "absolute",
    bottom: "100%",
    marginBottom: 5,
    alignItems: "center",
  },
  gearSlot: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 3,
  },
  associationCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  titleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    maxWidth: 176,
  },
  associationTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
  verifiedIcon: {
    opacity: 1,
  },
  clubLogoImage: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#000000",
  },
  clubLogoFallback: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeTrack: {
    height: 30,
    borderRadius: 999,
    padding: SWIPE_TRACK_PADDING,
    justifyContent: "center",
    overflow: "hidden",
    direction: "ltr",
  },
  swipeTrackWeb: {
    touchAction: "none",
    userSelect: "none",
    cursor: "grab",
  } as const,
  swipeTrackSupported: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  swipeTrackLabelHost: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: SWIPE_LABEL_INSET,
    paddingRight: 4,
  },
  swipeTrackLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  swipeTrackLabelSupported: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  swipeThumb: {
    width: SWIPE_THUMB_SIZE,
    height: SWIPE_THUMB_SIZE,
    borderRadius: SWIPE_THUMB_SIZE / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  dotsButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  dotsButtonPressed: {
    opacity: 0.55,
  },
  titlePressable: {
    alignItems: "center",
    justifyContent: "center",
  },
});
