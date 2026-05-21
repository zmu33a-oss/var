/**
 * ChatOverlay — محادثة خاصة (واتساب / تلغرام)
 * الهيدر ثابت · الشات يتمرر · شريط الإدخال يرتفع مع الكيبورد
 */

import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import {
  Image,
  Keyboard,
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
  draft: string;
  onDraftChange: (text: string) => void;
  onSend: () => Promise<void>;
  onClose: () => void;
};

type DisplayMessage = PrivateMessageEntry & { mine: boolean };

const HEADER_H = 58;
const COMPOSER_BLOCK_H = 96;

function BlinkingCursor({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1, { duration: 520, easing: Easing.steps(1) }),
          withTiming(0, { duration: 0 }),
          withTiming(0, { duration: 520, easing: Easing.steps(1) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(opacity);
      opacity.value = 1;
    }
  }, [visible, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return <Animated.View style={[styles.cursor, style]} />;
}

function MessageBubble({ message }: { message: DisplayMessage }) {
  return (
    <View
      style={[
        styles.bubbleRow,
        message.mine ? styles.bubbleRowMe : styles.bubbleRowPeer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          message.mine ? styles.bubbleMe : styles.bubblePeer,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            message.mine ? styles.bubbleTextMe : styles.bubbleTextPeer,
          ]}
        >
          {message.content}
        </Text>
        {message.timeLabel ? (
          <Text
            style={[
              styles.bubbleTime,
              message.mine ? styles.bubbleTimeMe : styles.bubbleTimePeer,
            ]}
          >
            {message.timeLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function ChatOverlay(props: ChatOverlayProps) {
  const { thread, isSending, draft, onDraftChange, onSend, onClose } = props;

  const [isFocused, setIsFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const inputRef = useRef<TextInputHandle | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const keyboardHRef = useRef(0);
  const vpFrameRef = useRef<number | null>(null);
  const wasSendingRef = useRef(false);

  const messages: DisplayMessage[] = thread
    ? thread.messages.map((m) => ({ ...m, mine: m.sender === "me" }))
    : [];

  useEffect(() => {
    if (Platform.OS === "web") return;

    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!thread) return;
    if (typeof window === "undefined" || !window.visualViewport) return;

    const vp = window.visualViewport;

    const measure = () => {
      if (vpFrameRef.current !== null) cancelAnimationFrame(vpFrameRef.current);
      vpFrameRef.current = requestAnimationFrame(() => {
        vpFrameRef.current = null;
        const diff = Math.max(
          0,
          Math.round(window.innerHeight - vp.height - vp.offsetTop),
        );
        const next = diff > 48 ? diff : 0;
        if (Math.abs(next - keyboardHRef.current) > 4) {
          keyboardHRef.current = next;
          setKeyboardHeight(next);
        }
      });
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName !== "INPUT" && target?.tagName !== "TEXTAREA") return;
      measure();
      setTimeout(measure, 120);
      setTimeout(measure, 280);
    };

    const onFocusOut = () => {
      keyboardHRef.current = 0;
      setKeyboardHeight(0);
    };

    vp.addEventListener("resize", measure);
    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);

    return () => {
      if (vpFrameRef.current !== null) cancelAnimationFrame(vpFrameRef.current);
      vp.removeEventListener("resize", measure);
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
    };
  }, [thread]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  useEffect(() => {
    if (keyboardHeight > 0) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [keyboardHeight]);

  useEffect(() => {
    if (wasSendingRef.current && !isSending) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
      wasSendingRef.current = isSending;
      return () => clearTimeout(timer);
    }

    wasSendingRef.current = isSending;
  }, [isSending]);

  const dismissKeyboard = () => {
    inputRef.current?.blur();
    if (Platform.OS !== "web") {
      Keyboard.dismiss();
      return;
    }

    if (typeof document !== "undefined") {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
    }
  };

  const handleSend = () => {
    if (!draft.trim() || isSending) return;
    void onSend();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  };

  // المؤشر يعمل فور فتح المحادثة ولا يتوقف إلا أثناء الإرسال
  const showCursor = !isSending;
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
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.root}>
        {/* هيدر ثابت — لا يتحرك مع الكيبورد */}
        <View style={styles.header}>
          <Pressable style={styles.cancelPill} onPress={onClose} hitSlop={10}>
            <Text style={styles.cancelPillText}>إلغاء</Text>
          </Pressable>

          <View style={styles.headerIdentity}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {thread.displayVarId} {thread.displayName}
            </Text>
          </View>

          <View style={styles.headerAvatar}>
            {thread.avatarUri ? (
              <Image
                source={{ uri: thread.avatarUri }}
                style={styles.headerAvatarImg as ImageStyle}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Text style={styles.headerAvatarLetter}>
                  {thread.displayName.charAt(0).toUpperCase() || "V"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* منطقة الشات — تتقلص عند فتح الكيبورد */}
        <View style={styles.chatColumn}>
          <ScrollView
            ref={scrollRef}
            style={styles.messageScroll}
            contentContainerStyle={[
              styles.messageContent,
              { paddingBottom: COMPOSER_BLOCK_H + 12 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="never"
            onTouchEnd={dismissKeyboard}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  ابدأ محادثتك مع{" "}
                  <Text style={styles.emptyName}>{thread.displayName}</Text>
                </Text>
              </View>
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} />)
            )}
          </ScrollView>

          {/* شريط الإدخال — يرتفع فوق الكيبورد */}
          <View
            style={[
              styles.composerDock,
              { paddingBottom: Math.max(keyboardHeight, 14) },
            ]}
          >
            <View style={styles.brandRow}>
              <Text style={styles.brandVar}>VAR</Text>
              <Text style={styles.brandPost}> POST</Text>
            </View>

            <View
              style={[
                styles.inputWrap,
                isFocused && styles.inputWrapFocused,
              ]}
            >
              <Pressable
                style={[
                  styles.sendBtn,
                  canSend && styles.sendBtnActive,
                ]}
                onPress={handleSend}
                disabled={!canSend}
                hitSlop={6}
                focusable={false}
              >
                <Text style={styles.sendBtnText}>ارسال</Text>
              </Pressable>

              <Pressable style={styles.attachBtn} hitSlop={8}>
                <Ionicons
                  name="attach"
                  size={22}
                  color="#FFFFFF"
                  style={styles.attachIcon}
                />
              </Pressable>

              <View style={styles.inputFieldArea}>
                <View style={styles.inputVisual} pointerEvents="none">
                  <View style={styles.textAndCursor}>
                    <BlinkingCursor visible={showCursor} />
                    {draft.length > 0 ? (
                      <Text
                        style={styles.inputDisplayText}
                        numberOfLines={4}
                      >
                        {draft}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <TextInput
                  ref={inputRef}
                  value={draft}
                  onChangeText={onDraftChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  multiline
                  autoCorrect={false}
                  editable
                  caretHidden
                  style={styles.inputOverlay}
                  textAlign="right"
                  placeholder=""
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },

  header: {
    height: HEADER_H,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#000000",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.14)",
    zIndex: 20,
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
  headerIdentity: {
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
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  headerAvatarImg: {
    width: "100%",
    height: "100%",
  },
  headerAvatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerAvatarLetter: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  chatColumn: {
    flex: 1,
    backgroundColor: "#000000",
  },

  messageScroll: {
    flex: 1,
  },
  messageContent: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  emptyState: {
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

  bubbleRow: {
    marginBottom: 8,
    flexDirection: "row",
  },
  bubbleRowMe: {
    justifyContent: "flex-end",
  },
  bubbleRowPeer: {
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
  bubbleTextMe: {
    color: "#FFFFFF",
  },
  bubbleTextPeer: {
    color: "#F2F2F2",
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  bubbleTimeMe: {
    color: "rgba(255,255,255,0.5)",
  },
  bubbleTimePeer: {
    color: "rgba(255,255,255,0.35)",
  },

  composerDock: {
    paddingHorizontal: 14,
    paddingTop: 4,
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

  inputWrap: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#FFFFFF",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 1px 10px rgba(255,255,255,0.1)",
        } as object)
      : null),
  },
  inputWrapFocused: {
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
    ...Platform.select({
      ios: {
        shadowColor: "#FFFFFF",
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 1px 8px rgba(255,255,255,0.08)",
        } as object)
      : null),
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

  inputFieldArea: {
    flex: 1,
    minHeight: 36,
    justifyContent: "center",
  },
  inputVisual: {
    minHeight: 28,
    justifyContent: "center",
    paddingRight: 4,
    paddingLeft: 2,
  },
  textAndCursor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    alignSelf: "stretch",
    width: "100%",
    minHeight: 28,
  },
  cursor: {
    width: 6,
    height: 26,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
    marginRight: 3,
    flexShrink: 0,
  },
  inputDisplayText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "right",
    flexShrink: 1,
  },
  inputOverlay: {
    ...StyleSheet.absoluteFillObject,
    color: "transparent",
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 4,
    paddingVertical: 4,
    textAlign: "right",
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          caretColor: "transparent",
        } as object)
      : null),
  },
});
