import { Ionicons } from "@expo/vector-icons";
import { scanFromURLAsync } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import type { MembershipCardTier } from "../../../lib/membershipCardTier";
import { getArabicFontStyle } from "../profile.helpers";
import {
  buildVarCardShareMessage,
  parseVarIdFromScannedValue,
} from "../profileCardConnect.utils";
import { shareVarFrontCardImage } from "../profileCardShareImage.utils";
import { styles } from "../profile.styles";

export function ProfileCardConnectPanel(props: {
  cardTier: MembershipCardTier;
  cardWidth: number;
  displayVarId: string;
  arabicFontFamily?: string;
  onAddUserByDisplayVarId: (
    displayVarId: string,
  ) => Promise<{ ok: boolean; message: string }>;
}) {
  const [searchValue, setSearchValue] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const arabicTextStyle = getArabicFontStyle(
    props.arabicFontFamily,
    feedback || searchValue,
  );

  const runAddUser = async (rawValue: string) => {
    const normalizedDisplayVarId = parseVarIdFromScannedValue(rawValue);

    if (!normalizedDisplayVarId) {
      setFeedback("أدخل VAR ID صالحًا مثل VAR-1234567.");
      return;
    }

    setIsBusy(true);
    setFeedback("");

    try {
      const result = await props.onAddUserByDisplayVarId(
        normalizedDisplayVarId,
      );
      setFeedback(result.message);

      if (result.ok) {
        setSearchValue("");
      }
    } catch {
      setFeedback("تعذر إضافة المستخدم الآن.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleShareCard = async () => {
    const { message, shareUrl } = buildVarCardShareMessage(props.displayVarId);

    try {
      if (Platform.OS === "web") {
        const shareResult = await shareVarFrontCardImage({
          cardTier: props.cardTier,
          displayVarId: props.displayVarId,
          width: props.cardWidth,
        });

        if (shareResult === "shared") {
          setFeedback("تم فتح مشاركة صورة بطاقة VAR.");
          return;
        }

        if (shareResult === "downloaded") {
          setFeedback("تم تنزيل صورة البطاقة بنفس التصميم والباركود.");
          return;
        }

        setFeedback("تعذر تجهيز صورة البطاقة على هذا المتصفح.");
        return;
      }

      await Share.share({
        message,
        title: "مشاركة بطاقة VAR",
        url: shareUrl.startsWith("http") ? shareUrl : undefined,
      });
      setFeedback("تم فتح نافذة المشاركة.");
    } catch (error) {
      const shareError = error as { name?: string };

      if (shareError.name === "AbortError") {
        return;
      }

      if (Platform.OS === "web") {
        setFeedback("تعذر مشاركة صورة البطاقة الآن.");
        return;
      }

      setFeedback("تعذر فتح نافذة المشاركة.");
    }
  };

  const handleScanCardPhoto = async () => {
    if (isBusy) {
      return;
    }

    setFeedback("");

    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (pickerResult.canceled) {
        return;
      }

      const imageUri = pickerResult.assets[0]?.uri;

      if (!imageUri) {
        setFeedback("تعذر قراءة الصورة المختارة.");
        return;
      }

      setIsBusy(true);

      const scanResults = await scanFromURLAsync(imageUri, ["qr"]);
      const scannedValue = scanResults[0]?.data?.trim();

      if (!scannedValue) {
        setFeedback(
          "لم يتم العثور على باركود في الصورة. جرّب صورة أوضح للبطاقة.",
        );
        return;
      }

      await runAddUser(scannedValue);
    } catch {
      setFeedback("تعذر مسح البطاقة من الصورة.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View style={styles.cardConnectPanel}>
      <Pressable
        accessibilityLabel="مشاركة بطاقة VAR"
        disabled={isBusy}
        onPress={() => {
          void handleShareCard();
        }}
        style={({ pressed }) => [
          styles.cardConnectShareButton,
          pressed ? styles.cardConnectShareButtonPressed : null,
        ]}
      >
        <View style={styles.cardConnectShareIconWrap}>
          <Ionicons color="#09111C" name="share-outline" size={18} />
        </View>
        <Text style={[styles.cardConnectShareText, arabicTextStyle]}>
          مشاركة البطاقة
        </Text>
      </Pressable>

      <View style={styles.cardConnectSearchRow}>
        <Pressable
          accessibilityLabel="مسح بطاقة VAR من الصور"
          disabled={isBusy}
          onPress={() => {
            void handleScanCardPhoto();
          }}
          style={({ pressed }) => [
            styles.cardConnectCameraButton,
            pressed ? styles.cardConnectCameraButtonPressed : null,
          ]}
        >
          {isBusy ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons color="#FFFFFF" name="camera-outline" size={20} />
          )}
        </Pressable>

        <TextInput
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isBusy}
          onChangeText={setSearchValue}
          onSubmitEditing={() => {
            void runAddUser(searchValue);
          }}
          placeholder="بحث بالـ VAR ID"
          placeholderTextColor="rgba(255,255,255,0.34)"
          returnKeyType="search"
          style={[styles.cardConnectSearchInput, arabicTextStyle]}
          value={searchValue}
        />
      </View>

      {feedback ? (
        <Text style={[styles.cardConnectFeedbackText, arabicTextStyle]}>
          {feedback}
        </Text>
      ) : null}
    </View>
  );
}
