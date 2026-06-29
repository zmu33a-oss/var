import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
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
  ProfileData,
  SocialInteractionRecord,
} from "../../../app.types";
import { LEAGUES } from "../../../app.data";
import { buildComposerDisplayVarId } from "../../../appshell/appshell.helpers";
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

export type FansProfileSheetTab = "posts" | "likes" | "reposts";

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

  // expanded section: null | 'varx' | 'fanclub'
  const [expandedSection, setExpandedSection] = useState<"varx" | "fanclub" | null>(null);
  const [varXActiveTab, setVarXActiveTab] = useState<"activity" | "likes" | "reposts" | "replies">("activity");
  const [fanClubActiveTab, setFanClubActiveTab] = useState<"activity" | "likes" | "reposts" | "replies">("activity");

  const toggleSection = (section: "varx" | "fanclub") => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

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
    const likedPosts = useMemo(
    () =>
      filterInteractionPosts(props.posts, props.socialInteractions, "like"),
    [props.posts, props.socialInteractions],
  );

  // --- بيانات الرابطة (fansPosts) ---
  const fanClubAuthoredPosts = useMemo(
    () => filterProfileAuthoredPosts(props.fansPosts ?? [], props.profile),
    [props.fansPosts, props.profile],
  );
  const fanClubReplies = useMemo(
    () =>
      mergeProfileReplies(
        props.fansPosts ?? [],
        props.profile,
        props.socialInteractions,
      ),
    [props.fansPosts, props.profile, props.socialInteractions],
  );
  const fanClubRepostPosts = useMemo(
    () =>
      mergeProfileRepostPosts(
        props.fansPosts ?? [],
        props.profile,
        props.socialInteractions,
      ),
    [props.fansPosts, props.profile, props.socialInteractions],
  );
  const fanClubLikedPosts = useMemo(
    () =>
      filterInteractionPosts(props.fansPosts ?? [], props.socialInteractions, "like"),
    [props.fansPosts, props.socialInteractions],
  );

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

            {/* يمين: الاسم + النوادي + مربع النقاط بالأعلى */}
            <View style={{ flex: 1 }}>
              {/* مربع النقاط (Milestone) في الزاوية اليمنى العليا */}
              <View style={localStyles.milestoneTopRight}>
                <MilestoneProgressBar
                  compactProfile
                  embedded
                  points={earnedPoints}
                  showControls={false}
                  titleTextStyle={titleArabicTextStyle}
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

                {leagueClubEntries.length > 0 ? (
                  <View style={localStyles.clubsGrid}>
                    {leagueClubEntries.slice(0, 4).map((entry, idx) => (
                      <View key={entry.leagueId + idx} style={localStyles.clubChip}>
                        <Ionicons name="football-outline" size={11} color="#F4C565" />
                        <Text numberOfLines={1} style={localStyles.clubChipText}>
                          {entry.club}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>

            {/* يسار: الأفتار + الرابطة + VAR ID تحته */}
            <View style={[localStyles.avatarColumn, { alignSelf: "flex-start" }]}>
              <View style={styles.avatarRing}>
                <Image
                  source={{ uri: resolveProfileAvatarUri(props.profile.avatarUri) }}
                  style={styles.avatarImage}
                />
              </View>
              <Text numberOfLines={1} style={localStyles.avatarBelowAssociation}>
                الرابطة : {associationLabel}
              </Text>
              <Text numberOfLines={1} style={localStyles.avatarBelowVarId}>
                {previewVarIdLabel}
              </Text>
            </View>

          </View>
        </LinearGradient>

      <PredictionsBar
        predictions={predictions}
        earnedPoints={earnedPoints}
        predictionsCount={predictions.length}
        wonPredictions={wonPredictions}
        arabicFontFamily={props.arabicFontFamily}
      />

        <View style={localStyles.sectionWrapper}>

          {/* المربع العلوي: السهمان */}
          <View style={localStyles.varXContainer}>

            {/* صف بروفايل VAR X */}
            <Pressable style={localStyles.sectionRow} onPress={() => toggleSection("varx")}>
              <Ionicons
                name={expandedSection === "varx" ? "chevron-up" : "chevron-down"}
                size={20}
                color="#FFFFFF"
              />
              <Text style={localStyles.sectionRowTitle}>بروفايل VAR X</Text>
            </Pressable>

            {/* تبويبات + محتوى VAR X */}
            {expandedSection === "varx" && (
              <View>
                <View style={localStyles.varXTabsContainer}>
                  {(["activity", "likes", "reposts", "replies"] as const).map((tab) => (
                    <Pressable
                      key={tab}
                      style={[localStyles.varXTab, varXActiveTab === tab && localStyles.varXTabActive]}
                      onPress={() => setVarXActiveTab(tab)}
                    >
                      <Text style={[localStyles.varXTabText, varXActiveTab === tab && localStyles.varXTabTextActive]}>
                        {tab === "activity" ? "النشاط" : tab === "likes" ? "الإعجابات" : tab === "reposts" ? "إعادة التغريد" : "الردود"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={localStyles.varXContent}>
                  {varXActiveTab === "activity" && (
                    <ProfileXPostFeed posts={authoredPosts} profile={props.profile} emptyText="لا توجد تغريدات" />
                  )}
                  {varXActiveTab === "likes" && (
                    <ProfileXLikedPostFeed posts={likedPosts} followedProfiles={props.followedProfiles} emptyText="لا توجد إعجابات" />
                  )}
                  {varXActiveTab === "reposts" && (
                    <ProfileXPostFeed posts={repostPosts} profile={props.profile} emptyText="لا توجد إعادات تغريد" />
                  )}
                  {varXActiveTab === "replies" && (
                    <ProfileXReplyFeed replies={profileReplies} profile={props.profile} emptyText="لا توجد ردود" />
                  )}
                </View>
              </View>
            )}

            <View style={localStyles.sectionDivider} />

            {/* صف بروفايل الرابطة */}
            <Pressable style={localStyles.sectionRow} onPress={() => toggleSection("fanclub")}>
              <Ionicons
                name={expandedSection === "fanclub" ? "chevron-up" : "chevron-down"}
                size={20}
                color="#FFFFFF"
              />
              <Text style={localStyles.sectionRowTitle}>بروفايل الرابطة</Text>
            </Pressable>

            {/* تبويبات + محتوى الرابطة */}
            {expandedSection === "fanclub" && (
              <View>
                <View style={localStyles.varXTabsContainer}>
                  {(["activity", "likes", "reposts", "replies"] as const).map((tab) => (
                    <Pressable
                      key={tab}
                      style={[localStyles.varXTab, fanClubActiveTab === tab && localStyles.varXTabActive]}
                      onPress={() => setFanClubActiveTab(tab)}
                    >
                      <Text style={[localStyles.varXTabText, fanClubActiveTab === tab && localStyles.varXTabTextActive]}>
                        {tab === "activity" ? "النشاط" : tab === "likes" ? "الإعجابات" : tab === "reposts" ? "إعادة التغريد" : "الردود"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={localStyles.varXContent}>
                                    {fanClubActiveTab === "activity" && (
                    <ProfileXPostFeed posts={fanClubAuthoredPosts} profile={props.profile} emptyText="لا توجد منشورات في الرابطة" />
                  )}
                  {fanClubActiveTab === "likes" && (
                    <ProfileXLikedPostFeed posts={fanClubLikedPosts} followedProfiles={props.followedProfiles} emptyText="لا توجد إعجابات في الرابطة" />
                  )}
                  {fanClubActiveTab === "reposts" && (
                    <ProfileXPostFeed posts={fanClubRepostPosts} profile={props.profile} emptyText="لا توجد إعادات نشر في الرابطة" />
                  )}
                  {fanClubActiveTab === "replies" && (
                    <ProfileXReplyFeed replies={fanClubReplies} profile={props.profile} emptyText="لا توجد ردود في الرابطة" />
                  )}
                </View>
              </View>
            )}

          </View>
        </View>
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
    marginTop: 6,
    marginBottom: 6,
  },
  varXContainer: {
    backgroundColor: "rgba(12,12,16,0.98)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  profileSectionsNav: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  profileNavItem: {
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row-reverse",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  profileNavDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 2,
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
  varXHeader: {
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: "center",
  },
  varXTabsContainer: {
    flexDirection: "row-reverse",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 4,
  },
  varXTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  varXTabActive: {
    borderBottomWidth: 2,
    borderColor: "#F4C565",
  },
  varXTabText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "600",
  },
  varXTabTextActive: {
    color: "#F4C565",
  },
  sectionRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionRowTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  milestoneTopRight: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 12,
  },
  avatarColumn: {
    alignItems: "center",
    gap: 5,
  },
  avatarBelowAssociation: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: 90,
  },
  avatarBelowVarId: {
    color: "#F4C565",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  clubsGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    justifyContent: "flex-start",
  },
  clubChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(244,197,101,0.12)",
    borderWidth: 1,
    borderColor: "rgba(244,197,101,0.3)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: "48%",
  },
  clubChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
