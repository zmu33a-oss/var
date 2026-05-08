import { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  Image,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { Post, ProfileData } from "../app.types";
import { resolveWalletPassUrl } from "../wallet/pass-url";

const SLIDE_HORIZONTAL_PADDING = 8;
const SLIDE_THUMB_SIZE = 64;
const SLIDE_THRESHOLD = 0.72;
const PORTRAIT_MULTI_TAP_DELAY = 280;
const PORTRAIT_TAP_MAX_DISTANCE = 12;
const DEFAULT_CLUB_NAME = "الهلال";
const DEFAULT_PLAYER_AVATAR_URI =
  "https://api.dicebear.com/9.x/personas/png?seed=alhilal-player&backgroundColor=c0d7ff,dbeafe,e2e8f0";
const SLIDE_SOUND = require("../../assets/audio/click.mp3.mp3");
const PROFILE_ARABIC_FONT_FAMILY = "ProfileArabic";
const PROFILE_ARABIC_FONT = require("../../assets/images/alfont_com_zainpcv2mob600-zainpcv2.ttf");
const ARABIC_TEXT_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

type ProfileScreenProps = {
  canOpenAdmin: boolean;
  posts: Post[];
  profile: ProfileData;
  onSaveProfile: (profile: ProfileData) => void;
  onSignOut: () => void;
};

type SwipeActionControlProps = {
  label: string;
  completedLabel: string;
  arabicFontFamily?: string;
  busy?: boolean;
  completed?: boolean;
  resetAfterComplete?: boolean;
  onComplete: () => void | Promise<void>;
  onReachedEnd: () => void | Promise<void>;
};

type ProfileFieldKey =
  | "displayName"
  | "username"
  | "bio"
  | "location"
  | "email"
  | "phoneNumber"
  | "profession"
  | "nationality";

function getArabicFontStyle(fontFamily?: string, value?: string) {
  if (!fontFamily) {
    return undefined;
  }

  if (value && !ARABIC_TEXT_PATTERN.test(value)) {
    return undefined;
  }

  return { fontFamily };
}

export default function ProfileScreen(props: ProfileScreenProps) {
  const { posts, profile, onSaveProfile, onSignOut } = props;
  const [message, setMessage] = useState("");
  const [isWalletBusy, setIsWalletBusy] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [draftProfile, setDraftProfile] = useState<ProfileData>({
    ...profile,
  });
  const slideSoundRef = useRef<any>(null);
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

  useEffect(() => {
    // Sound loading disabled due to expo-av deprecation causing web bundler TDZ loop issue
  }, []);

  const clubName = DEFAULT_CLUB_NAME;
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
  const englishMemberName = profile.username.replace(/^@/, "").toUpperCase();
  const sportsCardNumber = profile.nationalId;

  const playSlideSound = async () => {
    const sound = slideSoundRef.current;

    if (!sound) {
      return;
    }

    try {
      await sound.stopAsync().catch(() => undefined);
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch {
      // Ignore audio playback failures and keep the UI flow intact.
    }
  };

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

  const handleEditProfileTap = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics can be unavailable on some platforms like web.
    }

    handleEditProfile();
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
    onSaveProfile({
      ...draftProfile,
    });
    setIsEditModalOpen(false);
    setMessage("تم حفظ تعديل الملف الشخصي.");
  };

  // Triple tap must resolve first, otherwise the double tap would fire too early.
  const portraitTapGesture = Gesture.Exclusive(
    Gesture.Tap()
      .numberOfTaps(3)
      .maxDelay(PORTRAIT_MULTI_TAP_DELAY)
      .maxDistance(PORTRAIT_TAP_MAX_DISTANCE)
      .runOnJS(true)
      .onEnd((_event, success) => {
        if (success) {
          void handleEditProfileTap();
        }
      }),
    Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(PORTRAIT_MULTI_TAP_DELAY)
      .maxDistance(PORTRAIT_TAP_MAX_DISTANCE)
      .runOnJS(true)
      .onEnd((_event, success) => {
        if (success) {
          handlePreviewProfile();
        }
      }),
  );

  return (
    <View style={styles.profileRoot}>
      <View pointerEvents="none" style={styles.profileBackgroundLayer}>
        <LinearGradient
          colors={["#03060E", "#050A14", "#02040A"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.profileGlowOrb} />
        <View style={styles.profileGlowOrbSecondary} />
      </View>

      <ScrollView
        style={styles.profileScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.profileContent}
      >
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>DIGITAL ID</Text>
          <Text style={[styles.headerTitle, staticArabicTextStyle]}>
            الهوية الرياضية
          </Text>
        </View>

        <GestureDetector gesture={portraitTapGesture}>
          <View collapsable={false} style={styles.idCardShadow}>
            <LinearGradient
              colors={["#D2F5C6", "#73BA85", "#2F6F4A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.idCardFrame}
            >
              <View style={styles.idCardSurface}>
                <View style={styles.idCardWatermark}>
                  <View style={styles.idCardWatermarkRingOuter} />
                  <View style={styles.idCardWatermarkRingInner} />
                  <View style={styles.idCardWatermarkCore} />
                </View>

                <LinearGradient
                  colors={["#BFE7B6", "#E2F7D8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.idTopBand}
                >
                  <View style={styles.idTopBandBlockLeft}>
                    <Text
                      style={[styles.idTopBandTitle, staticArabicTextStyle]}
                    >
                      الهوية الرياضية
                    </Text>
                    <Text
                      style={[styles.idTopBandSubtitle, staticArabicTextStyle]}
                    >
                      رقم النسخة 1
                    </Text>
                  </View>

                  <SaudiEmblem />

                  <View style={styles.idTopBandBlockRight}>
                    <Text
                      style={[styles.idTopBandOverline, staticArabicTextStyle]}
                    >
                      المملكة العربية السعودية
                    </Text>
                    <Text
                      style={[styles.idTopBandTitle, staticArabicTextStyle]}
                    >
                      المنصة الرياضية السعودية
                    </Text>
                    <Text
                      style={[styles.idTopBandSubtitle, staticArabicTextStyle]}
                    >
                      بطاقة العضوية
                    </Text>
                  </View>
                </LinearGradient>

                <View style={styles.idCardBody}>
                  <View style={styles.idPortraitColumn}>
                    <IdentityPortrait />
                    <Text style={styles.idEnglishBadge}>
                      SPORTS MEMBER CARD
                    </Text>
                    <Text style={styles.idEnglishName}>
                      {englishMemberName}
                    </Text>
                    <IdentityBarcode value={sportsCardNumber} />
                    <Text style={styles.idBarcodeValue}>
                      {sportsCardNumber}
                    </Text>
                  </View>

                  <View style={styles.idCenterColumn}>
                    <IdentityEnglishInfoRow
                      label="ID NO"
                      value={sportsCardNumber}
                    />
                    <IdentityEnglishInfoRow
                      label="DOB"
                      value={profile.birthDate}
                    />
                    <IdentityEnglishInfoRow
                      label="JOINED"
                      value={profile.joinDate}
                    />
                    <IdentityEnglishInfoRow label="CLUB" value={clubName} />
                    <IdentityEnglishInfoRow
                      label="PHONE"
                      value={profile.phoneNumber}
                    />
                  </View>

                  <View style={styles.idArabicColumn}>
                    <View style={styles.idArabicHeaderRow}>
                      <View style={styles.idMiniPortraitWrap}>
                        <IdentityPortrait compact />
                      </View>

                      <Text style={styles.idArabicName} numberOfLines={2}>
                        {profile.displayName}
                      </Text>
                    </View>

                    <IdentityArabicInfoRow
                      label="الرقم"
                      value={sportsCardNumber}
                    />
                    <IdentityArabicInfoRow
                      label="تاريخ الميلاد"
                      value={profile.birthDate}
                    />
                    <IdentityArabicInfoRow
                      label="تاريخ الانضمام"
                      value={profile.joinDate}
                    />
                    <IdentityArabicInfoRow
                      label="الجنسية"
                      value={profile.nationality}
                    />
                    <IdentityArabicInfoRow
                      label="مكان الإقامة"
                      value={profile.location}
                    />
                  </View>
                </View>

                <View style={styles.idCardFooter}>
                  <Text style={[styles.idFooterTitle, staticArabicTextStyle]}>
                    الهوية الرياضية
                  </Text>
                  <Text style={styles.idFooterMeta}>
                    VAR SPORTS MEMBER PROFILE
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </GestureDetector>

        <View style={styles.gestureHintPanel}>
          <Ionicons name="finger-print" size={16} color="#F4C565" />
          <Text style={styles.gestureHintText}>
            اضغط ضغطتين لمعاينة البروفايل، واضغط ثلاث ضغطات لتعديل الملف الشخصي
            من الهوية كاملة.
          </Text>
        </View>

        <View style={styles.slidersStack}>
          <SwipeActionControl
            label="اسحب لإضافة الهوية إلى Wallet"
            completedLabel="تمت إضافة الهوية إلى Wallet"
            busy={isWalletBusy}
            completed={walletReady}
            onReachedEnd={playSlideSound}
            onComplete={handleAddToWallet}
          />

          <SwipeActionControl
            label="اسحب لتسجيل الخروج"
            completedLabel="جارٍ تسجيل الخروج"
            onReachedEnd={playSlideSound}
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
      </ScrollView>

      <Modal
        visible={isPreviewModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsPreviewModalOpen(false)}
      >
        <ProfilePreviewModal
          arabicFontFamily={profileArabicFontFamily}
          clubName={clubName}
          profile={profile}
          totalLikes={totalLikes}
          totalPosts={totalPosts}
          totalReplies={totalReplies}
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
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveProfileEdits}
        />
      </Modal>
    </View>
  );
}

function SwipeActionControl(props: SwipeActionControlProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [localCompleted, setLocalCompleted] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCompleted = props.completed || localCompleted;
  const activeLabel =
    isCompleted || props.busy ? props.completedLabel : props.label;
  const maxOffset = Math.max(
    0,
    trackWidth - SLIDE_THUMB_SIZE - SLIDE_HORIZONTAL_PADDING * 2,
  );
  const sliderTextArabicStyle = getArabicFontStyle(
    props.arabicFontFamily,
    activeLabel,
  );

  useEffect(() => {
    if (props.completed) {
      translateX.setValue(maxOffset);
      return;
    }

    if (!localCompleted) {
      translateX.setValue(0);
    }
  }, [localCompleted, maxOffset, props.completed, translateX]);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const resetThumb = () => {
    setLocalCompleted(false);
    Animated.spring(translateX, {
      toValue: 0,
      bounciness: 0,
      speed: 20,
      useNativeDriver: false,
    }).start();
  };

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const completeSlide = async () => {
    setLocalCompleted(true);
    await props.onReachedEnd();
    await props.onComplete();

    if (props.resetAfterComplete && !props.completed) {
      resetTimeoutRef.current = setTimeout(() => {
        resetThumb();
      }, 900);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () =>
      !props.busy && !isCompleted && maxOffset > 0,
    onMoveShouldSetPanResponder: (_event, gestureState) =>
      !props.busy &&
      !isCompleted &&
      maxOffset > 0 &&
      gestureState.dx > 6 &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderMove: (_event, gestureState) => {
      const nextOffset = Math.max(0, Math.min(maxOffset, gestureState.dx));
      translateX.setValue(nextOffset);
    },
    onPanResponderRelease: (_event, gestureState) => {
      const nextOffset = Math.max(0, Math.min(maxOffset, gestureState.dx));

      if (nextOffset >= maxOffset * SLIDE_THRESHOLD) {
        Animated.timing(translateX, {
          toValue: maxOffset,
          duration: 170,
          useNativeDriver: false,
        }).start(() => {
          void completeSlide();
        });
        return;
      }

      resetThumb();
    },
    onPanResponderTerminate: resetThumb,
  });

  return (
    <View style={styles.sliderTrack} onLayout={handleTrackLayout}>
      <View style={styles.sliderTextRow}>
        <Ionicons name="logo-apple" size={15} color="rgba(255,255,255,0.96)" />
        <Text style={[styles.sliderText, sliderTextArabicStyle]}>
          {activeLabel}
        </Text>
      </View>

      <View pointerEvents="none" style={styles.sliderTrailIcons}>
        <Ionicons
          name="chevron-forward"
          size={14}
          color="rgba(255,255,255,0.28)"
        />
        <Ionicons
          name="chevron-forward"
          size={14}
          color="rgba(255,255,255,0.44)"
          style={styles.sliderTrailIconSpacing}
        />
        <Ionicons
          name="chevron-forward"
          size={14}
          color="rgba(255,255,255,0.62)"
          style={styles.sliderTrailIconSpacing}
        />
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sliderThumb,
          isCompleted ? styles.sliderThumbCompleted : null,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <Ionicons
          name={isCompleted ? "checkmark" : "chevron-forward"}
          size={22}
          color="#09111C"
        />
      </Animated.View>
    </View>
  );
}

function IdentityPortrait(props: { compact?: boolean }) {
  return (
    <View
      style={[
        styles.portraitFrame,
        props.compact ? styles.portraitFrameCompact : null,
      ]}
    >
      <Image
        source={{ uri: DEFAULT_PLAYER_AVATAR_URI }}
        style={styles.portraitImage}
      />
    </View>
  );
}

function SaudiEmblem() {
  return (
    <View style={styles.idTopBandSeal}>
      <View style={styles.saudiPalmLeafRowTop}>
        <View style={[styles.saudiPalmLeaf, styles.saudiPalmLeafWide]} />
        <View style={[styles.saudiPalmLeaf, styles.saudiPalmLeafWide]} />
      </View>
      <View style={styles.saudiPalmLeafRowMid}>
        <View style={styles.saudiPalmLeaf} />
        <View style={[styles.saudiPalmLeaf, styles.saudiPalmLeafCenter]} />
        <View style={styles.saudiPalmLeaf} />
      </View>
      <View style={styles.saudiPalmTrunk} />
      <View style={styles.saudiSwordWrap}>
        <View style={[styles.saudiSword, styles.saudiSwordLeft]}>
          <View style={styles.saudiSwordBlade} />
          <View style={styles.saudiSwordHandle} />
        </View>
        <View style={[styles.saudiSword, styles.saudiSwordRight]}>
          <View style={styles.saudiSwordBlade} />
          <View style={styles.saudiSwordHandle} />
        </View>
      </View>
    </View>
  );
}

function IdentityEnglishInfoRow(props: { label: string; value: string }) {
  return (
    <View style={styles.idEnglishInfoRow}>
      <Text numberOfLines={1} style={styles.idEnglishInfoValue}>
        {props.value}
      </Text>
      <Text style={styles.idEnglishInfoLabel}>{props.label}:</Text>
    </View>
  );
}

function IdentityArabicInfoRow(props: {
  label: string;
  value: string;
  arabicFontFamily?: string;
}) {
  const labelArabicStyle = getArabicFontStyle(props.arabicFontFamily);
  const valueArabicStyle = getArabicFontStyle(
    props.arabicFontFamily,
    props.value,
  );

  return (
    <View style={styles.identityArabicInfoRow}>
      <Text style={[styles.identityArabicInfoLabel, labelArabicStyle]}>
        {props.label}
      </Text>
      <Text style={[styles.identityArabicInfoValue, valueArabicStyle]}>
        {props.value}
      </Text>
    </View>
  );
}

function IdentityBarcode(props: { value: string }) {
  const bars = props.value
    .replace(/\D/g, "")
    .slice(0, 10)
    .split("")
    .flatMap((digit, index) => {
      const width = (Number(digit) % 3) + 1;
      return [
        { width, filled: true, key: `${index}-a` },
        { width: 1, filled: false, key: `${index}-b` },
      ];
    });

  return (
    <View style={styles.barcodeWrap}>
      {bars.map((bar) => (
        <View
          key={bar.key}
          style={[
            styles.barcodeBar,
            {
              width: bar.width * 2,
              backgroundColor: bar.filled ? "#1E1E1E" : "transparent",
            },
          ]}
        />
      ))}
    </View>
  );
}

function ProfilePreviewModal(props: {
  arabicFontFamily?: string;
  clubName: string;
  profile: ProfileData;
  totalLikes: number;
  totalPosts: number;
  totalReplies: number;
  onClose: () => void;
}) {
  const staticArabicTextStyle = getArabicFontStyle(props.arabicFontFamily);

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
              source={{ uri: DEFAULT_PLAYER_AVATAR_URI }}
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
            label="الرابطة"
            value={props.clubName}
          />
          <PreviewStatCard
            arabicFontFamily={props.arabicFontFamily}
            label="المشاركات"
            value={String(props.totalPosts)}
          />
          <PreviewStatCard
            arabicFontFamily={props.arabicFontFamily}
            label="الردود"
            value={String(props.totalReplies)}
          />
          <PreviewStatCard
            arabicFontFamily={props.arabicFontFamily}
            label="الإعجابات"
            value={String(props.totalLikes)}
          />
        </View>

        <View style={styles.previewDetailsCard}>
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
      </ScrollView>
    </View>
  );
}

function ProfileEditModal(props: {
  arabicFontFamily?: string;
  draftProfile: ProfileData;
  onChangeField: (field: ProfileFieldKey, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const staticArabicTextStyle = getArabicFontStyle(props.arabicFontFamily);

  return (
    <View style={styles.modalRoot}>
      <LinearGradient
        colors={["#03060E", "#050A14", "#02040A"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.modalHeader}>
          <Pressable style={styles.modalIconButton} onPress={props.onClose}>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.modalHeaderCopy}>
            <Text style={styles.modalEyebrow}>EDIT PROFILE</Text>
            <Text style={[styles.modalTitle, staticArabicTextStyle]}>
              تعديل الملف الشخصي
            </Text>
          </View>

          <Pressable style={styles.modalPrimaryButton} onPress={props.onSave}>
            <Text
              style={[styles.modalPrimaryButtonText, staticArabicTextStyle]}
            >
              حفظ
            </Text>
          </Pressable>
        </View>

        <View style={styles.editPanel}>
          <ProfileFieldInput
            arabicFontFamily={props.arabicFontFamily}
            label="الاسم"
            value={props.draftProfile.displayName}
            onChangeText={(value) => props.onChangeField("displayName", value)}
          />
          <ProfileFieldInput
            arabicFontFamily={props.arabicFontFamily}
            label="اسم المستخدم"
            value={props.draftProfile.username}
            onChangeText={(value) => props.onChangeField("username", value)}
            autoCapitalize="none"
          />
          <ProfileFieldInput
            arabicFontFamily={props.arabicFontFamily}
            label="النبذة"
            value={props.draftProfile.bio}
            onChangeText={(value) => props.onChangeField("bio", value)}
            multiline
          />
          <ProfileFieldInput
            arabicFontFamily={props.arabicFontFamily}
            label="الموقع"
            value={props.draftProfile.location}
            onChangeText={(value) => props.onChangeField("location", value)}
          />
          <ProfileFieldInput
            arabicFontFamily={props.arabicFontFamily}
            label="البريد الإلكتروني"
            value={props.draftProfile.email}
            onChangeText={(value) => props.onChangeField("email", value)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <ProfileFieldInput
            arabicFontFamily={props.arabicFontFamily}
            label="رقم الجوال"
            value={props.draftProfile.phoneNumber}
            onChangeText={(value) => props.onChangeField("phoneNumber", value)}
            keyboardType="phone-pad"
          />
          <ProfileFieldInput
            arabicFontFamily={props.arabicFontFamily}
            label="المهنة"
            value={props.draftProfile.profession}
            onChangeText={(value) => props.onChangeField("profession", value)}
          />
          <ProfileFieldInput
            arabicFontFamily={props.arabicFontFamily}
            label="الجنسية"
            value={props.draftProfile.nationality}
            onChangeText={(value) => props.onChangeField("nationality", value)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileFieldInput(props: {
  arabicFontFamily?: string;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?:
    | "default"
    | "email-address"
    | "phone-pad"
    | "number-pad"
    | "numeric";
}) {
  const staticArabicTextStyle = getArabicFontStyle(props.arabicFontFamily);

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, staticArabicTextStyle]}>
        {props.label}
      </Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        multiline={props.multiline}
        autoCapitalize={props.autoCapitalize ?? "sentences"}
        keyboardType={props.keyboardType ?? "default"}
        placeholderTextColor="rgba(255,255,255,0.32)"
        style={[
          styles.fieldInput,
          props.multiline ? styles.fieldInputMultiline : null,
          getArabicFontStyle(props.arabicFontFamily, props.value),
        ]}
        textAlign="right"
      />
    </View>
  );
}

function PreviewStatCard(props: {
  arabicFontFamily?: string;
  label: string;
  value: string;
}) {
  const staticArabicTextStyle = getArabicFontStyle(props.arabicFontFamily);

  return (
    <View style={styles.previewStatCard}>
      <Text
        style={[
          styles.previewStatValue,
          getArabicFontStyle(props.arabicFontFamily, props.value),
        ]}
      >
        {props.value}
      </Text>
      <Text style={[styles.previewStatLabel, staticArabicTextStyle]}>
        {props.label}
      </Text>
    </View>
  );
}

function PreviewDetailRow(props: {
  arabicFontFamily?: string;
  label: string;
  value: string;
}) {
  const staticArabicTextStyle = getArabicFontStyle(props.arabicFontFamily);

  return (
    <View style={styles.previewDetailRow}>
      <Text
        style={[
          styles.previewDetailValue,
          getArabicFontStyle(props.arabicFontFamily, props.value),
        ]}
      >
        {props.value}
      </Text>
      <Text style={[styles.previewDetailLabel, staticArabicTextStyle]}>
        {props.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileRoot: {
    flex: 1,
  },
  profileBackgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  profileGlowOrb: {
    position: "absolute",
    top: -30,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(244,197,101,0.14)",
  },
  profileGlowOrbSecondary: {
    position: "absolute",
    bottom: 120,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(51,136,255,0.10)",
  },
  profileScroll: {
    flex: 1,
  },
  profileContent: {
    paddingHorizontal: 16,
    paddingTop: 82,
    paddingBottom: 110,
  },
  headerCopy: {
    alignItems: "flex-end",
  },
  headerEyebrow: {
    color: "rgba(244,197,101,0.72)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textAlign: "right",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 6,
  },
  idCardShadow: {
    marginTop: 14,
  },
  idCardFrame: {
    borderRadius: 24,
    padding: 2,
    shadowColor: "#67B878",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  idCardSurface: {
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "#EAF7DB",
    borderWidth: 1,
    borderColor: "rgba(56,113,69,0.18)",
  },
  idCardWatermark: {
    position: "absolute",
    top: 86,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.16,
  },
  idCardWatermarkRingOuter: {
    position: "absolute",
    width: 172,
    height: 172,
    borderRadius: 86,
    borderWidth: 10,
    borderColor: "rgba(132,196,140,0.16)",
  },
  idCardWatermarkRingInner: {
    position: "absolute",
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 6,
    borderColor: "rgba(132,196,140,0.20)",
  },
  idCardWatermarkCore: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(77,134,90,0.18)",
  },
  idTopBand: {
    minHeight: 88,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  idTopBandBlockLeft: {
    width: 110,
    alignItems: "flex-start",
  },
  idTopBandBlockRight: {
    width: 130,
    alignItems: "flex-end",
  },
  idTopBandOverline: {
    color: "rgba(45,110,71,0.72)",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "right",
    marginBottom: 2,
  },
  idTopBandTitle: {
    color: "#2D6E47",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
    lineHeight: 18,
  },
  idTopBandSubtitle: {
    color: "rgba(45,110,71,0.82)",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 3,
  },
  idTopBandSeal: {
    width: 74,
    height: 64,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(49,110,74,0.10)",
    borderWidth: 2,
    borderColor: "rgba(49,110,74,0.20)",
    marginHorizontal: 6,
  },
  idTopBandSealText: {
    color: "#2D6E47",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  saudiPalmLeafRowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  saudiPalmLeafRowMid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginTop: 2,
  },
  saudiPalmLeaf: {
    width: 14,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#2D6E47",
  },
  saudiPalmLeafWide: {
    width: 18,
  },
  saudiPalmLeafCenter: {
    width: 16,
  },
  saudiPalmTrunk: {
    width: 4,
    height: 15,
    borderRadius: 999,
    backgroundColor: "#2D6E47",
    marginTop: 2,
  },
  saudiSwordWrap: {
    position: "absolute",
    bottom: 10,
    width: 44,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  saudiSword: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
  },
  saudiSwordLeft: {
    transform: [{ rotate: "26deg" }],
  },
  saudiSwordRight: {
    transform: [{ rotate: "-26deg" }],
  },
  saudiSwordBlade: {
    width: 18,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: "#2D6E47",
  },
  saudiSwordHandle: {
    width: 4,
    height: 6,
    borderRadius: 2,
    backgroundColor: "#2D6E47",
    marginLeft: 2,
  },
  idCardBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
  },
  idPortraitColumn: {
    width: 104,
    alignItems: "flex-start",
  },
  portraitFrame: {
    width: 92,
    height: 112,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(57,113,73,0.28)",
    backgroundColor: "rgba(255,255,255,0.58)",
  },
  portraitFrameCompact: {
    width: 44,
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
  },
  portraitImage: {
    width: "100%",
    height: "100%",
  },
  idEnglishBadge: {
    color: "rgba(24,56,31,0.78)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginTop: 7,
  },
  idEnglishName: {
    color: "#102F18",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  idCenterColumn: {
    width: 88,
    marginLeft: 8,
    marginRight: 8,
    paddingTop: 10,
  },
  idEnglishInfoRow: {
    alignItems: "flex-start",
    marginBottom: 9,
  },
  idEnglishInfoLabel: {
    color: "rgba(45,90,58,0.66)",
    fontSize: 9,
    fontWeight: "900",
    marginBottom: 2,
  },
  idEnglishInfoValue: {
    color: "#14301B",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 13,
  },
  idArabicColumn: {
    flex: 1,
    alignItems: "flex-end",
    minWidth: 128,
    paddingLeft: 2,
  },
  idArabicHeaderRow: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  idMiniPortraitWrap: {
    marginLeft: 8,
  },
  idArabicName: {
    color: "#102F18",
    flex: 1,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 0,
    lineHeight: 15,
  },
  identityArabicInfoRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 6,
  },
  identityArabicInfoLabel: {
    color: "#315A3C",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "right",
    marginLeft: 8,
    minWidth: 58,
  },
  identityArabicInfoValue: {
    color: "#14301B",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "right",
    flex: 1,
    lineHeight: 14,
  },
  idCardFooter: {
    minHeight: 44,
    borderTopWidth: 1,
    borderTopColor: "rgba(57,113,73,0.14)",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  idFooterTitle: {
    color: "#1C4126",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
  },
  idFooterMeta: {
    color: "rgba(28,65,38,0.72)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  barcodeWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 30,
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(57,113,73,0.20)",
    backgroundColor: "rgba(250,252,245,0.96)",
    marginTop: 10,
    alignSelf: "center",
    justifyContent: "center",
  },
  barcodeBar: {
    height: "100%",
    marginRight: 1,
  },
  idBarcodeValue: {
    color: "#17311E",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 4,
  },
  gestureHintPanel: {
    marginTop: 12,
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  gestureHintText: {
    flex: 1,
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "right",
    marginRight: 10,
  },
  slidersStack: {
    marginTop: 18,
    gap: 12,
  },
  sliderTrack: {
    height: 62,
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "center",
    backgroundColor: "rgba(8,14,24,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  sliderTextRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 108,
  },
  sliderText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginRight: 8,
    lineHeight: 18,
  },
  sliderTrailIcons: {
    position: "absolute",
    right: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  sliderTrailIconSpacing: {
    marginLeft: -4,
  },
  sliderThumb: {
    position: "absolute",
    left: SLIDE_HORIZONTAL_PADDING,
    top: SLIDE_HORIZONTAL_PADDING,
    width: SLIDE_THUMB_SIZE,
    height: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  sliderThumbCompleted: {
    backgroundColor: "#FFFFFF",
  },
  messageText: {
    color: "#F4C565",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 16,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "#03060E",
  },
  modalContent: {
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 42,
  },
  modalHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalHeaderCopy: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  modalEyebrow: {
    color: "rgba(244,197,101,0.72)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 5,
    textAlign: "center",
  },
  modalIconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalPrimaryButton: {
    minWidth: 68,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#F4C565",
  },
  modalPrimaryButtonText: {
    color: "#09111C",
    fontSize: 14,
    fontWeight: "900",
  },
  modalHeaderSpacer: {
    minWidth: 68,
    height: 44,
  },
  previewHeroCard: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
  },
  previewPortraitRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    padding: 3,
    backgroundColor: "rgba(244,197,101,0.18)",
  },
  previewPortraitImage: {
    width: "100%",
    height: "100%",
    borderRadius: 53,
  },
  previewIdentityCopy: {
    alignItems: "center",
    marginTop: 16,
  },
  previewNameRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  previewName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  previewHandle: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6,
  },
  previewBio: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
  },
  previewStatsGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  previewStatCard: {
    width: "48%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  previewStatValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right",
  },
  previewStatLabel: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 8,
  },
  previewDetailsCard: {
    marginTop: 16,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  previewDetailRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  previewDetailLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
  previewDetailValue: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "left",
    marginRight: 18,
  },
  editPanel: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    marginBottom: 8,
  },
  fieldInput: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  fieldInputMultiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },
});
