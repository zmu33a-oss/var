import {
  type ComponentProps,
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  type TextProps,
  View,
} from "react-native";
import { FAN_CLUBS } from "../app.data";
import type { FanClubId } from "../app.types";
import { createCompatStyleSheet } from "../lib/crossPlatformStyles";

const MONO_FONT = Platform.OS === "ios" ? "Courier" : "monospace";
const FANS_ARABIC_FONT_FAMILY = "FansArabic";
const FANS_ARABIC_FONT = require("../../assets/images/alfont_com_KA-Hand-Naskh.ttf");
const HILAL_ICON = require("../../assets/icons/alhilal.png.png");
const NASSR_ICON = require("../../assets/icons/alnassr.png.png");

const CLUB_EMBLEMS: Partial<Record<FanClubId, number>> = {
  hilal: HILAL_ICON,
  nassr: NASSR_ICON,
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];

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

const CLUB_COPY: Record<
  FanClubId,
  {
    flameLabel: string;
    deckLabel: string;
    supportHint: string;
    statusLabel: string;
  }
> = {
  hilal: {
    flameLabel: "نبض مشتعل",
    deckLabel: "المدرج الأزرق",
    supportHint: "إيقاع موحد وصوت سريع في بداية المدرج.",
    statusLabel: "جاهزية عالية قبل الذروة",
  },
  nassr: {
    flameLabel: "صوت ناري",
    deckLabel: "المدرج الأصفر",
    supportHint: "حضور حاد وارتفاع واضح في الرد الجماعي.",
    statusLabel: "اندفاع سريع في الرابطة",
  },
  ittihad: {
    flameLabel: "شحنة قوية",
    deckLabel: "المدرج الذهبي",
    supportHint: "ثبات جماهيري مع دفعة إلكترونية متصاعدة.",
    statusLabel: "زخم ثابت على مدار اليوم",
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
  }
> = {
  hilal: {
    name: "سعود الحربي",
    handle: "@bluepulse",
    posts: 148,
    replies: 326,
    likes: 1842,
  },
  nassr: {
    name: "فيصل المطيري",
    handle: "@victoryline",
    posts: 136,
    replies: 288,
    likes: 1634,
  },
  ittihad: {
    name: "راكان الشريف",
    handle: "@goldroar",
    posts: 121,
    replies: 244,
    likes: 1278,
  },
};

const TREND_TWEETS: Record<
  FanClubId,
  {
    engagement: number;
    previewHeadline: string;
    hashtag: string;
    handle: string;
    comments: number;
    reposts: number;
    likes: number;
  }
> = {
  hilal: {
    engagement: 87,
    previewHeadline:
      "الهلال يتصدر الترند مع تفاعل متواصل من الرابطة والهاشتاق والحسابات الداعمة.",
    hashtag: "#الهلال",
    handle: "@bluepulse",
    comments: 286,
    reposts: 164,
    likes: 934,
  },
  nassr: {
    engagement: 82,
    previewHeadline:
      "النصر يقترب من القمة بعد موجة اقتباسات سريعة وارتفاع واضح في حجم التغريدات.",
    hashtag: "#النصر",
    handle: "@victoryline",
    comments: 241,
    reposts: 151,
    likes: 876,
  },
  ittihad: {
    engagement: 79,
    previewHeadline:
      "الاتحاد يحافظ على حضور قوي في مسار التغريدات مع زيادة مستقرة في إعادة النشر.",
    hashtag: "#الاتحاد",
    handle: "@goldroar",
    comments: 214,
    reposts: 139,
    likes: 801,
  },
};

const TREND_RANKING_ROWS = [
  {
    id: "trend-tweet",
    metric: "1052K",
    label: "التغريده الترند",
    handle: "@ALHELA",
  },
  {
    id: "trend-account",
    metric: "1525K",
    label: "الحساب الترند",
    handle: "@ALKING",
  },
  {
    id: "prediction-trend-account",
    metric: "1525K",
    label: "حساب ترند التوقعات",
    handle: "@ALKING",
  },
] as const;

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
  });
  const fansArabicFontFamily = areArabicFontsLoaded
    ? FANS_ARABIC_FONT_FAMILY
    : undefined;
  const [activeClubId, setActiveClubId] = useState<FanClubId>(FAN_CLUBS[0].id);

  const activeClub =
    FAN_CLUBS.find((club) => club.id === activeClubId) ?? FAN_CLUBS[0];
  const activeClubRank =
    FAN_CLUBS.findIndex((club) => club.id === activeClub.id) + 1;
  const activeClubSupporters = props.supporters[activeClub.id] ?? 0;
  const activeClubDigits = digitsForCount(activeClubSupporters);

  const cycleActiveClub = () => {
    const currentIndex = FAN_CLUBS.findIndex(
      (club) => club.id === activeClub.id,
    );
    const nextClub = FAN_CLUBS[(currentIndex + 1) % FAN_CLUBS.length];
    setActiveClubId(nextClub.id);
  };

  return (
    <FansArabicFontContext.Provider value={fansArabicFontFamily}>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.screenContent}
        >
          <SupportTongue
            clubTitle={activeClub.title}
            crowdLabel={activeClub.crowdLabel}
            digits={activeClubDigits}
            rank={activeClubRank}
            onPress={cycleActiveClub}
          />

          <TrendRankingBoard />
        </ScrollView>
      </View>
    </FansArabicFontContext.Provider>
  );
}

function SupportTongue(props: {
  clubTitle: string;
  crowdLabel: string;
  digits: string[];
  rank: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.topTongue} onPress={props.onPress}>
      <View style={styles.topTongueRow}>
        <View style={styles.topTongueLead}>
          <Text style={styles.topTongueLabel}>{props.crowdLabel}</Text>

          <View style={styles.topTongueRankBadge}>
            <Text style={styles.topTongueRankText}>{props.rank}</Text>
          </View>

          <Ionicons name="swap-horizontal" size={12} color="#FFFFFF" />
        </View>

        <View style={styles.topTongueCenter}>
          <DigitalDigits digits={props.digits} />
          <Text style={styles.topTongueSubLabel}>رابطة {props.clubTitle}</Text>
        </View>

        <View style={styles.topTongueCta}>
          <Text style={styles.topTongueCtaText}>بدّل</Text>
        </View>
      </View>
    </Pressable>
  );
}

function TrendRankingBoard() {
  return (
    <View style={styles.trendRankingBoard}>
      {TREND_RANKING_ROWS.map((row) => (
        <View key={row.id} style={styles.trendRankingRow}>
          <View style={styles.trendRankingAvatarColumn}>
            <View style={styles.trendRankingAvatar} />
            <RNText style={styles.trendRankingHandle}>{row.handle}</RNText>
          </View>

          <View style={styles.trendRankingContent}>
            <View style={styles.trendRankingTitleRow}>
              <Text style={styles.trendRankingLabel}>{row.label}</Text>
              <RNText style={styles.trendRankingMetric}>{row.metric}</RNText>
            </View>

            <View style={styles.trendRankingUnderline} />
          </View>

          <View style={styles.trendRankingIconWrap}>
            <Ionicons name="finger-print" size={38} color="#D6A538" />
          </View>
        </View>
      ))}
    </View>
  );
}

function TrendPulseCard(props: {
  clubTitle: string;
  clubIcon: IoniconName;
  clubGradient: [string, string];
  emblemSource?: number;
  trend: {
    engagement: number;
    previewHeadline: string;
    hashtag: string;
    handle: string;
    comments: number;
    reposts: number;
    likes: number;
  };
  statusLabel: string;
}) {
  return (
    <LeaguePanelFrame
      chipLabel="نبض الرابطة"
      chipIcon="flame-outline"
      chipColors={["#F97316", "#EA580C"]}
      glowColor="rgba(249,115,22,0.18)"
      utilityIcons={["trending-up-outline", "radio-outline"]}
    >
      <View style={styles.panelHeroRow}>
        <View style={styles.panelCopyColumn}>
          <Text style={styles.panelEyebrow}>{props.statusLabel}</Text>
          <Text style={styles.panelTitle}>رابطة {props.clubTitle}</Text>
          <Text style={styles.panelBody}>{props.trend.previewHeadline}</Text>
        </View>

        <ClubBadge
          emblemSource={props.emblemSource}
          icon={props.clubIcon}
          gradient={props.clubGradient}
        />
      </View>

      <View style={styles.metricRibbon}>
        <MetricPill
          icon="stats-chart"
          value={`${props.trend.engagement}%`}
          label="تفاعل"
        />
        <MetricPill
          icon="chatbubble-ellipses-outline"
          value={formatCompactCount(props.trend.comments)}
          label="رد"
        />
        <MetricPill
          icon="repeat-outline"
          value={formatCompactCount(props.trend.reposts)}
          label="إعادة"
        />
        <MetricPill
          icon="heart"
          value={formatCompactCount(props.trend.likes)}
          label="إعجاب"
          iconColor="#FF6B6B"
        />
      </View>

      <View style={styles.cardFooterRow}>
        <View style={styles.tagPill}>
          <Ionicons name="pricetag-outline" size={12} color="#FFDE97" />
          <RNText style={styles.tagPillText}>{props.trend.hashtag}</RNText>
        </View>

        <RNText style={styles.cardFooterMonoText}>{props.trend.handle}</RNText>
      </View>
    </LeaguePanelFrame>
  );
}

function SupporterSpotlightCard(props: {
  clubTitle: string;
  featuredFan: {
    name: string;
    handle: string;
    posts: number;
    replies: number;
    likes: number;
  };
  isSupported: boolean;
  onSupportPress: () => void;
}) {
  return (
    <LeaguePanelFrame
      chipLabel="الأكثر دعمًا"
      chipIcon="star-outline"
      chipColors={["#FACC15", "#CA8A04"]}
      glowColor="rgba(250,204,21,0.16)"
      utilityIcons={["shield-checkmark-outline", "sparkles-outline"]}
    >
      <View style={styles.spotlightRow}>
        <View style={styles.spotlightCopyColumn}>
          <Text style={styles.panelEyebrow}>بطاقة الرابطة</Text>
          <Text style={styles.panelTitle}>{props.featuredFan.name}</Text>
          <RNText style={styles.spotlightHandle}>
            {props.featuredFan.handle}
          </RNText>

          <View style={styles.spotlightStatsRow}>
            <MiniStat
              label="المشاركات"
              value={formatCompactCount(props.featuredFan.posts)}
            />
            <MiniStat
              label="الردود"
              value={formatCompactCount(props.featuredFan.replies)}
            />
            <MiniStat
              label="الإعجاب"
              value={formatCompactCount(props.featuredFan.likes)}
            />
          </View>
        </View>

        <View style={styles.portraitWrap}>
          <LinearGradient
            colors={["#FFE7AB", "#D7912C"]}
            style={styles.portraitOuter}
          >
            <View style={styles.portraitInner}>
              <View style={styles.portraitGlow} />
              <Ionicons name="person" size={38} color="#60380B" />
            </View>
          </LinearGradient>
          <Text style={styles.portraitCaption}>موثق</Text>
        </View>
      </View>

      <View style={styles.cardFooterRow}>
        <View style={styles.tagPill}>
          <Ionicons name="people-outline" size={12} color="#FFDE97" />
          <Text style={styles.tagPillText}>رابطة {props.clubTitle}</Text>
        </View>

        <Pressable
          style={[
            styles.inlineActionButton,
            props.isSupported ? styles.inlineActionButtonActive : null,
          ]}
          onPress={props.onSupportPress}
        >
          <Ionicons
            name={props.isSupported ? "checkmark" : "add"}
            size={14}
            color={props.isSupported ? "#07111D" : "#5F3709"}
          />
          <Text
            style={[
              styles.inlineActionButtonText,
              props.isSupported ? styles.inlineActionButtonTextActive : null,
            ]}
          >
            {props.isSupported ? "مدعوم" : "ادعم الآن"}
          </Text>
        </Pressable>
      </View>
    </LeaguePanelFrame>
  );
}

function DeckStatusCard(props: {
  clubTitle: string;
  deckLabel: string;
  flameLabel: string;
  supportHint: string;
  supportCount: number;
  supportDigits: string[];
  isSupported: boolean;
  onSupportPress: () => void;
}) {
  return (
    <LeaguePanelFrame
      chipLabel="جاهزية المدرج"
      chipIcon="layers-outline"
      chipColors={["#8B5CF6", "#4338CA"]}
      glowColor="rgba(139,92,246,0.18)"
      utilityIcons={["people-outline", "flash-outline"]}
    >
      <View style={styles.deckTopRow}>
        <View style={styles.panelCopyColumn}>
          <Text style={styles.panelEyebrow}>{props.flameLabel}</Text>
          <Text style={styles.panelTitle}>{props.deckLabel}</Text>
          <Text style={styles.panelBody}>{props.supportHint}</Text>
        </View>

        <View style={styles.deckDigitsPanel}>
          <RNText style={styles.deckDigitsLabel}>SUPPORT</RNText>
          <DigitalDigits digits={props.supportDigits} compact />
        </View>
      </View>

      <View style={styles.deckInfoBox}>
        <View style={styles.deckInfoHeader}>
          <Text style={styles.deckInfoTitle}>حالة الرابطة</Text>
          <Text style={styles.deckInfoValue}>رابطة {props.clubTitle}</Text>
        </View>
        <RNText style={styles.deckInfoMonoText}>
          {formatCompactCount(props.supportCount)} داعم جاهز الآن
        </RNText>
      </View>

      <Pressable
        style={[
          styles.fullWidthActionButton,
          props.isSupported ? styles.fullWidthActionButtonActive : null,
        ]}
        onPress={props.onSupportPress}
      >
        <Ionicons
          name={props.isSupported ? "checkmark-circle" : "rocket-outline"}
          size={16}
          color={props.isSupported ? "#07111D" : "#FFFFFF"}
        />
        <Text
          style={[
            styles.fullWidthActionButtonText,
            props.isSupported ? styles.fullWidthActionButtonTextActive : null,
          ]}
        >
          {props.isSupported ? "أنت داخل الرابطة" : "ادخل الرابطة الآن"}
        </Text>
      </Pressable>
    </LeaguePanelFrame>
  );
}

function LeaguePanelFrame(props: {
  chipLabel: string;
  chipIcon: IoniconName;
  chipColors: [string, string];
  glowColor: string;
  utilityIcons: IoniconName[];
  children: ReactNode;
}) {
  return (
    <LinearGradient
      colors={["#F4D384", "#9A6A1D", "#ECC878"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.panelFrame}
    >
      <View style={styles.panelShell}>
        <View
          style={[styles.panelGlow, { backgroundColor: props.glowColor }]}
        />
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.16)",
            "rgba(255,255,255,0.04)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.panelSheen}
        />

        <View style={styles.panelHeaderRow}>
          <LinearGradient
            colors={props.chipColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.panelChip}
          >
            <Ionicons name={props.chipIcon} size={12} color="#FFFFFF" />
            <Text style={styles.panelChipText}>{props.chipLabel}</Text>
          </LinearGradient>

          <View style={styles.panelToolsRow}>
            {props.utilityIcons.map((iconName) => (
              <PanelToolButton key={iconName} icon={iconName} />
            ))}
          </View>
        </View>

        {props.children}
      </View>
    </LinearGradient>
  );
}

function ClubBadge(props: {
  emblemSource?: number;
  icon: IoniconName;
  gradient: [string, string];
}) {
  return (
    <View style={styles.clubBadgeWrap}>
      <LinearGradient
        colors={[`${props.gradient[0]}55`, "rgba(255,255,255,0.04)"]}
        style={styles.clubBadgeGlow}
      />

      <View style={styles.clubBadgeCore}>
        {props.emblemSource ? (
          <Image
            source={props.emblemSource}
            resizeMode="contain"
            style={styles.clubBadgeImage}
          />
        ) : (
          <LinearGradient
            colors={props.gradient}
            style={styles.clubBadgeFallback}
          >
            <Ionicons name={props.icon} size={26} color="#FFFFFF" />
          </LinearGradient>
        )}
      </View>
    </View>
  );
}

function PanelToolButton(props: { icon: IoniconName }) {
  return (
    <View style={styles.panelToolButton}>
      <Ionicons name={props.icon} size={15} color="rgba(148,163,184,0.96)" />
    </View>
  );
}

function MetricPill(props: {
  icon: IoniconName;
  value: string;
  label: string;
  iconColor?: string;
}) {
  return (
    <View style={styles.metricPill}>
      <Ionicons
        name={props.icon}
        size={14}
        color={props.iconColor ?? "#D9B15D"}
      />
      <RNText style={styles.metricPillValue}>{props.value}</RNText>
      <Text style={styles.metricPillLabel}>{props.label}</Text>
    </View>
  );
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <View style={styles.miniStatCard}>
      <Text style={styles.miniStatLabel}>{props.label}</Text>
      <RNText style={styles.miniStatValue}>{props.value}</RNText>
    </View>
  );
}

function DigitalDigit(props: { digit: string; compact?: boolean }) {
  return (
    <View
      style={[
        styles.digitalDigitBox,
        props.compact ? styles.digitalDigitBoxCompact : null,
      ]}
    >
      <RNText
        style={[
          styles.digitalDigitText,
          props.compact ? styles.digitalDigitTextCompact : null,
        ]}
      >
        {props.digit}
      </RNText>
    </View>
  );
}

function DigitalDigits(props: { digits: string[]; compact?: boolean }) {
  return (
    <View style={styles.digitalDigitsRow}>
      {props.digits.map((digit, index) => (
        <DigitalDigit
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

function formatCompactCount(count: number) {
  if (count >= 1000) {
    const compactValue =
      count >= 10000 ? (count / 1000).toFixed(0) : (count / 1000).toFixed(1);
    return `${compactValue}K`;
  }

  return count.toLocaleString("en-US");
}

const styles = createCompatStyleSheet({
  root: {
    flex: 1,
    backgroundColor: "#04070C",
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },
  topTongue: {
    alignSelf: "center",
    width: "68%",
    maxWidth: 268,
    backgroundColor: "rgba(8, 12, 20, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.26)",
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  topTongueRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topTongueLead: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexShrink: 1,
  },
  topTongueLabel: {
    color: "#FFDE97",
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 6,
  },
  topTongueRankBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F3C96D",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
    borderWidth: 1,
    borderColor: "rgba(95,55,9,0.18)",
  },
  topTongueRankText: {
    color: "#5F3709",
    fontSize: 10,
    fontWeight: "900",
  },
  topTongueCenter: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 6,
  },
  topTongueSubLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 4,
  },
  topTongueCta: {
    backgroundColor: "#F3C96D",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(95,55,9,0.18)",
  },
  topTongueCtaText: {
    color: "#5F3709",
    fontSize: 10,
    fontWeight: "900",
  },
  cardsColumn: {
    marginTop: 14,
  },
  trendRankingBoard: {
    marginTop: 24,
    paddingHorizontal: 2,
    paddingBottom: 12,
  },
  trendRankingRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  trendRankingAvatarColumn: {
    width: 68,
    alignItems: "center",
  },
  trendRankingAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#646464",
  },
  trendRankingHandle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: MONO_FONT,
    marginTop: 6,
  },
  trendRankingContent: {
    flex: 1,
    paddingTop: 6,
    paddingHorizontal: 10,
  },
  trendRankingTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  trendRankingLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
    flexShrink: 1,
  },
  trendRankingMetric: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    minWidth: 68,
    textAlign: "left",
  },
  trendRankingUnderline: {
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.86)",
    marginTop: 8,
  },
  trendRankingIconWrap: {
    width: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
  },
  panelFrame: {
    borderRadius: 24,
    padding: 1,
    marginBottom: 16,
    shadowColor: "#C88D1C",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },
  panelShell: {
    borderRadius: 23,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "rgba(5,10,18,0.98)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  panelGlow: {
    position: "absolute",
    width: 176,
    height: 176,
    borderRadius: 88,
    top: -54,
    left: -44,
  },
  panelSheen: {
    position: "absolute",
    top: -18,
    right: -22,
    width: 144,
    height: 96,
    transform: [{ rotate: "12deg" }],
  },
  panelHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  panelChipText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    marginRight: 6,
  },
  panelToolsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  panelToolButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    marginLeft: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  panelHeroRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  panelCopyColumn: {
    flex: 1,
    marginLeft: 12,
  },
  panelEyebrow: {
    color: "rgba(255,214,126,0.70)",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "right",
  },
  panelTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 4,
  },
  panelBody: {
    color: "rgba(226,232,240,0.76)",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "right",
    marginTop: 6,
  },
  clubBadgeWrap: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  clubBadgeGlow: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    opacity: 0.26,
  },
  clubBadgeCore: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,15,26,0.92)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  clubBadgeImage: {
    width: 52,
    height: 52,
  },
  clubBadgeFallback: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  metricRibbon: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    marginTop: 14,
  },
  metricPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginLeft: 8,
    marginBottom: 8,
  },
  metricPillValue: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    marginHorizontal: 6,
  },
  metricPillLabel: {
    color: "rgba(226,232,240,0.62)",
    fontSize: 10,
    fontWeight: "800",
  },
  cardFooterRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  cardFooterMonoText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  tagPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tagPillText: {
    color: "#FFDE97",
    fontSize: 10,
    fontWeight: "800",
    marginRight: 6,
  },
  spotlightRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 12,
  },
  spotlightCopyColumn: {
    flex: 1,
    marginLeft: 12,
  },
  spotlightHandle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "800",
    fontFamily: MONO_FONT,
    textAlign: "right",
    marginTop: 4,
  },
  spotlightStatsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 12,
  },
  portraitWrap: {
    width: 90,
    alignItems: "center",
  },
  portraitOuter: {
    width: 76,
    height: 94,
    borderRadius: 24,
    padding: 2,
  },
  portraitInner: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "rgba(255,244,214,0.92)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  portraitGlow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(245,189,88,0.22)",
  },
  portraitCaption: {
    color: "#FFDE97",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 8,
  },
  miniStatCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 8,
    paddingVertical: 9,
    marginLeft: 8,
    alignItems: "center",
  },
  miniStatLabel: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 9,
    fontWeight: "800",
  },
  miniStatValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    marginTop: 4,
  },
  inlineActionButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#F3C96D",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(95,55,9,0.18)",
  },
  inlineActionButtonActive: {
    backgroundColor: "#B7F0A4",
    borderColor: "rgba(183,240,164,0.32)",
  },
  inlineActionButtonText: {
    color: "#5F3709",
    fontSize: 11,
    fontWeight: "900",
    marginRight: 6,
  },
  inlineActionButtonTextActive: {
    color: "#07111D",
  },
  deckTopRow: {
    flexDirection: "row-reverse",
    alignItems: "stretch",
    marginTop: 12,
  },
  deckDigitsPanel: {
    width: 118,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  deckDigitsLabel: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 10,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    marginBottom: 8,
  },
  deckInfoBox: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  deckInfoHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deckInfoTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  deckInfoValue: {
    color: "#FFDE97",
    fontSize: 11,
    fontWeight: "800",
  },
  deckInfoMonoText: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: MONO_FONT,
    marginTop: 7,
    textAlign: "right",
  },
  fullWidthActionButton: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "#5B36D6",
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  fullWidthActionButtonActive: {
    backgroundColor: "#B7F0A4",
    borderColor: "rgba(183,240,164,0.32)",
  },
  fullWidthActionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    marginRight: 8,
  },
  fullWidthActionButtonTextActive: {
    color: "#07111D",
  },
  digitalDigitsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  digitalDigitBox: {
    minWidth: 18,
    height: 24,
    borderRadius: 7,
    marginHorizontal: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#02050B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  digitalDigitBoxCompact: {
    minWidth: 18,
    height: 24,
  },
  digitalDigitText: {
    color: "#FFDE97",
    fontSize: 13,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  digitalDigitTextCompact: {
    fontSize: 13,
  },
});
