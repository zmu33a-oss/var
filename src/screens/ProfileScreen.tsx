import { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { Post, ProfileData } from "../app.types";
import {
  createCompatStyleSheet,
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../lib/crossPlatformStyles";
import { resolveWalletPassUrl } from "../wallet/pass-url";

const SLIDE_HORIZONTAL_PADDING = 8;
const SLIDE_THUMB_SIZE = 64;
const SLIDE_THRESHOLD = 0.72;
const PORTRAIT_MULTI_TAP_DELAY = 280;
const PORTRAIT_TAP_MAX_DISTANCE = 12;
const DEFAULT_CLUB_NAME = "الهلال";
const DEFAULT_PLAYER_AVATAR_URI =
  "https://api.dicebear.com/9.x/personas/png?seed=alhilal-player&backgroundColor=c0d7ff,dbeafe,e2e8f0";
const KSA_EMBLEM = require("../../assets/icons/ksa.png");
const SLIDE_SOUND = require("../../assets/audio/click.mp3.mp3");
const PROFILE_ARABIC_FONT_FAMILY = "ProfileArabic";
const PROFILE_ARABIC_FONT = require("../../assets/images/alfont_com_zainpcv2mob600-zainpcv2.ttf");
const ARABIC_TEXT_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const ARABIC_DIACRITICS_PATTERN = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const ARABIC_TATWEEL_PATTERN = /\u0640/g;

const ARABIC_AUTO_ENGLISH_LABELS: Record<string, string> = {
  الهلال: "AL HILAL",
  النصر: "AL NASSR",
  الأهلي: "AL AHLI",
  الاهلي: "AL AHLI",
  الاتحاد: "AL ITTIHAD",
  الشباب: "AL SHABAB",
  الاتفاق: "AL ETTIFAQ",
};

const ARABIC_TO_LATIN_MAP: Record<string, string> = {
  ا: "a",
  أ: "a",
  إ: "i",
  آ: "a",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "w",
  ي: "y",
  ى: "a",
  ة: "a",
  ؤ: "w",
  ئ: "y",
  ء: "a",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

type ProfileScreenProps = {
  canOpenAdmin: boolean;
  onOpenAdmin: () => void;
  posts: Post[];
  profile: ProfileData;
  onSaveProfile: (profile: ProfileData) => void | Promise<void>;
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

type ProfileFieldKey = "displayName" | "nationality" | "avatarUri";

const NATIONALITY_LABELS: Record<string, { arabic: string; english: string }> =
  {
    سعودي: { arabic: "سعودي", english: "SAUDI" },
    سعودية: { arabic: "سعودية", english: "SAUDI" },
    محايد: { arabic: "محايد", english: "NEUTRAL" },
    محايدة: { arabic: "محايدة", english: "NEUTRAL" },
    saudi: { arabic: "سعودي", english: "SAUDI" },
    "saudi arabian": { arabic: "سعودي", english: "SAUDI" },
    ksa: { arabic: "سعودي", english: "SAUDI" },
    neutral: { arabic: "محايد", english: "NEUTRAL" },
  };

function transliterateArabicToken(value: string): string {
  const normalizedValue = value
    .replace(ARABIC_DIACRITICS_PATTERN, "")
    .replace(ARABIC_TATWEEL_PATTERN, "");

  const mappedValue = ARABIC_AUTO_ENGLISH_LABELS[normalizedValue];

  if (mappedValue) {
    return mappedValue;
  }

  if (normalizedValue.startsWith("ال") && normalizedValue.length > 2) {
    const remainder: string = transliterateArabicToken(normalizedValue.slice(2));
    return remainder ? `AL ${remainder}` : "AL";
  }

  let result = "";

  for (const char of normalizedValue) {
    result += ARABIC_TO_LATIN_MAP[char] ?? char;
  }

  return result;
}

function getAutomaticEnglishLabel(value: string) {
  return value
    .trim()
    .replace(ARABIC_DIACRITICS_PATTERN, "")
    .replace(ARABIC_TATWEEL_PATTERN, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) =>
      ARABIC_TEXT_PATTERN.test(token) ? transliterateArabicToken(token) : token,
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function getArabicFontStyle(fontFamily?: string, value?: string) {
  if (!fontFamily) {
    return undefined;
  }

  if (value && !ARABIC_TEXT_PATTERN.test(value)) {
    return undefined;
  }

  return { fontFamily };
}

function getEnglishProfileName(displayName: string, fallbackValue: string) {
  const trimmedDisplayName = displayName.trim();

  if (!trimmedDisplayName) {
    return fallbackValue;
  }

  if (/[A-Za-z]/.test(trimmedDisplayName)) {
    return trimmedDisplayName;
  }

  return getAutomaticEnglishLabel(trimmedDisplayName) || fallbackValue;
}

function getEnglishProfileLine(profile: ProfileData) {
  const emailAlias = profile.email
    .split("@")[0]
    ?.replace(/[._-]+/g, " ")
    .trim();
  const usernameAlias = profile.username.replace(/^@/, "").trim();

  return getEnglishProfileName(
    profile.displayName,
    emailAlias || usernameAlias || "member profile",
  );
}

function resolveProfileAvatarUri(avatarUri?: string) {
  const normalizedAvatarUri = avatarUri?.trim();

  return normalizedAvatarUri || DEFAULT_PLAYER_AVATAR_URI;
}

function readSelectedProfileAvatarUri(asset?: ImagePicker.ImagePickerAsset) {
  if (!asset) {
    return "";
  }

  if (asset.base64?.trim()) {
    return `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
  }

  return asset.uri?.trim() || "";
}

function getNationalityLabels(nationality: string) {
  const trimmedNationality = nationality.trim();

  if (!trimmedNationality) {
    return { arabic: "", english: "" };
  }

  const mappedLabels = NATIONALITY_LABELS[trimmedNationality.toLowerCase()];

  if (mappedLabels) {
    return mappedLabels;
  }

  if (/[A-Za-z]/.test(trimmedNationality)) {
    return {
      arabic: trimmedNationality,
      english: trimmedNationality.toUpperCase(),
    };
  }

  return {
    arabic: trimmedNationality,
    english: getAutomaticEnglishLabel(trimmedNationality) || trimmedNationality,
  };
}

export default function ProfileScreen(props: ProfileScreenProps) {
  const { posts, profile, onOpenAdmin, onSaveProfile, onSignOut } = props;
  const { width: viewportWidth } = useWindowDimensions();
  const [message, setMessage] = useState("");
  const [isWalletBusy, setIsWalletBusy] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);
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
  const englishProfileName = getEnglishProfileLine(profile);
  const sportsCardNumber =
    profile.displayVarId || profile.varId || profile.nationalId;
  const nationalityLabels = getNationalityLabels(profile.nationality);
  const profileAvatarUri = resolveProfileAvatarUri(profile.avatarUri);
  const idCardWidth = Math.min(Math.max(viewportWidth - 20, 300), 404);
  const useNarrowIdCardLayout = viewportWidth <= 430 || idCardWidth <= 404;

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

    onSaveProfile({
      ...draftProfile,
      displayName: nextDisplayName || profile.displayName,
      nationality: nextNationality || profile.nationality,
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

      <ScrollView
        style={styles.profileScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.profileContent}
      >
        <GestureDetector gesture={portraitTapGesture}>
          <View
            collapsable={false}
            style={[styles.idCardShadow, { width: idCardWidth }]}
          >
            <LinearGradient
              colors={["#0F766E", "#0B1823", "#05080F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.idCardFrame}
            >
              <View style={styles.idCardGlow} />
              <View style={styles.idCardGlowSecondary} />

              <View style={styles.idCardSurface}>
                <View style={styles.idCardWatermark}>
                  <Image
                    source={KSA_EMBLEM}
                    resizeMode="contain"
                    style={styles.idCardWatermarkImage}
                  />
                </View>

                <View style={styles.idCardBadgeRow}>
                  <View style={styles.idCardBadge}>
                    <Ionicons
                      name="card-outline"
                      size={14}
                      color="rgba(255,255,255,0.88)"
                    />
                    <Text style={styles.idCardBadgeText}>WEBPLUS PASS</Text>
                  </View>

                  <View style={styles.idCardStatusPill}>
                    <View style={styles.idCardStatusDot} />
                    <Text style={styles.idCardStatusText}>PRIVATE</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.idNameBand,
                    useNarrowIdCardLayout ? styles.idNameBandNarrow : null,
                  ]}
                >
                  <Text numberOfLines={1} style={styles.idArabicPrimaryName}>
                    {profile.displayName}
                  </Text>
                  <Text numberOfLines={1} style={styles.idEnglishProfileName}>
                    {englishProfileName}
                  </Text>
                </View>

                <View style={styles.idCardBody}>
                  <View
                    style={[
                      styles.idPortraitColumn,
                      useNarrowIdCardLayout
                        ? styles.idPortraitColumnNarrow
                        : null,
                    ]}
                  >
                    <IdentityPortrait uri={profileAvatarUri} />
                    <IdentityBarcode value={sportsCardNumber} />
                    <Text style={styles.idBarcodeValue}>
                      {sportsCardNumber}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.idDetailsColumn,
                      useNarrowIdCardLayout
                        ? styles.idDetailsColumnNarrow
                        : null,
                    ]}
                  >
                    <IdentityPairedInfoRow
                      englishLabel="ID NO"
                      englishValue={sportsCardNumber}
                      arabicLabel="الرقم"
                      arabicValue={sportsCardNumber}
                      isIdRow
                      narrow={useNarrowIdCardLayout}
                    />
                    <IdentityPairedInfoRow
                      englishLabel="JOIN"
                      englishValue={profile.joinDate}
                      arabicLabel="الانضمام"
                      arabicValue={profile.joinDate}
                      englishValueTight
                      narrow={useNarrowIdCardLayout}
                    />
                    <IdentityPairedInfoRow
                      englishLabel="NATIONALITY"
                      englishValue={nationalityLabels.english}
                      arabicLabel="الجنسية"
                      arabicValue={nationalityLabels.arabic}
                      compactEnglishLabel
                      emphasizeValue
                      narrow={useNarrowIdCardLayout}
                    />
                  </View>
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

        {props.canOpenAdmin ? (
          <Pressable style={styles.adminConsoleButton} onPress={onOpenAdmin}>
            <View style={styles.adminConsoleCopy}>
              <Text style={styles.adminConsoleEyebrow}>VAR CONTROL</Text>
              <Text style={[styles.adminConsoleTitle, staticArabicTextStyle]}>
                افتح لوحة التحكم
              </Text>
              <Text style={[styles.adminConsoleHint, staticArabicTextStyle]}>
                ادخل إلى مركز الإدارة لمراجعة Appwrite والمنشورات وحالة تجهيز
                النظام من داخل Expo.
              </Text>
            </View>

            <View style={styles.adminConsoleIconWrap}>
              <Ionicons name="grid-outline" size={22} color="#09111C" />
            </View>
          </Pressable>
        ) : null}

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
          onPickAvatar={handlePickProfileAvatar}
          isPickingAvatar={isPickingAvatar}
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

      <View
        {...getNativePointerEventsProps("none")}
        style={[styles.sliderTrailIcons, getWebPointerEventsStyle("none")]}
      >
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

function IdentityPortrait(props: { uri?: string; compact?: boolean }) {
  return (
    <View
      style={[
        styles.portraitFrame,
        props.compact ? styles.portraitFrameCompact : null,
      ]}
    >
      <Image
        source={{ uri: resolveProfileAvatarUri(props.uri) }}
        style={styles.portraitImage}
      />
    </View>
  );
}

function SaudiEmblem() {
  return (
    <View style={styles.idTopBandSeal}>
      <Image
        source={KSA_EMBLEM}
        resizeMode="contain"
        style={styles.idTopBandSealImage}
      />
    </View>
  );
}

function IdentityEnglishInfoRow(props: { label: string; value: string }) {
  return (
    <View style={styles.idEnglishInfoRow}>
      <Text style={styles.idEnglishInfoLabel}>{props.label}:</Text>
      <Text numberOfLines={1} style={styles.idEnglishInfoValue}>
        {props.value}
      </Text>
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

function IdentityPairedInfoRow(props: {
  englishLabel: string;
  englishValue: string;
  arabicLabel: string;
  arabicValue: string;
  englishValueTight?: boolean;
  emphasizeValue?: boolean;
  compactEnglishLabel?: boolean;
  isIdRow?: boolean;
  narrow?: boolean;
}) {
  return (
    <View
      style={[
        styles.idPairedInfoRow,
        props.narrow ? styles.idPairedInfoRowNarrow : null,
      ]}
    >
      <View
        style={[
          styles.idPairedInfoEnglishBlock,
          props.narrow ? styles.idPairedInfoEnglishBlockNarrow : null,
        ]}
      >
        <Text
          style={[
            styles.idPairedInfoEnglishLabel,
            props.compactEnglishLabel
              ? styles.idPairedInfoEnglishLabelCompact
              : null,
            props.isIdRow ? styles.idPairedInfoEnglishLabelIdRow : null,
          ]}
        >
          {props.englishLabel} :
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.idPairedInfoEnglishValue,
            props.emphasizeValue
              ? styles.idPairedInfoEnglishValueEmphasis
              : null,
            props.englishValueTight
              ? styles.idPairedInfoEnglishValueTight
              : null,
            props.narrow ? styles.idPairedInfoEnglishValueNarrow : null,
            props.isIdRow ? styles.idPairedInfoEnglishValueIdRow : null,
          ]}
        >
          {props.englishValue}
        </Text>
      </View>

      <View
        style={[
          styles.idPairedInfoArabicBlock,
          props.narrow ? styles.idPairedInfoArabicBlockNarrow : null,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.idPairedInfoArabicLabel,
            props.isIdRow ? styles.idPairedInfoArabicLabelIdRow : null,
          ]}
        >
          {props.arabicLabel} :
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.idPairedInfoArabicValue,
            props.emphasizeValue
              ? styles.idPairedInfoArabicValueEmphasis
              : null,
            props.narrow ? styles.idPairedInfoArabicValueNarrow : null,
            props.isIdRow ? styles.idPairedInfoArabicValueIdRow : null,
          ]}
        >
          {props.arabicValue}
        </Text>
      </View>
    </View>
  );
}

function IdentityBilingualInfoRow(props: {
  arabicLabel: string;
  englishLabel: string;
  arabicValue: string;
  englishValue: string;
  arabicFontFamily?: string;
  compact?: boolean;
}) {
  const labelArabicStyle = getArabicFontStyle(
    props.arabicFontFamily,
    props.arabicLabel,
  );
  const valueArabicStyle = getArabicFontStyle(
    props.arabicFontFamily,
    props.arabicValue,
  );

  return (
    <View
      style={[
        styles.identityBilingualInfoRow,
        props.compact ? styles.identityBilingualInfoRowCompact : null,
      ]}
    >
      <View style={styles.identityBilingualInfoHeader}>
        <Text
          style={[styles.identityBilingualInfoLabelArabic, labelArabicStyle]}
        >
          {props.arabicLabel}
        </Text>
        <Text style={styles.identityBilingualInfoLabelEnglish}>
          {props.englishLabel}
        </Text>
      </View>
      <View style={styles.identityBilingualInfoValues}>
        <Text
          numberOfLines={1}
          style={[styles.identityBilingualInfoValueArabic, valueArabicStyle]}
        >
          {props.arabicValue}
        </Text>
        <Text
          numberOfLines={1}
          style={styles.identityBilingualInfoValueEnglish}
        >
          {props.englishValue}
        </Text>
      </View>
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
              backgroundColor: bar.filled
                ? "rgba(255,255,255,0.92)"
                : "transparent",
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
  const sportsCardNumber =
    props.profile.displayVarId ||
    props.profile.varId ||
    props.profile.nationalId;
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

function ProfileEditModal(props: {
  arabicFontFamily?: string;
  draftProfile: ProfileData;
  onChangeField: (field: ProfileFieldKey, value: string) => void;
  onPickAvatar: () => void;
  isPickingAvatar: boolean;
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
          <View style={styles.editAvatarSection}>
            <Text style={[styles.fieldLabel, staticArabicTextStyle]}>
              الصورة الشخصية
            </Text>

            <View style={styles.editAvatarCard}>
              <View style={styles.editAvatarPreviewWrap}>
                <Image
                  source={{
                    uri: resolveProfileAvatarUri(props.draftProfile.avatarUri),
                  }}
                  style={styles.editAvatarPreview}
                />
              </View>

              <View style={styles.editAvatarCopy}>
                <Text style={[styles.editAvatarTitle, staticArabicTextStyle]}>
                  واجهة البطاقة
                </Text>
                <Text style={[styles.editAvatarHint, staticArabicTextStyle]}>
                  الصورة تنعكس مباشرة على وجه البطاقة بعد اختيارها.
                </Text>
              </View>

              <Pressable
                style={styles.editAvatarButton}
                onPress={props.onPickAvatar}
                disabled={props.isPickingAvatar}
              >
                <Ionicons name="image-outline" size={18} color="#09111C" />
                <Text style={styles.editAvatarButtonText}>
                  {props.isPickingAvatar ? "جارٍ التحميل" : "تحميل صورة"}
                </Text>
              </Pressable>
            </View>
          </View>

          <ProfileFieldInput
            arabicFontFamily={props.arabicFontFamily}
            label="الاسم"
            value={props.draftProfile.displayName}
            onChangeText={(value) => props.onChangeField("displayName", value)}
          />
          <ProfileFieldInput
            arabicFontFamily={props.arabicFontFamily}
            label="الجنسية"
            value={props.draftProfile.nationality}
            onChangeText={(value) => props.onChangeField("nationality", value)}
          />

          <Text style={[styles.editInfoNote, staticArabicTextStyle]}>
            المسموح تعديله هنا فقط: الاسم، الجنسية، والصورة الشخصية.
          </Text>
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

const styles = createCompatStyleSheet({
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
    marginTop: 8,
    alignSelf: "center",
  },
  idCardFrame: {
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 12,
  },
  idCardSurface: {
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "transparent",
  },
  idCardGlow: {
    position: "absolute",
    top: -24,
    left: -18,
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  idCardGlowSecondary: {
    position: "absolute",
    bottom: -92,
    right: -36,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(15,118,110,0.20)",
  },
  idCardWatermark: {
    position: "absolute",
    top: 18,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.06,
  },
  idCardWatermarkImage: {
    width: 264,
    height: 196,
    transform: [{ translateX: 16 }, { translateY: 10 }],
  },
  idCardBadgeRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  idCardBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  idCardBadgeText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontWeight: "900",
    marginRight: 6,
    letterSpacing: 0.6,
  },
  idCardStatusPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  idCardStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },
  idCardStatusText: {
    marginRight: 8,
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  idTopBand: {
    minHeight: 74,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  idTopBandBlockLeft: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
  },
  idTopBandBlockRight: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
  },
  idTopBandBlockRightNarrow: {
    flex: 1.14,
    minWidth: 0,
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
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
    lineHeight: 18,
    flexShrink: 1,
  },
  idTopBandTitleRightNarrow: {
    fontSize: 11,
    lineHeight: 15,
  },
  idTopBandTitleLeft: {
    textAlign: "left",
  },
  idTopBandSubtitle: {
    color: "rgba(45,110,71,0.82)",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 2,
    flexShrink: 1,
  },
  idTopBandSubtitleLeft: {
    textAlign: "left",
  },
  idTopBandSeal: {
    width: 90,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  idTopBandSealImage: {
    width: 88,
    height: 62,
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
  idNameBand: {
    alignItems: "flex-end",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 0,
  },
  idNameBandNarrow: {
    paddingTop: 18,
    paddingBottom: 0,
  },
  idArabicPrimaryName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "right",
    lineHeight: 28,
  },
  idEnglishProfileName: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 5,
    letterSpacing: 0.3,
  },
  idCardBody: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  idPortraitColumn: {
    width: 88,
    alignItems: "center",
  },
  idPortraitColumnNarrow: {
    width: 78,
    marginTop: 0,
    marginLeft: 0,
  },
  portraitFrame: {
    width: 70,
    height: 92,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  portraitFrameCompact: {
    width: 40,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
  },
  portraitImage: {
    width: "100%",
    height: "100%",
  },
  idEnglishBadge: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginTop: 7,
  },
  idEnglishName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  idCenterColumn: {
    paddingTop: 2,
    alignItems: "center",
    position: "absolute",
    right: 20,
    top: 4,
  },
  idCenterColumnNarrow: {
    left: 0,
    right: 0,
    top: -5,
    alignItems: "center",
    opacity: 0.6,
  },
  idCompactPortraitScaleWrap: {
    transform: [{ scale: 0.8 }],
  },
  idDetailsColumn: {
    flex: 1,
    marginLeft: 18,
    minHeight: 0,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "flex-start",
  },
  idDetailsColumnNarrow: {
    minHeight: 0,
    marginLeft: 12,
    marginTop: 0,
    paddingTop: 12,
    paddingBottom: 8,
    justifyContent: "flex-start",
  },
  idEnglishInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  idEnglishInfoLabel: {
    color: "rgba(45,90,58,0.66)",
    fontSize: 9,
    fontWeight: "900",
    marginRight: 6,
  },
  idEnglishInfoValue: {
    color: "#14301B",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 13,
    flex: 1,
  },
  idArabicColumn: {
    flex: 1,
    alignItems: "flex-end",
    minWidth: 128,
    paddingTop: 6,
    paddingLeft: 2,
  },
  idPairedInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  idPairedInfoRowNarrow: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  idPairedInfoEnglishBlock: {
    flex: 0.96,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    marginRight: 4,
  },
  idPairedInfoEnglishBlockNarrow: {
    flex: 1.08,
    marginRight: 0,
    marginTop: 0,
    transform: [{ translateX: -8 }],
  },
  idPairedInfoEnglishLabel: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 10,
    fontWeight: "900",
    marginRight: 4,
    letterSpacing: 0.1,
  },
  idPairedInfoEnglishLabelCompact: {
    fontSize: 8,
    marginRight: 3,
    letterSpacing: 0,
  },
  idPairedInfoEnglishLabelIdRow: {
    fontSize: 9,
  },
  idPairedInfoEnglishValue: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 14,
  },
  idPairedInfoEnglishValueEmphasis: {
    fontSize: 10,
    lineHeight: 14,
  },
  idPairedInfoEnglishValueIdRow: {
    fontSize: 10,
    lineHeight: 14,
  },
  idPairedInfoEnglishValueNarrow: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 14,
  },
  idPairedInfoEnglishValueTight: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "auto",
    minWidth: 0,
    textAlign: "left",
  },
  idPairedInfoArabicValueTight: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "auto",
    minWidth: 0,
    textAlign: "right",
  },
  idPairedInfoArabicBlock: {
    flex: 1.04,
    flexDirection: "row-reverse",
    alignItems: "center",
    minWidth: 0,
  },
  idPairedInfoArabicBlockNarrow: {
    flex: 0.95,
    marginRight: 0,
  },
  idPairedInfoArabicLabel: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "right",
    marginLeft: 4,
    flexShrink: 0,
  },
  idPairedInfoArabicLabelIdRow: {
    fontSize: 9,
  },
  idPairedInfoArabicValue: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "right",
    lineHeight: 14,
  },
  idPairedInfoArabicValueEmphasis: {
    fontSize: 10,
    lineHeight: 14,
  },
  idPairedInfoArabicValueIdRow: {
    fontSize: 10,
    lineHeight: 14,
  },
  idPairedInfoArabicValueNarrow: {
    flexShrink: 1,
  },
  identityBilingualInfoRow: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(57,113,73,0.12)",
    paddingBottom: 8,
    marginBottom: 8,
  },
  identityBilingualInfoRowCompact: {
    flex: 1,
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  identityBilingualInfoHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  identityBilingualInfoLabelArabic: {
    color: "#315A3C",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "right",
  },
  identityBilingualInfoLabelEnglish: {
    color: "rgba(45,90,58,0.64)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  identityBilingualInfoValues: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 4,
  },
  identityBilingualInfoValueArabic: {
    color: "#14301B",
    flex: 1,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "right",
    lineHeight: 16,
    marginLeft: 10,
  },
  identityBilingualInfoValueEnglish: {
    color: "#14301B",
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "left",
    lineHeight: 15,
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
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  identityArabicInfoLabel: {
    color: "#315A3C",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "right",
    marginLeft: 8,
    minWidth: 88,
  },
  identityArabicInfoValue: {
    color: "#14301B",
    fontSize: 10,
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
    height: 21,
    width: 70,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 7,
    alignSelf: "center",
    justifyContent: "center",
  },
  barcodeBar: {
    height: "100%",
    marginRight: 1,
  },
  idBarcodeValue: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginTop: 3,
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
  adminConsoleButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(99,198,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(99,198,255,0.20)",
  },
  adminConsoleCopy: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 14,
  },
  adminConsoleEyebrow: {
    color: "rgba(99,198,255,0.82)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    textAlign: "right",
  },
  adminConsoleTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 4,
  },
  adminConsoleHint: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "right",
    marginTop: 6,
  },
  adminConsoleIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#63C6FF",
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
  previewPredictionsCard: {
    marginTop: 16,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  previewPredictionsTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 12,
  },
  previewPredictionRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  previewPredictionCopyColumn: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 14,
  },
  previewPredictionMetaColumn: {
    minWidth: 74,
    alignItems: "flex-start",
  },
  previewPredictionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
  previewPredictionMeta: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  previewPredictionPoints: {
    color: "#F4C565",
    fontSize: 14,
    fontWeight: "900",
  },
  previewPredictionLockedAt: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "left",
  },
  previewPredictionsEmpty: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
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
  editAvatarSection: {
    marginBottom: 16,
  },
  editAvatarCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
  },
  editAvatarPreviewWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    padding: 3,
    backgroundColor: "rgba(244,197,101,0.18)",
  },
  editAvatarPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 53,
  },
  editAvatarCopy: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 14,
  },
  editAvatarTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  editAvatarHint: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },
  editAvatarButton: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: "#F4C565",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarButtonText: {
    color: "#09111C",
    fontSize: 13,
    fontWeight: "900",
    marginRight: 8,
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
  editInfoNote: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
});
