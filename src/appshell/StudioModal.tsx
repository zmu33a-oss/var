import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { styles } from "./appshell.styles";

export function StudioModal(props: {
  visible: boolean;
  assetName: string;
  assetUri: string;
  caption: string;
  tag: string;
  onChangeCaption: (value: string) => void;
  onChangeTag: (value: string) => void;
  onChooseVideo: () => void;
  onClose: () => void;
  onPublish: () => void;
}) {
  return (
    <Modal
      transparent
      animationType="slide"
      visible={props.visible}
      onRequestClose={props.onClose}
    >
      <View style={styles.studioModalBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={props.onClose}
        />

        <View style={styles.studioModalCard}>
          <View style={styles.studioModalHeader}>
            <Pressable
              style={styles.studioModalIconButton}
              onPress={props.onClose}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.studioModalHeaderCopy}>
              <Text style={styles.studioModalEyebrow}>VAR STUDIO</Text>
              <Text style={styles.studioModalTitle}>
                ارفع فيديو جديد من الجهاز
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.studioPickerButton}
            onPress={props.onChooseVideo}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#9DDAFF" />
            <Text style={styles.studioPickerButtonText}>
              اختيار فيديو من الاستديو
            </Text>
          </Pressable>

          <View style={styles.studioPreviewCard}>
            {props.assetUri ? (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: "#000" },
                ]}
              />
            ) : (
              <View style={styles.studioPreviewPlaceholder}>
                <Ionicons
                  name="videocam-outline"
                  size={28}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.studioPreviewPlaceholderText}>
                  اختر فيديو لعرض المعاينة هنا
                </Text>
              </View>
            )}

            <LinearGradient
              colors={
                props.assetUri
                  ? ["rgba(2,8,14,0.08)", "rgba(2,8,14,0.52)"]
                  : ["rgba(8,19,31,0.18)", "rgba(8,19,31,0.62)"]
              }
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.studioPreviewCopy}>
              <Text style={styles.studioPreviewEyebrow}>LIVE PREVIEW</Text>
              <Text style={styles.studioPreviewTitle}>
                {props.assetName || "المعاينة جاهزة بعد اختيار الملف"}
              </Text>
            </View>
          </View>

          <View style={styles.studioAssetBadge}>
            <Text style={styles.studioAssetBadgeText}>
              {props.assetName || "لم يتم اختيار ملف بعد"}
            </Text>
          </View>

          <View style={styles.studioFieldBlock}>
            <Text style={styles.studioFieldLabel}>الوصف</Text>
            <TextInput
              value={props.caption}
              onChangeText={props.onChangeCaption}
              placeholder="اكتب وصف الفيديو"
              placeholderTextColor="rgba(255,255,255,0.34)"
              style={styles.studioInput}
              textAlign="right"
            />
          </View>

          <View style={styles.studioFieldBlock}>
            <Text style={styles.studioFieldLabel}>التصنيف</Text>
            <TextInput
              value={props.tag}
              onChangeText={props.onChangeTag}
              placeholder="Studio"
              placeholderTextColor="rgba(255,255,255,0.34)"
              style={styles.studioInput}
              textAlign="right"
            />
          </View>

          <View style={styles.studioFooter}>
            <Pressable
              style={styles.studioSecondaryButton}
              onPress={props.onClose}
            >
              <Text style={styles.studioSecondaryButtonText}>إلغاء</Text>
            </Pressable>
            <Pressable
              style={[
                styles.studioPrimaryButton,
                !props.assetUri ? styles.studioPrimaryButtonDisabled : null,
              ]}
              disabled={!props.assetUri}
              onPress={props.onPublish}
            >
              <Text style={styles.studioPrimaryButtonText}>نشر الفيديو</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
