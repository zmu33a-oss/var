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
import type { ProfileData } from "../../../app.types";
import { buildComposerDisplayVarId } from "../../../appshell/appshell.helpers";
import {
  getArabicFontStyle,
  resolveProfileAvatarUri,
} from "../profile.helpers";
import { styles } from "../profile.styles";
import { PreviewStatCard } from "./PreviewStatCard";
import { PreviewDetailRow } from "./PreviewDetailRow";

export function ProfilePreviewModal(props: {
  arabicFontFamily?: string;
  clubName: string;
  profile: ProfileData;
  totalLikes: number;
  totalPosts: number;
  totalReplies: number;
  onClose: () => void;
}) {
  const staticArabicTextStyle = getArabicFontStyle(props.arabicFontFamily);
  const sportsCardNumber = buildComposerDisplayVarId(
    props.profile.displayVarId,
    props.profile.varId,
  );
  const xInteractionTotal =
    props.profile.socialMetrics.xPosts +
    props.profile.socialMetrics.xLikes +
    props.profile.socialMetrics.xReplies +
    props.profile.socialMetrics.xReposts +
    props.profile.socialMetrics.xShares;
  const tiktokInteractionTotal =
    props.profile.socialMetrics.tiktokUploads +
    props.profile.socialMetrics.tiktokLikes +
    props.profile.socialMetrics.tiktokComments +
    props.profile.socialMetrics.tiktokSaves +
    props.profile.socialMetrics.tiktokShares;

  return (
    <View style={styles.modalRoot}>
      <LinearGradient
        colors={["#03060E", "#050A14", "#02040A"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.modalHeader}>
          <Pressable style={styles.modalIconButton} onPress={props.onClose}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.modalHeaderCopy}>
            <Text style={styles.modalEyebrow}>PROFILE PREVIEW</Text>
            <Text style={[styles.modalTitle, staticArabicTextStyle]}>
              معاينة البروفايل
            </Text>
          </View>

          <View style={styles.modalHeaderSpacer} />
        </View>

        <LinearGradient
          colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]}
          style={styles.previewHeroCard}
        >
          <View style={styles.previewPortraitRing}>
            <Image
              source={{ uri: resolveProfileAvatarUri(props.profile.avatarUri) }}
              style={styles.previewPortraitImage}
            />
          </View>

          <View style={styles.previewIdentityCopy}>
            <View style={styles.previewNameRow}>
              {props.profile.isVerified ? (
                <Ionicons name="checkmark-circle" size={18} color="#7ED0FF" />
              ) : null}
              <Text
                style={[
                  styles.previewName,
                  getArabicFontStyle(
                    props.arabicFontFamily,
                    props.profile.displayName,
                  ),
                ]}
              >
                {props.profile.displayName}
              </Text>
            </View>
            <Text style={styles.previewHandle}>{props.profile.username}</Text>
            <Text
              style={[
                styles.previewBio,
                getArabicFontStyle(props.arabicFontFamily, props.profile.bio),
              ]}
            >
              {props.profile.bio}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.previewStatsGrid}>
          <PreviewStatCard
            arabicFontFamily={props.arabicFontFamily}
            label="VAR ID"
            value={sportsCardNumber}
          />
          <PreviewStatCard
            arabicFontFamily={props.arabicFontFamily}
            label="النقاط"
            value={String(props.profile.earnedPoints)}
          />
          <PreviewStatCard
            arabicFontFamily={props.arabicFontFamily}
            label="التوقعات المقفلة"
            value={String(props.profile.lockedPredictions.length)}
          />
          <PreviewStatCard
            arabicFontFamily={props.arabicFontFamily}
            label="إجمالي التفاعلات"
            value={String(props.profile.socialMetrics.totalInteractions)}
          />
        </View>

        <View style={styles.previewDetailsCard}>
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="VAR ID"
            value={sportsCardNumber}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="النقاط المكتسبة"
            value={String(props.profile.earnedPoints)}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="إجمالي تفاعلات X"
            value={String(xInteractionTotal)}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="إجمالي تفاعلات TikTok"
            value={String(tiktokInteractionTotal)}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="مشاركات X"
            value={String(props.profile.socialMetrics.xPosts)}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="ردود X"
            value={String(props.profile.socialMetrics.xReplies)}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="منشورات TikTok"
            value={String(props.profile.socialMetrics.tiktokUploads)}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="تعليقات TikTok"
            value={String(props.profile.socialMetrics.tiktokComments)}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="الرابطة"
            value={props.clubName}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="المشاركات المحلية"
            value={String(props.totalPosts)}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="الردود المحلية"
            value={String(props.totalReplies)}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="الإعجابات المحلية"
            value={String(props.totalLikes)}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="البريد"
            value={props.profile.email}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="الهاتف"
            value={props.profile.phoneNumber}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="الموقع"
            value={props.profile.location}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="المهنة"
            value={props.profile.profession}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="الجنسية"
            value={props.profile.nationality}
          />
          <PreviewDetailRow
            arabicFontFamily={props.arabicFontFamily}
            label="الانضمام"
            value={props.profile.joinDate}
          />
        </View>

        <View style={styles.previewPredictionsCard}>
          <Text style={[styles.previewPredictionsTitle, staticArabicTextStyle]}>
            التوقعات المقفلة
          </Text>

          {props.profile.lockedPredictions.length ? (
            props.profile.lockedPredictions.map((prediction) => {
              const predictionMeta = [prediction.choice, prediction.competition]
                .filter(Boolean)
                .join(" • ");
              const predictionPointsLabel = prediction.pointsAwarded
                ? `+${prediction.pointsAwarded}`
                : prediction.status;

              return (
                <View key={prediction.id} style={styles.previewPredictionRow}>
                  <View style={styles.previewPredictionMetaColumn}>
                    <Text style={styles.previewPredictionPoints}>
                      {predictionPointsLabel}
                    </Text>
                    <Text
                      style={[
                        styles.previewPredictionLockedAt,
                        getArabicFontStyle(
                          props.arabicFontFamily,
                          prediction.lockedAt,
                        ),
                      ]}
                    >
                      {prediction.lockedAt}
                    </Text>
                  </View>

                  <View style={styles.previewPredictionCopyColumn}>
                    <Text
                      style={[
                        styles.previewPredictionTitle,
                        getArabicFontStyle(
                          props.arabicFontFamily,
                          prediction.title,
                        ),
                      ]}
                    >
                      {prediction.title}
                    </Text>
                    <Text
                      style={[
                        styles.previewPredictionMeta,
                        getArabicFontStyle(
                          props.arabicFontFamily,
                          predictionMeta || prediction.status,
                        ),
                      ]}
                    >
                      {predictionMeta || prediction.status}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text
              style={[
                styles.previewPredictionsEmpty,
                getArabicFontStyle(
                  props.arabicFontFamily,
                  "لا توجد توقعات مقفلة بعد.",
                ),
              ]}
            >
              لا توجد توقعات مقفلة بعد.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
