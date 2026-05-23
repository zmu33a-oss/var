/**
 * ChatOverlay — محادثة خاصة
 *
 * مبدأ الحل (يحاكي WhatsApp / Telegram على المتصفح):
 *   1) لا نُعطّل الـ TextInput أبداً (editable يبقى true دائماً)،
 *      حتى لا يفقد الـ focus → فيغلق الكيبورد.
 *   2) أزرار الإرسال/المرفقات على web لا تسرق الـ focus من الـ input:
 *      نمنع السلوك الافتراضي على mousedown/pointerdown قبل أن يحوّل
 *      المتصفح الـ focus إلى الزر. النتيجة: الـ input يبقى مركّزاً والكيبورد
 *      يظل مفتوحاً حتى أثناء الإرسال وبعده.
 *   3) لا نعتمد على إعادة .focus() بعد await، لأن المتصفحات على الجوال
 *      ترفض فتح الكيبورد خارج user gesture.
 */

import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  type TextInput as TextInputHandle,
  View,
  type ImageStyle,
} from "react-native";
import type { MessageThreadEntry, PrivateMessageEntry } from "./x-feed/x-feed.types";

export type ChatOverlayProps = {
  thread: MessageThreadEntry | null;
  isSending: boolean;
  onSend: (message: string) => Promise<boolean>;
  onClose: () => void;
};

type DisplayMessage = PrivateMessageEntry & { mine: boolean };

const HEADER_H = 58;
const STATUS_BAR_H = Platform.OS === "ios" ? 52 : (StatusBar.currentHeight ?? 24) + 8;

const IS_WEB = Platform.OS === "web";

/**
 * Hook صغير: يربط ref إلى عنصر تفاعلي ويمنع سرقة الـ focus على الويب
 * عند الضغط (mousedown / pointerdown / touchstart). هذا يحافظ على
 * الـ focus داخل الـ TextInput فلا يغلق الكيبورد.
 */
function useKeepInputFocusOnWeb() {
  const ref = useRef<View | null>(null);

  useEffect(() => {
    if (!IS_WEB) return;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node) return;

    const preventBlur = (event: Event) => {
      event.preventDefault();
    };

    node.addEventListener("mousedown", preventBlur);
    node.addEventListener("pointerdown", preventBlur);

    return () => {
      node.removeEventListener("mousedown", preventBlur);
      node.removeEventListener("pointerdown", preventBlur);
    };
  }, []);

  return ref;
}

function MessageBubble({ msg }: { msg: DisplayMessage }) {
  return (
    <View style={[styles.bubbleRow, msg.mine ? styles.rowMe : styles.rowPeer]}>
      <View style={[styles.bubble, msg.mine ? styles.bubbleMe : styles.bubblePeer]}>
        <Text style={[styles.bubbleText, msg.mine ? styles.textMe : styles.textPeer]}>
          {msg.content}
        </Text>
        {msg.timeLabel ? (
          <Text style={[styles.timeLabel, msg.mine ? styles.timeMe : styles.timePeer]}>
            {msg.timeLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function ChatOverlay({ thread, isSending, onSend, onClose }: ChatOverlayProps) {
  const [draft, setDraft] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<TextInputHandle | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  const sendBtnRef = useKeepInputFocusOnWeb();
  const attachBtnRef = useKeepInputFocusOnWeb();

  const messages: DisplayMessage[] = thread
    ? thread.messages.map((m) => ({ ...m, mine: m.sender === "me" }))
    : [];

  useEffect(() => {
    setDraft("");
    setIsFocused(false);
  }, [thread?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending) return;

    setDraft("");

    const ok = await onSend(text);
    if (!ok) {
      setDraft(text);
    }
  };

  const canSend = Boolean(draft.trim()) && !isSending;

  if (!thread) {
    return (
      <Modal visible={false} animationType="slide" presentationStyle="fullScreen">
        <View />
      </Modal>
    );
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />

      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* الهيدر — ثابت لا يتحرك مع الكيبورد */}
        <View style={[styles.header, { paddingTop: STATUS_BAR_H }]}>
          <Pressable style={styles.cancelPill} onPress={onClose} hitSlop={10}>
            <Text style={styles.cancelPillText}>الغاء</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {thread.displayVarId} {thread.displayName}
            </Text>
          </View>

          <View style={styles.avatarWrap}>
            {thread.avatarUri ? (
              <Image
                source={{ uri: thread.avatarUri }}
                style={styles.avatarImg as ImageStyle}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarLetter}>
                  {thread.displayName.charAt(0).toUpperCase() || "V"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* منطقة الرسائل — تتمرر وحدها */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageArea}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
        >
          {messages.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                ابدأ محادثتك مع{" "}
                <Text style={styles.emptyName}>{thread.displayName}</Text>
              </Text>
            </View>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} msg={m} />)
          )}
        </ScrollView>

        {/* شريط الإدخال — يرتفع مع الكيبورد ويبقى ثابتاً بعد الإرسال */}
        <View style={styles.composer}>
          <View style={styles.brandRow}>
            <Text style={styles.brandVar}>VAR</Text>
            <Text style={styles.brandPost}> BOST</Text>
          </View>

          <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
            <Pressable
              ref={sendBtnRef}
              style={[styles.sendBtn, canSend && styles.sendBtnActive]}
              onPress={() => {
                void handleSend();
              }}
              disabled={!canSend}
              hitSlop={6}
            >
              <Text style={styles.sendBtnText}>ارسال</Text>
            </Pressable>

            <Pressable ref={attachBtnRef} style={styles.attachBtn} hitSlop={8}>
              <Ionicons
                name="attach"
                size={22}
                color="#FFFFFF"
                style={styles.attachIcon}
              />
            </Pressable>

            <TextInput
              ref={inputRef}
              value={draft}
              onChangeText={setDraft}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={() => {
                void handleSend();
              }}
              returnKeyType="send"
              blurOnSubmit={false}
              multiline
              autoCorrect={false}
              style={styles.input}
              textAlign="right"
              placeholder="اكتب رسالتك..."
              placeholderTextColor="rgba(255,255,255,0.36)"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },

  /* ───── الهيدر ───── */
  header: {
    flexShrink: 0,
    minHeight: HEADER_H,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: "#000000",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.14)",
  },
  cancelPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    minWidth: 64,
    alignItems: "center",
  },
  cancelPillText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "700",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  /* ───── الرسائل ───── */
  messageArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  messageContent: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
  },
  emptyText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
    textAlign: "center",
  },
  emptyName: {
    color: "rgba(255,255,255,0.65)",
    fontWeight: "700",
  },

  /* ───── فقاعات الرسائل ───── */
  bubbleRow: {
    marginBottom: 8,
    flexDirection: "row",
  },
  rowMe: {
    justifyContent: "flex-end",
  },
  rowPeer: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: "#1D4ED8",
    borderBottomRightRadius: 4,
  },
  bubblePeer: {
    backgroundColor: "#141414",
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "right",
  },
  textMe: {
    color: "#FFFFFF",
  },
  textPeer: {
    color: "#F2F2F2",
  },
  timeLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  timeMe: {
    color: "rgba(255,255,255,0.5)",
  },
  timePeer: {
    color: "rgba(255,255,255,0.35)",
  },

  /* ───── شريط الإدخال ───── */
  composer: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    backgroundColor: "#000000",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "baseline",
    marginBottom: 8,
  },
  brandVar: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.4,
  },
  brandPost: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.2,
  },
  inputRow: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  inputRowFocused: {
    borderColor: "rgba(255,255,255,0.9)",
  },
  sendBtn: {
    minWidth: 58,
    height: 36,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginRight: 6,
  },
  sendBtnActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  attachBtn: {
    width: 32,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  attachIcon: {
    transform: [{ rotate: "90deg" }],
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 4,
    paddingVertical: 6,
    textAlign: "right",
  },
});
