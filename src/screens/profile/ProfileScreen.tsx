import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { ProfileData } from "../../app.types";
import { PullToRefreshScrollView } from "../../components/PullToRefreshScrollView";
import {
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../../lib/crossPlatformStyles";
import { resolveWalletPassUrl } from "../../wallet/pass-url";
import {
  DEFAULT_CLUB_NAME,
  PROFILE_ARABIC_FONT,
  PROFILE_ARABIC_FONT_FAMILY,
} from "./profile.constants";
import {
  getArabicFontStyle,
  getNationalityLabels,
  readSelectedProfileAvatarUri,
  resolveProfileAvatarUri,
} from "./profile.helpers";
import { styles } from "./profile.styles";
import { buildComposerDisplayVarId } from "../../appshell/appshell.helpers";
import { normalizeAppwriteDisplayVarId } from "../../lib/appwrite";
import type { ProfileFieldKey, ProfileScreenProps } from "./profile.constants";
import { SwipeActionControl } from "./components/SwipeActionControl";
import { ProfileUserPreviewScreen } from "./components/ProfileUserPreviewScreen";
import { ProfileEditModal } from "./components/ProfileEditModal";
import { VarIdentityCard } from "./components/identity";
import { shareVarIdentityCard } from "./profileCardShare.actions";

export default function ProfileScreen(props: ProfileScreenProps) {
  const {
    posts,
    profile,
    onOpenAdmin,
    onOpenAdminWeb,
    onSaveProfile,
    onSignOut,
  } = props;
  const { width: viewportWidth } = useWindowDimensions();
  const [message, setMessage] = useState("");
  const [isWalletBusy, setIsWalletBusy] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);
  const [draftProfile, setDraftProfile] = useState<ProfileData>({
    ...profile,
  });
  const [isProfileArabicFontLoaded] = useFonts({
    [PROFILE_ARABIC_FONT_FAMILY]: PROFILE_ARABIC_FONT,
  });
  const profileArabicFontFamily = isProfileArabicFontLoaded
    ? PROFILE_ARABIC_FONT_FAMILY
    : undefined;
  const staticArabicTextStyle = getArabicFontStyle(profileArabicFontFamily);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = setTimeout(() => {
      setMessage("");
    }, 2600);

    return () => clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (!isEditModalOpen) {
      setDraftProfile({ ...profile });
    }
  }, [isEditModalOpen, profile]);



  const clubName = profile.association?.trim() || DEFAULT_CLUB_NAME;
  const totalPosts = posts.length;
  const totalReplies = useMemo(
    () => posts.reduce((sum, post) => sum + post.replies, 0),
    [posts],
  );
  const totalLikes = useMemo(
    () => posts.reduce((sum, post) => sum + post.likes, 0),
    [posts],
  );
  const walletReady = profile.walletPassAdded;
  const walletPassUrl = useMemo(
    () =>
      resolveWalletPassUrl({
        profile,
        clubName,
        totalPosts,
        totalReplies,
        totalLikes,
      }),
    [clubName, profile, totalLikes, totalPosts, totalReplies],
  );
  const displayVarId = buildComposerDisplayVarId(
    profile.displayVarId,
    profile.varId,
  );
  const nationalityLabels = getNationalityLabels(profile.nationality);
  const profileAvatarUri = resolveProfileAvatarUri(profile.avatarUri);
  const idCardWidth = Math.min(Math.max(viewportWidth - 24, 320), 440);



  const handleAddToWallet = async () => {
    if (isWalletBusy) {
      return;
    }

    if (walletReady) {
      setMessage("الهوية مضافة بالفعل إلى Wallet.");
      return;
    }

    setMessage("");
    setIsWalletBusy(true);

    try {
      let openedWalletPass = false;

      if (Platform.OS === "ios" && walletPassUrl) {
        const canOpenWalletPass = await Linking.canOpenURL(walletPassUrl);

        if (canOpenWalletPass) {
          await Linking.openURL(walletPassUrl);
          openedWalletPass = true;
        }
      }

      onSaveProfile({
        ...profile,
        walletPassAdded: true,
        walletPassUrl: walletPassUrl || profile.walletPassUrl,
      });

      setMessage(
        openedWalletPass
          ? "تم إرسال الهوية إلى Wallet."
          : walletPassUrl
            ? "تم تجهيز رابط بطاقة Wallet. افتحه من iPhone لإضافة البطاقة."
            : "تم تجهيز الهوية داخل Wallet محليًا.",
      );
    } catch {
      setMessage("تعذر إضافة الهوية إلى Wallet الآن.");
    } finally {
      setIsWalletBusy(false);
    }
  };

  const handleEditProfile = () => {
    setMessage("");
    setDraftProfile({ ...profile });
    setIsPreviewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handlePreviewProfile = () => {
    setMessage("");
    setIsEditModalOpen(false);
    setIsPreviewModalOpen(true);
  };

  const handleShareCard = async () => {
    const result = await shareVarIdentityCard({
      displayVarId,
      cardTier: profile.cardTier ?? "classic",
      cardWidth: idCardWidth,
    });

    if (result.message) {
      setMessage(result.message);
    }
  };

  const handleEditProfileTap = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics can be unavailable on some platforms like web.
    }

    handleEditProfile();
  };

  const handlePickProfileAvatar = async () => {
    if (isPickingAvatar) {
      return;
    }

    setMessage("");
    setIsPickingAvatar(true);

    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.35,
        base64: true,
      });

      if (pickerResult.canceled) {
        return;
      }

      const nextAvatarUri = readSelectedProfileAvatarUri(
        pickerResult.assets[0],
      );

      if (!nextAvatarUri) {
        setMessage("تعذر قراءة الصورة المختارة.");
        return;
      }

      setDraftProfile((currentProfile) => ({
        ...currentProfile,
        avatarUri: nextAvatarUri,
      }));

      void onSaveProfile({
        ...profile,
        avatarUri: nextAvatarUri,
      });

      setMessage("تم تحديث الصورة الشخصية وستظهر مباشرة على البطاقة.");
    } catch {
      setMessage("تعذر فتح مكتبة الصور على هذا الجهاز.");
    } finally {
      setIsPickingAvatar(false);
    }
  };

  const handleSignOut = () => {
    setIsEditModalOpen(false);
    setIsPreviewModalOpen(false);
    onSignOut();
  };

  const updateDraftProfile = (field: ProfileFieldKey, value: string) => {
    setDraftProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveProfileEdits = () => {
    const nextDisplayName = draftProfile.displayName.trim();
    const nextNationality = draftProfile.nationality.trim();
    const nextAssociation =
      draftProfile.association.trim() ||
      profile.association ||
      DEFAULT_CLUB_NAME;
    const nextDisplayVarId =
      normalizeAppwriteDisplayVarId(draftProfile.displayVarId) ||
      buildComposerDisplayVarId(profile.displayVarId, profile.varId);

    void onSaveProfile({
      ...draftProfile,
      displayName: nextDisplayName || profile.displayName,
      nationality: nextNationality || profile.nationality,
      association: nextAssociation,
      leagueClub: draftProfile.leagueClub?.trim() || profile.leagueClub || "",
      displayVarId: nextDisplayVarId,
    });
    setIsEditModalOpen(false);
    setMessage("تم حفظ تعديل الملف الشخصي.");
  };

  const portraitTapGesture = Gesture.Exclusive(
    Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(280)
      .maxDistance(12)
      .runOnJS(true)
      .onEnd((_event, success) => {
        if (success) {
          void handleEditProfileTap();
        }
      }),
    Gesture.Tap()
      .numberOfTaps(1)
      .maxDelay(280)
      .maxDistance(12)
      .runOnJS(true)
      .onEnd((_event, success) => {
        if (success) {
          handlePreviewProfile();
        }
      }),
  );

  return (
    <View style={styles.profileRoot}>
      <View
        {...getNativePointerEventsProps("none")}
        style={[
          styles.profileBackgroundLayer,
          getWebPointerEventsStyle("none"),
        ]}
      >
        <LinearGradient
          colors={["#03060E", "#050A14", "#02040A"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.profileGlowOrb} />
        <View style={styles.profileGlowOrbSecondary} />
      </View>

      <PullToRefreshScrollView
        style={styles.profileScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.profileContent}
        refreshing={props.isRefreshing}
        onRefresh={props.onRefresh}
      >
        <View style={styles.cardTopActions}>
          <Pressable
            style={styles.cardTopButton}
            onPress={() => setMessage("قريباً: شراء التوثيق وVAR ID مميز")}
          >
            <Ionicons name="shield-checkmark" size={16} color="#F4C565" />
            <Text style={styles.cardTopButtonText}>التوثيق</Text>
          </Pressable>
        </View>

        <GestureDetector gesture={portraitTapGesture}>
          <View collapsable={false}>
            <VarIdentityCard
              width={idCardWidth}
              displayVarId={displayVarId}
              arabicFontFamily={profileArabicFontFamily}
              cardTier={profile.cardTier}
              onWalletSwipe={handleAddToWallet}
              onSharePress={() => void handleShareCard()}
            />
          </View>
        </GestureDetector>

        <View style={styles.gestureHintPanel}>
          <Ionicons name="finger-print" size={16} color="#F4C565" />
          <Text style={styles.gestureHintText}>
            اضغط على البطاقة مرة لمعاينة البروفايل، واضغط مرتين لتعديل الملف الشخصي.
          </Text>
        </View>

        {props.canOpenAdmin ? (
          <View style={styles.adminConsoleCard}>
            <View style={styles.adminConsoleHeaderRow}>
              <View style={styles.adminConsoleBadge}>
                <Text style={styles.adminConsoleBadgeText}>
                  {props.adminRoleLabel || "ADMIN"}
                </Text>
              </View>
              <Text style={styles.adminConsoleVarId}>
                {props.adminDisplayVarId?.trim() ||
                  profile.displayVarId ||
                  profile.varId ||
                  "VAR ID"}
              </Text>
            </View>

            <Pressable
              style={styles.adminConsoleButton}
              onPress={onOpenAdminWeb}
            >
              <View style={styles.adminConsoleCopy}>
                <Text style={styles.adminConsoleEyebrow}>VAR ADMIN</Text>
                <Text style={[styles.adminConsoleTitle, staticArabicTextStyle]}>
                  فتح لوحة الإدارة
                </Text>
                <Text style={[styles.adminConsoleHint, staticArabicTextStyle]}>
                  ادخل إلى لوحة الإدارة الكاملة مربوطة ببروفايلك وجلسة Appwrite
                  الحالية.
                </Text>
              </View>

              <View style={styles.adminConsoleIconWrap}>
                <Ionicons name="globe-outline" size={22} color="#09111C" />
              </View>
            </Pressable>

            <Pressable
              style={styles.adminConsoleSecondaryButton}
              onPress={onOpenAdmin}
            >
              <Ionicons name="grid-outline" size={18} color="#D7E6FF" />
              <Text style={styles.adminConsoleSecondaryText}>
                لوحة سريعة داخل التطبيق
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.slidersStack}>
          <SwipeActionControl
            label="اسحب للدعم السريع عبر واتساب"
            completedLabel="جارٍ فتح واتساب"
            iconName="logo-whatsapp"
            iconColor="#FFFFFF"
            resetAfterComplete
            resetDelayMs={30000}
            onComplete={() => {
              const whatsappUrl = "https://wa.me/966547778281?text=مرحباً%20VAR%20لدي%20استفسار";
              void Linking.openURL(whatsappUrl);
            }}
          />

          <SwipeActionControl
            label="اسحب لتسجيل الخروج"
            completedLabel="جارٍ تسجيل الخروج"
            iconName="log-out-outline"
            onComplete={handleSignOut}
          />
        </View>

        {message ? (
          <Text
            style={[
              styles.messageText,
              getArabicFontStyle(profileArabicFontFamily, message),
            ]}
          >
            {message}
          </Text>
        ) : null}
      </PullToRefreshScrollView>

      <Modal
        visible={isPreviewModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsPreviewModalOpen(false)}
      >
        <ProfileUserPreviewScreen
          arabicFontFamily={profileArabicFontFamily}
          clubName={clubName}
          followedProfiles={props.followedProfiles}
          profile={profile}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      </Modal>

      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <ProfileEditModal
          arabicFontFamily={profileArabicFontFamily}
          draftProfile={draftProfile}
          onChangeField={updateDraftProfile}
          onPickAvatar={handlePickProfileAvatar}
          isPickingAvatar={isPickingAvatar}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveProfileEdits}
        />
      </Modal>
    </View>
  );
}
