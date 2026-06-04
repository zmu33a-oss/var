import {
  type ComponentProps,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  Text as RNText,
  type TextProps,
  View,
} from "react-native";
import { FAN_CLUBS } from "../../app.data";
import type { FanClub, FanClubId } from "../../app.types";
import {
  createCompatStyleSheet,
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../../lib/crossPlatformStyles";

const TONGUE_FONT_FAMILY = "TongueZain";
const TONGUE_FONT = require("../../../assets/images/alfont_com_zainpcv2mob600-zainpcv2.ttf");
const CLICK_SOUND = require("../../../assets/audio/click.mp3.mp3");
const HILAL_ICON = require("../../../assets/icons/alhilal.png.png");
const NASSR_ICON = require("../../../assets/icons/alnassr.png.png");

const CLUB_EMBLEMS: Partial<Record<FanClubId, number>> = {
  hilal: HILAL_ICON,
  nassr: NASSR_ICON,
};

const RANK_LABELS: Record<number, string> = {
  1: "المركز الاول",
  2: "المركز الثاني",
  3: "المركز الثالث",
};

const TONGUE_CARD_HEIGHT = 118;
const TONGUE_CARD_GAP = 14;
const TONGUE_STACK_PADDING_V = 30;
const TONGUE_STACK_PADDING_H = 14;
const TONGUE_STACK_HEIGHT =
  TONGUE_STACK_PADDING_V * 2 + TONGUE_CARD_HEIGHT * 3 + TONGUE_CARD_GAP * 2;
const TONGUE_COLLAPSED_HEIGHT = 52;
const TONGUE_FLOATING_CHEVRON_OFFSET = 18;
export const FANS_TONGUE_RESERVED_HEIGHT =
  TONGUE_COLLAPSED_HEIGHT + TONGUE_FLOATING_CHEVRON_OFFSET;
const TONGUE_LOGO_SIZE = 36;
const TONGUE_COLLAPSED_LOGO_SIZE = 28;
const TONGUE_CARD_RADIUS = 22;
const TONGUE_OUTER_RADIUS = 26;

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type WebAudioInstance = {
  currentTime: number;
  pause?: () => void;
  play?: () => Promise<void> | void;
  preload: string;
};

type WebAudioConstructor = new (src?: string) => WebAudioInstance;

type RankedClubEntry = {
  club: FanClub;
  count: number;
  digits: string[];
  emblem?: number;
  rank: number;
};

const TongueFontContext = createContext<string | undefined>(undefined);

function TongueText(props: TextProps) {
  const tongueFontFamily = useContext(TongueFontContext);

  return (
    <RNText
      {...props}
      style={[
        tongueFontFamily ? { fontFamily: tongueFontFamily } : null,
        props.style,
      ]}
    />
  );
}

export type FansSupportTongueProps = {
  supporters: Record<FanClubId, number>;
  supportedTeams: FanClubId[];
  isLoggedIn: boolean;
  onRequireAuth: (message?: string) => void;
  onToggleSupport: (clubId: FanClubId) => void;
};

export default function FansSupportTongue(props: FansSupportTongueProps) {
  const [areTongueFontsLoaded] = useFonts({
    [TONGUE_FONT_FAMILY]: TONGUE_FONT,
  });
  const tongueFontFamily = areTongueFontsLoaded
    ? TONGUE_FONT_FAMILY
    : undefined;
  const [contentExpanded, setContentExpanded] = useState(false);
  const clickSoundRef = useRef<WebAudioInstance | null>(null);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const rankedClubs = useMemo<RankedClubEntry[]>(() => {
    return [...FAN_CLUBS]
      .map((club) => {
        const count = props.supporters[club.id] ?? 0;

        return {
          club,
          count,
          digits: digitsForCount(count),
          emblem: CLUB_EMBLEMS[club.id],
          rank: 0,
        };
      })
      .sort((left, right) => right.count - left.count)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [props.supporters]);

  const leader = rankedClubs[0];

  const clickSoundUri = useMemo(() => {
    try {
      const resolvedSource = Image.resolveAssetSource(CLICK_SOUND);

      if (resolvedSource?.uri) {
        return resolvedSource.uri;
      }
    } catch {
      // Ignore asset resolution failures on unsupported platforms.
    }

    return typeof CLICK_SOUND === "string" ? CLICK_SOUND : null;
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || !clickSoundUri) {
      clickSoundRef.current = null;
      return;
    }

    const audioConstructor = (
      globalThis as typeof globalThis & { Audio?: WebAudioConstructor }
    ).Audio;

    if (!audioConstructor) {
      clickSoundRef.current = null;
      return;
    }

    const sound = new audioConstructor(clickSoundUri);
    sound.preload = "auto";
    clickSoundRef.current = sound;

    return () => {
      try {
        sound.pause?.();
      } catch {
        // Ignore teardown failures and keep the UI responsive.
      }

      clickSoundRef.current = null;
    };
  }, [clickSoundUri]);

  useEffect(() => {
    if (!contentExpanded) {
      expandAnim.setValue(0);
    }
  }, [contentExpanded, expandAnim]);

  const playCheerSound = async () => {
    const sound = clickSoundRef.current;

    if (!sound) {
      return;
    }

    try {
      sound.currentTime = 0;
      const playback = sound.play?.();

      if (
        playback &&
        typeof playback === "object" &&
        "catch" in playback &&
        typeof playback.catch === "function"
      ) {
        await playback.catch(() => undefined);
      }
    } catch {
      // Ignore playback failures so button feedback still completes.
    }
  };

  const handleCheerPress = (clubId: FanClubId) => {
    if (!props.isLoggedIn) {
      props.onRequireAuth("سجل الدخول لدعم ناديك.");
      return;
    }

    void playCheerSound();
    props.onToggleSupport(clubId);
  };

  const handleExpand = () => {
    setContentExpanded(true);
    expandAnim.setValue(0);
    Animated.spring(expandAnim, {
      toValue: 1,
      damping: 22,
      stiffness: 260,
      mass: 0.82,
      useNativeDriver: false,
    }).start();
  };

  const handleCollapse = () => {
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setContentExpanded(false);
      }
    });
  };

  const dropdownHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TONGUE_STACK_HEIGHT],
  });

  const handleChevronPress = () => {
    if (contentExpanded) {
      handleCollapse();
      return;
    }

    handleExpand();
  };

  if (!leader) {
    return null;
  }

  return (
    <TongueFontContext.Provider value={tongueFontFamily}>
      <View style={styles.tongueRoot}>
        <View style={styles.tongueAnchor}>
          {!contentExpanded ? (
            <AnimatedBorderFrame borderRadius={24} variant="collapsed">
              <Pressable
                style={styles.tongueCollapsedInner}
                onPress={handleExpand}
                testID="support-tongue"
              >
                <View style={styles.tongueCollapsedRow}>
                  <TongueCounterDigits digits={leader.digits} compact />

                  <View style={styles.tongueCollapsedLogoSlot}>
                    <TongueClubLogo
                      club={leader.club}
                      emblem={leader.emblem}
                      size={TONGUE_COLLAPSED_LOGO_SIZE}
                    />
                  </View>

                  <TongueText
                    style={styles.tongueLeaderLabel}
                    numberOfLines={1}
                  >
                    النادي الاكثر جماهيرية
                  </TongueText>
                </View>
              </Pressable>
            </AnimatedBorderFrame>
          ) : null}

          {contentExpanded ? (
            <Animated.View
              style={[
                styles.tongueDropdownOverlay,
                {
                  height: dropdownHeight,
                  opacity: expandAnim,
                },
              ]}
            >
              <AnimatedBorderFrame
                borderRadius={TONGUE_OUTER_RADIUS}
                variant="expanded"
              >
                <View style={styles.tongueCardsStack}>
                  {rankedClubs
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <TongueRankCard
                        key={entry.club.id}
                        entry={entry}
                        isSupported={props.supportedTeams.includes(
                          entry.club.id,
                        )}
                        onCheerPress={() => handleCheerPress(entry.club.id)}
                      />
                    ))}
                </View>
              </AnimatedBorderFrame>
            </Animated.View>
          ) : null}

          <Pressable
            style={[
              styles.tongueFloatingChevron,
              contentExpanded ? styles.tongueFloatingChevronExpanded : null,
            ]}
            onPress={handleChevronPress}
          >
            <View style={styles.tongueChevronCircle}>
              <Ionicons
                name={contentExpanded ? "chevron-up" : "chevron-down"}
                size={12}
                color="#FFFFFF"
              />
            </View>
          </Pressable>
        </View>
      </View>
    </TongueFontContext.Provider>
  );
}

function AnimatedBorderFrame(props: {
  borderRadius: number;
  variant?: "collapsed" | "expanded";
  children: ReactNode;
}) {
  const rotatingBorderProgress = useRef(new Animated.Value(0)).current;
  const isCollapsed = props.variant === "collapsed";
  const ringRadiusStyle = isCollapsed
    ? {
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        borderBottomLeftRadius: props.borderRadius,
        borderBottomRightRadius: props.borderRadius,
      }
    : { borderRadius: props.borderRadius };
  const shellRadiusStyle = isCollapsed
    ? {
        borderTopLeftRadius: 9,
        borderTopRightRadius: 9,
        borderBottomLeftRadius: props.borderRadius - 1,
        borderBottomRightRadius: props.borderRadius - 1,
      }
    : { borderRadius: props.borderRadius - 1 };

  useEffect(() => {
    rotatingBorderProgress.setValue(0);

    const borderLoop = Animated.loop(
      Animated.timing(rotatingBorderProgress, {
        toValue: 1,
        duration: 9200,
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
        "rgba(255,255,255,0.28)",
        "rgba(255,255,255,0.08)",
        "rgba(255,255,255,0.28)",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.tongueBorderRing, ringRadiusStyle]}
    >
      <Animated.View
        {...getNativePointerEventsProps("none")}
        style={[
          styles.tongueBorderSpinner,
          { transform: [{ rotate: rotatingBorderSpin }] },
          getWebPointerEventsStyle("none"),
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
            "rgba(255,255,255,0.96)",
            "rgba(255,255,255,0.96)",
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
          ]}
          locations={[0, 0.34, 0.45, 0.52, 0.58, 0.68, 1]}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 0.92, y: 1 }}
          style={styles.tongueBorderSpinnerGradient}
        />
      </Animated.View>

      <View style={[styles.tongueBorderShell, shellRadiusStyle]}>
        {props.children}
      </View>
    </LinearGradient>
  );
}

function TongueRankCard(props: {
  entry: RankedClubEntry;
  isSupported: boolean;
  onCheerPress: () => void;
}) {
  const supportLabel =
    props.entry.rank === 1 ? "النادي الاكثر جماهيرية" : "ادعم ناديك";

  return (
    <View style={styles.tongueRankCard}>
      <View style={styles.tongueRankCardLogoCenter}>
        <TongueClubLogo
          club={props.entry.club}
          emblem={props.entry.emblem}
          size={TONGUE_LOGO_SIZE}
        />
      </View>

      <View style={styles.tongueRankCardTopRow}>
        <Pressable
          style={[
            styles.tongueCheerButton,
            props.isSupported ? styles.tongueCheerButtonActive : null,
          ]}
          onPress={props.onCheerPress}
        >
          <TongueText
            style={[
              styles.tongueCheerButtonText,
              props.isSupported ? styles.tongueCheerButtonTextActive : null,
            ]}
          >
            شجع
          </TongueText>
          <Ionicons
            name={props.isSupported ? "checkmark" : "add"}
            size={11}
            color={props.isSupported ? "#05210F" : "#111111"}
          />
        </Pressable>

        <TongueText style={styles.tongueRankLabel} numberOfLines={1}>
          {RANK_LABELS[props.entry.rank] ?? `المركز ${props.entry.rank}`}
        </TongueText>
      </View>

      <View style={styles.tongueRankCardBottomRow}>
        <TongueCounterDigits digits={props.entry.digits} />

        <TongueText style={styles.tongueSupportLabel} numberOfLines={1}>
          {supportLabel}
        </TongueText>
      </View>
    </View>
  );
}

function TongueClubLogo(props: {
  club: FanClub;
  emblem?: number;
  size: number;
}) {
  const radius = props.size / 2;

  return (
    <View
      style={[
        styles.tongueClubLogoWrap,
        {
          width: props.size,
          height: props.size,
          borderRadius: radius,
        },
      ]}
    >
      {props.emblem ? (
        <Image
          source={props.emblem}
          resizeMode="contain"
          style={{
            width: props.size - 4,
            height: props.size - 4,
          }}
        />
      ) : (
        <LinearGradient
          colors={props.club.gradient}
          style={[
            styles.tongueClubLogoFallback,
            {
              width: props.size - 8,
              height: props.size - 8,
              borderRadius: radius - 4,
            },
          ]}
        >
          <Ionicons
            name={props.club.icon as IoniconName}
            size={Math.max(18, props.size * 0.42)}
            color="#FFFFFF"
          />
        </LinearGradient>
      )}
    </View>
  );
}

function TongueCounterDigit(props: { digit: string; compact?: boolean }) {
  const tongueFontFamily = useContext(TongueFontContext);

  return (
    <View
      style={[
        styles.tongueCounterDigitBox,
        props.compact ? styles.tongueCounterDigitBoxCompact : null,
      ]}
    >
      <RNText
        style={[
          tongueFontFamily ? { fontFamily: tongueFontFamily } : null,
          styles.tongueCounterDigitText,
          props.compact ? styles.tongueCounterDigitTextCompact : null,
        ]}
      >
        {props.digit}
      </RNText>
    </View>
  );
}

function TongueCounterDigits(props: { digits: string[]; compact?: boolean }) {
  return (
    <View style={styles.tongueCounterDigitsRow}>
      {props.digits.map((digit, index) => (
        <TongueCounterDigit
          key={`${digit}-${index}`}
          digit={digit}
          compact={props.compact}
        />
      ))}
    </View>
  );
}

function digitsForCount(count: number) {
  return Math.max(0, Math.floor(count))
    .toLocaleString("en-US", { useGrouping: false })
    .padStart(4, "0")
    .slice(-4)
    .split("");
}

const styles = createCompatStyleSheet({
  tongueRoot: {
    width: "100%",
    alignItems: "center",
  },
  tongueAnchor: {
    width: "96%",
    maxWidth: 380,
    position: "relative",
    alignItems: "center",
  },
  tongueBorderRing: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
    padding: 1.2,
  },
  tongueBorderSpinner: {
    position: "absolute",
    top: -180,
    right: -180,
    bottom: -180,
    left: -180,
    opacity: 0.98,
  },
  tongueBorderSpinnerGradient: {
    flex: 1,
  },
  tongueBorderShell: {
    overflow: "hidden",
    backgroundColor: "rgba(6, 9, 18, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    direction: "ltr",
  },
  tongueBodyClip: {
    overflow: "hidden",
  },
  tongueDropdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    overflow: "hidden",
    backgroundColor: "rgba(4, 7, 12, 0.98)",
  },
  tongueCardsStack: {
    paddingHorizontal: TONGUE_STACK_PADDING_H,
    paddingVertical: TONGUE_STACK_PADDING_V,
    gap: TONGUE_CARD_GAP,
  },
  tongueRankCard: {
    height: TONGUE_CARD_HEIGHT,
    borderRadius: TONGUE_CARD_RADIUS,
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: "#151F38",
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: "space-between",
    position: "relative",
  },
  tongueRankCardLogoCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  tongueRankCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  tongueRankCardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
    gap: 8,
  },
  tongueCollapsedInner: {
    height: TONGUE_COLLAPSED_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  tongueCollapsedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tongueCollapsedLogoSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  tongueLeaderLabel: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "right",
    writingDirection: "rtl",
  },
  tongueChevronCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  tongueFloatingChevron: {
    position: "absolute",
    top: TONGUE_COLLAPSED_HEIGHT - 12,
    alignSelf: "center",
    zIndex: 60,
  },
  tongueFloatingChevronExpanded: {
    top: TONGUE_STACK_HEIGHT - 12,
  },
  tongueRankLabel: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 18,
    marginLeft: 10,
  },
  tongueCheerButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    width: 58,
    height: 28,
    borderWidth: 0,
  },
  tongueCheerButtonActive: {
    backgroundColor: "#22C55E",
  },
  tongueCheerButtonText: {
    color: "#111111",
    fontSize: 11,
    fontWeight: "900",
    marginRight: 3,
  },
  tongueCheerButtonTextActive: {
    color: "#05210F",
  },
  tongueChevronCircleSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  tongueSupportLabel: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "900",
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 16,
    marginLeft: 10,
  },
  tongueClubLogoWrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    overflow: "hidden",
  },
  tongueClubLogoFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  tongueCounterDigitsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tongueCounterDigitBox: {
    width: 22,
    height: 28,
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
  },
  tongueCounterDigitBoxCompact: {
    width: 17,
    height: 21,
    borderRadius: 4,
    marginHorizontal: 1.5,
  },
  tongueCounterDigitText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  tongueCounterDigitTextCompact: {
    fontSize: 10.5,
  },
});
