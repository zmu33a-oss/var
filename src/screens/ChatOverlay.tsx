import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInput as TextInputHandle,
  useWindowDimensions,
  View,
} from "react-native";
import type { ChatMessage } from "../app.types";

const SHELL_WIDTH = 430;
const COMPOSER_HEIGHT = 58;
const VAR_CHAT_ICON = require("../../assets/icons/black.png");
const HILAL_ICON = require("../../assets/icons/alhilal.png.png");

type OverlayMessage = ChatMessage & {
  tone: "paper" | "highlight";
  width: string;
  offset: number;
  status?: string;
};

const INITIAL_MESSAGES: OverlayMessage[] = [
  {
    id: "bb-1",
    sender: "VAR",
    content: "يقول لي سيريزز يا أبوك شيء غيري\nيتكلم ❤️",
    time: "الآن",
    mine: false,
    tone: "paper",
    width: "82%",
    offset: 12,
    status: "✓",
  },
  {
    id: "bb-2",
    sender: "VAR",
    content: "أبو نواف: من الليلة قروب صرت ؟؟",
    time: "الآن",
    mine: false,
    tone: "paper",
    width: "74%",
    offset: 18,
    status: "✓",
  },
  {
    id: "bb-3",
    sender: "VAR",
    content: "جاك أبي أنا كنت مشغول",
    time: "الآن",
    mine: true,
    tone: "highlight",
    width: "64%",
    offset: 42,
  },
];

type ChatOverlayProps = {
  onClose: () => void;
};

export default function ChatOverlay(props: ChatOverlayProps) {
  const { height: viewportHeight } = useWindowDimensions();
  const [messages, setMessages] = useState<OverlayMessage[]>(INITIAL_MESSAGES);
  const [messageDraft, setMessageDraft] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const panelTranslateY = useRef(new Animated.Value(18)).current;
  const inputRef = useRef<TextInputHandle | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const keyboardHeightRef = useRef(0);
  const keyboardOpenRef = useRef(false);
  const viewportFrameRef = useRef<number | null>(null);
  const verticalInset = Math.max(20, Math.round(viewportHeight * 0.1));
  const composerLift = Math.max(0, keyboardHeight - verticalInset);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const rootStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const appElement = document.getElementById("root") || document.body;

    const previous = {
      rootOverflow: rootStyle.overflow,
      rootOverscroll: rootStyle.overscrollBehavior,
      bodyOverflow: bodyStyle.overflow,
      bodyPosition: bodyStyle.position,
      bodyTop: bodyStyle.top,
      bodyWidth: bodyStyle.width,
      appPosition: appElement.style.position,
      appTop: appElement.style.top,
      appW: appElement.style.width,
    };

    // Completely lock both body and html and move the scroll to a fixed root element so background can't move
    rootStyle.overflow = "hidden";
    rootStyle.overscrollBehavior = "none";
    bodyStyle.overflow = "hidden";
    bodyStyle.position = "fixed";

    const currentScroll = window.scrollY;

    // Instead of pushing body up, we lock the body and let the chat overlay render absolutely over it
    bodyStyle.top = `-${currentScroll}px`;
    bodyStyle.width = "100%";

    return () => {
      rootStyle.overflow = previous.rootOverflow;
      rootStyle.overscrollBehavior = previous.rootOverscroll;
      bodyStyle.overflow = previous.bodyOverflow;
      bodyStyle.position = previous.bodyPosition;
      bodyStyle.top = previous.bodyTop;
      bodyStyle.width = previous.bodyWidth;
      appElement.style.position = previous.appPosition;
      appElement.style.top = previous.appTop;
      appElement.style.width = previous.appW;
      window.scrollTo(0, currentScroll);
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(panelOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(panelTranslateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  }, [panelOpacity, panelTranslateY]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    if (keyboardHeight <= 0) {
      return;
    }

    scrollRef.current?.scrollToEnd({ animated: false });
  }, [keyboardHeight]);

  useEffect(() => {
    if (Platform.OS !== "web" || !window.visualViewport) return;
    const vp = window.visualViewport;

    const applyKeyboardHeight = (nextHeight: number) => {
      const normalizedHeight = nextHeight > 56 ? nextHeight : 0;

      if (Math.abs(normalizedHeight - keyboardHeightRef.current) <= 4) {
        return;
      }

      keyboardHeightRef.current = normalizedHeight;
      keyboardOpenRef.current = normalizedHeight > 0;
      setKeyboardHeight(normalizedHeight);
    };

    const measureViewport = () => {
      const windowHeight = window.innerHeight;
      const vpHeight = vp.height;
      const offsetTop = vp.offsetTop;
      const diff = Math.max(0, Math.round(windowHeight - vpHeight - offsetTop));

      applyKeyboardHeight(diff);

      if (diff > 0) {
        window.scrollTo(0, 0);
      }
    };

    const scheduleMeasure = () => {
      if (viewportFrameRef.current !== null) {
        cancelAnimationFrame(viewportFrameRef.current);
      }

      viewportFrameRef.current = requestAnimationFrame(() => {
        viewportFrameRef.current = null;
        measureViewport();
      });
    };

    let focusTimeout1: ReturnType<typeof setTimeout> | null = null;
    let focusTimeout2: ReturnType<typeof setTimeout> | null = null;
    let focusTimeout3: ReturnType<typeof setTimeout> | null = null;

    const clearFocusTimers = () => {
      if (focusTimeout1) clearTimeout(focusTimeout1);
      if (focusTimeout2) clearTimeout(focusTimeout2);
      if (focusTimeout3) clearTimeout(focusTimeout3);
      focusTimeout1 = null;
      focusTimeout2 = null;
      focusTimeout3 = null;
    };

    const handleFocusIn = () => {
      clearFocusTimers();
      scheduleMeasure();

      // Safari reports intermediate viewport sizes while the keyboard animates.
      focusTimeout1 = setTimeout(scheduleMeasure, 120);
      focusTimeout2 = setTimeout(scheduleMeasure, 260);
      focusTimeout3 = setTimeout(scheduleMeasure, 420);
    };

    const handleFocusOut = () => {
      clearFocusTimers();
      keyboardOpenRef.current = false;
      applyKeyboardHeight(0);
      window.scrollTo(0, 0);

      focusTimeout1 = setTimeout(scheduleMeasure, 80);
      focusTimeout2 = setTimeout(scheduleMeasure, 180);
    };

    vp.addEventListener("resize", scheduleMeasure);
    vp.addEventListener("scroll", scheduleMeasure);
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    scheduleMeasure();

    return () => {
      clearFocusTimers();

      if (viewportFrameRef.current !== null) {
        cancelAnimationFrame(viewportFrameRef.current);
        viewportFrameRef.current = null;
      }

      vp.removeEventListener("resize", scheduleMeasure);
      vp.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  const dismissKeyboard = () => {
    setIsInputFocused(false);
    keyboardOpenRef.current = false;
    keyboardHeightRef.current = 0;
    setKeyboardHeight(0);
    inputRef.current?.blur();
    Keyboard.dismiss();

    if (Platform.OS === "web") {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
    }
  };

  const sendMessage = () => {
    const trimmedMessage = messageDraft.trim();
    if (!trimmedMessage) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `chat-${Date.now()}`,
        sender: "VAR",
        content: trimmedMessage,
        time: "الآن",
        mine: true,
        tone: "highlight",
        width: "68%",
        offset: 56,
      },
    ]);
    setMessageDraft("");
  };

  return (
    <View style={[styles.chatOverlayWrap]}>
      <Pressable style={styles.chatBackdrop} onPress={dismissKeyboard} />

      <Animated.View
        style={[
          styles.chatShellWrap,
          {
            marginTop: verticalInset,
            marginBottom: verticalInset + composerLift,
            opacity: panelOpacity,
            transform: [{ translateY: panelTranslateY }],
          },
        ]}
      >
        <View style={styles.chatShell}>
          <View style={styles.chatHeader}>
            <Pressable
              style={styles.chatHeaderLogoButton}
              onPress={props.onClose}
            >
              <Image
                source={VAR_CHAT_ICON}
                resizeMode="contain"
                style={styles.chatHeaderLogo}
              />
            </Pressable>

            <Text style={styles.chatHeaderTitle}>قروب الهلال</Text>

            <View style={styles.chatHeaderAvatarWrap}>
              <Image
                source={HILAL_ICON}
                resizeMode="contain"
                style={styles.chatHeaderAvatar}
              />
            </View>
          </View>

          <View style={styles.chatBody}>
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              style={styles.chatConversationScroll}
              contentContainerStyle={[
                styles.chatConversation,
                {
                  paddingBottom: 16,
                },
              ]}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.chatBubbleRow,
                    {
                      width: message.width,
                      marginLeft: message.offset,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.chatBubble,
                      message.tone === "highlight"
                        ? styles.chatBubbleHighlight
                        : styles.chatBubblePaper,
                    ]}
                  >
                    {message.status ? (
                      <Text style={styles.chatBubbleStatus}>
                        {message.status}
                      </Text>
                    ) : null}
                    <Text style={styles.chatBubbleText}>{message.content}</Text>
                    <View
                      style={[
                        styles.chatBubbleTail,
                        message.tone === "highlight"
                          ? styles.chatBubbleTailHighlight
                          : styles.chatBubbleTailPaper,
                      ]}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.chatComposerDock}>
              <View style={styles.chatComposer}>
                <Pressable
                  style={styles.chatEmojiButton}
                  onPress={dismissKeyboard}
                >
                  <Text style={styles.chatEmojiText}>🙂</Text>
                </Pressable>

                <View
                  style={[
                    styles.chatComposerInputWrap,
                    isInputFocused ? styles.chatComposerInputWrapFocused : null,
                  ]}
                >
                  <TextInput
                    ref={inputRef}
                    value={messageDraft}
                    onChangeText={setMessageDraft}
                    onFocus={() => {
                      setIsInputFocused(true);
                    }}
                    onBlur={() => setIsInputFocused(false)}
                    onSubmitEditing={sendMessage}
                    returnKeyType="send"
                    blurOnSubmit={false}
                    autoCorrect={false}
                    spellCheck={false}
                    placeholder=""
                    placeholderTextColor="rgba(0,0,0,0.32)"
                    selectionColor="#0E63D7"
                    style={styles.chatComposerInput}
                    textAlign="right"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  chatOverlayWrap: {
    ...Platform.select({
      web: { position: "fixed" as any },
      default: StyleSheet.absoluteFillObject,
    }),
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
  },
  chatBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.84)",
  },
  chatShellWrap: {
    flex: 1,
    width: "100%",
    maxWidth: SHELL_WIDTH,
    alignSelf: "center",
  },
  chatShell: {
    flex: 1,
    backgroundColor: "#030303",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.46)",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: "hidden",
  },
  chatHeader: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    backgroundColor: "#020202",
  },
  chatHeaderLogoButton: {
    width: 42,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  chatHeaderLogo: {
    width: 30,
    height: 30,
  },
  chatHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  chatHeaderAvatarWrap: {
    width: 38,
    height: 32,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  chatHeaderAvatar: {
    width: 32,
    height: 32,
  },
  chatBody: {
    flex: 1,
    position: "relative",
  },
  chatConversationScroll: {
    flex: 1,
  },
  chatConversation: {
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#030303",
  },
  chatBubbleRow: {
    marginBottom: 8,
  },
  chatBubble: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    borderWidth: 1,
    position: "relative",
  },
  chatBubblePaper: {
    backgroundColor: "#E8E9E2",
    borderColor: "#BFC1B8",
  },
  chatBubbleHighlight: {
    backgroundColor: "#CBEAF8",
    borderColor: "#94BFCD",
  },
  chatBubbleStatus: {
    position: "absolute",
    top: 4,
    right: 6,
    color: "#545454",
    fontSize: 11,
    fontWeight: "900",
  },
  chatBubbleText: {
    color: "#111111",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "right",
  },
  chatBubbleTail: {
    position: "absolute",
    left: 10,
    bottom: -5,
    width: 10,
    height: 10,
    transform: [{ rotate: "45deg" }],
    borderLeftWidth: 1,
    borderBottomWidth: 1,
  },
  chatBubbleTailPaper: {
    backgroundColor: "#E8E9E2",
    borderLeftColor: "#BFC1B8",
    borderBottomColor: "#BFC1B8",
  },
  chatBubbleTailHighlight: {
    backgroundColor: "#CBEAF8",
    borderLeftColor: "#94BFCD",
    borderBottomColor: "#94BFCD",
  },
  chatComposer: {
    minHeight: COMPOSER_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.26)",
    backgroundColor: "#020202",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chatComposerDock: {
    marginTop: "auto",
  },
  chatEmojiButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  chatEmojiText: {
    fontSize: 28,
    lineHeight: 30,
  },
  chatComposerInputWrap: {
    flex: 1,
    minHeight: 38,
    backgroundColor: "#FCFCFC",
    borderWidth: 1,
    borderColor: "#C3C6CC",
    borderRadius: 7,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  chatComposerInputWrapFocused: {
    borderColor: "#0F63D7",
    borderWidth: 2,
  },
  chatComposerInput: {
    flex: 1,
    minHeight: 30,
    color: "#111111",
    paddingHorizontal: 0,
    fontSize: 16,
    paddingVertical: 4,
  },
});
