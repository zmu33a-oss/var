import { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createAppwriteVarLibraryItem,
  deleteAppwriteVarLibraryItem,
  getAppwriteProfileImagesBucketConfigurationError,
  hasAppwriteProfileImagesBucketConfig,
  hasAppwriteVarLibraryConfig,
  listAppwriteVarLibraryItems,
  uploadAppwritePostImage,
  type AppwriteVarLibraryRecord,
} from "../../lib/appwrite";
import { VAR_PLAYER_LIBRARY_CLUBS } from "./varPlayerLibrary.constants";

const UPLOAD_CLUBS = VAR_PLAYER_LIBRARY_CLUBS.filter((club) => club !== "الكل");

type VarLibraryUploadPanelProps = {
  managerVarId: string;
  compact?: boolean;
  onUploaded?: () => void;
  onShowNotice?: (message: string) => void;
};

export function VarLibraryUploadPanel({
  managerVarId,
  compact = false,
  onUploaded,
  onShowNotice,
}: VarLibraryUploadPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [items, setItems] = useState<AppwriteVarLibraryRecord[]>([]);
  const [name, setName] = useState("");
  const [club, setClub] = useState(UPLOAD_CLUBS[0] ?? "الهلال");
  const [position, setPosition] = useState("لاعب");
  const [localImageUri, setLocalImageUri] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [busyItemId, setBusyItemId] = useState("");

  const bucketError = getAppwriteProfileImagesBucketConfigurationError();
  const libraryReady = hasAppwriteVarLibraryConfig();
  const bucketReady = hasAppwriteProfileImagesBucketConfig();

  const notify = (text: string) => {
    setMessage(text);
    onShowNotice?.(text);
  };

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setItems(await listAppwriteVarLibraryItems());
    } catch (loadError) {
      setItems([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "تعذر تحميل صور المكتبة.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled) {
        return;
      }

      const nextUri = result.assets[0]?.uri?.trim() || "";

      if (!nextUri) {
        notify("تعذر قراءة الصورة المختارة.");
        return;
      }

      setLocalImageUri(nextUri);
      notify("تم اختيار الصورة. أكمل البيانات ثم اضغط رفع.");
    } catch {
      notify("تعذر فتح مكتبة الصور.");
    }
  };

  const handleUpload = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      notify("اكتب اسم اللاعب أو عنوان الصورة.");
      return;
    }

    if (!localImageUri) {
      notify("اختر صورة أولاً.");
      return;
    }

    if (!libraryReady) {
      notify(
        "مجموعة مكتبة فار غير مضبوطة. تواصل مع الدعم الفني أو شغّل سكربت الإعداد.",
      );
      return;
    }

    if (!bucketReady) {
      notify(bucketError || "رفع الصور غير مفعّل.");
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const uploadedUri = await uploadAppwritePostImage(
        localImageUri,
        managerVarId || "admin",
      );

      await createAppwriteVarLibraryItem({
        name: trimmedName,
        club,
        position: position.trim() || "لاعب",
        imageUri: uploadedUri,
        createdByVarId: managerVarId,
      });

      setName("");
      setPosition("لاعب");
      setLocalImageUri("");
      notify("تم رفع الصورة إلى مكتبة فار.");
      await loadItems();
      onUploaded?.();
    } catch (uploadError) {
      notify(
        uploadError instanceof Error
          ? uploadError.message
          : "تعذر رفع الصورة.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    setBusyItemId(itemId);
    setMessage("");

    try {
      await deleteAppwriteVarLibraryItem(itemId);
      notify("تم حذف الصورة من المكتبة.");
      await loadItems();
      onUploaded?.();
    } catch (deleteError) {
      notify(
        deleteError instanceof Error
          ? deleteError.message
          : "تعذر حذف الصورة.",
      );
    } finally {
      setBusyItemId("");
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsExpanded((current) => !current)}
          style={styles.headerToggle}
        >
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#7DD3FC"
          />
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>رفع للإدارة</Text>
            <Text style={styles.title}>إضافة صورة لمكتبة فار</Text>
          </View>
        </Pressable>
        <Pressable style={styles.refreshChip} onPress={() => void loadItems()}>
          <Ionicons name="refresh" size={14} color="#FFFFFF" />
        </Pressable>
      </View>

      {isExpanded ? (
        <>
          {!libraryReady ? (
            <Text style={styles.warningText}>
              مجموعة مكتبة فار غير جاهزة بعد في Appwrite.
            </Text>
          ) : null}

          {!bucketReady && bucketError ? (
            <Text style={styles.warningText}>{bucketError}</Text>
          ) : null}

          <Pressable style={styles.pickButton} onPress={() => void pickImage()}>
            <Ionicons name="cloud-upload-outline" size={18} color="#E0F2FE" />
            <Text style={styles.pickButtonText}>
              {localImageUri ? "تغيير الصورة" : "اختيار صورة للرفع"}
            </Text>
          </Pressable>

          {localImageUri ? (
            <Image source={{ uri: localImageUri }} style={styles.previewImage} />
          ) : null}

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="اسم اللاعب أو عنوان الصورة"
            placeholderTextColor="rgba(148,163,184,0.9)"
            style={styles.input}
            textAlign="right"
          />

          <TextInput
            value={position}
            onChangeText={setPosition}
            placeholder="المركز (مهاجم، وسط...)"
            placeholderTextColor="rgba(148,163,184,0.9)"
            style={styles.input}
            textAlign="right"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.clubRow}
          >
            {UPLOAD_CLUBS.map((clubOption) => {
              const isActive = clubOption === club;

              return (
                <Pressable
                  key={clubOption}
                  onPress={() => setClub(clubOption)}
                  style={[
                    styles.clubChip,
                    isActive ? styles.clubChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.clubChipText,
                      isActive ? styles.clubChipTextActive : null,
                    ]}
                  >
                    {clubOption}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            disabled={isUploading}
            onPress={() => void handleUpload()}
            style={[
              styles.uploadButton,
              isUploading ? styles.uploadButtonBusy : null,
            ]}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.uploadButtonText}>رفع إلى مكتبة فار</Text>
            )}
          </Pressable>

          {message ? <Text style={styles.messageText}>{message}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.listTitle}>صورك المرفوعة ({items.length})</Text>

          {isLoading ? (
            <ActivityIndicator color="#63C6FF" style={styles.loader} />
          ) : items.length ? (
            items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Image source={{ uri: item.imageUri }} style={styles.itemThumb} />
                <View style={styles.itemCopy}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.club} · {item.position}
                  </Text>
                </View>
                <Pressable
                  disabled={busyItemId === item.id}
                  onPress={() => void handleDelete(item.id)}
                  style={styles.deleteButton}
                >
                  {busyItemId === item.id ? (
                    <ActivityIndicator color="#FECACA" size="small" />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color="#FECACA" />
                  )}
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>لا توجد صور مرفوعة بعد.</Text>
          )}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    backgroundColor: "rgba(14, 165, 233, 0.08)",
    borderColor: "rgba(56, 189, 248, 0.35)",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  headerToggle: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  headerCopy: {
    flex: 1,
    alignItems: "flex-end",
    gap: 2,
  },
  eyebrow: {
    color: "#7DD3FC",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
  },
  refreshChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 41, 59, 0.9)",
  },
  warningText: {
    color: "#FECACA",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
  },
  pickButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.45)",
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    paddingVertical: 12,
  },
  pickButtonText: {
    color: "#E0F2FE",
    fontSize: 14,
    fontWeight: "700",
  },
  previewImage: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    backgroundColor: "#020617",
  },
  input: {
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    borderColor: "rgba(51, 65, 85, 0.9)",
    borderRadius: 12,
    borderWidth: 1,
    color: "#F8FAFC",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  clubRow: {
    gap: 8,
  },
  clubChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.9)",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  clubChipActive: {
    borderColor: "rgba(56, 189, 248, 0.75)",
    backgroundColor: "rgba(14, 165, 233, 0.18)",
  },
  clubChipText: {
    color: "rgba(203, 213, 225, 0.9)",
    fontSize: 12,
    fontWeight: "600",
  },
  clubChipTextActive: {
    color: "#E0F2FE",
  },
  uploadButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#0EA5E9",
  },
  uploadButtonBusy: {
    opacity: 0.75,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  messageText: {
    color: "#BAE6FD",
    fontSize: 13,
    textAlign: "right",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    textAlign: "right",
  },
  listTitle: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 4,
  },
  loader: {
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(51, 65, 85, 0.55)",
  },
  itemThumb: {
    width: 54,
    height: 68,
    borderRadius: 10,
    backgroundColor: "#020617",
  },
  itemCopy: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  itemMeta: {
    color: "rgba(148, 163, 184, 0.95)",
    fontSize: 12,
    textAlign: "right",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(127, 29, 29, 0.35)",
  },
  emptyText: {
    color: "rgba(148, 163, 184, 0.95)",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
});
