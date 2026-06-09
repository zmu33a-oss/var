import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
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
  ProfileData,
} from "../../../app.types";
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

function ProfileMetricGroupCard(props: {
  accentColor: string;
  arabicFontFamily?: string;
  iconName: IconName;
  items: { id: string; label: string; value: string }[];
  title: string;
}) {
  const titleTextStyle = getArabicFontStyle(
    props.arabicFontFamily,
    props.title,
  );

  return (
    <View style={styles.profileMetricGroupCard}>
      <View style={styles.profileMetricGroupHeader}>
        <View
          style={[
            styles.profileMetricGroupIcon,
            { backgroundColor: `${props.accentColor}24` },
          ]}
        >
          <Ionicons name={props.iconName} size={18} color={props.accentColor} />
        </View>

        <Text style={[styles.profileMetricGroupTitle, titleTextStyle]}>
          {props.title}
        </Text>
      </View>

      <View style={styles.profileMetricGroupBody}>
        {props.items.map((item) => (
          <View key={item.id} style={styles.profileMetricCell}>
            <Text numberOfLines={1} style={styles.profileMetricCellValue}>
              {item.value}
            </Text>
            <Text numberOfLines={1} style={styles.profileMetricCellLabel}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ProfileUserPreviewScreen(props: {
  arabicFontFamily?: string;
  clubName: string;
  followedProfiles: FollowingProfileCard[];
  profile: ProfileData;
  onClose: () => void;
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
  const previewVarIdLabel = sportsCardNumber.replace(/^VAR-/i, "VAR ");
  const wonPredictions = predictions.filter(
    (prediction) => prediction.pointsAwarded > 0,
  ).length;
  const followedProfilesCount = props.followedProfiles.length;
  const followedProfilesPreview = props.followedProfiles.slice(0, 4);
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
      title: "التغريدات والردود",
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
      ],
    },
    {
      id: "engagement",
      title: "الإعجابات والمشاركات",
      iconName: "heart-outline" as const,
      accentColor: "#FB7185",
      items: [
        {
          id: "likes",
          label: "إعجابات",
          value: String(props.profile.socialMetrics.xLikes),
        },
        {
          id: "shares",
          label: "مشاركات",
          value: String(props.profile.socialMetrics.xShares),
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
          value: String(followedProfilesCount),
        },
      ],
    },
  ];

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
            </View>
          </View>

          <MilestoneProgressBar
            compactProfile
            embedded
            points={earnedPoints}
            showControls={false}
            style={styles.identityRewardsTracker}
          />
        </LinearGradient>

        <View style={styles.profileMetricGroupsGrid}>
          {profileMetricGroups.map((metricGroup) => (
            <ProfileMetricGroupCard
              key={metricGroup.id}
              accentColor={metricGroup.accentColor}
              arabicFontFamily={props.arabicFontFamily}
              iconName={metricGroup.iconName}
              items={metricGroup.items}
              title={metricGroup.title}
            />
          ))}
        </View>

        <View style={styles.followedPreviewSection}>
          <View style={styles.followedPreviewHeader}>
            <View style={styles.followedPreviewIconWrap}>
              <Ionicons name="people" size={18} color="#34D399" />
            </View>
            <View style={styles.followedPreviewHeaderCopy}>
              <Text style={[styles.followedPreviewTitle, titleArabicTextStyle]}>
                المضافون عبر VAR
              </Text>
              <Text style={styles.followedPreviewHint}>
                {followedProfilesCount
                  ? `${followedProfilesCount} حساب في قائمتك`
                  : "لم تضف أي حساب بالباركود بعد"}
              </Text>
            </View>
          </View>

          {followedProfilesPreview.length ? (
            <View style={styles.followedPreviewList}>
              {followedProfilesPreview.map((followedProfile) => (
                <View
                  key={followedProfile.varId}
                  style={styles.followedPreviewCard}
                >
                  <View style={styles.followedPreviewAvatarWrap}>
                    {followedProfile.avatarUri ? (
                      <Image
                        source={{
                          uri: resolveProfileAvatarUri(
                            followedProfile.avatarUri,
                          ),
                        }}
                        style={styles.followedPreviewAvatarImage}
                      />
                    ) : (
                      <Text style={styles.followedPreviewAvatarFallback}>
                        {followedProfile.displayName.slice(0, 1) || "V"}
                      </Text>
                    )}
                  </View>

                  <View style={styles.followedPreviewCardCopy}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.followedPreviewName,
                        getArabicFontStyle(
                          props.arabicFontFamily,
                          followedProfile.displayName,
                        ),
                      ]}
                    >
                      {followedProfile.displayName ||
                        followedProfile.displayVarId}
                    </Text>
                    <Text numberOfLines={1} style={styles.followedPreviewVarId}>
                      {followedProfile.displayVarId || followedProfile.varId}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.followedPreviewEmptyCard}>
              <Text style={styles.followedPreviewEmptyText}>
                امسح باركود بطاقة VAR لأي مستخدم، وسيظهر هنا فور إضافته.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.showcaseSection}>
          <View style={styles.showcaseHeader}>
            <View style={styles.showcaseBadge}>
              <Ionicons name="trophy" size={22} color="#F4C565" />
            </View>

            <View style={styles.showcaseHeaderCopy}>
              <Text style={[styles.showcaseTitle, titleArabicTextStyle]}>
                سجل التوقعات
              </Text>
              <Text style={styles.showcaseHint}>
                كل توقع مقفل يظهر هنا بشكل واضح ليزيد حماسك قبل المباراة وبعدها.
              </Text>
            </View>
          </View>

          {predictions.length ? (
            <View style={styles.predictionsList}>
              {predictions.map((prediction) => (
                <PredictionShowcaseCard
                  key={prediction.id}
                  arabicFontFamily={props.arabicFontFamily}
                  prediction={prediction}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyShowcaseCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="football-outline" size={28} color="#F4C565" />
              </View>
              <Text style={[styles.emptyTitle, titleArabicTextStyle]}>
                لا توجد توقعات بعد
              </Text>
              <Text style={styles.emptyText}>
                اقفل أول توقع من صفحة الدوريات، وستظهر هنا بطاقة حماسية تعرض
                توقعك والنقاط ووقت القفل.
              </Text>
              <View style={styles.emptyCtaRow}>
                <Ionicons name="sparkles" size={16} color="#8BD6FF" />
                <Text style={styles.emptyCtaText}>
                  ابدأ من تبويب التوقع داخل المباراة
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
