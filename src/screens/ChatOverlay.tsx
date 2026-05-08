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
  const [vpHeight, setVpHeight] = useState(viewportHeight);
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const panelTranslateY = useRef(new Animated.Value(18)).current;
  const inputRef = useRef<TextInputHandle | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const verticalInset = Math.max(20, Math.round(vpHeight * 0.1));

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const rootStyle = document.documentElement.style;
    const bodyStyle = document.body.style;

    const prevRootOverflow = rootStyle.overflow;
    const prevRootOverscroll = rootStyle.overscrollBehavior;
    const prevBodyOverflow = bodyStyle.overflow;
    const prevBodyPosition = bodyStyle.position;
    const prevBodyTop = bodyStyle.top;
    const prevBodyWidth = bodyStyle.width;

    rootStyle.overflow = "hidden";
    rootStyle.overscrollBehavior = "none";
    bodyStyle.overflow = "hidden";
    bodyStyle.position = "fixed";
    bodyStyle.top = "0px";
    bodyStyle.width = "100%";

    return () => {
      rootStyle.overflow = prevRootOverflow;
      rootStyle.overscrollBehavior = prevRootOverscroll;
      bodyStyle.overflow = prevBodyOverflow;
      bodyStyle.position = prevBodyPosition;
      bodyStyle.top = prevBodyTop;
      bodyStyle.width = prevBodyWidth;
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
    if (Platform.OS !== "web" || !window.visualViewport) return;
    const vp = window.visualViewport;
    const onResize = () => setVpHeight(Math.round(vp.height));
    vp.addEventListener("resize", onResize);
    // Initialize with current visual height
    setVpHeight(Math.round(vp.height));
    return () => vp.removeEventListener("resize", onResize);
  }, []);

  const dismissKeyboard = () => {
    setIsInputFocused(false);
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
    <View
      style={[
        styles.chatOverlayWrap,
        Platform.OS === "web"
          ? { top: 0, height: vpHeight, bottom: undefined as any }
          : null,
      ]}
    >
      <Pressable style={styles.chatBackdrop} onPress={dismissKeyboard} />

      <Animated.View
        style={[
          styles.chatShellWrap,
          {
            marginTop: verticalInset,
            marginBottom: verticalInset,
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
