import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { XFeedTab } from "../screens/x-feed/x-feed.types";

const SHELL_WIDTH = 430;
const VAR_WORDMARK_ICON = require("../../assets/icons/var.png");

type XFeedHeaderProps = {
  windowWidth: number;
  activeTab: XFeedTab;
  onChangeTab: (tab: XFeedTab) => void;
  notificationCount?: number;
  notificationsActive?: boolean;
  onOpenNotifications?: () => void;
};

export default function XFeedHeader(props: XFeedHeaderProps) {
  const layoutWidth = Math.min(props.windowWidth, SHELL_WIDTH);
  const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / SHELL_WIDTH));
  const xTopBarPaddingTop = Math.round(44 * chromeScale);
  const xTopBarPaddingHorizontal = Math.round(12 * chromeScale);
  const xTopBarPaddingBottom = Math.max(10, Math.round(10 * chromeScale));
  const xTopBarItemSize = Math.round(36 * chromeScale);
  const xTopBarIconSize = Math.round(13 * chromeScale);
  const xHeaderLogoFrameWidth = Math.round(118 * chromeScale);
  const xHeaderLogoFrameHeight = Math.round(28 * chromeScale);
  const xHeaderLogoImageWidth = Math.round(132 * chromeScale);
  const xHeaderLogoImageHeight = Math.round(82 * chromeScale);
  const xHeaderModePillHeight = Math.round(24 * chromeScale);
  const normalizedNotificationCount = Math.max(0, props.notificationCount ?? 0);
  const isNotificationButtonActive = props.notificationsActive ?? false;

  return (
    <>
      <View
        style={[
          styles.xTopBar,
          {
            paddingTop: xTopBarPaddingTop,
            paddingHorizontal: xTopBarPaddingHorizontal,
            paddingBottom: xTopBarPaddingBottom,
          },
        ]}
      >
        <Pressable
          style={[
            styles.xTopBarChatButton,
            isNotificationButtonActive ? styles.xTopBarChatButtonActive : null,
            { width: xTopBarItemSize, height: xTopBarItemSize },
          ]}
          onPress={
            props.onOpenNotifications
              ? props.onOpenNotifications
              : undefined
          }
          disabled={!props.onOpenNotifications}
        >
          <View style={styles.xTopBarChatBubble}>
            <Text style={styles.xTopBarChatBubbleText}>VAR</Text>
            <View style={styles.xTopBarChatBubbleTail} />
          </View>

          {normalizedNotificationCount ? (
            <View style={styles.xTopBarBadge}>
              <Text style={styles.xTopBarBadgeText}>
                {normalizedNotificationCount > 9
                  ? "+9"
                  : normalizedNotificationCount}
              </Text>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.xTopBarCenter}>
          <View
            style={[
              styles.xHeaderModePill,
              { minHeight: xHeaderModePillHeight },
            ]}
          >
            <Ionicons name="close" size={xTopBarIconSize} color="#FFFFFF" />
            <Text style={styles.xHeaderModePillText}>VAR X</Text>
          </View>

          <View
            style={[
              styles.xHeaderLogoFrame,
              {
                width: xHeaderLogoFrameWidth,
                height: xHeaderLogoFrameHeight,
              },
            ]}
          >
            <Image
              source={VAR_WORDMARK_ICON}
              resizeMode="contain"
              style={[
                styles.xHeaderLogoImage,
                {
                  width: xHeaderLogoImageWidth,
                  height: xHeaderLogoImageHeight,
                },
              ]}
            />
          </View>
        </View>

        <View
          style={[
            styles.xTopBarSpacer,
            { width: xTopBarItemSize, height: xTopBarItemSize },
          ]}
        />
      </View>

      <View style={styles.xTabsBar}>
        <View style={styles.xTabsInner}>
          <XHomeTab
            label="ملفك"
            active={props.activeTab === "profile"}
            onPress={() => props.onChangeTab("profile")}
          />
          <XHomeTab
            label="المتابعون"
            active={props.activeTab === "following"}
            onPress={() => props.onChangeTab("following")}
          />
          <XHomeTab
            active={props.activeTab === "for-you"}
            label="لأجلك"
            onPress={() => props.onChangeTab("for-you")}
          />
        </View>
      </View>
    </>
  );
}

function XHomeTab(props: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.xHomeTab} onPress={props.onPress}>
      <Text
        style={[
          styles.xHomeTabText,
          props.active ? styles.xHomeTabTextActive : null,
        ]}
      >
        {props.label}
      </Text>
      <View
        style={[
          styles.xHomeTabUnderline,
          props.active ? styles.xHomeTabUnderlineActive : null,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  xTopBar: {
    backgroundColor: "rgba(0,0,0,0.96)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
    paddingTop: 74,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xTopBarCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  xTopBarChatButton: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  xTopBarChatButtonActive: {
    opacity: 1,
  },
  xTopBarBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    borderWidth: 1,
    borderColor: "#000000",
  },
  xTopBarBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },
  xTopBarChatBubble: {
    minWidth: 30,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "rgba(0,0,0,0.94)",
  },
  xTopBarChatBubbleText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  xTopBarChatBubbleTail: {
    position: "absolute",
    left: 4,
    bottom: -3,
    width: 6,
    height: 6,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    backgroundColor: "#000000",
    transform: [{ rotate: "-45deg" }],
  },
  xHeaderModePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(18,18,18,0.92)",
    marginBottom: 2,
  },
  xHeaderModePillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    marginRight: 4,
    letterSpacing: 0.3,
  },
  xHeaderLogoFrame: {
    width: 146,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  xHeaderLogoImage: {
    width: 158,
    height: 104,
  },
  xTopBarSpacer: {
    width: 42,
    height: 42,
  },
  xTabsBar: {
    backgroundColor: "rgba(0,0,0,0.98)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    paddingTop: 6,
  },
  xTabsInner: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    paddingHorizontal: 6,
  },
  xHomeTab: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 12,
  },
  xHomeTabText: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 15,
    fontWeight: "700",
  },
  xHomeTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  xHomeTabUnderline: {
    width: 0,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#1D9BF0",
    marginTop: 10,
    marginBottom: -1,
  },
  xHomeTabUnderlineActive: {
    width: 56,
  },
});
