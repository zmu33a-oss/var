import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Text as RNText,
  type TextProps,
  useWindowDimensions,
  View,
} from "react-native";
import { FAN_CLUBS } from "../../app.data";
import type { FanClub, FanClubId } from "../../app.types";
import { createCompatStyleSheet, createShadowStyle } from "../../lib/crossPlatformStyles";
import { getSaudiClubEmblem } from "./clubEmblems";
import FansCounterDigits from "./FansCounterDigits";
import {
  FANS_STICKY_HEADER_TOP,
  FANS_TONGUE_COLLAPSED_BAR_HEIGHT,
  FANS_TONGUE_COLLAPSED_LOGO_FLOAT,
  FANS_TONGUE_DROPDOWN_HEIGHT_RATIO,
  FANS_TONGUE_DROPDOWN_WIDTH_RATIO,
  FANS_TONGUE_PAGE_SHELL_WIDTH,
} from "./fans.layout.constants";

const TONGUE_FONT_FAMILY = "TongueZain";
const TONGUE_COUNTER_FONT_FAMILY = "BebasNeue_400Regular";
const TONGUE_COUNTER_FONT_FALLBACK =
  Platform.OS === "ios"
    ? "Helvetica Neue"
    : Platform.OS === "android"
      ? "sans-serif-condensed"
      : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const TONGUE_FONT = require("../../../assets/images/alfont_com_zainpcv2mob600-zainpcv2.ttf");

const RANK_LABELS: Record<number, string> = {
  1: "المركز الاول",
  2: "المركز الثاني",
  3: "المركز الثالث",
  4: "المركز الرابع",
  5: "المركز الخامس",
  6: "المركز السادس",
  7: "المركز السابع",
  8: "المركز الثامن",
  9: "المركز التاسع",
  10: "المركز العاشر",
  11: "المركز الحادي عشر",
  12: "المركز الثاني عشر",
  13: "المركز الثالث عشر",
  14: "المركز الرابع عشر",
  15: "المركز الخامس عشر",
  16: "المركز السادس عشر",
};

const TONGUE_ANCHOR_WIDTH = "82%";
const TONGUE_ANCHOR_MAX_WIDTH = 292;
const TONGUE_CARD_HEIGHT = 118;
const TONGUE_CARD_GAP = 14;
const TONGUE_STACK_PADDING_V = 30;
const TONGUE_STACK_PADDING_H = 14;
const TONGUE_COLLAPSED_TOUCH_HEIGHT =
  FANS_TONGUE_COLLAPSED_BAR_HEIGHT + FANS_TONGUE_COLLAPSED_LOGO_FLOAT;
const TONGUE_DROPDOWN_CONTENT_TOP_INSET =
  FANS_STICKY_HEADER_TOP + TONGUE_COLLAPSED_TOUCH_HEIGHT + 8;
const TONGUE_COLLAPSED_BAR_HEIGHT = FANS_TONGUE_COLLAPSED_BAR_HEIGHT;
const TONGUE_COLLAPSED_LOGO_SIZE = 18;
const TONGUE_COLLAPSED_LOGO_COLOR = "#F97316";
const TONGUE_COLLAPSED_LOGO_FLOAT = FANS_TONGUE_COLLAPSED_LOGO_FLOAT;
const TONGUE_LOGO_SIZE = 36;
const TONGUE_CARD_RADIUS = 22;
const TONGUE_OUTER_RADIUS = 26;

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type RankedClubEntry = {
  club: FanClub;
  count: number;
  digits: string[];
  emblem?: number;
  rank: number;
};

const TongueFontContext = createContext<string | undefined>(undefined);
const TongueCounterFontContext = createContext<string | undefined>(undefined);

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

export type FansSupportTongueHandle = {
  collapse: () => void;
  expand: () => void;
};

export type FansSupportTongueProps = {
  supporters: Record<FanClubId, number>;
  supportedTeams: FanClubId[];
  isLoggedIn: boolean;
  activeLeagueId?: string;
  onRequireAuth: (message?: string) => void;
  onToggleSupport: (clubId: FanClubId) => void;
  onEnterClub?: (clubId: FanClubId) => void;
  onExpandedChange?: (expanded: boolean) => void;
};

const FansSupportTongue = forwardRef<
  FansSupportTongueHandle,
  FansSupportTongueProps
>(function FansSupportTongue(props, ref) {
  const [areTongueFontsLoaded] = useFonts({
    [TONGUE_FONT_FAMILY]: TONGUE_FONT,
    [TONGUE_COUNTER_FONT_FAMILY]: BebasNeue_400Regular,
  });
  const tongueFontFamily = areTongueFontsLoaded
    ? TONGUE_FONT_FAMILY
    : undefined;
  const counterFontFamily = areTongueFontsLoaded
    ? TONGUE_COUNTER_FONT_FAMILY
    : TONGUE_COUNTER_FONT_FALLBACK;
  const [contentExpanded, setContentExpanded] = useState(false);
  const [clubSearchQuery, setClubSearchQuery] = useState("");
  const expandAnim = useRef(new Animated.Value(0)).current;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const layoutWidth = Math.min(windowWidth, FANS_TONGUE_PAGE_SHELL_WIDTH);
  const dropdownWidth = layoutWidth * FANS_TONGUE_DROPDOWN_WIDTH_RATIO;
  const dropdownHeight = windowHeight * FANS_TONGUE_DROPDOWN_HEIGHT_RATIO;

  const leagueClubs = useMemo(
    () =>
      props.activeLeagueId
        ? FAN_CLUBS.filter((c) => c.leagueId === props.activeLeagueId)
        : FAN_CLUBS,
    [props.activeLeagueId],
  );

  const leagueClubCards = useMemo<RankedClubEntry[]>(() => {
    return [...leagueClubs]
      .map((club) => {
        const count = props.supporters[club.id] ?? 0;

        return {
          club,
          count,
          digits: digitsForCount(count),
          emblem: getSaudiClubEmblem(club.id),
          rank: 0,
        };
      })
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count;
        }

        return left.club.title.localeCompare(right.club.title, "ar");
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [leagueClubs, props.supporters]);

  const leader = leagueClubCards[0];
  const filteredLeagueClubCards = useMemo(() => {
    const query = clubSearchQuery.trim();

    if (!query) {
      return leagueClubCards;
    }

    return leagueClubCards.filter((entry) =>
      entry.club.title.includes(query),
    );
  }, [clubSearchQuery, leagueClubCards]);

  useEffect(() => {
    if (!contentExpanded) {
      expandAnim.setValue(0);
    }
  }, [contentExpanded, expandAnim]);

  const handleExpand = () => {
    setContentExpanded(true);
    props.onExpandedChange?.(true);
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
    props.onExpandedChange?.(false);
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setContentExpanded(false);
        setClubSearchQuery("");
      }
    });
  };

  const animatedDropdownHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, dropdownHeight],
  });

  const handleToggleExpand = () => {
    if (contentExpanded) {
      handleCollapse();
      return;
    }

    handleExpand();
  };

  useImperativeHandle(ref, () => ({
    collapse: handleCollapse,
    expand: handleExpand,
  }));

  if (!leader) {
    return null;
  }

  return (
    <TongueFontContext.Provider value={tongueFontFamily}>
      <TongueCounterFontContext.Provider value={counterFontFamily}>
      <View style={styles.tongueRoot}>
        <View style={styles.tongueAnchor}>
          {contentExpanded ? (
            <Animated.View
              style={[
                styles.tongueDropdownOverlay,
                {
                  top: -FANS_STICKY_HEADER_TOP,
                  width: dropdownWidth,
                  height: animatedDropdownHeight,
                  opacity: expandAnim,
                },
              ]}
            >
              <TongueShell borderRadius={TONGUE_OUTER_RADIUS} variant="expanded">
                <ScrollView
                  style={styles.tongueDropdownScroll}
                  contentContainerStyle={[
                    styles.tongueCardsStack,
                    { paddingTop: TONGUE_DROPDOWN_CONTENT_TOP_INSET },
                  ]}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {filteredLeagueClubCards.map((entry) => (
                      <TongueRankCard
                        key={entry.club.id}
                        entry={entry}
                        onEnterClub={props.onEnterClub}
                      />
                    ))}
                </ScrollView>
              </TongueShell>

              <View style={styles.tongueDropdownFooterSearch}>
                <Ionicons
                  name="search"
                  size={16}
                  color="rgba(255,255,255,0.55)"
                  style={styles.tongueDropdownSearchIcon}
                />
                <TextInput
                  value={clubSearchQuery}
                  onChangeText={setClubSearchQuery}
                  placeholder="ابحث عن النادي..."
                  placeholderTextColor="rgba(255,255,255,0.38)"
                  style={styles.tongueDropdownSearchInput}
                  textAlign="right"
                  returnKeyType="search"
                />
              </View>
            </Animated.View>
          ) : null}

          <Pressable
            style={[
              styles.tongueCollapsedTouch,
              styles.tongueCollapsedTouchOnTop,
              {
                width: TONGUE_ANCHOR_WIDTH,
                maxWidth: TONGUE_ANCHOR_MAX_WIDTH,
              },
            ]}
            onPress={handleToggleExpand}
            testID="support-tongue"
          >
            <View style={styles.tongueCollapsedTitleRow}>
              <TongueText
                style={styles.tongueLeaderLabelCollapsed}
                numberOfLines={1}
              >
                جماهيرية
              </TongueText>

              <View style={styles.tongueCollapsedAnchorColumn}>
                <TongueText
                  style={styles.tongueLeaderLabelCollapsed}
                  numberOfLines={1}
                >
                  الاكثر
                </TongueText>

                <View style={styles.tongueCollapsedClubSlot}>
                  <TongueClubIconControl
                    club={leader.club}
                    emblem={leader.emblem}
                    expanded={contentExpanded}
                    tintColor={TONGUE_COLLAPSED_LOGO_COLOR}
                    onPress={handleToggleExpand}
                  />
                </View>
              </View>

              <TongueText
                style={styles.tongueLeaderLabelCollapsed}
                numberOfLines={1}
              >
                النادي
              </TongueText>
            </View>
          </Pressable>
        </View>
      </View>
      </TongueCounterFontContext.Provider>
    </TongueFontContext.Provider>
  );
});

export default FansSupportTongue;

function TongueShell(props: {
  borderRadius: number;
  variant?: "collapsed" | "expanded";
  children: ReactNode;
}) {
  const isCollapsed = props.variant === "collapsed";
  const shellRadiusStyle = isCollapsed
    ? {
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        borderBottomLeftRadius: props.borderRadius,
        borderBottomRightRadius: props.borderRadius,
      }
    : {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: props.borderRadius,
        borderBottomRightRadius: props.borderRadius,
      };

  return (
    <View
      style={[
        styles.tongueBorderShell,
        isCollapsed ? styles.tongueBorderShellCollapsed : styles.tongueBorderShellExpanded,
        shellRadiusStyle,
        styles.tongueShell,
        !isCollapsed ? styles.tongueShellExpanded : null,
      ]}
    >
      {props.children}
    </View>
  );
}

function useTongueBobAnimation(enabled: boolean) {
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) {
      bobAnim.stopAnimation();
      bobAnim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      bobAnim.stopAnimation();
      bobAnim.setValue(0);
    };
  }, [enabled, bobAnim]);

  return bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });
}

function TongueClubIconControl(props: {
  club: FanClub;
  emblem?: number;
  expanded: boolean;
  onPress: () => void;
  size?: number;
  tintColor?: string;
}) {
  const iconTranslateY = useTongueBobAnimation(!props.expanded);
  const iconSize = props.size ?? TONGUE_COLLAPSED_LOGO_SIZE;

  return (
    <Pressable
      style={styles.tongueClubIconPressable}
      onPress={(event) => {
        event.stopPropagation?.();
        props.onPress();
      }}
      hitSlop={8}
    >
      <Animated.View
        style={
          !props.expanded
            ? { transform: [{ translateY: iconTranslateY }] }
            : undefined
        }
      >
        <TongueClubLogo
          club={props.club}
          emblem={props.emblem}
          size={iconSize}
          plain
          tintColor={props.tintColor ?? TONGUE_COLLAPSED_LOGO_COLOR}
        />
      </Animated.View>
    </Pressable>
  );
}

function TongueRankCard(props: {
  entry: RankedClubEntry;
  onEnterClub?: (clubId: FanClubId) => void;
}) {
  const supportLabel = "ادعم ناديك";

  return (
    <View style={styles.tongueRankCard}>
      <View style={styles.tongueRankCardLogoCenter}>
        <View style={styles.tongueRankCardLogoStack}>
          <TongueClubLogo
            club={props.entry.club}
            emblem={props.entry.emblem}
            size={TONGUE_LOGO_SIZE}
          />
          <TongueText style={styles.tongueRankClubTitle} numberOfLines={1}>
            {props.entry.club.title}
          </TongueText>
        </View>
      </View>

      <View style={styles.tongueRankCardTopRow}>
        <TongueText style={styles.tongueRankLabel} numberOfLines={1}>
          {RANK_LABELS[props.entry.rank] ?? `المركز ${props.entry.rank}`}
        </TongueText>

        <Pressable
          style={styles.tongueEntryLabelHost}
          onPress={() => props.onEnterClub?.(props.entry.club.id)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`دخول رابطة ${props.entry.club.title}`}
        >
          <TongueText style={styles.tongueEntryLabel} numberOfLines={1}>
            دخول
          </TongueText>
        </Pressable>
      </View>

      <View style={styles.tongueRankCardBottomRow}>
        <FansCounterDigits digits={props.entry.digits} compact />

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
  plain?: boolean;
  tintColor?: string;
}) {
  const plainColor = props.tintColor ?? "#FFFFFF";

  if (props.emblem) {
    return (
      <Image
        source={props.emblem}
        resizeMode="contain"
        style={{
          width: props.size,
          height: props.size,
        }}
      />
    );
  }

  if (props.plain) {
    return (
      <Ionicons
        name={props.club.icon as IoniconName}
        size={Math.max(14, props.size * 0.62)}
        color={plainColor}
      />
    );
  }

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
      <View
        style={[
          styles.tongueClubLogoFallback,
          {
            width: props.size,
            height: props.size,
            borderRadius: radius,
          },
        ]}
      >
        <Ionicons
          name={props.club.icon as IoniconName}
          size={Math.max(18, props.size * 0.42)}
          color="#FFFFFF"
        />
      </View>
    </View>
  );
}

function TongueCounterDigit(props: { digit: string; compact?: boolean }) {
  const counterFontFamily = useContext(TongueCounterFontContext);

  return (
    <View
      style={[
        styles.tongueCounterDigitBox,
        props.compact ? styles.tongueCounterDigitBoxCompact : null,
      ]}
    >
      <RNText
        style={[
          counterFontFamily ? { fontFamily: counterFontFamily } : null,
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
    overflow: "visible",
  },
  tongueAnchor: {
    width: "100%",
    position: "relative",
    alignItems: "center",
    minHeight: TONGUE_COLLAPSED_TOUCH_HEIGHT,
    overflow: "visible",
    zIndex: 2,
  },
  tongueShell: {
    width: "100%",
  },
  tongueShellExpanded: {
    flex: 1,
    height: "100%",
  },
  tongueBorderShell: {
    overflow: "hidden",
    backgroundColor: "rgba(6, 9, 18, 0.98)",
    direction: "ltr",
  },
  tongueBorderShellCollapsed: {
    backgroundColor: "transparent",
    borderWidth: 0,
    overflow: "visible",
  },
  tongueBorderShellExpanded: {
    flex: 1,
    height: "100%",
    backgroundColor: "transparent",
  },
  tongueBodyClip: {
    overflow: "hidden",
  },
  tongueDropdownOverlay: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 40,
    overflow: "hidden",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: TONGUE_OUTER_RADIUS,
    borderBottomRightRadius: TONGUE_OUTER_RADIUS,
    backgroundColor: "transparent",
  },
  tongueDropdownScroll: {
    flex: 1,
  },
  tongueDropdownFooterSearch: {
    position: "absolute",
    bottom: 10,
    left: 14,
    right: 14,
    zIndex: 50,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: "rgba(0, 0, 0, 0.88)",
  },
  tongueDropdownSearchIcon: {
    flexShrink: 0,
  },
  tongueDropdownSearchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
    writingDirection: "rtl",
  },
  tongueCardsStack: {
    paddingHorizontal: TONGUE_STACK_PADDING_H,
    paddingTop: TONGUE_STACK_PADDING_V,
    paddingBottom: TONGUE_STACK_PADDING_V + 52,
    gap: TONGUE_CARD_GAP,
  },
  tongueRankCard: {
    height: TONGUE_CARD_HEIGHT,
    borderRadius: TONGUE_CARD_RADIUS,
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: "#000000",
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: "space-between",
    position: "relative",
    ...createShadowStyle({
      color: "#FFFFFF",
      x: 0,
      y: 2,
      blur: 12,
      spread: 0,
      opacity: 0.35,
      elevation: 8,
    }),
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
  tongueRankCardLogoStack: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tongueRankClubTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    writingDirection: "rtl",
    lineHeight: 14,
  },
  tongueRankCardTopRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
    gap: 10,
  },
  tongueRankCardBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    zIndex: 1,
    gap: 8,
  },
  tongueEntryLabelHost: {
    backgroundColor: "#1D9BF0",
    borderRadius: 999,
    minWidth: 58,
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tongueEntryLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    writingDirection: "rtl",
    lineHeight: 12,
  },
  tongueCollapsedTouch: {
    width: "100%",
    minHeight: TONGUE_COLLAPSED_TOUCH_HEIGHT,
    justifyContent: "flex-start",
    paddingTop: 4,
    paddingHorizontal: 6,
    overflow: "visible",
  },
  tongueCollapsedTouchOnTop: {
    position: "relative",
    zIndex: 60,
    elevation: 24,
  },
  tongueCollapsedTitleRow: {
    flexDirection: "row",
    direction: "rtl",
    alignItems: "flex-start",
    justifyContent: "center",
    overflow: "visible",
  },
  tongueCollapsedAnchorColumn: {
    alignItems: "center",
    overflow: "visible",
  },
  tongueCollapsedClubSlot: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    zIndex: 40,
  },
  tongueLeaderLabelCollapsed: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    writingDirection: "rtl",
    flexShrink: 0,
    lineHeight: 18,
  },
  tongueClubIconPressable: {
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#000000",
    borderWidth: 0,
    overflow: "hidden",
  },
  tongueClubLogoFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  tongueCounterDigitsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tongueCounterDigitBox: {
    width: 22,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 2,
  },
  tongueCounterDigitBoxCompact: {
    width: 16,
    height: 24,
    borderRadius: 6,
  },
  tongueCounterDigitText: {
    color: "#000000",
    fontSize: 17,
    letterSpacing: 0.4,
    includeFontPadding: false,
    marginTop: Platform.OS === "android" ? -1 : 1,
  },
  tongueCounterDigitTextCompact: {
    fontSize: 15,
    letterSpacing: 0.3,
    marginTop: Platform.OS === "android" ? -1 : 0,
  },
});
