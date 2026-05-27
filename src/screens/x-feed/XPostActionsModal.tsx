import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Post } from "../../app.types";

export function XPostActionsModal(props: {
  post: Post | null;
  isOwner: boolean;
  onClose: () => void;
  onDelete: (post: Post) => void;
  onSaveEdit: (post: Post, content: string) => void;
  onReport: (post: Post) => void;
}) {
  const [mode, setMode] = useState<"menu" | "edit">("menu");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!props.post) {
      setMode("menu");
      setDraft("");
      return;
    }

    setDraft(props.post.content);
    setMode("menu");
  }, [props.post]);

  if (!props.post) {
    return null;
  }

  const post = props.post;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={Boolean(post)}
      onRequestClose={props.onClose}
    >
      <Pressable style={styles.backdrop} onPress={props.onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          {mode === "edit" ? (
            <>
              <Text style={styles.title}>تعديل المنشور</Text>
              <TextInput
                multiline
                value={draft}
                onChangeText={setDraft}
                style={styles.input}
                textAlign="right"
                placeholder="اكتب محتوى المنشور..."
                placeholderTextColor="rgba(255,255,255,0.36)"
              />
              <View style={styles.row}>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => setMode("menu")}
                >
                  <Text style={styles.secondaryBtnText}>رجوع</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.primaryBtn,
                    !draft.trim() ? styles.btnDisabled : null,
                  ]}
                  disabled={!draft.trim()}
                  onPress={() => props.onSaveEdit(post, draft.trim())}
                >
                  <Text style={styles.primaryBtnText}>حفظ</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>خيارات المنشور</Text>
              {props.isOwner ? (
                <>
                  <ActionRow
                    icon="create-outline"
                    label="تعديل"
                    onPress={() => setMode("edit")}
                  />
                  <ActionRow
                    icon="trash-outline"
                    label="حذف"
                    tone="danger"
                    onPress={() => props.onDelete(post)}
                  />
                </>
              ) : (
                <ActionRow
                  icon="flag-outline"
                  label="إبلاغ"
                  tone="danger"
                  onPress={() => props.onReport(post)}
                />
              )}
              <Pressable style={styles.cancelBtn} onPress={props.onClose}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ActionRow(props: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: "default" | "danger";
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionRow} onPress={props.onPress}>
      <Ionicons
        name={props.icon}
        size={18}
        color={props.tone === "danger" ? "#F87171" : "#FFFFFF"}
      />
      <Text
        style={[
          styles.actionLabel,
          props.tone === "danger" ? styles.actionLabelDanger : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#111114",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 8,
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  actionLabelDanger: {
    color: "#F87171",
  },
  cancelBtn: {
    marginTop: 8,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cancelBtnText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "800",
  },
  input: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 14,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D9BF0",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  secondaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  btnDisabled: {
    opacity: 0.45,
  },
});
