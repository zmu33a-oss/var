import { useEffect, useRef, useState } from "react";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  type ImageStyle,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import SealCheckIcon from "../../components/SealCheckIcon";
import { createCompatStyleSheet } from "../../lib/crossPlatformStyles";

const CARD_FONT_FAMILY = "FansCardBold";
const CARD_FONT = require("../../../assets/images/alfont_com_zainpcv2mob600-zainpcv2.ttf");
const NASSR_ICON = require("../../../assets/icons/alnassr.png.png");
const HILAL_ICON = require("../../../assets/icons/alhilal.png.png");
const KSA_ICON = require("../../../assets/icons/ksa.png");

const PAGE_TITLE = "الهاشتاج الاكثر تفاعلا ومشاركه";
const ASSOCIATION_PREFIX = "الرابطة :";
const POSTS_HEADER = "اجمالي المشاركات الهاشتاق";
const POSTS_LABEL = "تغريده";
const TREND_TIME_PREFIX = "وقت دخول الترند";
const TOP_TWEET_TITLE = "التغريده الاكثر مشاركة";
const TWITTER_ICON_BLUE = "#1DA1F2";
const TWEET_ACTION_ICONS = [
  "chatbubble-outline",
  "repeat-outline",
  "heart-outline",
  "share-social-outline",
] as const;

const COLLAPSED_CARD_HEIGHT = 56;
const EXPANDED_BODY_HEIGHT_FALLBACK = 172;
const EXPANDED_SECTION_PADDING_TOP = 8;
const EXPANDED_SECTION_PADDING_BOTTOM = 14;
const EXPANDED_SECTION_VERTICAL_PADDING =
  EXPANDED_SECTION_PADDING_TOP + EXPANDED_SECTION_PADDING_BOTTOM;

type AssociationTopTweet = {
  author: string;
  varId: string;
  time: string;
  label: string;
  content: string;
};

type AssociationEntry = {
  rank: number;
  hashtag: string;
  trendEntryAt: string;
  clubSlug: string;
  clubVarId: string;
  emblem: ImageSourcePropType;
  totalPosts: string;
  collapsedVerifiedLabel: string;
  topTweet: AssociationTopTweet;
};

const ASSOCIATIONS: AssociationEntry[] = [
  {
    rank: 1,
    hashtag: "#النصر",
    trendEntryAt: "14/05/2026 00:34:10",
    clubSlug: "alnaser",
    clubVarId: "var-22000",
    emblem: NASSR_ICON,
    totalPosts: "1650",
    collapsedVerifiedLabel: "الحساب موثق",
    topTweet: {
      author: "Looosh alaa",
      varId: "VAR-88276158",
      time: "قبل 2 ساعة",
      label: "رسالة عامة",
      content: "انا هنا",
    },
  },
  {
    rank: 2,
    hashtag: "#الهلال",
    trendEntryAt: "14/05/2026 01:12:44",
    clubSlug: "alhilal",
    clubVarId: "var-19840",
    emblem: HILAL_ICON,
    totalPosts: "1420",
    collapsedVerifiedLabel: "الحساب موثق",
    topTweet: {
      author: "Salem Khaled",
      varId: "VAR-77124003",
      time: "قبل 4 ساعات",
      label: "رسالة عامة",
      content: "يلعب الهلال بقوة الليلة",
    },
  },
  {
    rank: 3,
    hashtag: "#الاتحاد",
    trendEntryAt: "14/05/2026 02:08:19",
    clubSlug: "ittihad",
    clubVarId: "var-17620",
    emblem: KSA_ICON,
    totalPosts: "1185",
    collapsedVerifiedLabel: "غير موثق",
    topTweet: {
      author: "Fahad Nasser",
      varId: "VAR-66011892",
      time: "قبل 6 ساعات",
      label: "رسالة عامة",
      content: "جمهور الاتحاد حاضر",
    },
  },
];

type FansAssociationCardProps = {
  supporters?: Record<string, number>;
};

function FansAssociationChevron(props: {
  expanded: boolean;
  translateY: Animated.AnimatedInterpolation<string | number>;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={props.onPress} style={styles.chevronButton}>
      <Animated.View
        style={[
          styles.chevronWrap,
          {
            transform: [
              { translateY: props.translateY },
              { rotate: props.expanded ? "180deg" : "0deg" },
            ],
          },
        ]}
      >
        <View style={styles.chevronIcon} />
      </Animated.View>
    </Pressable>
  );
}

function FansTopTweetCard(props: { topTweet: AssociationTopTweet }) {
  const { topTweet } = props;

  return (
    <View style={styles.tweetCard}>
      <View style={styles.tweetCardHead}>
        <Pressable style={styles.tweetMenuButton}>
          <Ionicons
            name="ellipsis-horizontal"
            size={16}
            color="rgba(255,255,255,0.56)"
          />
        </Pressable>

        <View style={styles.tweetHeadCopy}>
          <View style={styles.tweetMetaLine}>
            <Text style={styles.tweetAuthor}>{topTweet.author}</Text>
            <SealCheckIcon size={12} style={styles.tweetVerifiedIcon} />
            <Text style={styles.tweetVarId}>{topTweet.varId}</Text>
            <Text style={styles.tweetTime}>{topTweet.time}</Text>
          </View>
          <Text style={styles.tweetLabel}>{topTweet.label}</Text>
        </View>

        <View style={styles.tweetAvatar}>
          <Ionicons name="person" size={16} color="#5C3D0A" />
        </View>
      </View>

      <Text style={styles.tweetBody}>{topTweet.content}</Text>

      <View style={styles.tweetActionsRow}>
        {TWEET_ACTION_ICONS.map((iconName) => (
          <View key={iconName} style={styles.tweetActionItem}>
            <Ionicons name={iconName} size={14} color={TWITTER_ICON_BLUE} />
            <Text style={styles.tweetActionCount}>0</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FansExpandedBody(props: {
  association: AssociationEntry;
  innerText: (style: object) => object[];
  onLayout?: (height: number) => void;
}) {
  return (
    <View
      style={styles.expandedBody}
      onLayout={
        props.onLayout
          ? (event) => {
              const nextHeight = Math.ceil(event.nativeEvent.layout.height);
              if (nextHeight > 0) {
                props.onLayout?.(nextHeight);
              }
            }
          : undefined
      }
    >
      <View style={styles.expandedSubHeader}>
        <Pressable style={styles.previewChip}>
          <Ionicons name="eye" size={14} color="#FFFFFF" />
        </Pressable>

        <Text style={props.innerText(styles.topTweetTitle)}>
          {TOP_TWEET_TITLE}
        </Text>
      </View>

      <FansTopTweetCard topTweet={props.association.topTweet} />
    </View>
  );
}

function FansAssociationShowcaseCard(props: {
  association: AssociationEntry;
  headerText: (style: object) => object[];
  innerText: (style: object) => object[];
}) {
  const { association } = props;
  const [expanded, setExpanded] = useState(false);
  const [expandedBodyHeight, setExpandedBodyHeight] = useState(
    EXPANDED_BODY_HEIGHT_FALLBACK,
  );
  const expandProgress = useRef(new Animated.Value(0)).current;
  const chevronBob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(expandProgress, {
      toValue: expanded ? 1 : 0,
      duration: expanded ? 300 : 240,
      easing: expanded ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expandProgress, expanded]);

  useEffect(() => {
    if (expanded) {
      chevronBob.setValue(0);
      return;
    }

    const bobAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(chevronBob, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(chevronBob, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );

    bobAnimation.start();
    return () => bobAnimation.stop();
  }, [chevronBob, expanded]);

  const expandedSectionHeight = expandProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, expandedBodyHeight + EXPANDED_SECTION_VERTICAL_PADDING],
  });
  const expandedOpacity = expandProgress.interpolate({
    inputRange: [0, 0.22, 1],
    outputRange: [0, 0.45, 1],
  });
  const chevronTranslateY = chevronBob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  return (
    <View style={styles.cardSection}>
      <View style={styles.rankBadgeCenterWrap}>
        <View style={styles.hashtagRankBadge}>
          <Text style={props.headerText(styles.hashtagRankText)}>
            {association.rank}
          </Text>
        </View>
      </View>

      <View style={styles.pageHeaderRow}>
        <Text style={props.headerText(styles.trendTimeText)}>
          {TREND_TIME_PREFIX} {association.trendEntryAt}
        </Text>

        <Text style={props.headerText(styles.associationHeader)}>
          <Text style={props.headerText(styles.associationOrange)}>
            {ASSOCIATION_PREFIX}
          </Text>
          <Text style={props.headerText(styles.associationWhite)}>
            {" "}
            {association.hashtag}
          </Text>
        </Text>
      </View>

      <View style={styles.showcaseCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryLeft}>
            <FansAssociationChevron
              expanded={expanded}
              translateY={chevronTranslateY}
              onPress={() => setExpanded((current) => !current)}
            />

            {!expanded ? (
              <View style={styles.collapsedVerifiedBlock}>
                <SealCheckIcon size={14} style={styles.collapsedVerifiedSeal} />
                <Text style={props.innerText(styles.collapsedVerifiedLabel)}>
                  {association.collapsedVerifiedLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.summaryMetrics}>
            <Text
              style={props.innerText(styles.summaryTitle)}
              numberOfLines={1}
            >
              {POSTS_HEADER}
            </Text>
            <Text style={props.innerText(styles.summaryCount)}>
              {association.totalPosts}
            </Text>
            <Text style={props.innerText(styles.summaryUnit)}>
              {POSTS_LABEL}
            </Text>
          </View>

          <View style={styles.summaryLogoBlock}>
            <Image
              source={association.emblem}
              resizeMode="contain"
              style={styles.summaryLogo as ImageStyle}
            />
            <Text style={props.innerText(styles.summaryClubSlug)}>
              {association.clubSlug}
            </Text>
            <Text style={props.innerText(styles.summaryClubVarId)}>
              {association.clubVarId}
            </Text>
          </View>
        </View>

        <View pointerEvents="none" style={styles.expandedMeasureHost}>
          <FansExpandedBody
            association={association}
            innerText={props.innerText}
            onLayout={(nextHeight) => {
              if (nextHeight !== expandedBodyHeight) {
                setExpandedBodyHeight(nextHeight);
              }
            }}
          />
        </View>

        <Animated.View
          style={[
            styles.expandedSection,
            {
              maxHeight: expandedSectionHeight,
              opacity: expandedOpacity,
            },
          ]}
          pointerEvents={expanded ? "auto" : "none"}
        >
          <FansExpandedBody
            association={association}
            innerText={props.innerText}
          />
        </Animated.View>
      </View>
    </View>
  );
}

export default function FansAssociationCard(_props: FansAssociationCardProps) {
  const [headerFontsLoaded] = useFonts({
    [CARD_FONT_FAMILY]: CARD_FONT,
  });
  const headerFontFamily = headerFontsLoaded ? CARD_FONT_FAMILY : undefined;

  const headerText = (style: object) => [
    style,
    styles.boldText,
    ...(headerFontFamily ? [{ fontFamily: headerFontFamily }] : []),
  ];

  const innerText = (style: object) => [style, styles.boldText];

  return (
    <View style={styles.root}>
      <Text style={headerText(styles.pageTitle)}>{PAGE_TITLE}</Text>

      {ASSOCIATIONS.map((association) => (
        <FansAssociationShowcaseCard
          key={association.rank}
          association={association}
          headerText={headerText}
          innerText={innerText}
        />
      ))}
    </View>
  );
}

const styles = createCompatStyleSheet({
  root: {
    marginTop: 0,
  },
  boldText: {
    fontWeight: "900",
  },
  pageTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "right",
    marginBottom: 36,
    lineHeight: 22,
  },
  cardSection: {
    marginBottom: 28,
  },
  rankBadgeCenterWrap: {
    alignItems: "center",
    marginBottom: 10,
  },
  hashtagRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  hashtagRankText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 18,
    textAlign: "center",
  },
  pageHeaderRow: {
    flexDirection: "row",
    direction: "ltr",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  trendTimeText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 10,
    textAlign: "left",
    lineHeight: 14,
  },
  associationHeader: {
    textAlign: "right",
    lineHeight: 18,
    flexShrink: 0,
  },
  associationOrange: {
    color: "#FF9800",
    fontSize: 13,
  },
  associationWhite: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  showcaseCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "#000000",
    overflow: "hidden",
    position: "relative",
  },
  summaryRow: {
    minHeight: COLLAPSED_CARD_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    maxWidth: "28%",
  },
  summaryMetrics: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    flexWrap: "nowrap",
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 9,
    lineHeight: 12,
    flexShrink: 1,
  },
  summaryCount: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 16,
  },
  summaryUnit: {
    color: "#FFFFFF",
    fontSize: 9,
    lineHeight: 12,
  },
  summaryLogoBlock: {
    width: 46,
    alignItems: "center",
    flexShrink: 0,
  },
  summaryLogo: {
    width: 28,
    height: 28,
  },
  summaryClubSlug: {
    color: "#FFFFFF",
    fontSize: 7,
    textAlign: "center",
    marginTop: 1,
    lineHeight: 9,
  },
  summaryClubVarId: {
    color: "#FF9800",
    fontSize: 7,
    textAlign: "center",
    lineHeight: 9,
  },
  chevronButton: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronWrap: {
    marginTop: 1,
  },
  chevronIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
  },
  collapsedVerifiedBlock: {
    alignItems: "center",
    gap: 2,
    minWidth: 42,
  },
  collapsedVerifiedSeal: {
    opacity: 1,
  },
  collapsedVerifiedLabel: {
    color: "#F5B942",
    fontSize: 7,
    textAlign: "center",
    lineHeight: 9,
  },
  expandedMeasureHost: {
    position: "absolute",
    left: -9999,
    top: 0,
    width: "100%",
    opacity: 0,
  },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingTop: EXPANDED_SECTION_PADDING_TOP,
    paddingBottom: EXPANDED_SECTION_PADDING_BOTTOM,
  },
  expandedBody: {
    width: "100%",
    alignSelf: "stretch",
  },
  expandedSubHeader: {
    position: "relative",
    minHeight: 28,
    justifyContent: "center",
    marginBottom: 8,
    direction: "ltr",
  },
  previewChip: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 72,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TWITTER_ICON_BLUE,
  },
  topTweetTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    width: "100%",
    paddingHorizontal: 80,
  },
  tweetCard: {
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "#05070D",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    overflow: "visible",
  },
  tweetCardHead: {
    flexDirection: "row",
    direction: "ltr",
    alignItems: "flex-start",
    gap: 8,
  },
  tweetMenuButton: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
    flexShrink: 0,
  },
  tweetHeadCopy: {
    flex: 1,
    minWidth: 0,
  },
  tweetMetaLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  tweetAuthor: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 14,
  },
  tweetVerifiedIcon: {
    opacity: 1,
  },
  tweetVarId: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 9,
    lineHeight: 12,
  },
  tweetTime: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    lineHeight: 12,
  },
  tweetLabel: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    marginTop: 2,
    lineHeight: 12,
  },
  tweetAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF9800",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tweetBody: {
    color: "#FFFFFF",
    fontSize: 13,
    textAlign: "right",
    marginTop: 6,
    lineHeight: 18,
  },
  tweetActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 14,
    marginTop: 8,
  },
  tweetActionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  tweetActionCount: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
});
