import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { Post } from "../../app.types";
import RetweetIcon from "../../components/RetweetIcon";

export function XRepostConfirmModal(props: {
  post: Post | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [canDismissBackdrop, setCanDismissBackdrop] = useState(false);

  useEffect(() => {
    if (!props.post) {
      setCanDismissBackdrop(false);
      return;
    }

    setCanDismissBackdrop(false);
    const timer = setTimeout(() => {
      setCanDismissBackdrop(true);
    }, 160);

    return () => {
      clearTimeout(timer);
    };
  }, [props.post]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={Boolean(props.post)}
      onRequestClose={props.onCancel}
      statusBarTranslucent
    >
      <View style={styles.host}>
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (canDismissBackdrop) {
              props.onCancel();
            }
          }}
        />

        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <RetweetIcon size={30} color="#6DE5AA" />
          </View>

          <Text style={styles.title}>
            هل أنت متأكد من إعادة نشر هذه الرسالة؟
          </Text>

          <View style={styles.actions}>
            <Pressable style={styles.noButton} onPress={props.onCancel}>
              <Text style={styles.noButtonText}>لا</Text>
            </Pressable>

            <Pressable style={styles.yesButton} onPress={props.onConfirm}>
              <Text style={styles.yesButtonText}>نعم</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    zIndex: 100000,
    elevation: 100000,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111114",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: "center",
    zIndex: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(109,229,170,0.12)",
    marginBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 20,
  },
  actions: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    gap: 10,
  },
  yesButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6DE5AA",
  },
  yesButtonText: {
    color: "#052E1B",
    fontSize: 15,
    fontWeight: "900",
  },
  noButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  noButtonText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 15,
    fontWeight: "800",
  },
});
