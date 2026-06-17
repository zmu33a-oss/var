import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  FollowingProfileCard,
  IconName,
  LockedPredictionSummary,
  Post,
  PostReply,
  ProfileData,
  SocialInteractionRecord,
} from "../../../app.types";
import { FAN_CLUBS, LEAGUES } from "../../../app.data";
import { listFansPostsByVarId } from "../../../lib/appwrite";
import {
  buildComposerDisplayVarId,
  normalizeAuthorId,
} from "../../../appshell/appshell.helpers";
import { MilestoneProgressBar } from "../../../components/MilestoneProgressBar";
import {
  getArabicFontStyle,
  resolveProfileAvatarUri,
} from "../profile.helpers";
import {
  resolvePredictionHeadline,
  resolvePredictionPointsLabel,
  resolvePredictionStatusLabel,
  resolvePredictionTone,
  type PredictionVisualTone,
} from "../profileUserPreview.helpers";
import { styles } from "../profileUserPreview.styles";
import {
  ProfileXFanCommentFeed,
  ProfileXLikedPostFeed,
  ProfileXPostFeed,
  ProfileXReplyFeed,
} from "./ProfileActivityXFeed";
import {
  filterInteractionPosts,
  filterProfileAuthoredPosts,
  mergeProfileReplies,
  mergeProfileRepostPosts,
} from "../profileActivityPosts";

const TONE_GRADIENTS: Record<
  PredictionVisualTone,
  readonly [string, string, string]
> = {
  won: [
    "rgba(65,241,123,0.55)",
    "rgba(29,161,242,0.28)",
    "rgba(65,241,123,0.18)",
  ],
  pending: [
    "rgba(244,197,101,0.55)",
    "rgba(255,152,0,0.24)",
    "rgba(244,197,101,0.16)",
  ],
  neutral: [
    "rgba(29,161,242,0.42)",
    "rgba(125,208,255,0.18)",
    "rgba(29,161,242,0.12)",
  ],
};

const TONE_STATUS_COLORS: Record<
  PredictionVisualTone,
  { backgroundColor: string; borderColor: string; color: string }
> = {
  won: {
    backgroundColor: "rgba(65,241,123,0.14)",
    borderColor: "rgba(65,241,123,0.34)",
    color: "#9DFFC0",
  },
  pending: {
    backgroundColor: "rgba(244,197,101,0.14)",
    borderColor: "rgba(244,197,101,0.34)",
    color: "#F4C565",
  },
  neutral: {
    backgroundColor: "rgba(29,161,242,0.14)",
    borderColor: "rgba(29,161,242,0.34)",
    color: "#8BD6FF",
  },
};

const TONE_POINTS_COLORS: Record<PredictionVisualTone, string> = {
  won: "#9DFFC0",
  pending: "#F4C565",
  neutral: "#8BD6FF",
};

const PROFILE_SUB_SECTION_MAX_HEIGHT = 2400;

function PredictionShowcaseCard(props: {
  arabicFontFamily?: string;
  prediction: LockedPredictionSummary;
}) {
  const tone = resolvePredictionTone(props.prediction);
  const statusColors = TONE_STATUS_COLORS[tone];
  const headline = resolvePredictionHeadline(props.prediction);
  const pointsLabel = resolvePredictionPointsLabel(props.prediction);
  const statusLabel = resolvePredictionStatusLabel(props.prediction);
  const competitionLabel =
    props.prediction.competition.trim() || "دوري روشن السعودي";
  const title =
    props.prediction.title.trim() || "مواجهة محفوظة في سجل التوقعات";

  return (
    <LinearGradient
      colors={[...TONE_GRADIENTS[tone]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.predictionCardOuter}
    >
      <View style={styles.predictionCardInner}>
        <View style={styles.predictionTopRow}>
          <View style={styles.competitionChip}>
            <Text style={styles.competitionChipText}>{competitionLabel}</Text>
          </View>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: statusColors.backgroundColor,
                borderColor: statusColors.borderColor,
              },
            ]}
          >
            <Text
              style={[styles.statusPillText, { color: statusColors.color }]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.predictionHeroBlock}>
          <Text style={styles.predictionHeroLabel}>توقعك</Text>
          <Text
            style={[
              styles.predictionHeroValue,
              getArabicFontStyle(props.arabicFontFamily, headline),
            ]}
          >
            {headline}
          </Text>
        </View>

        <Text
          style={[
            styles.predictionTitle,
            getArabicFontStyle(props.arabicFontFamily, title),
          ]}
        >
          {title}
        </Text>

        <View style={styles.predictionFooter}>
          <View style={styles.predictionFooterItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color="rgba(255,255,255,0.56)"
            />
            <Text style={styles.predictionFooterText}>
              {props.prediction.lockedAt}
            </Text>
          </View>

          <View
            style={[
              styles.predictionPointsBadge,
              tone === "pending" ? styles.predictionPointsBadgePending : null,
              tone === "neutral" ? styles.predictionPointsBadgeNeutral : null,
            ]}
          >
            <Text
              style={[
                styles.predictionPointsText,
                { color: TONE_POINTS_COLORS[tone] },
              ]}
            >
              {pointsLabel === "—" ? "بانتظار النتيجة" : `${pointsLabel} نقطة`}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

function PredictionsBar(props: {
  earnedPoints: number;
  predictionsCount: number;
  wonPredictions: number;
  predictions: LockedPredictionSummary[];
  arabicFontFamily?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandAnim] = useState(() => new Animated.Value(0));
  const titleStyle = getArabicFontStyle(props.arabicFontFamily, "التوقعات");

  const toggleExpand = () => {
    if (isExpanded) {
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(() => setIsExpanded(false));
    } else {
      setIsExpanded(true);
      Animated.spring(expandAnim, {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  return (
    <View style={localStyles.predictionsWrapper}>
      <Text style={[localStyles.predictionsTitle, titleStyle]}>التوقعات</Text>
      <Pressable style={localStyles.predictionsBar} onPress={toggleExpand}>
        <View style={localStyles.predictionsBarRow}>
          <View style={localStyles.predictionsBarItem}>
            <Text style={localStyles.predictionsBarLabel}>نقاط فار</Text>
            <Text style={localStyles.predictionsBarValue}>{props.earnedPoints}</Text>
          </View>
          <View style={localStyles.predictionsBarDivider} />
          <View style={localStyles.predictionsBarItem}>
            <Text style={localStyles.predictionsBarLabel}>توقعات</Text>
            <Text style={localStyles.predictionsBarValue}>{props.predictionsCount}</Text>
          </View>
          <View style={localStyles.predictionsBarDivider} />
          <View style={localStyles.predictionsBarItem}>
            <Text style={localStyles.predictionsBarLabel}>فوز</Text>
            <Text style={localStyles.predictionsBarValue}>{props.wonPredictions}</Text>
          </View>
        </View>

        {isExpanded && (
          <Animated.View
            style={[
              localStyles.expandedContent,
              {
                opacity: expandAnim,
                maxHeight: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 500],
                }),
              },
            ]}
          >
            <View style={localStyles.expandedDivider} />
            <Text style={localStyles.expandedTitle}>سجل التوقعات</Text>
            {props.predictions.length === 0 ? (
              <Text style={localStyles.expandedEmpty}>لا توجد توقعات مقفلة بعد</Text>
            ) : (
              props.predictions.map((pred) => (
                <View key={pred.id} style={localStyles.expandedItem}>
                  <Text style={localStyles.expandedItemTitle}>{pred.title}</Text>
                  <Text style={localStyles.expandedItemMeta}>
                    {pred.lockedAt} · {pred.pointsAwarded > 0 ? `+${pred.pointsAwarded} نقطة` : "بانتظار النتيجة"}
                  </Text>
                </View>
              ))
            )}
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

function ProfileMetricGroupCard(props: {
  accentColor: string;
  arabicFontFamily?: string;
  iconName: IconName;
  items: { id: string; label: string; value: string }[];
  title: string;
  onPress?: () => void;
  isWide?: boolean;
}) {
  const titleTextStyle = getArabicFontStyle(props.arabicFontFamily, props.title);

  const CardContent = () => (
    <>
      <View style={styles.profileMetricGroupHeader}>
        <View style={[styles.profileMetricGroupIcon, { backgroundColor: `${props.accentColor}24` }]}>
          <Ionicons name={props.iconName} size={18} color={props.accentColor} />
        </View>
        <Text style={[styles.profileMetricGroupTitle, titleTextStyle]}>{props.title}</Text>
      </View>
      <View style={styles.profileMetricGroupBody}>
        {props.items.map((item) => (
          <View key={item.id} style={styles.profileMetricCell}>
            <Text numberOfLines={1} style={styles.profileMetricCellValue}>{item.value}</Text>
            <Text numberOfLines={1} style={styles.profileMetricCellLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const cardStyle = props.isWide ? localStyles.profileMetricGroupCardWide : styles.profileMetricGroupCard;

  if (props.onPress) {
    return (
      <Pressable style={cardStyle} onPress={props.onPress}>
        <CardContent />
      </Pressable>
    );
  }
  return (
    <View style={cardStyle}>
      <CardContent />
    </View>
  );
}

type ProfileActivityEntry = {
  id: string;
  typeLabel: string;
  title: string;
  subtitle: string;
  content: string;
  iconName: IconName;
  accentColor: string;
};

function normalizeProfileActivityToken(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

function truncateActivityContent(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length <= 110) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, 107)}...`;
}

function buildProfileHandleCandidates(profile: ProfileData) {
  return new Set(
    [
      profile.varId,
      profile.displayVarId,
      profile.username,
      buildComposerDisplayVarId(profile.displayVarId, profile.varId),
    ]
      .map(normalizeProfileActivityToken)
      .filter(Boolean),
  );
}

function isProfilePostAuthor(
  post: Post,
  profile: ProfileData,
  handleCandidates: Set<string>,
) {
  const normalizedProfileVarId = normalizeAuthorId(profile.varId);
  const normalizedPostAuthorId = normalizeAuthorId(post.authorId || "");

  if (
    normalizedProfileVarId !== "local-user" &&
    normalizedPostAuthorId === normalizedProfileVarId
  ) {
    return true;
  }

  const normalizedPostHandle = normalizeProfileActivityToken(post.handle);
  const normalizedPostAuthor = normalizeProfileActivityToken(post.author);
  const normalizedDisplayName = normalizeProfileActivityToken(
    profile.displayName,
  );

  return (
    handleCandidates.has(normalizedPostHandle) ||
    Boolean(normalizedDisplayName && normalizedPostAuthor === normalizedDisplayName)
  );
}

function isProfileReplyAuthor(
  reply: PostReply,
  profile: ProfileData,
  handleCandidates: Set<string>,
) {
  const normalizedReplyHandle = normalizeProfileActivityToken(reply.handle);
  const normalizedReplyAuthor = normalizeProfileActivityToken(reply.author);
  const normalizedDisplayName = normalizeProfileActivityToken(
    profile.displayName,
  );

  return (
    handleCandidates.has(normalizedReplyHandle) ||
    Boolean(normalizedDisplayName && normalizedReplyAuthor === normalizedDisplayName)
  );
}

function buildProfileActivityEntries(
  posts: Post[],
  profile: ProfileData,
  socialInteractions?: SocialInteractionRecord[],
) {
  const handleCandidates = buildProfileHandleCandidates(profile);
  const normalizedProfileVarId = normalizeAuthorId(profile.varId);
  const entries: ProfileActivityEntry[] = [];
  const seenEntryIds = new Set<string>();

  const pushEntry = (entry: ProfileActivityEntry) => {
    if (seenEntryIds.has(entry.id)) {
      return;
    }

    seenEntryIds.add(entry.id);
    entries.push(entry);
  };

  // بناء Map للمنشورات للبحث السريع
  const postsById = new Map<string, Post>();
  posts.forEach((post) => {
    postsById.set(String(post.id), post);
    if (post.sourceId) {
      postsById.set(post.sourceId, post);
    }
  });

  // معالجة تفاعلات المستخدم من Appwrite
  if (socialInteractions && socialInteractions.length > 0) {
    socialInteractions.forEach((interaction) => {
      if (!interaction.active) return;

      const post = postsById.get(interaction.targetId);
      const postContent = post
        ? truncateActivityContent(post.content)
        : "محتوى غير متوفر";
      const postAuthor = post ? post.author : "مستخدم";
      const postTime = post
        ? post.time
        : new Date(interaction.createdAt).toLocaleDateString("ar-SA");

      switch (interaction.action) {
        case "like":
          pushEntry({
            id: `like-${interaction.targetId}-${interaction.id}`,
            typeLabel: "إعجاب",
            title: `أعجبت بمنشور ${postAuthor}`,
            subtitle: postTime,
            content: postContent,
            iconName: "heart-outline",
            accentColor: "#FB7185",
          });
          break;
        case "repost":
          pushEntry({
            id: `repost-${interaction.targetId}-${interaction.id}`,
            typeLabel: "إعادة تغريد",
            title: `أعدت تغريد ${postAuthor}`,
            subtitle: postTime,
            content: postContent,
            iconName: "repeat-outline",
            accentColor: "#8BD6FF",
          });
          break;
        case "share":
          pushEntry({
            id: `share-${interaction.targetId}-${interaction.id}`,
            typeLabel: "مشاركة",
            title: `شاركت منشور ${postAuthor}`,
            subtitle: postTime,
            content: postContent,
            iconName: "share-social-outline",
            accentColor: "#8BD6FF",
          });
          break;
        case "reply":
          pushEntry({
            id: `reply-${interaction.targetId}-${interaction.id}`,
            typeLabel: "رد",
            title: `رد على ${postAuthor}`,
            subtitle: postTime,
            content: interaction.value
              ? truncateActivityContent(interaction.value)
              : postContent,
            iconName: "return-down-back-outline",
            accentColor: "#8BD6FF",
          });
          break;
      }
    });
  }

  // معالجة المنشورات المحلية (كاحتياطي)
  posts.forEach((post) => {
    const postContent = truncateActivityContent(post.content);

    if (!post.repostMeta && isProfilePostAuthor(post, profile, handleCandidates)) {
      const entryId = `post-${post.id}`;
      if (!seenEntryIds.has(entryId)) {
        pushEntry({
          id: entryId,
          typeLabel: "تغريدة",
          title: post.title?.trim() || "تغريدة منشورة",
          subtitle: post.time,
          content: postContent,
          iconName: "chatbubble-ellipses-outline",
          accentColor: "#8BD6FF",
        });
      }
    }

    if (
      post.repostMeta &&
      normalizedProfileVarId !== "local-user" &&
      normalizeAuthorId(post.repostMeta.varId) === normalizedProfileVarId
    ) {
      const entryId = `repost-meta-${post.id}`;
      if (!seenEntryIds.has(entryId)) {
        pushEntry({
          id: entryId,
          typeLabel: "إعادة تغريد",
          title: `أعدت تغريد ${post.author}`,
          subtitle: post.repostMeta.time,
          content: postContent,
          iconName: "repeat-outline",
          accentColor: "#8BD6FF",
        });
      }
    }

    (post.replyItems ?? []).forEach((reply) => {
      if (!isProfileReplyAuthor(reply, profile, handleCandidates)) {
        return;
      }

      const entryId = `reply-${post.id}-${reply.id}`;
      if (!seenEntryIds.has(entryId)) {
        pushEntry({
          id: entryId,
          typeLabel: "رد",
          title: `رد على ${post.author}`,
          subtitle: reply.time,
          content: truncateActivityContent(reply.content),
          iconName: "return-down-back-outline",
          accentColor: "#8BD6FF",
        });
      }
    });
  });

  return entries;
}

export type FansProfileSheetTab = "posts" | "comments" | "likes" | "reposts";

function filterFansSocialInteractions(
  fansPosts: Post[],
  socialInteractions?: SocialInteractionRecord[],
) {
  if (!socialInteractions?.length || fansPosts.length === 0) {
    return [];
  }

  const fansTargetIds = new Set<string>();
  fansPosts.forEach((post) => {
    fansTargetIds.add(String(post.id));
    if (post.sourceId?.trim()) {
      fansTargetIds.add(post.sourceId.trim());
    }
  });

  return socialInteractions.filter((interaction) =>
    fansTargetIds.has(interaction.targetId),
  );
}

function formatFanCommentTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `قبل ${mins} دقيقة`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `قبل ${hrs} ساعة`;
    return `قبل ${Math.floor(hrs / 24)} يوم`;
  } catch {
    return "";
  }
}

function resolveFanClubLabel(clubId: string) {
  const normalizedClubId = clubId.trim();
  if (!normalizedClubId) return "رابطة غير معروفة";

  const club = FAN_CLUBS.find(
    (candidate) =>
      candidate.id === normalizedClubId ||
      candidate.title.trim() === normalizedClubId,
  );

  return club ? `رابطة ${club.title}` : `رابطة ${normalizedClubId}`;
}

function buildFanCommentEntries(
  comments: { id: string; content: string; createdAt: string; clubId: string }[],
): ProfileActivityEntry[] {
  return comments.map((comment) => ({
    id: `fan-comment-${comment.id}`,
    typeLabel: "تعليق",
    title: resolveFanClubLabel(comment.clubId),
    subtitle: formatFanCommentTime(comment.createdAt),
    content: truncateActivityContent(comment.content),
    iconName: "chatbubble-outline",
    accentColor: "#F4C565",
  }));
}

export function ProfileUserPreviewScreen(props: {
  arabicFontFamily?: string;
  clubName: string;
  followedProfiles: FollowingProfileCard[];
  posts: Post[];
  fansPosts?: Post[];
  profile: ProfileData;
  socialInteractions?: SocialInteractionRecord[];
  onClose: () => void;
  onOpenFansAssociation?: (options?: { sheetTab?: FansProfileSheetTab }) => void;
}) {
  const titleArabicTextStyle = getArabicFontStyle(props.arabicFontFamily);
  const sportsCardNumber = buildComposerDisplayVarId(
    props.profile.displayVarId,
    props.profile.varId,
  );
  const predictions = props.profile.lockedPredictions;
  const earnedPoints = Math.max(0, props.profile.earnedPoints);
  const associationLabel =
    props.profile.association?.trim() || props.clubName || "بدون رابطة";
  const leagueNameMap = Object.fromEntries(LEAGUES.map((l) => [l.id, l.name]));
  const leagueClubEntries: { leagueId: string; leagueName: string; club: string }[] = (() => {
    const raw = props.profile.leagueClub?.trim() || "";
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      return Object.entries(parsed)
        .filter(([, club]) => club)
        .map(([leagueId, club]) => ({
          leagueId,
          leagueName: leagueNameMap[leagueId] || leagueId,
          club,
        }));
    } catch {
      return raw ? [{ leagueId: "other", leagueName: "الرابطة", club: raw }] : [];
    }
  })();
  const previewVarIdLabel = sportsCardNumber.replace(/^VAR-/i, "VAR ");
  const wonPredictions = predictions.filter(
    (prediction) => prediction.pointsAwarded > 0,
  ).length;

  // Animation for main VAR X section
  const [isVarSectionExpanded, setIsVarSectionExpanded] = useState(false);
  const [varSectionAnim] = useState(() => new Animated.Value(0));

  // Animation for sub-sections inside VAR X
  const [expandedSubSection, setExpandedSubSection] = useState<string | null>(null);
  const [subSectionAnims] = useState<Record<string, Animated.Value>>({
    posts: new Animated.Value(0),
    replies: new Animated.Value(0),
    reposts: new Animated.Value(0),
    shares: new Animated.Value(0),
    likes: new Animated.Value(0),
  });

  // Animation for main Fan Club section
  const [isFanClubSectionExpanded, setIsFanClubSectionExpanded] = useState(false);
  const [fanClubSectionAnim] = useState(() => new Animated.Value(0));

  // Animation for sub-sections inside Fan Club
  const [expandedFanClubSubSection, setExpandedFanClubSubSection] = useState<string | null>(null);
  const [fanClubSubSectionAnims] = useState<Record<string, Animated.Value>>({
    posts: new Animated.Value(0),
    comments: new Animated.Value(0),
    reposts: new Animated.Value(0),
    shares: new Animated.Value(0),
    likes: new Animated.Value(0),
  });
  const [fanCommentRecords, setFanCommentRecords] = useState<
    { id: string; content: string; createdAt: string; clubId: string }[]
  >([]);

  const toggleVarSection = () => {
    const isExpanding = !isVarSectionExpanded;
    setIsVarSectionExpanded(isExpanding);

    if (isExpanding) {
      Animated.spring(varSectionAnim, {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Close all subsections when closing main section
      Animated.timing(varSectionAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        setExpandedSubSection(null);
        // Reset all subsections
        Object.values(subSectionAnims).forEach((anim) => anim.setValue(0));
      });
    }
  };

  const toggleSubSection = (sectionId: string) => {
    const isExpanding = expandedSubSection !== sectionId;

    // Close current expanded subsection if any
    if (expandedSubSection && expandedSubSection !== sectionId) {
      Animated.timing(subSectionAnims[expandedSubSection], {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }

    if (isExpanding) {
      setExpandedSubSection(sectionId);
      Animated.spring(subSectionAnims[sectionId], {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(subSectionAnims[sectionId], {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(() => setExpandedSubSection(null));
    }
  };

  const toggleFanClubSection = () => {
    const isExpanding = !isFanClubSectionExpanded;
    setIsFanClubSectionExpanded(isExpanding);

    if (isExpanding) {
      Animated.spring(fanClubSectionAnim, {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(fanClubSectionAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        setExpandedFanClubSubSection(null);
        Object.values(fanClubSubSectionAnims).forEach((anim) => anim.setValue(0));
      });
    }
  };

  const toggleFanClubSubSection = (sectionId: string) => {
    const isExpanding = expandedFanClubSubSection !== sectionId;

    if (expandedFanClubSubSection && expandedFanClubSubSection !== sectionId) {
      Animated.timing(fanClubSubSectionAnims[expandedFanClubSubSection], {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }

    if (isExpanding) {
      setExpandedFanClubSubSection(sectionId);
      Animated.spring(fanClubSubSectionAnims[sectionId], {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(fanClubSubSectionAnims[sectionId], {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(() => setExpandedFanClubSubSection(null));
    }
  };

  const profileMetricGroups = [
    {
      id: "predictions",
      title: "التوقعات",
      iconName: "trophy-outline" as const,
      accentColor: "#F4C565",
      items: [
        {
          id: "var-points",
          label: "نقاط VAR",
          value: String(earnedPoints),
        },
        { id: "locked", label: "توقعات", value: String(predictions.length) },
        { id: "wins", label: "فوز", value: String(wonPredictions) },
      ],
    },
    {
      id: "x-activity",
      title: "التغريدات والردود والمشاركات",
      iconName: "chatbubbles-outline" as const,
      accentColor: "#8BD6FF",
      items: [
        {
          id: "posts",
          label: "تغريدات",
          value: String(props.profile.socialMetrics.xPosts),
        },
        {
          id: "reposts",
          label: "إعادة تغريد",
          value: String(props.profile.socialMetrics.xReposts),
        },
        {
          id: "replies",
          label: "ردود",
          value: String(props.profile.socialMetrics.xReplies),
        },
        {
          id: "shares",
          label: "مشاركات",
          value: String(props.profile.socialMetrics.xShares),
        },
      ],
    },
    {
      id: "engagement",
      title: "الإعجابات",
      iconName: "heart-outline" as const,
      accentColor: "#FB7185",
      items: [
        {
          id: "likes",
          label: "إعجابات",
          value: String(props.profile.socialMetrics.xLikes),
        },
        {
          id: "total",
          label: "إجمالي",
          value: String(props.profile.socialMetrics.totalInteractions),
        },
      ],
    },
    {
      id: "network",
      title: "المضافون عبر VAR",
      iconName: "people-outline" as const,
      accentColor: "#34D399",
      items: [
        {
          id: "added",
          label: "المضافون",
          value: String(props.followedProfiles.length),
        },
      ],
    },
  ];

  const fansPosts = props.fansPosts ?? [];
  const fansSocialInteractions = filterFansSocialInteractions(
    fansPosts,
    props.socialInteractions,
  );

  const authoredPosts = useMemo(
    () => filterProfileAuthoredPosts(props.posts, props.profile),
    [props.posts, props.profile],
  );
  const profileReplies = useMemo(
    () =>
      mergeProfileReplies(
        props.posts,
        props.profile,
        props.socialInteractions,
      ),
    [props.posts, props.profile, props.socialInteractions],
  );
  const repostPosts = useMemo(
    () =>
      mergeProfileRepostPosts(
        props.posts,
        props.profile,
        props.socialInteractions,
      ),
    [props.posts, props.profile, props.socialInteractions],
  );
  const sharedPosts = useMemo(
    () =>
      filterInteractionPosts(props.posts, props.socialInteractions, "share"),
    [props.posts, props.socialInteractions],
  );
  const likedPosts = useMemo(
    () =>
      filterInteractionPosts(props.posts, props.socialInteractions, "like"),
    [props.posts, props.socialInteractions],
  );

  const fanAuthoredPosts = useMemo(
    () => filterProfileAuthoredPosts(fansPosts, props.profile),
    [fansPosts, props.profile],
  );
  const fanRepostPosts = useMemo(
    () =>
      mergeProfileRepostPosts(
        fansPosts,
        props.profile,
        fansSocialInteractions,
      ),
    [fansPosts, props.profile, fansSocialInteractions],
  );
  const fanSharedPosts = useMemo(
    () =>
      filterInteractionPosts(fansPosts, fansSocialInteractions, "share"),
    [fansPosts, fansSocialInteractions],
  );
  const fanLikedPosts = useMemo(
    () => filterInteractionPosts(fansPosts, fansSocialInteractions, "like"),
    [fansPosts, fansSocialInteractions],
  );
  const fanCommentFeedItems = useMemo(
    () =>
      fanCommentRecords.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        clubId: comment.clubId,
        clubLabel: resolveFanClubLabel(comment.clubId),
        timeLabel: formatFanCommentTime(comment.createdAt),
      })),
    [fanCommentRecords],
  );

  useEffect(() => {
    const varIds = [props.profile.varId, props.profile.displayVarId].filter(Boolean);
    if (varIds.length === 0) {
      setFanCommentRecords([]);
      return;
    }

    let cancelled = false;
    void listFansPostsByVarId(varIds, 100).then((records) => {
      if (cancelled) return;
      setFanCommentRecords(
        records.map((record) => ({
          id: record.id,
          content: record.content,
          createdAt: record.createdAt,
          clubId: record.clubId,
        })),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [props.profile.displayVarId, props.profile.varId]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#000000", "#000000", "#000000"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={props.onClose}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>USER PROFILE</Text>
            <Text style={[styles.headerTitle, titleArabicTextStyle]}>
              بروفايل المستخدم
            </Text>
            <Text style={styles.headerSubtitle}>
              نظرة واضحة على الهوية وسجل التوقعات
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <LinearGradient
          colors={["#000000", "#000000", "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.identityBanner}
        >
          <View style={styles.identityAccentGlow} />

          <View style={styles.identityHeaderLine}>
            <View style={styles.avatarRing}>
              <Image
                source={{
                  uri: resolveProfileAvatarUri(props.profile.avatarUri),
                }}
                style={styles.avatarImage}
              />
            </View>

            <View style={styles.identityCopy}>
              <View style={styles.identityNameRow}>
                <Ionicons name="checkmark-circle" size={18} color="#5DB9FF" />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.identityName,
                    getArabicFontStyle(
                      props.arabicFontFamily,
                      props.profile.displayName,
                    ),
                  ]}
                >
                  {props.profile.displayName}
                </Text>
              </View>

              <View style={styles.identityInfoRow}>
                <Text numberOfLines={1} style={styles.identityAssociation}>
                  الرابطة : {associationLabel}
                </Text>
                <Text numberOfLines={1} style={styles.identityVarIdText}>
                  {previewVarIdLabel}
                </Text>
              </View>
              {leagueClubEntries.length > 0 ? (
                <View style={styles.identityInfoRow}>
                  <Ionicons name="football-outline" size={13} color="#F4C565" />
                  <Text numberOfLines={2} style={styles.identityAssociation}>
                    {leagueClubEntries.map((e) => e.club).join(" · ")}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <MilestoneProgressBar
            compactProfile
            embedded
            points={earnedPoints}
            showControls={false}
            style={styles.identityRewardsTracker}
            titleTextStyle={titleArabicTextStyle}
          />
        </LinearGradient>

        <View style={localStyles.sectionWrapper}>
          <View style={localStyles.varXContainer}>
            <View style={localStyles.profileSectionsNav}>
              <Pressable
                style={localStyles.profileNavItem}
                onPress={toggleVarSection}
              >
                <Text style={localStyles.varXTitle}>بروفايل VAR X</Text>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: varSectionAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "180deg"],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                </Animated.View>
              </Pressable>

              <View style={localStyles.profileNavDivider} />

              <Pressable
                style={localStyles.profileNavItem}
                onPress={toggleFanClubSection}
              >
                <Text style={localStyles.varXTitle}>بروفايل الرابطة</Text>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: fanClubSectionAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "180deg"],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                </Animated.View>
              </Pressable>
            </View>

          {/* محتوى VAR X */}
          <Animated.View
            style={[
              localStyles.varXContent,
              {
                maxHeight: varSectionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1200],
                }),
                opacity: varSectionAnim,
              },
            ]}
          >
            {/* قسم التغريدات */}
            <View style={localStyles.subSection}>
              <Pressable
                style={localStyles.subSectionHeader}
                onPress={() => toggleSubSection("posts")}
              >
                <View style={localStyles.subSectionHeaderLeft}>
                  <Text style={localStyles.subSectionTitle}>التغريدات</Text>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#8BD6FF" />
                </View>
                <View style={localStyles.subSectionHeaderRight}>
                  <Text style={localStyles.subSectionCount}>{authoredPosts.length}</Text>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: subSectionAnims.posts.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                  </Animated.View>
                </View>
              </Pressable>
              <Animated.View
                style={[
                  localStyles.subSectionContent,
                  {
                    maxHeight: subSectionAnims.posts.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, PROFILE_SUB_SECTION_MAX_HEIGHT],
                    }),
                    opacity: subSectionAnims.posts,
                  },
                ]}
              >
                <ProfileXPostFeed
                  posts={authoredPosts}
                  profile={props.profile}
                  emptyText="لا توجد تغريدات"
                />
              </Animated.View>
            </View>

            {/* قسم الردود */}
            <View style={localStyles.subSection}>
              <Pressable
                style={localStyles.subSectionHeader}
                onPress={() => toggleSubSection("replies")}
              >
                <View style={localStyles.subSectionHeaderLeft}>
                  <Text style={localStyles.subSectionTitle}>الردود</Text>
                  <Ionicons name="return-down-back-outline" size={16} color="#8BD6FF" />
                </View>
                <View style={localStyles.subSectionHeaderRight}>
                  <Text style={localStyles.subSectionCount}>{profileReplies.length}</Text>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: subSectionAnims.replies.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                  </Animated.View>
                </View>
              </Pressable>
              <Animated.View
                style={[
                  localStyles.subSectionContent,
                  {
                    maxHeight: subSectionAnims.replies.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, PROFILE_SUB_SECTION_MAX_HEIGHT],
                    }),
                    opacity: subSectionAnims.replies,
                  },
                ]}
              >
                <ProfileXReplyFeed
                  replies={profileReplies}
                  profile={props.profile}
                  emptyText="لا توجد ردود"
                />
              </Animated.View>
            </View>

            {/* قسم إعادة التغريد */}
            <View style={localStyles.subSection}>
              <Pressable
                style={localStyles.subSectionHeader}
                onPress={() => toggleSubSection("reposts")}
              >
                <View style={localStyles.subSectionHeaderLeft}>
                  <Text style={localStyles.subSectionTitle}>إعادة التغريد</Text>
                  <Ionicons name="repeat-outline" size={16} color="#8BD6FF" />
                </View>
                <View style={localStyles.subSectionHeaderRight}>
                  <Text style={localStyles.subSectionCount}>{repostPosts.length}</Text>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: subSectionAnims.reposts.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                  </Animated.View>
                </View>
              </Pressable>
              <Animated.View
                style={[
                  localStyles.subSectionContent,
                  {
                    maxHeight: subSectionAnims.reposts.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, PROFILE_SUB_SECTION_MAX_HEIGHT],
                    }),
                    opacity: subSectionAnims.reposts,
                  },
                ]}
              >
                <ProfileXPostFeed
                  posts={repostPosts}
                  profile={props.profile}
                  emptyText="لا توجد إعادات تغريد"
                />
              </Animated.View>
            </View>

            {/* قسم المشاركات */}
            <View style={localStyles.subSection}>
              <Pressable
                style={localStyles.subSectionHeader}
                onPress={() => toggleSubSection("shares")}
              >
                <View style={localStyles.subSectionHeaderLeft}>
                  <Text style={localStyles.subSectionTitle}>المشاركات</Text>
                  <Ionicons name="share-social-outline" size={16} color="#8BD6FF" />
                </View>
                <View style={localStyles.subSectionHeaderRight}>
                  <Text style={localStyles.subSectionCount}>{sharedPosts.length}</Text>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: subSectionAnims.shares.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                  </Animated.View>
                </View>
              </Pressable>
              <Animated.View
                style={[
                  localStyles.subSectionContent,
                  {
                    maxHeight: subSectionAnims.shares.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, PROFILE_SUB_SECTION_MAX_HEIGHT],
                    }),
                    opacity: subSectionAnims.shares,
                  },
                ]}
              >
                <ProfileXPostFeed
                  posts={sharedPosts}
                  profile={props.profile}
                  useProfileAuthor={false}
                  emptyText="لا توجد مشاركات"
                />
              </Animated.View>
            </View>

            {/* قسم الإعجابات */}
            <View style={localStyles.subSection}>
              <Pressable
                style={localStyles.subSectionHeader}
                onPress={() => toggleSubSection("likes")}
              >
                <View style={localStyles.subSectionHeaderLeft}>
                  <Text style={localStyles.subSectionTitle}>الإعجابات</Text>
                  <Ionicons name="heart-outline" size={16} color="#FB7185" />
                </View>
                <View style={localStyles.subSectionHeaderRight}>
                  <Text style={[localStyles.subSectionCount, { color: "#FB7185" }]}>
                    {likedPosts.length}
                  </Text>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: subSectionAnims.likes.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                  </Animated.View>
                </View>
              </Pressable>
              <Animated.View
                style={[
                  localStyles.subSectionContent,
                  {
                    maxHeight: subSectionAnims.likes.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, PROFILE_SUB_SECTION_MAX_HEIGHT],
                    }),
                    opacity: subSectionAnims.likes,
                  },
                ]}
              >
                <ProfileXLikedPostFeed
                  posts={likedPosts}
                  followedProfiles={props.followedProfiles}
                  emptyText="لا توجد إعجابات"
                />
              </Animated.View>
            </View>
          </Animated.View>

          {/* محتوى بروفايل الرابطة */}
          <Animated.View
            style={[
              localStyles.varXContent,
              {
                maxHeight: fanClubSectionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1200],
                }),
                opacity: fanClubSectionAnim,
              },
            ]}
          >
            {/* قسم التغريدات */}
            <View style={localStyles.subSection}>
              <Pressable
                style={localStyles.subSectionHeader}
                onPress={() => toggleFanClubSubSection("posts")}
              >
                <View style={localStyles.subSectionHeaderLeft}>
                  <Text style={localStyles.subSectionTitle}>التغريدات</Text>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#F4C565" />
                </View>
                <View style={localStyles.subSectionHeaderRight}>
                  <Text style={localStyles.subSectionCount}>{fanAuthoredPosts.length}</Text>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: fanClubSubSectionAnims.posts.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                  </Animated.View>
                </View>
              </Pressable>
              <Animated.View
                style={[
                  localStyles.subSectionContent,
                  {
                    maxHeight: fanClubSubSectionAnims.posts.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, PROFILE_SUB_SECTION_MAX_HEIGHT],
                    }),
                    opacity: fanClubSubSectionAnims.posts,
                  },
                ]}
              >
                <ProfileXPostFeed
                  posts={fanAuthoredPosts}
                  profile={props.profile}
                  emptyText="لا توجد تغريدات في الرابطة"
                />
              </Animated.View>
            </View>

            {/* قسم التعليقات */}
            <View style={localStyles.subSection}>
              <Pressable
                style={localStyles.subSectionHeader}
                onPress={() => toggleFanClubSubSection("comments")}
              >
                <View style={localStyles.subSectionHeaderLeft}>
                  <Text style={localStyles.subSectionTitle}>التعليقات</Text>
                  <Ionicons name="chatbubble-outline" size={16} color="#F4C565" />
                </View>
                <View style={localStyles.subSectionHeaderRight}>
                  <Text style={localStyles.subSectionCount}>{fanCommentFeedItems.length}</Text>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: fanClubSubSectionAnims.comments.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                  </Animated.View>
                </View>
              </Pressable>
              <Animated.View
                style={[
                  localStyles.subSectionContent,
                  {
                    maxHeight: fanClubSubSectionAnims.comments.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, PROFILE_SUB_SECTION_MAX_HEIGHT],
                    }),
                    opacity: fanClubSubSectionAnims.comments,
                  },
                ]}
              >
                <ProfileXFanCommentFeed
                  comments={fanCommentFeedItems}
                  profile={props.profile}
                  emptyText="لا توجد تعليقات في الرابطة"
                />
              </Animated.View>
            </View>

            {/* قسم إعادة التغريد */}
            <View style={localStyles.subSection}>
              <Pressable
                style={localStyles.subSectionHeader}
                onPress={() => toggleFanClubSubSection("reposts")}
              >
                <View style={localStyles.subSectionHeaderLeft}>
                  <Text style={localStyles.subSectionTitle}>إعادة التغريد</Text>
                  <Ionicons name="repeat-outline" size={16} color="#F4C565" />
                </View>
                <View style={localStyles.subSectionHeaderRight}>
                  <Text style={localStyles.subSectionCount}>{fanRepostPosts.length}</Text>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: fanClubSubSectionAnims.reposts.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                  </Animated.View>
                </View>
              </Pressable>
              <Animated.View
                style={[
                  localStyles.subSectionContent,
                  {
                    maxHeight: fanClubSubSectionAnims.reposts.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, PROFILE_SUB_SECTION_MAX_HEIGHT],
                    }),
                    opacity: fanClubSubSectionAnims.reposts,
                  },
                ]}
              >
                <ProfileXPostFeed
                  posts={fanRepostPosts}
                  profile={props.profile}
                  emptyText="لا توجد إعادات تغريد في الرابطة"
                />
              </Animated.View>
            </View>

            {/* قسم المشاركات */}
            <View style={localStyles.subSection}>
              <Pressable
                style={localStyles.subSectionHeader}
                onPress={() => toggleFanClubSubSection("shares")}
              >
                <View style={localStyles.subSectionHeaderLeft}>
                  <Text style={localStyles.subSectionTitle}>المشاركات</Text>
                  <Ionicons name="share-social-outline" size={16} color="#F4C565" />
                </View>
                <View style={localStyles.subSectionHeaderRight}>
                  <Text style={localStyles.subSectionCount}>{fanSharedPosts.length}</Text>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: fanClubSubSectionAnims.shares.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                  </Animated.View>
                </View>
              </Pressable>
              <Animated.View
                style={[
                  localStyles.subSectionContent,
                  {
                    maxHeight: fanClubSubSectionAnims.shares.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, PROFILE_SUB_SECTION_MAX_HEIGHT],
                    }),
                    opacity: fanClubSubSectionAnims.shares,
                  },
                ]}
              >
                <ProfileXPostFeed
                  posts={fanSharedPosts}
                  profile={props.profile}
                  useProfileAuthor={false}
                  emptyText="لا توجد مشاركات في الرابطة"
                />
              </Animated.View>
            </View>

            {/* قسم الإعجابات */}
            <View style={localStyles.subSection}>
              <Pressable
                style={localStyles.subSectionHeader}
                onPress={() => toggleFanClubSubSection("likes")}
              >
                <View style={localStyles.subSectionHeaderLeft}>
                  <Text style={localStyles.subSectionTitle}>الإعجابات</Text>
                  <Ionicons name="heart-outline" size={16} color="#FB7185" />
                </View>
                <View style={localStyles.subSectionHeaderRight}>
                  <Text style={[localStyles.subSectionCount, { color: "#FB7185" }]}>
                    {fanLikedPosts.length}
                  </Text>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: fanClubSubSectionAnims.likes.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "180deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                  </Animated.View>
                </View>
              </Pressable>
              <Animated.View
                style={[
                  localStyles.subSectionContent,
                  {
                    maxHeight: fanClubSubSectionAnims.likes.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, PROFILE_SUB_SECTION_MAX_HEIGHT],
                    }),
                    opacity: fanClubSubSectionAnims.likes,
                  },
                ]}
              >
                <ProfileXLikedPostFeed
                  posts={fanLikedPosts}
                  followedProfiles={props.followedProfiles}
                  emptyText="لا توجد إعجابات في الرابطة"
                />
              </Animated.View>
            </View>
          </Animated.View>
        </View>
        </View>

        <PredictionsBar
          earnedPoints={earnedPoints}
          predictionsCount={predictions.length}
          wonPredictions={wonPredictions}
          predictions={predictions}
          arabicFontFamily={props.arabicFontFamily}
        />
      </ScrollView>

    </View>
  );
}

const localStyles = StyleSheet.create({
  expandableSectionsContainer: {
    marginTop: 12,
    gap: 8,
    paddingHorizontal: 16,
  },
  expandableSection: {
    backgroundColor: "rgba(12,12,16,0.98)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  expandableHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  expandableHeaderLeft: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  expandableHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expandableTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  expandableCount: {
    color: "#8BD6FF",
    fontSize: 16,
    fontWeight: "700",
  },
  expandableContent: {
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptySectionText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  profileMetricGroupCardWide: {
    width: "100%",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(12,12,16,0.98)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    marginBottom: 10,
  },
  predictionsWrapper: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  predictionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "right",
    marginBottom: 10,
    marginRight: 4,
  },
  predictionsBar: {
    backgroundColor: "rgba(12,12,16,0.98)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  predictionsBarRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  predictionsBarItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  predictionsBarDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  predictionsBarValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F4C565",
  },
  predictionsBarLabel: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
    backgroundColor: "rgba(135,206,235,0.65)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  expandedContent: {
    overflow: "hidden",
    marginTop: 12,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 12,
  },
  expandedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F4C565",
    textAlign: "right",
    marginBottom: 10,
  },
  expandedEmpty: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    paddingVertical: 20,
  },
  expandedItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  expandedItemTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "right",
    marginBottom: 4,
  },
  expandedItemMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "right",
  },
  activityLogSection: {
    marginTop: 18,
    gap: 10,
  },
  activityLogTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
    marginBottom: 4,
  },
  activityLogCard: {
    borderRadius: 18,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    gap: 10,
  },
  activityLogCardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  activityLogIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  activityLogCopy: {
    flex: 1,
    alignItems: "flex-end",
  },
  activityLogMetaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  activityLogType: {
    color: "#8BD6FF",
    fontSize: 12,
    fontWeight: "800",
  },
  activityLogTime: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 11,
    fontWeight: "700",
  },
  activityLogItemTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
  activityLogContent: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
  },
  activityLogEmptyCard: {
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 8,
  },
  activityLogEmptyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  activityLogEmptyText: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  sectionWrapper: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  varXContainer: {
    backgroundColor: "rgba(12,12,16,0.98)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  profileSectionsNav: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  profileNavItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  profileNavDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
  },
  varXTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  varXContent: {
    overflow: "hidden",
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  subSection: {
    marginBottom: 4,
    overflow: "hidden",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  subSectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subSectionHeaderLeft: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  subSectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subSectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  subSectionCount: {
    color: "#8BD6FF",
    fontSize: 14,
    fontWeight: "700",
  },
  subSectionContent: {
    overflow: "hidden",
    paddingBottom: 4,
  },
});
