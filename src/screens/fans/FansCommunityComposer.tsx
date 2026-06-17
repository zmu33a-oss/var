import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createCompatStyleSheet } from "../../lib/crossPlatformStyles";
import { useKeyboardInset } from "../../lib/useKeyboardInset";
import { FANS_BOTTOM_NAV_RESERVE } from "./fans.layout.constants";

const COMPOSER_RESTING_BOTTOM = FANS_BOTTOM_NAV_RESERVE - 14;
const KEYBOARD_GAP = 6;

type FansCommunityComposerProps = {
  isLoggedIn: boolean;
  canPost: boolean;
  activeClubTitle: string;
  onRequireAuth: (message?: string) => void;
  onSend: (text: string) => void;
};

/** شريط الكتابة — نفس أسلوب شات X أسفل الصفحة. */
export default function FansCommunityComposer(props: FansCommunityComposerProps) {
  const [draft, setDraft] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const keyboardInset = useKeyboardInset();

  const hostBottom = useMemo(() => {
    if (keyboardInset > 0) {
      return keyboardInset + KEYBOARD_GAP;
    }

    return COMPOSER_RESTING_BOTTOM;
  }, [keyboardInset]);

  const handleSend = () => {
    if (!props.isLoggedIn) {
      props.onRequireAuth("سجّل الدخول للمشاركة في مجتمع الرابطة.");
      return;
    }

    if (!props.canPost) {
      Alert.alert(
        "وضع المشاهدة",
        `أضف ${props.activeClubTitle || "هذا النادي"} في بروفايلك لتتمكن من المشاركة.`,
        [{ text: "حسناً", style: "default" }],
      );
      return;
    }

    if (!draft.trim()) return;

    const text = draft.trim();
    setDraft("");
    props.onSend(text);
  };

  const isReadOnly = props.isLoggedIn && !props.canPost;

  return (
    <View style={[styles.host, { bottom: hostBottom }]}>
      {isReadOnly ? (
        <View style={styles.root}>
          <View style={styles.readonlyBar}>
            <Ionicons name="eye-outline" size={16} color="rgba(255,255,255,0.45)" />
            <Text style={styles.readonlyText}>
              أنت في وضع المشاهدة — أضف{" "}
              <Text style={styles.readonlyClub}>
                {props.activeClubTitle || "هذا النادي"}
              </Text>
              {" "}في بروفايلك للمشاركة
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.root}>
          <View
            style={[styles.inputRow, isFocused ? styles.inputRowFocused : null]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إرفاق"
              style={({ pressed }) => [
                styles.attachButton,
                pressed && styles.iconButtonPressed,
              ]}
              onPress={() => {
                if (!props.isLoggedIn) {
                  props.onRequireAuth("سجّل الدخول للمشاركة في مجتمع الرابطة.");
                }
              }}
            >
              <Ionicons name="attach" size={20} color="#F97316" />
            </Pressable>

            <TextInput
              value={draft}
              onChangeText={setDraft}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="ملتقى الرابطة"
              placeholderTextColor="rgba(255,255,255,0.38)"
              style={styles.input}
              textAlign="right"
              multiline
              maxLength={280}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إرسال"
              style={({ pressed }) => [
                styles.sendButton,
                pressed && styles.iconButtonPressed,
              ]}
              onPress={handleSend}
            >
              <Ionicons name="arrow-up" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = createCompatStyleSheet({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 25,
  },
  root: {
    paddingHorizontal: 14,
    paddingTop: 3,
    paddingBottom: Platform.OS === "ios" ? 6 : 4,
    backgroundColor: "#000000",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  inputRow: {
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "#141414",
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  inputRowFocused: {
    borderColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    minHeight: 20,
    maxHeight: 96,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 17,
    paddingHorizontal: 6,
    paddingTop: Platform.OS === "ios" ? 3 : 2,
    paddingBottom: Platform.OS === "ios" ? 1 : 0,
  },
  attachButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPressed: {
    opacity: 0.82,
  },
  readonlyBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  readonlyText: {
    flex: 1,
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    lineHeight: 18,
  },
  readonlyClub: {
    color: "#F97316",
    fontWeight: "800",
  },
});
