import {
  createContext,
  useContext,
  useEffect,
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
  ScrollView,
  StyleSheet,
  Text as RNText,
  type TextProps,
  useWindowDimensions,
  View,
} from "react-native";
import { FAN_CLUBS } from "../app.data";
import type { FanClubId } from "../app.types";

const MONO_FONT = Platform.OS === "ios" ? "Courier" : "monospace";
const DISPLAY_FONT = Platform.OS === "ios" ? "Georgia" : "serif";
const VAR_WORDMARK_FONT =
  Platform.OS === "web" ? "Times New Roman" : DISPLAY_FONT;
const ENGLISH_DISPLAY_FONT =
  Platform.OS === "ios"
    ? "Avenir Next"
    : Platform.OS === "android"
      ? "sans-serif-condensed"
      : "Trebuchet MS";
const SHEET_BODY_HEIGHT = 334;
const SHEET_TRIGGER_RESERVE = 92;
const FANS_ARABIC_FONT_FAMILY = "ProfileArabic";
const FANS_ARABIC_FONT = require("../../assets/images/alfont_com_zainpcv2mob600-zainpcv2.ttf");
const TREND_DETAIL_ARABIC_FONT_FAMILY = "TrendDetailArabic";
const TREND_DETAIL_ARABIC_FONT = require("../../assets/images/alfont_com_KA-Hand-Naskh.ttf");
const HILAL_ICON = require("../../assets/icons/alhilal.png.png");
const NASSR_ICON = require("../../assets/icons/alnassr.png.png");

const CLUB_EMBLEMS: Partial<Record<FanClubId, number>> = {
  hilal: HILAL_ICON,
  nassr: NASSR_ICON,
};

const FansArabicFontContext = createContext<string | undefined>(undefined);

function Text(props: TextProps) {
  const fansArabicFontFamily = useContext(FansArabicFontContext);

  return (
    <RNText
      {...props}
      style={[
        fansArabicFontFamily ? { fontFamily: fansArabicFontFamily } : null,
        props.style,
      ]}
    />
  );
}

function TrendCardTrigger(props: {
  children: ReactNode;
  label: string;
  onPress: () => void;
  onDoublePress: () => void;
}) {
  if (Platform.OS === "web") {
    return (
      <div
        role="button"
        aria-label={props.label}
        data-testid="trend-detail-trigger"
        onClick={props.onPress}
        onDoubleClick={props.onDoublePress}
        style={{ display: "block", cursor: "pointer" }}
      >
        {props.children}
      </div>
    );
  }

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={props.label}
      onPress={props.onPress}
    >
      {props.children}
    </Pressable>
  );
}

const CLUB_COPY: Record<
  FanClubId,
  {
    flameLabel: string;
    deckLabel: string;
    supportHint: string;
  }
> = {
  hilal: {
    flameLabel: "نبض مشتعل",
    deckLabel: "المدرج الأزرق",
    supportHint: "إيقاع موحد وصوت سريع في بداية المدرج.",
  },
  nassr: {
    flameLabel: "صوت ناري",
    deckLabel: "المدرج الأصفر",
    supportHint: "حضور حاد وارتفاع واضح في الرد الجماعي.",
  },
  ittihad: {
    flameLabel: "شحنة قوية",
    deckLabel: "المدرج الذهبي",
    supportHint: "ثبات جماهيري مع دفعة إلكترونية متصاعدة.",
  },
};

const TOP_FAN_CARD: Record<
  FanClubId,
  {
    name: string;
    handle: string;
    posts: number;
    replies: number;
    likes: number;
    cardCode: string;
    issuedAt: string;
  }
> = {
  hilal: {
    name: "سعود الحربي",
    handle: "@bluepulse",
    posts: 148,
    replies: 326,
    likes: 1842,
    cardCode: "VR-HL-2048",
    issuedAt: "25/26 SEASON",
  },
  nassr: {
    name: "فيصل المطيري",
    handle: "@victoryline",
    posts: 136,
    replies: 288,
    likes: 1634,
    cardCode: "VR-NS-1934",
    issuedAt: "25/26 SEASON",
  },
  ittihad: {
    name: "راكان الشريف",
    handle: "@goldroar",
    posts: 121,
    replies: 244,
    likes: 1278,
    cardCode: "VR-IT-1927",
    issuedAt: "25/26 SEASON",
  },
};

const TREND_TWEETS: Record<
  FanClubId,
  {
    engagement: number;
    headline: string;
    previewHeadline: string;
    hashtag: string;
    handle: string;
    comments: number;
    reposts: number;
    likes: number;
    shares: number;
  }
> = {
  hilal: {
    engagement: 87,
    headline:
      "الهلال يتصدر الدوري بفارق 5 نقاط فقط عن أقرب منافسيه مع استمرار صعود التفاعل من الرابطة والهاشتاق والحسابات الداعمة.",
    previewHeadline:
      "الهلال يتصدر الدوري بفارق 5 نقاط فقط عن أقرب منافسيه مع استمرار صعود التفاعل",
    hashtag: "#الهلال",
    handle: "@bluepulse",
    comments: 286,
    reposts: 164,
    likes: 934,
    shares: 72,
  },
  nassr: {
    engagement: 82,
    headline:
      "النصر يقترب من قمة الترند بعد موجة اقتباسات سريعة وارتفاع واضح في حجم التغريدات القادمة من الحسابات الجماهيرية.",
    previewHeadline:
      "النصر يقترب من قمة الترند بعد موجة اقتباسات سريعة وارتفاع واضح في حجم التغريدات",
    hashtag: "#النصر",
    handle: "@victoryline",
    comments: 241,
    reposts: 151,
    likes: 876,
    shares: 63,
  },
  ittihad: {
    engagement: 79,
    headline:
      "الاتحاد يحافظ على حضور قوي في مسار التغريدات مع زيادة مستقرة في إعادة النشر وتفاعل المستخدمين طوال اليوم.",
    previewHeadline:
      "الاتحاد يحافظ على حضور قوي في مسار التغريدات مع زيادة مستقرة في إعادة النشر",
    hashtag: "#الاتحاد",
    handle: "@goldroar",
    comments: 214,
    reposts: 139,
    likes: 801,
    shares: 58,
  },
};

type FansScreenProps = {
  isLoggedIn: boolean;
  supporters: Record<FanClubId, number>;
  supportedTeams: FanClubId[];
  onRequireAuth: (message?: string) => void;
  onToggleSupport: (clubId: FanClubId) => void;
};

export default function FansScreen(props: FansScreenProps) {
  const [areArabicFontsLoaded] = useFonts({
    [FANS_ARABIC_FONT_FAMILY]: FANS_ARABIC_FONT,
    [TREND_DETAIL_ARABIC_FONT_FAMILY]: TREND_DETAIL_ARABIC_FONT,
  });
  const { width: viewportWidth, height: viewportHeight } =
    useWindowDimensions();
  const fansArabicFontFamily = areArabicFontsLoaded
    ? FANS_ARABIC_FONT_FAMILY
    : undefined;
  const trendDetailArabicFontFamily = areArabicFontsLoaded
    ? TREND_DETAIL_ARABIC_FONT_FAMILY
    : undefined;
  const {
    isLoggedIn,
    supporters,
    supportedTeams,
    onRequireAuth,
    onToggleSupport,
  } = props;

  const [isTopSheetOpen, setIsTopSheetOpen] = useState(false);
  const [activeClubId, setActiveClubId] = useState<FanClubId>(FAN_CLUBS[0].id);
  const [isTrendExpanded, setIsTrendExpanded] = useState(false);
  const [isTrendDetailOpen, setIsTrendDetailOpen] = useState(false);
  const sheetProgress = useRef(new Animated.Value(0)).current;
  const trendDetailProgress = useRef(new Animated.Value(0)).current;
  const lastTrendCardPressAt = useRef(0);

  useEffect(() => {
    Animated.spring(sheetProgress, {
      toValue: isTopSheetOpen ? 1 : 0,
      friction: 13,
      tension: 130,
      useNativeDriver: false,
    }).start();
  }, [isTopSheetOpen, sheetProgress]);

  useEffect(() => {
    Animated.timing(trendDetailProgress, {
      toValue: isTrendDetailOpen ? 1 : 0,
      duration: isTrendDetailOpen ? 540 : 280,
      easing: isTrendDetailOpen
        ? Easing.out(Easing.cubic)
        : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isTrendDetailOpen, trendDetailProgress]);

  useEffect(() => {
    setIsTrendExpanded(false);
  }, [activeClubId]);

  const sheetBodyAnimatedHeight = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SHEET_BODY_HEIGHT],
  });
  const sheetBodyTranslateY = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, 0],
  });
  const sheetBodyOpacity = sheetProgress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.18, 1],
  });
  const scrimOpacity = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const activeClub =
    FAN_CLUBS.find((club) => club.id === activeClubId) ?? FAN_CLUBS[0];
  const activeClubDigits = digitsForCount(supporters[activeClub.id]);
  const activeClubRank =
    FAN_CLUBS.findIndex((club) => club.id === activeClub.id) + 1;
  const featuredFan = TOP_FAN_CARD[activeClub.id];
  const activeTrendTweet = TREND_TWEETS[activeClub.id];
  const activeClubEmblem = CLUB_EMBLEMS[activeClub.id];
  const { seasonValue, seasonLabel } = splitIssuedAtText(featuredFan.issuedAt);
  const trendDetailPanelWidth = Math.round(viewportWidth * 0.7);
  const isShortTrendDetailViewport = viewportHeight < 560;
  const trendDetailPanelHeight = Math.round(
    viewportHeight * (isShortTrendDetailViewport ? 0.76 : 0.6),
  );
  const isCompactTrendDetailPanel = trendDetailPanelHeight < 340;
  const trendDetailPanelOffsetY = isShortTrendDetailViewport ? -40 : 0;
  const trendDetailScrimOpacity = trendDetailProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const trendDetailPanelOpacity = trendDetailProgress.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [0, 1, 1],
    extrapolate: "clamp",
  });
  const trendDetailPanelTranslateX = trendDetailProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-Math.round(viewportWidth * 0.88), 0],
  });
  const trendDetailPanelScale = trendDetailProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  const buildTrendDetailReveal = (
    start: number,
    end: number,
    offsetX = 0,
    offsetY = 14,
  ) => ({
    opacity: trendDetailProgress.interpolate({
      inputRange: [0, start, end, 1],
      outputRange: [0, 0, 1, 1],
      extrapolate: "clamp",
    }),
    transform: [
      {
        translateX: trendDetailProgress.interpolate({
          inputRange: [0, start, end, 1],
          outputRange: [offsetX, offsetX, 0, 0],
          extrapolate: "clamp",
        }),
      },
      {
        translateY: trendDetailProgress.interpolate({
          inputRange: [0, start, end, 1],
          outputRange: [offsetY, offsetY, 0, 0],
          extrapolate: "clamp",
        }),
      },
    ],
  });

  const trendDetailHeaderReveal = buildTrendDetailReveal(0.1, 0.24, 0, -10);
  const trendDetailStemReveal = buildTrendDetailReveal(0.16, 0.34, 0, -12);
  const trendDetailTopLeftReveal = buildTrendDetailReveal(0.26, 0.42, -20, 0);
  const trendDetailTopRightReveal = buildTrendDetailReveal(0.34, 0.5, 20, 0);
  const trendDetailMidLeftReveal = buildTrendDetailReveal(0.42, 0.58, -20, 0);
  const trendDetailMidRightReveal = buildTrendDetailReveal(0.5, 0.66, 20, 0);
  const trendDetailTweetReveal = buildTrendDetailReveal(0.58, 0.8, 0, 16);
  const trendDetailBottomReveal = buildTrendDetailReveal(0.74, 1, 0, 18);

  const handleTrendCardPress = () => {
    const now = Date.now();

    if (now - lastTrendCardPressAt.current < 280) {
      openTrendDetail();
      return;
    }

    lastTrendCardPressAt.current = now;
  };

  const openTrendDetail = () => {
    lastTrendCardPressAt.current = 0;
    setIsTopSheetOpen(false);
    setIsTrendDetailOpen(true);
  };

  const closeTrendDetail = () => {
    lastTrendCardPressAt.current = 0;
    setIsTrendDetailOpen(false);
  };

  return (
    <FansArabicFontContext.Provider value={fansArabicFontFamily}>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.screenContent}
        >
          <SectionHeader
            eyebrow=""
            title="TREND FANS"
            description="صفحة الاكثر تفاعلا والاكثر ترند من الرابطة والهاشتاق والمستخدمين"
          />

          <View style={styles.fanIdBoard}>
            <View style={styles.fanIdSelectorRow}>
              {FAN_CLUBS.map((club) => {
                const isActive = club.id === activeClub.id;

                return (
                  <Pressable
                    key={club.id}
                    style={[
                      styles.fanIdSelectorChip,
                      isActive ? styles.fanIdSelectorChipActive : null,
                    ]}
                    onPress={() => setActiveClubId(club.id)}
                  >
                    <Text
                      style={[
                        styles.fanIdSelectorChipText,
                        isActive ? styles.fanIdSelectorChipTextActive : null,
                      ]}
                    >
                      {club.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <LinearGradient
              colors={["#F6D37B", "#D79A2E", "#7A4B10"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fanIdCardFrame}
            >
              <LinearGradient
                colors={["#0B1320", "#05070D", "#101827"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fanIdCardInner}
              >
                <View style={styles.fanIdCardGlow} />
                <LinearGradient
                  colors={[
                    "rgba(255,255,255,0.16)",
                    "rgba(255,255,255,0.04)",
                    "rgba(255,255,255,0)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fanIdCardSheen}
                />
                <View style={styles.fanIdCardEtch} />
                <View style={styles.fanIdWatermark}>
                  <Text style={styles.fanIdWatermarkText}>VAR</Text>
                </View>

                <View style={styles.fanIdUtilityRow}>
                  <RNText style={styles.fanIdUtilityText}>
                    <RNText style={styles.fanIdUtilityValueText}>
                      {seasonValue}
                    </RNText>
                    {seasonLabel ? (
                      <RNText style={styles.fanIdUtilityLabelText}>
                        {` ${seasonLabel}`}
                      </RNText>
                    ) : null}
                  </RNText>
                  <RNText
                    style={[
                      styles.fanIdUtilityText,
                      styles.fanIdUtilityCodeText,
                    ]}
                  >
                    {featuredFan.cardCode}
                  </RNText>
                </View>

                <View style={styles.fanIdTitleRow}>
                  <View style={styles.fanIdRankChip}>
                    <Text style={styles.fanIdRankChipText}>
                      #{activeClubRank}
                    </Text>
                  </View>

                  <View style={styles.fanIdVerifySealWrap}>
                    <View style={styles.fanIdVerifySeal}>
                      <Ionicons
                        name="checkmark-circle"
                        size={15}
                        color="#5F3709"
                      />
                      <Text style={styles.fanIdVerifySealText}>موثق</Text>
                    </View>
                  </View>

                  <Text style={styles.fanIdTitle}>ID CARD</Text>
                </View>

                <Text style={styles.fanIdEyebrow}>الاكثر تفاعلا</Text>

                <View style={styles.fanIdRuleLong} />

                <View style={styles.fanIdBodyRow}>
                  <View style={styles.fanIdMetaColumn}>
                    <View style={styles.fanIdLeagueRow}>
                      <Text style={styles.fanIdLeagueLabel}>الرابطة</Text>
                      <Text style={styles.fanIdLeagueValue}>
                        {activeClub.title}
                      </Text>
                    </View>

                    <View style={styles.fanIdStatsRow}>
                      <FanIdStat
                        label="المشاركات"
                        value={featuredFan.posts.toLocaleString("en-US")}
                      />
                      <FanIdStat
                        label="الردود"
                        value={featuredFan.replies.toLocaleString("en-US")}
                      />
                      <FanIdStat
                        label="الإعجاب"
                        value={featuredFan.likes.toLocaleString("en-US")}
                      />
                    </View>
                  </View>

                  <View style={styles.fanIdProfileColumn}>
                    <View style={styles.fanIdPhotoTag}>
                      <Text style={styles.fanIdPhotoTagText}>PHOTO ID</Text>
                    </View>

                    <View style={styles.fanIdSealWrap}>
                      <LinearGradient
                        colors={["#FFE7AB", "#D7912C"]}
                        style={styles.fanIdSealOuter}
                      >
                        <View style={styles.fanIdSealGloss} />
                        <View style={styles.fanIdSealInner}>
                          <View style={styles.fanIdPortraitBackdrop} />
                          <Ionicons name="person" size={36} color="#60380B" />
                        </View>
                      </LinearGradient>
                    </View>

                    <Text style={styles.fanIdProfileName}>
                      {featuredFan.name}
                    </Text>
                    <Text style={styles.fanIdProfileHandle}>
                      {featuredFan.handle}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </LinearGradient>
          </View>

          <View style={styles.tweetTrendSection}>
            <View style={styles.tweetTrendTitleWrap}>
              <RNText
                style={[
                  styles.tweetTrendSectionTitle,
                  fansArabicFontFamily
                    ? { fontFamily: fansArabicFontFamily }
                    : null,
                ]}
              >
                ترند التغريدات
              </RNText>
            </View>

            <TrendCardTrigger
              label="فتح تفاصيل ترند التغريدة"
              onPress={handleTrendCardPress}
              onDoublePress={openTrendDetail}
            >
              <LinearGradient
                colors={["#F6D37B", "#D79A2E", "#7A4B10"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tweetTrendCardFrame}
              >
                <LinearGradient
                  colors={["#0B1320", "#05070D", "#101827"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tweetTrendCardInner}
                >
                  <View style={styles.tweetTrendCardGlow} />

                  {/* Header: club info */}
                  <View style={styles.tweetTrendCardTopRow}>
                    <View style={styles.tweetTrendClubWrap}>
                      <View style={styles.tweetTrendClubCopy}>
                        <RNText style={styles.tweetTrendClubLabel}>
                          رابطة {activeClub.title}
                        </RNText>
                        <RNText style={styles.tweetTrendClubHandle}>
                          {activeTrendTweet.handle}
                        </RNText>
                      </View>

                      <View style={styles.tweetTrendClubBadge}>
                        <Ionicons
                          name={activeClub.icon}
                          size={24}
                          color={activeClub.gradient[0]}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Tweet body */}
                  <RNText style={styles.tweetTrendPostText}>
                    {isTrendExpanded
                      ? activeTrendTweet.headline
                      : activeTrendTweet.previewHeadline}
                    <RNText
                      style={styles.tweetTrendMoreText}
                      onPress={() =>
                        setIsTrendExpanded((currentValue) => !currentValue)
                      }
                    >
                      {isTrendExpanded ? " ... اخفاء" : " ... المزيد"}
                    </RNText>
                  </RNText>

                  {/* Action stats */}
                  <View style={styles.tweetTrendActionsRow}>
                    <TrendActionStat
                      icon="paper-plane-outline"
                      value={activeTrendTweet.shares}
                    />
                    <TrendActionStat
                      icon="heart"
                      value={activeTrendTweet.likes}
                      iconColor="#FF5A4F"
                      highlight
                    />
                    <TrendActionStat
                      icon="repeat-outline"
                      value={activeTrendTweet.reposts}
                    />
                    <TrendActionStat
                      icon="chatbox-ellipses-outline"
                      value={activeTrendTweet.comments}
                    />
                    <TrendActionStat
                      icon="stats-chart"
                      value={`${activeTrendTweet.engagement}%`}
                    />
                  </View>
                </LinearGradient>
              </LinearGradient>
            </TrendCardTrigger>
          </View>
        </ScrollView>

        <Animated.View
          pointerEvents={isTopSheetOpen ? "auto" : "none"}
          style={[styles.scrim, { opacity: scrimOpacity }]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setIsTopSheetOpen(false)}
          />
        </Animated.View>

        <View pointerEvents="box-none" style={styles.topSheetLayer}>
          <Animated.View
            pointerEvents={isTopSheetOpen ? "auto" : "none"}
            style={[
              styles.topSheetBodyWrap,
              {
                height: sheetBodyAnimatedHeight,
                opacity: sheetBodyOpacity,
                transform: [{ translateY: sheetBodyTranslateY }],
              },
            ]}
          >
            <View style={styles.topSheetBody}>
              <Text style={styles.topSheetEyebrow}>لوحة التشجيع السريعة</Text>
              <Text style={styles.topSheetTitle}>
                اختر الفريق وابدأ التشجيع
              </Text>

              <View style={styles.topSheetCardsColumn}>
                {FAN_CLUBS.map((club) => (
                  <SupportTeamCard
                    key={club.id}
                    clubId={club.id}
                    title={club.title}
                    icon={club.icon}
                    gradient={club.gradient}
                    count={supporters[club.id]}
                    isActive={activeClub.id === club.id}
                    isSupported={supportedTeams.includes(club.id)}
                    isLoggedIn={isLoggedIn}
                    hint={CLUB_COPY[club.id].supportHint}
                    onFocus={() => setActiveClubId(club.id)}
                    onRequireAuth={() =>
                      onRequireAuth("سجل الدخول لدعم الرابطة.")
                    }
                    onToggleSupport={() => onToggleSupport(club.id)}
                  />
                ))}
              </View>
            </View>
          </Animated.View>

          <Pressable
            style={styles.topSheetTrigger}
            onPress={() => setIsTopSheetOpen((currentValue) => !currentValue)}
          >
            <View style={styles.topSheetTriggerRow}>
              <View style={styles.topSheetTriggerLead}>
                <Text style={styles.topSheetTriggerLabel}>
                  {activeClub.crowdLabel}
                </Text>

                <View style={styles.topSheetTriggerRankBadge}>
                  <Text style={styles.topSheetTriggerRankText}>
                    {activeClubRank}
                  </Text>
                </View>

                <Ionicons
                  name={isTopSheetOpen ? "chevron-up" : "chevron-down"}
                  size={14}
                  color="#FFFFFF"
                />
              </View>

              <DigitalDigits digits={activeClubDigits} tone="trigger" />

              <View style={styles.topSheetTriggerCta}>
                <Text style={styles.topSheetTriggerCtaText}>شجع</Text>
              </View>
            </View>
          </Pressable>
        </View>

        <Animated.View
          pointerEvents={isTrendDetailOpen ? "auto" : "none"}
          style={[
            styles.trendDetailScrim,
            { opacity: trendDetailScrimOpacity },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={closeTrendDetail}
          />
        </Animated.View>

        <View pointerEvents="box-none" style={styles.trendDetailLayer}>
          <Animated.View
            pointerEvents={isTrendDetailOpen ? "auto" : "none"}
            style={[
              styles.trendDetailPanelShell,
              {
                width: trendDetailPanelWidth,
                height: trendDetailPanelHeight,
                opacity: trendDetailPanelOpacity,
                transform: [
                  { translateX: trendDetailPanelTranslateX },
                  { translateY: trendDetailPanelOffsetY },
                  { scale: trendDetailPanelScale },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["#F2D185", "#A96D1B", "#E3BB6A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.trendDetailPanelFrame}
            >
              <View style={styles.trendDetailPanelInner}>
                <FansArabicFontContext.Provider
                  value={trendDetailArabicFontFamily}
                >
                  <View style={styles.trendDetailVisualFrame}>
                    <Animated.View
                      style={[
                        styles.trendDetailHeroRow,
                        isCompactTrendDetailPanel
                          ? styles.trendDetailHeroRowCompact
                          : null,
                        trendDetailHeaderReveal,
                      ]}
                    >
                      <View
                        style={[
                          styles.trendDetailQuickActionsColumn,
                          isCompactTrendDetailPanel
                            ? styles.trendDetailQuickActionsColumnCompact
                            : null,
                        ]}
                      >
                        <Animated.View
                          style={[
                            styles.trendDetailQuickActionSlot,
                            trendDetailTopLeftReveal,
                          ]}
                        >
                          <TrendDetailQuickAction
                            label="متابعة+"
                            icon="add"
                            compact={isCompactTrendDetailPanel}
                          />
                        </Animated.View>

                        <Animated.View
                          style={[
                            styles.trendDetailQuickActionSlot,
                            trendDetailMidLeftReveal,
                          ]}
                        >
                          <TrendDetailQuickAction
                            label="رسالة"
                            icon="mail-outline"
                            compact={isCompactTrendDetailPanel}
                          />
                        </Animated.View>
                      </View>

                      <Animated.View
                        style={[
                          styles.trendDetailClubBlock,
                          isCompactTrendDetailPanel
                            ? styles.trendDetailClubBlockCompact
                            : null,
                          trendDetailTopRightReveal,
                        ]}
                      >
                        <View style={styles.trendDetailClubCrestWrap}>
                          {activeClubEmblem ? (
                            <Image
                              source={activeClubEmblem}
                              style={styles.trendDetailClubCrest}
                              resizeMode="contain"
                            />
                          ) : (
                            <Ionicons
                              name={activeClub.icon}
                              size={32}
                              color={activeClub.gradient[0]}
                            />
                          )}
                        </View>
                        <View style={styles.trendDetailClubMetaRow}>
                          <View style={styles.trendDetailClubMetaDot} />
                          <Text
                            style={[
                              styles.trendDetailClubMetaText,
                              isCompactTrendDetailPanel
                                ? styles.trendDetailClubMetaTextCompact
                                : null,
                            ]}
                            numberOfLines={1}
                          >
                            رابطة {activeClub.title}
                          </Text>
                        </View>
                      </Animated.View>
                    </Animated.View>

                    <Animated.View
                      style={[
                        styles.trendDetailReferenceCardWrap,
                        isCompactTrendDetailPanel
                          ? styles.trendDetailReferenceCardWrapCompact
                          : null,
                        trendDetailTweetReveal,
                      ]}
                    >
                      <View
                        style={[
                          styles.trendDetailReferenceCard,
                          isCompactTrendDetailPanel
                            ? styles.trendDetailReferenceCardCompact
                            : null,
                        ]}
                      >
                        <View style={styles.trendDetailReferenceCardHeader}>
                          <Text
                            style={[
                              styles.trendDetailReferenceHandle,
                              styles.trendDetailTweetHandleLatin,
                            ]}
                            numberOfLines={1}
                          >
                            {activeTrendTweet.handle}
                          </Text>

                          <View style={styles.trendDetailReferenceBrand}>
                            <View
                              style={styles.trendDetailReferenceBrandHeader}
                            >
                              <View
                                style={styles.trendDetailReferenceBrandMeta}
                              >
                                <View
                                  style={styles.trendDetailReferenceBrandRow}
                                >
                                  <View
                                    style={styles.trendDetailReferenceBrandDot}
                                  />
                                  <Text
                                    style={[
                                      styles.trendDetailReferenceBrandText,
                                      isCompactTrendDetailPanel
                                        ? styles.trendDetailReferenceBrandTextCompact
                                        : null,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    رابطة {activeClub.title}
                                  </Text>
                                </View>
                              </View>

                              {activeClubEmblem ? (
                                <Image
                                  source={activeClubEmblem}
                                  style={styles.trendDetailReferenceBrandMark}
                                  resizeMode="contain"
                                />
                              ) : (
                                <Ionicons
                                  name={activeClub.icon}
                                  size={18}
                                  color={activeClub.gradient[0]}
                                />
                              )}
                            </View>
                          </View>
                        </View>

                        <Text
                          style={[
                            styles.trendDetailReferenceBody,
                            isCompactTrendDetailPanel
                              ? styles.trendDetailReferenceBodyCompact
                              : null,
                          ]}
                          numberOfLines={isCompactTrendDetailPanel ? 2 : 3}
                        >
                          {activeTrendTweet.previewHeadline}
                        </Text>

                        <View style={styles.trendDetailReferenceMetricsRow}>
                          <TrendDetailMetricItem
                            icon="stats-chart"
                            value={`${activeTrendTweet.engagement}%`}
                            compact={isCompactTrendDetailPanel}
                          />
                          <TrendDetailMetricItem
                            icon="chatbox-ellipses-outline"
                            value={String(activeTrendTweet.comments)}
                            compact={isCompactTrendDetailPanel}
                          />
                          <TrendDetailMetricItem
                            icon="paper-plane-outline"
                            value={String(activeTrendTweet.shares)}
                            compact={isCompactTrendDetailPanel}
                          />
                          <TrendDetailMetricItem
                            icon="heart"
                            value={String(activeTrendTweet.likes)}
                            iconColor="#FF625A"
                            compact={isCompactTrendDetailPanel}
                          />
                          <TrendDetailMetricItem
                            icon="repeat-outline"
                            value={String(activeTrendTweet.reposts)}
                            compact={isCompactTrendDetailPanel}
                          />
                        </View>
                      </View>
                    </Animated.View>

                    <Animated.View
                      style={[
                        styles.trendDetailComposerRow,
                        isCompactTrendDetailPanel
                          ? styles.trendDetailComposerRowCompact
                          : null,
                        trendDetailBottomReveal,
                      ]}
                    >
                      <Pressable
                        style={[
                          styles.trendDetailComposerSendButton,
                          isCompactTrendDetailPanel
                            ? styles.trendDetailComposerSendButtonCompact
                            : null,
                        ]}
                        onPress={closeTrendDetail}
                      >
                        <Text
                          style={[
                            styles.trendDetailComposerSendText,
                            isCompactTrendDetailPanel
                              ? styles.trendDetailComposerSendTextCompact
                              : null,
                          ]}
                        >
                          SEND
                        </Text>
                      </Pressable>

                      <View
                        style={[
                          styles.trendDetailComposerField,
                          isCompactTrendDetailPanel
                            ? styles.trendDetailComposerFieldCompact
                            : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.trendDetailComposerPlaceholder,
                            isCompactTrendDetailPanel
                              ? styles.trendDetailComposerPlaceholderCompact
                              : null,
                          ]}
                          numberOfLines={1}
                        >
                          إرسال الرد الآن
                        </Text>
                      </View>
                    </Animated.View>

                    <Animated.View
                      style={[
                        styles.trendDetailFooterRow,
                        isCompactTrendDetailPanel
                          ? styles.trendDetailFooterRowCompact
                          : null,
                        trendDetailMidRightReveal,
                      ]}
                    >
                      <TrendDetailVarWordmark
                        compact={isCompactTrendDetailPanel}
                      />

                      <Pressable
                        style={[
                          styles.trendDetailJumpButton,
                          isCompactTrendDetailPanel
                            ? styles.trendDetailJumpButtonCompact
                            : null,
                        ]}
                        onPress={closeTrendDetail}
                      >
                        <Text
                          style={[
                            styles.trendDetailJumpButtonText,
                            isCompactTrendDetailPanel
                              ? styles.trendDetailJumpButtonTextCompact
                              : null,
                          ]}
                          numberOfLines={1}
                        >
                          الانتقال للتغريدة
                        </Text>
                      </Pressable>
                    </Animated.View>
                  </View>
                </FansArabicFontContext.Provider>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    </FansArabicFontContext.Provider>
  );
}

function SectionHeader(props: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      {props.eyebrow ? (
        <Text style={styles.sectionEyebrow}>{props.eyebrow}</Text>
      ) : null}
      <RNText style={styles.sectionTitle}>{props.title}</RNText>
      <RNText style={styles.sectionDescription}>{props.description}</RNText>
    </View>
  );
}

function FanIdStat(props: { label: string; value: string }) {
  return (
    <View style={styles.fanIdStatCard}>
      <Text style={styles.fanIdStatLabel}>{props.label}</Text>
      <Text style={styles.fanIdStatValue} numberOfLines={1}>
        {props.value}
      </Text>
    </View>
  );
}

function TrendActionStat(props: {
  icon: FanClubId extends never ? never : any;
  value: number | string;
  iconColor?: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.tweetTrendActionStat}>
      <View
        style={[
          styles.tweetTrendActionBubble,
          props.highlight ? styles.tweetTrendActionBubbleLiked : null,
        ]}
      >
        <Ionicons
          name={props.icon}
          size={18}
          color={props.iconColor ?? "#D9B15D"}
        />
      </View>
      <RNText style={styles.tweetTrendActionCount}>
        {typeof props.value === "number"
          ? props.value.toLocaleString("en-US")
          : props.value}
      </RNText>
    </View>
  );
}

function TrendDetailPill(props: {
  label: string;
  icon: FanClubId extends never ? never : any;
}) {
  return (
    <View style={styles.trendDetailPill}>
      <Ionicons name={props.icon} size={12} color="#231A0C" />
      <Text style={styles.trendDetailPillText} numberOfLines={1}>
        {props.label}
      </Text>
    </View>
  );
}

function TrendDetailQuickAction(props: {
  label: string;
  icon: FanClubId extends never ? never : any;
  compact?: boolean;
}) {
  return (
    <LinearGradient
      colors={["#31B8FF", "#1B8DF5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.trendDetailQuickAction,
        props.compact ? styles.trendDetailQuickActionCompact : null,
      ]}
    >
      <Ionicons
        name={props.icon}
        size={props.compact ? 8 : 10}
        color="#FFFFFF"
      />
      <Text
        style={[
          styles.trendDetailQuickActionText,
          props.compact ? styles.trendDetailQuickActionTextCompact : null,
        ]}
        numberOfLines={1}
      >
        {props.label}
      </Text>
    </LinearGradient>
  );
}

function TrendDetailMetricItem(props: {
  icon: FanClubId extends never ? never : any;
  value: string;
  iconColor?: string;
  compact?: boolean;
}) {
  return (
    <View style={styles.trendDetailMetricItem}>
      <Ionicons
        name={props.icon}
        size={props.compact ? 10 : 12}
        color={props.iconColor ?? "#D9B15D"}
      />
      <RNText
        style={[
          styles.trendDetailMetricValue,
          props.compact ? styles.trendDetailMetricValueCompact : null,
        ]}
        numberOfLines={1}
      >
        {props.value}
      </RNText>
    </View>
  );
}

function TrendDetailVarWordmark(props: { compact?: boolean }) {
  return (
    <View
      style={[
        styles.trendDetailVarLogo,
        props.compact ? styles.trendDetailVarLogoCompact : null,
      ]}
    >
      <RNText
        style={[
          styles.trendDetailVarLogoText,
          props.compact ? styles.trendDetailVarLogoTextCompact : null,
        ]}
        numberOfLines={1}
      >
        VAR
      </RNText>
    </View>
  );
}

function SupportTeamCard(props: {
  clubId: FanClubId;
  title: string;
  icon: FanClubId extends never ? never : any;
  gradient: [string, string];
  count: number;
  isActive: boolean;
  isSupported: boolean;
  isLoggedIn: boolean;
  hint: string;
  onFocus: () => void;
  onRequireAuth: () => void;
  onToggleSupport: () => void;
}) {
  const digits = digitsForCount(props.count);

  return (
    <Pressable
      style={[
        styles.supportTeamCard,
        props.isActive ? styles.supportTeamCardActive : null,
      ]}
      onPress={props.onFocus}
    >
      <LinearGradient
        colors={props.gradient}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.supportTeamGlow} />

      <View style={styles.supportTeamRow}>
        <Pressable
          style={[
            styles.supportTeamAction,
            props.isSupported ? styles.supportTeamActionActive : null,
          ]}
          onPress={() => {
            if (!props.isLoggedIn) {
              props.onRequireAuth();
              return;
            }

            props.onToggleSupport();
          }}
        >
          <Ionicons
            name={props.isSupported ? "checkmark" : "add"}
            size={12}
            color="#FFFFFF"
          />
          <Text style={styles.supportTeamActionText}>
            {props.isSupported ? "تم" : "شجع"}
          </Text>
        </Pressable>

        <View style={styles.supportTeamCopy}>
          <Text style={styles.supportTeamTitle}>{props.title}</Text>
          <Text style={styles.supportTeamHint}>{props.hint}</Text>
        </View>

        <DigitalDigits digits={digits} tone="card" />

        <View style={styles.supportTeamIconWrap}>
          <Ionicons name={props.icon} size={18} color="#FFFFFF" />
        </View>
      </View>
    </Pressable>
  );
}

function DigitalDigit(props: {
  digit: string;
  tone: "trigger" | "card" | "poster";
}) {
  return (
    <View
      style={[
        styles.digitalDigitBox,
        props.tone === "trigger"
          ? styles.digitalDigitBoxTrigger
          : props.tone === "poster"
            ? styles.digitalDigitBoxPoster
            : styles.digitalDigitBoxCard,
      ]}
    >
      <RNText
        style={[
          styles.digitalDigitText,
          props.tone === "poster" ? styles.digitalDigitTextPoster : null,
        ]}
      >
        {props.digit}
      </RNText>
    </View>
  );
}

function DigitalDigits(props: {
  digits: string[];
  tone: "trigger" | "card" | "poster";
}) {
  return (
    <View style={styles.digitalDigitsRow}>
      {props.digits.map((digit, index) => (
        <DigitalDigit
          key={`${props.tone}-${digit}-${index}`}
          digit={digit}
          tone={props.tone}
        />
      ))}
    </View>
  );
}

function digitsForCount(count: number) {
  const safeCount = Math.max(0, Math.floor(count));

  return safeCount
    .toLocaleString("en-US", { useGrouping: false })
    .padStart(4, "0")
    .slice(-4)
    .split("");
}

function splitIssuedAtText(issuedAt: string) {
  const [seasonValue = issuedAt, ...labelParts] = issuedAt.split(" ");

  return {
    seasonValue,
    seasonLabel: labelParts.join(" "),
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#04070C",
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: SHEET_TRIGGER_RESERVE + 34,
  },
  sectionHeader: {
    alignItems: "flex-end",
    marginBottom: 18,
  },
  sectionEyebrow: {
    color: "rgba(244,197,101,0.72)",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: MONO_FONT,
    textAlign: "right",
    letterSpacing: 1.4,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 1.6,
    textAlign: "right",
  },
  sectionDescription: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    lineHeight: 26,
    textAlign: "right",
    marginTop: 10,
  },
  fanIdBoard: {
    marginBottom: 18,
  },
  fanIdCardFrame: {
    borderRadius: 26,
    padding: 2,
    shadowColor: "#C88D1C",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  fanIdCardInner: {
    borderRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,225,162,0.22)",
  },
  fanIdCardGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(42, 89, 129, 0.18)",
    top: -64,
    left: -52,
  },
  fanIdCardSheen: {
    position: "absolute",
    top: -18,
    right: -20,
    width: 138,
    height: 92,
    transform: [{ rotate: "12deg" }],
  },
  fanIdCardEtch: {
    position: "absolute",
    left: 14,
    top: 18,
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,225,162,0.07)",
  },
  fanIdWatermark: {
    position: "absolute",
    top: 18,
    right: 14,
    opacity: 0.18,
  },
  fanIdWatermarkText: {
    color: "#FFCC68",
    fontSize: 32,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    letterSpacing: 2.4,
  },
  fanIdUtilityRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fanIdUtilityText: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  fanIdUtilityValueText: {
    color: "#FFCC68",
    fontSize: 12,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  fanIdUtilityLabelText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  fanIdUtilityCodeText: {
    color: "rgba(255,255,255,0.72)",
    letterSpacing: 1.2,
  },
  fanIdTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fanIdVerifySealWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  fanIdRankChip: {
    minWidth: 30,
    minHeight: 22,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#FFCC68",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  fanIdRankChipText: {
    color: "#FFCC68",
    fontSize: 9,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  fanIdTitle: {
    color: "#FFCC68",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  fanIdEyebrow: {
    color: "#F4C565",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 1,
  },
  fanIdRuleLong: {
    width: "48%",
    height: 4,
    borderRadius: 999,
    backgroundColor: "#F5BD58",
    marginTop: 6,
    alignSelf: "flex-end",
  },
  fanIdBodyRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginTop: 6,
  },
  fanIdMetaColumn: {
    flex: 1,
    marginLeft: 8,
    paddingTop: 0,
  },
  fanIdChipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  fanIdSecurityChip: {
    width: 44,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,217,130,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,240,196,0.44)",
    padding: 4,
    justifyContent: "center",
  },
  fanIdSecurityChipCore: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(96,55,9,0.26)",
    justifyContent: "space-evenly",
    paddingHorizontal: 5,
  },
  fanIdSecurityChipLineLong: {
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(96,55,9,0.55)",
  },
  fanIdSecurityChipLineShort: {
    width: "58%",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(96,55,9,0.55)",
    alignSelf: "flex-end",
  },
  fanIdVerifySeal: {
    minWidth: 88,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3C96D",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(95,55,9,0.18)",
    paddingHorizontal: 15,
    paddingVertical: 6,
  },
  fanIdVerifySealText: {
    color: "#5F3709",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    marginRight: 6,
  },
  fanIdLeagueRow: {
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(245,189,88,0.72)",
    marginBottom: 4,
    paddingBottom: 5,
  },
  fanIdLeagueLabel: {
    color: "#F4C565",
    fontSize: 8,
    fontWeight: "800",
    fontFamily: MONO_FONT,
    textAlign: "right",
  },
  fanIdLeagueValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 2,
  },
  fanIdStatsRow: {
    flexDirection: "row-reverse",
    marginTop: 8,
    marginHorizontal: -2,
  },
  fanIdStatCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.26)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 5,
    marginHorizontal: 2,
    overflow: "hidden",
  },
  fanIdStatLabel: {
    color: "#F4C565",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
  },
  fanIdStatValue: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 3,
  },
  fanIdProfileColumn: {
    width: 78,
    alignItems: "center",
    backgroundColor: "rgba(255,227,165,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,227,165,0.12)",
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  fanIdPhotoTag: {
    backgroundColor: "rgba(255,227,165,0.14)",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
    alignSelf: "center",
  },
  fanIdPhotoTagText: {
    color: "#FFCC68",
    fontSize: 7,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  fanIdSealWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  fanIdSealOuter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fanIdSealGloss: {
    position: "absolute",
    top: -16,
    left: -10,
    width: 38,
    height: 94,
    backgroundColor: "rgba(255,255,255,0.18)",
    transform: [{ rotate: "18deg" }],
  },
  fanIdSealInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F9D4A0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(0,0,0,0.14)",
  },
  fanIdPortraitBackdrop: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    top: 4,
  },
  fanIdProfileName: {
    color: "#FFCC68",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 5,
  },
  fanIdProfileHandle: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 7,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 2,
  },
  fanIdSignatureRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    marginTop: 6,
    paddingTop: 6,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,216,130,0.18)",
  },
  fanIdSignatureBlock: {
    flex: 1,
  },
  fanIdSignatureLabel: {
    color: "rgba(255,227,165,0.54)",
    fontSize: 7,
    fontWeight: "800",
    fontFamily: MONO_FONT,
    textAlign: "right",
  },
  fanIdSignatureLine: {
    width: "58%",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,204,104,0.62)",
    marginTop: 6,
    alignSelf: "flex-end",
  },
  fanIdSignatureStatus: {
    color: "#FFCC68",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 4,
  },
  fanIdSelectorRow: {
    flexDirection: "row-reverse",
    marginBottom: 12,
    marginHorizontal: -4,
  },
  fanIdSelectorChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 15,
    backgroundColor: "rgba(5,7,12,0.98)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    shadowColor: "#C88D1C",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  fanIdSelectorChipActive: {
    backgroundColor: "rgba(245,189,88,0.16)",
    borderColor: "#F4C565",
  },
  fanIdSelectorChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  fanIdSelectorChipTextActive: {
    color: "#FFFFFF",
  },
  radarBoard: {
    backgroundColor: "rgba(5, 7, 12, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 28,
    overflow: "hidden",
    padding: 14,
    marginBottom: 16,
  },
  radarHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  radarHeaderCopy: {
    flex: 1,
    alignItems: "flex-end",
    marginRight: 10,
  },
  radarEyebrow: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    fontFamily: MONO_FONT,
    textAlign: "right",
  },
  radarTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 5,
  },
  radarDescription: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 12,
    lineHeight: 20,
    textAlign: "right",
    marginTop: 8,
  },
  radarBodyRow: {
    flexDirection: "row-reverse",
    alignItems: "stretch",
    marginTop: 16,
  },
  radarPoster: {
    flex: 1,
    minHeight: 308,
    borderRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  radarPosterGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.18)",
    top: -36,
    right: -18,
  },
  radarPosterBadge: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(0,0,0,0.24)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  radarPosterBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  radarPosterTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 14,
  },
  radarPosterSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
    marginTop: 10,
  },
  radarPosterFooter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  radarPosterChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.24)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  radarPosterChipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    marginRight: 8,
  },
  radarSelectorColumn: {
    width: 52,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  radarSelectorCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    width: 42,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  radarSelectorCardActive: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.16)",
  },
  radarSelectorNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  radarSelectorNumberActive: {
    color: "#9EDCFF",
  },
  tweetTrendSection: {
    marginTop: 2,
    marginBottom: 12,
  },
  tweetTrendHeaderRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tweetTrendTitleWrap: {
    alignItems: "flex-end",
    marginBottom: 10,
  },
  tweetTrendContentRow: {
    width: "100%",
  },
  tweetTrendSectionTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    fontFamily: FANS_ARABIC_FONT_FAMILY,
    textAlign: "right",
    lineHeight: 34,
  },
  tweetTrendMetricCard: {
    width: 36,
    minHeight: 74,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 16,
    paddingHorizontal: 0,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "flex-start",
    alignSelf: "flex-start",
    marginRight: 0,
    shadowColor: "#E0B260",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },
  tweetTrendMetricValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    letterSpacing: 0,
  },
  tweetTrendMetricIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  tweetTrendMetricLabel: {
    color: "#F4C565",
    fontSize: 7,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 9,
    marginTop: 3,
  },
  tweetTrendCardFrame: {
    borderRadius: 26,
    padding: 2,
    shadowColor: "#C88D1C",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  tweetTrendCardFrameMain: {
    width: "100%",
  },
  tweetTrendCardInner: {
    borderRadius: 23,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 7,
    borderWidth: 1,
    borderColor: "rgba(255,225,162,0.22)",
  },
  tweetTrendCardContentRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  tweetTrendCardMainColumn: {
    flex: 1,
    marginLeft: 12,
  },
  tweetTrendCardGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(42, 89, 129, 0.18)",
    top: -64,
    left: -52,
  },
  tweetTrendCardSheen: {
    position: "absolute",
    top: -18,
    right: -20,
    width: 138,
    height: 92,
    transform: [{ rotate: "12deg" }],
  },
  tweetTrendCardEtch: {
    position: "absolute",
    left: 14,
    top: 18,
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,225,162,0.07)",
  },
  tweetTrendCardTopRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  tweetTrendClubHandle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "left",
    marginTop: 2,
  },
  tweetTrendClubWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  tweetTrendClubBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.26)",
    alignItems: "center",
    justifyContent: "center",
  },
  tweetTrendClubCopy: {
    alignItems: "flex-start",
    marginRight: 10,
  },
  tweetTrendClubLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "left",
  },
  tweetTrendQuickReplyCard: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.52)",
    backgroundColor: "rgba(5,7,12,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  tweetTrendQuickReplyText: {
    color: "#E0B260",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
  },
  tweetTrendPostText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "right",
    marginTop: 4,
  },
  tweetTrendMoreText: {
    color: "#F4C565",
    fontSize: 16,
    fontWeight: "800",
  },
  tweetTrendFooterRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
  },
  tweetTrendMetaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexWrap: "wrap",
    marginLeft: 12,
  },
  tweetTrendMetaPill: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 6,
  },
  tweetTrendMetaText: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 11,
    fontWeight: "700",
  },
  tweetTrendActionsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 8,
    paddingHorizontal: 0,
  },
  tweetTrendActionStat: {
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: 38,
  },
  tweetTrendActionBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  tweetTrendActionBubbleLiked: {
    backgroundColor: "transparent",
  },
  tweetTrendActionCount: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: MONO_FONT,
    marginTop: 2,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  trendDetailScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.64)",
    zIndex: 28,
  },
  topSheetLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  trendDetailLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
  },
  trendDetailPanelShell: {
    shadowColor: "#D39D39",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 30,
  },
  trendDetailPanelFrame: {
    flex: 1,
    borderRadius: 14,
    padding: 1,
  },
  trendDetailPanelInner: {
    flex: 1,
    borderRadius: 13,
    backgroundColor: "#030507",
    borderWidth: 1,
    borderColor: "rgba(242,209,133,0.2)",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  trendDetailHeader: {
    alignItems: "center",
  },
  trendDetailHeaderMarkWrap: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  trendDetailHeaderMark: {
    width: 38,
    height: 38,
  },
  trendDetailHeaderLabelRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 8,
  },
  trendDetailHeaderLabel: {
    color: "#FFF4D2",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    marginRight: 5,
  },
  trendDetailCanvas: {
    flex: 1,
    position: "relative",
    marginTop: 14,
  },
  trendDetailStemCap: {
    position: "absolute",
    top: "1.5%",
    left: "50%",
    width: 5,
    height: 5,
    marginLeft: -2.5,
    borderRadius: 999,
    backgroundColor: "#E2B860",
  },
  trendDetailStem: {
    position: "absolute",
    top: "3.4%",
    bottom: "11%",
    left: "50%",
    width: 1.2,
    marginLeft: -0.6,
    backgroundColor: "#D4A655",
  },
  trendDetailTopLeftCluster: {
    position: "absolute",
    top: "8%",
    left: "-1%",
    width: "42%",
    alignItems: "flex-start",
  },
  trendDetailTopRightCluster: {
    position: "absolute",
    top: "8%",
    right: "-1%",
    width: "42%",
    alignItems: "flex-end",
  },
  trendDetailMidLeftCluster: {
    position: "absolute",
    top: "22%",
    left: "-2%",
    width: "43%",
    alignItems: "flex-start",
  },
  trendDetailMidRightCluster: {
    position: "absolute",
    top: "22%",
    right: "-2%",
    width: "43%",
    alignItems: "flex-end",
  },
  trendDetailConnectorTopLeft: {
    position: "absolute",
    top: 17,
    right: -21,
    width: 74,
    height: 38,
    borderTopWidth: 1.35,
    borderRightWidth: 1.35,
    borderColor: "#D4A655",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 12,
  },
  trendDetailConnectorTopRight: {
    position: "absolute",
    top: 17,
    left: -21,
    width: 74,
    height: 38,
    borderTopWidth: 1.35,
    borderLeftWidth: 1.35,
    borderColor: "#D4A655",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 12,
  },
  trendDetailConnectorMidLeft: {
    position: "absolute",
    top: -24,
    right: -22,
    width: 78,
    height: 56,
    borderBottomWidth: 1.35,
    borderRightWidth: 1.35,
    borderColor: "#D4A655",
    borderBottomRightRadius: 10,
    borderTopRightRadius: 12,
  },
  trendDetailConnectorMidRight: {
    position: "absolute",
    top: -24,
    left: -22,
    width: 78,
    height: 56,
    borderBottomWidth: 1.35,
    borderLeftWidth: 1.35,
    borderColor: "#D4A655",
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 12,
  },
  trendDetailPill: {
    minWidth: 90,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#DAB363",
    borderWidth: 1,
    borderColor: "rgba(35,26,12,0.18)",
  },
  trendDetailPillText: {
    color: "#231A0C",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    textAlign: "center",
    marginRight: 5,
  },
  trendDetailTweetCluster: {
    position: "absolute",
    top: "36%",
    left: 12,
    right: 12,
    alignItems: "center",
  },
  trendDetailTweetClusterCompact: {
    top: "24%",
  },
  trendDetailTweetConnectorTop: {
    width: 1.2,
    height: 30,
    backgroundColor: "#D4A655",
  },
  trendDetailTweetConnectorTopCompact: {
    height: 12,
  },
  trendDetailTweetCard: {
    width: "100%",
    backgroundColor: "#0A0E14",
    borderWidth: 1,
    borderColor: "#D9B15D",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 11,
  },
  trendDetailTweetCardCompact: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  trendDetailTweetHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trendDetailTweetMarkWrap: {
    minWidth: 18,
    minHeight: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  trendDetailTweetMark: {
    width: 18,
    height: 18,
  },
  trendDetailTweetHandle: {
    color: "rgba(255,240,210,0.72)",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "left",
  },
  trendDetailTweetHandleLatin: {
    fontFamily: ENGLISH_DISPLAY_FONT,
    letterSpacing: 0.2,
  },
  trendDetailTweetBody: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
  },
  trendDetailTweetBodyCompact: {
    fontSize: 9,
    lineHeight: 12,
    marginTop: 3,
  },
  trendDetailTweetMetricsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  trendDetailTweetMetricsRowCompact: {
    marginTop: 4,
  },
  trendDetailTweetConnectorBottom: {
    width: 1.2,
    height: 26,
    backgroundColor: "#D4A655",
  },
  trendDetailTweetConnectorBottomCompact: {
    height: 8,
  },
  trendDetailBottomCluster: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    paddingTop: 22,
  },
  trendDetailBottomClusterCompact: {
    bottom: 2,
    paddingTop: 12,
  },
  trendDetailConnectorBottomLeft: {
    position: "absolute",
    top: 0,
    left: "19%",
    width: "22%",
    height: 20,
    borderTopWidth: 1.35,
    borderLeftWidth: 1.35,
    borderColor: "#D4A655",
    borderTopLeftRadius: 10,
  },
  trendDetailConnectorBottomRight: {
    position: "absolute",
    top: 0,
    right: "24%",
    width: "27%",
    height: 20,
    borderTopWidth: 1.35,
    borderRightWidth: 1.35,
    borderColor: "#D4A655",
    borderTopRightRadius: 10,
  },
  trendDetailBottomButtonsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trendDetailBottomButtonPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4A655",
    backgroundColor: "#142118",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  trendDetailBottomButtonPrimaryCompact: {
    minHeight: 34,
  },
  trendDetailBottomButtonSecondary: {
    width: "30%",
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4A655",
    backgroundColor: "#1C2417",
    alignItems: "center",
    justifyContent: "center",
  },
  trendDetailBottomButtonSecondaryCompact: {
    minHeight: 34,
  },
  trendDetailBottomButtonPrimaryText: {
    color: "#FFF8E4",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  trendDetailBottomButtonPrimaryTextCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  trendDetailBottomButtonSecondaryText: {
    color: "#FFF2D1",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  trendDetailBottomButtonSecondaryTextCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
  trendDetailVisualFrame: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(226,175,83,0.22)",
    backgroundColor: "#040608",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  trendDetailHeroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  trendDetailHeroRowCompact: {
    marginBottom: 4,
  },
  trendDetailQuickActionsColumn: {
    width: 94,
    paddingTop: 2,
  },
  trendDetailQuickActionsColumnCompact: {
    width: 82,
  },
  trendDetailQuickActionSlot: {
    marginBottom: 9,
  },
  trendDetailQuickAction: {
    minHeight: 29,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  trendDetailQuickActionCompact: {
    minHeight: 24,
    paddingHorizontal: 8,
  },
  trendDetailQuickActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    marginRight: 4,
  },
  trendDetailQuickActionTextCompact: {
    fontSize: 10,
    marginRight: 3,
  },
  trendDetailClubBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 12,
  },
  trendDetailClubBlockCompact: {
    marginLeft: 8,
  },
  trendDetailClubCrestWrap: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  trendDetailClubCrest: {
    width: 34,
    height: 34,
  },
  trendDetailClubMetaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 6,
  },
  trendDetailClubMetaDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#D9B15D",
    marginLeft: 6,
    shadowColor: "#E9C16A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  trendDetailClubMetaText: {
    color: "#F3E1B7",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "right",
  },
  trendDetailClubMetaTextCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  trendDetailReferenceCardWrap: {
    marginTop: 14,
  },
  trendDetailReferenceCardWrapCompact: {
    marginTop: 10,
  },
  trendDetailReferenceCard: {
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(226,175,83,0.5)",
    backgroundColor: "#090C12",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  trendDetailReferenceCardCompact: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },
  trendDetailReferenceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  trendDetailReferenceHandle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 4,
  },
  trendDetailReferenceBrand: {
    alignItems: "flex-end",
    flexShrink: 1,
    marginLeft: 12,
  },
  trendDetailReferenceBrandHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  trendDetailReferenceBrandMeta: {
    marginLeft: 7,
    alignItems: "flex-end",
  },
  trendDetailReferenceBrandRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  trendDetailReferenceBrandDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D9B15D",
    marginLeft: 4,
  },
  trendDetailReferenceBrandText: {
    color: "#F0DDAF",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  trendDetailReferenceBrandTextCompact: {
    fontSize: 9,
    lineHeight: 11,
  },
  trendDetailReferenceBrandMark: {
    width: 18,
    height: 18,
  },
  trendDetailReferenceBody: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
  },
  trendDetailReferenceBodyCompact: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  trendDetailReferenceMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(226,175,83,0.12)",
    marginTop: 12,
    paddingTop: 10,
  },
  trendDetailMetricItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  trendDetailMetricValue: {
    color: "#E5BF71",
    fontSize: 10,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    marginTop: 3,
  },
  trendDetailMetricValueCompact: {
    fontSize: 8,
    marginTop: 3,
  },
  trendDetailComposerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  trendDetailComposerRowCompact: {
    marginTop: 10,
  },
  trendDetailComposerSendButton: {
    width: 72,
    height: 34,
    borderRadius: 7,
    backgroundColor: "#1EA8FF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  trendDetailComposerSendButtonCompact: {
    width: 62,
    height: 30,
  },
  trendDetailComposerSendText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    fontFamily: ENGLISH_DISPLAY_FONT,
    letterSpacing: 0.7,
  },
  trendDetailComposerSendTextCompact: {
    fontSize: 11,
  },
  trendDetailComposerField: {
    flex: 1,
    height: 34,
    marginLeft: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "#080B10",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  trendDetailComposerFieldCompact: {
    height: 30,
    marginLeft: 6,
    paddingHorizontal: 10,
  },
  trendDetailComposerPlaceholder: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  trendDetailComposerPlaceholderCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
  trendDetailFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
  },
  trendDetailFooterRowCompact: {
    marginTop: 8,
  },
  trendDetailVarLogo: {
    width: 104,
    minHeight: 32,
    marginTop: 8,
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  trendDetailVarLogoCompact: {
    width: 88,
    minHeight: 28,
    marginTop: 6,
  },
  trendDetailVarLogoText: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 32,
    fontWeight: "900",
    fontStyle: Platform.OS === "web" ? "italic" : "normal",
    fontFamily: VAR_WORDMARK_FONT,
    letterSpacing: -2.6,
    textAlign: "left",
    textShadowColor: "rgba(255,255,255,0.22)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    transform: [{ scaleX: 1.02 }],
  },
  trendDetailVarLogoTextCompact: {
    fontSize: 27,
    lineHeight: 27,
    letterSpacing: -2.2,
  },
  trendDetailJumpButton: {
    borderRadius: 999,
    backgroundColor: "#1EA8FF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  trendDetailJumpButtonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  trendDetailJumpButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "900",
    textAlign: "center",
  },
  trendDetailJumpButtonTextCompact: {
    fontSize: 9,
    lineHeight: 11,
  },
  topSheetBodyWrap: {
    width: "74%",
    maxWidth: 276,
    overflow: "hidden",
  },
  topSheetBody: {
    backgroundColor: "rgba(8, 12, 20, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.26)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
  },
  topSheetEyebrow: {
    color: "rgba(255,214,126,0.62)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
  },
  topSheetTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 4,
  },
  topSheetCardsColumn: {
    marginTop: 12,
  },
  topSheetTrigger: {
    width: "74%",
    maxWidth: 276,
    backgroundColor: "rgba(8, 12, 20, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.26)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  topSheetTriggerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topSheetTriggerLead: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexShrink: 1,
  },
  topSheetTriggerLabel: {
    color: "#FFDE97",
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 8,
  },
  topSheetTriggerRankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F3C96D",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "rgba(95,55,9,0.18)",
  },
  topSheetTriggerRankText: {
    color: "#5F3709",
    fontSize: 11,
    fontWeight: "900",
  },
  topSheetTriggerCta: {
    backgroundColor: "#F3C96D",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(95,55,9,0.18)",
  },
  topSheetTriggerCtaText: {
    color: "#5F3709",
    fontSize: 11,
    fontWeight: "900",
  },
  supportTeamCard: {
    height: 84,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  supportTeamCardActive: {
    borderColor: "rgba(255,255,255,0.28)",
  },
  supportTeamGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.14)",
    top: -34,
    right: -10,
  },
  supportTeamRow: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  supportTeamAction: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(29,155,240,0.92)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  supportTeamActionActive: {
    backgroundColor: "rgba(32,163,93,0.94)",
  },
  supportTeamActionText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    marginRight: 4,
  },
  supportTeamCopy: {
    flex: 1,
    alignItems: "flex-end",
    marginRight: 12,
    marginLeft: 10,
  },
  supportTeamTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  supportTeamHint: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 4,
  },
  supportTeamIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  digitalDigitsRow: {
    flexDirection: "row-reverse",
  },
  digitalDigitBox: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 3,
    borderRadius: 6,
  },
  digitalDigitBoxTrigger: {
    width: 16,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  digitalDigitBoxCard: {
    width: 15,
    height: 22,
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  digitalDigitBoxPoster: {
    width: 18,
    height: 26,
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  digitalDigitText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  digitalDigitTextPoster: {
    fontSize: 11,
  },
});
