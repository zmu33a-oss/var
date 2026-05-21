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
import {
  getArabicFontStyle,
  resolveProfileAvatarUri,
} from "../profile.helpers";
import type { ProfileFieldKey } from "../profile.constants";
import { styles } from "../profile.styles";
import { ProfileFieldInput } from "./ProfileFieldInput";

export function ProfileEditModal(props: {
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
