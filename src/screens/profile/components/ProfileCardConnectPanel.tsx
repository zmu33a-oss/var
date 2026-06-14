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
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const arabicTextStyle = getArabicFontStyle(
    props.arabicFontFamily,
    feedback,
  );

  const runScanAndAdd = async () => {
    if (isBusy) return;

    setFeedback("");

    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (pickerResult.canceled) return;

      const imageUri = pickerResult.assets[0]?.uri;
      if (!imageUri) {
        setFeedback("تعذر قراءة الصورة المختارة.");
        return;
      }

      setIsBusy(true);

      const scanResults = await scanFromURLAsync(imageUri, ["qr"]);
      const scannedValue = scanResults[0]?.data?.trim();

      if (!scannedValue) {
        setFeedback("لم يتم العثور على باركود في الصورة.");
        return;
      }

      const normalizedDisplayVarId = parseVarIdFromScannedValue(scannedValue);
      if (!normalizedDisplayVarId) {
        setFeedback("أدخل VAR ID صالحًا مثل VAR-1234567.");
        return;
      }

      const result = await props.onAddUserByDisplayVarId(normalizedDisplayVarId);
      setFeedback(result.message);
    } catch {
      setFeedback("تعذر مسح البطاقة من الصورة.");
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

  return (
    <View style={styles.cardConnectPanel}>
      <View style={styles.cardConnectCompactRow}>
        <Pressable
          accessibilityLabel="مشاركة بطاقة VAR"
          disabled={isBusy}
          onPress={() => void handleShareCard()}
          style={({ pressed }) => [
            styles.cardConnectCompactBtn,
            pressed && styles.cardConnectCompactBtnPressed,
          ]}
        >
          <Ionicons color="#F4C565" name="share-outline" size={16} />
          <Text style={styles.cardConnectCompactText}>مشاركة</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="إضافة عبر مسح QR"
          disabled={isBusy}
          onPress={() => void runScanAndAdd()}
          style={({ pressed }) => [
            styles.cardConnectCompactBtn,
            pressed && styles.cardConnectCompactBtnPressed,
          ]}
        >
          {isBusy ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons color="#63C6FF" name="scan" size={16} />
          )}
          <Text style={styles.cardConnectCompactText}>إضافة</Text>
        </Pressable>
      </View>

      {feedback ? (
        <Text style={[styles.cardConnectFeedbackText, arabicTextStyle]}>
          {feedback}
        </Text>
      ) : null}
    </View>
  );
}
