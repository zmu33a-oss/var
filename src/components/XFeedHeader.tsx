import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { XFeedTab } from "../screens/x-feed/x-feed.types";

const SHELL_WIDTH = 430;
const VAR_WORDMARK_ICON = require("../../assets/icons/var.png");
const VAR_CHAT_ICON = require("../../assets/icons/varchat.png");
const VAR_CHAT_UNREAD_INDICATOR = require("../../assets/icons/images-blac.png");

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
  const xTopBarChatIconSize = Math.round(34 * chromeScale);
  const xTopBarUnreadIndicatorSize = Math.round(14 * chromeScale);
  const xHeaderLogoFrameWidth = Math.round(118 * chromeScale);
  const xHeaderLogoFrameHeight = Math.round(28 * chromeScale);
  const xHeaderLogoImageWidth = Math.round(132 * chromeScale);
  const xHeaderLogoImageHeight = Math.round(82 * chromeScale);
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
        <View
          style={[
            styles.xTopBarSpacer,
            { width: xTopBarItemSize, height: xTopBarItemSize },
          ]}
        />

        <View style={styles.xTopBarCenter}>
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

        <Pressable
          style={[
            styles.xTopBarChatButton,
            isNotificationButtonActive ? styles.xTopBarChatButtonActive : null,
            { width: xTopBarItemSize, height: xTopBarItemSize },
          ]}
          onPress={
            props.onOpenNotifications ? props.onOpenNotifications : undefined
          }
          disabled={!props.onOpenNotifications}
        >
          <Image
            source={VAR_CHAT_ICON}
            resizeMode="contain"
            style={{
              width: xTopBarChatIconSize,
              height: xTopBarChatIconSize,
            }}
          />

          {normalizedNotificationCount ? (
            <Image
              source={VAR_CHAT_UNREAD_INDICATOR}
              resizeMode="contain"
              style={[
                styles.xTopBarUnreadIndicator,
                {
                  width: xTopBarUnreadIndicatorSize,
                  height: xTopBarUnreadIndicatorSize,
                },
              ]}
            />
          ) : null}
        </Pressable>
      </View>

      <View style={styles.xTabsBar}>
        <View style={styles.xTabsInner}>
          <XHomeTab
            label="ملفك"
            active={props.activeTab === "profile"}
            onPress={() => props.onChangeTab("profile")}
          />
          <XHomeTab
            label="تايم لاين"
            active={props.activeTab === "timeline"}
            onPress={() => props.onChangeTab("timeline")}
            showLiveDot
          />
          <XHomeTab
            label="مكتبة فار"
            active={props.activeTab === "var-library"}
            onPress={() => props.onChangeTab("var-library")}
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
  showLiveDot?: boolean;
}) {
  return (
    <Pressable style={styles.xHomeTab} onPress={props.onPress}>
      <View style={styles.xHomeTabLabelRow}>
        {props.showLiveDot ? <View style={styles.xHomeTabLiveDot} /> : null}
        <Text
          style={[
            styles.xHomeTabText,
            props.active ? styles.xHomeTabTextActive : null,
          ]}
        >
          {props.label}
        </Text>
      </View>
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
  xTopBarUnreadIndicator: {
    position: "absolute",
    top: -2,
    right: 0,
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
  xHomeTabLabelRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  xHomeTabLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#22C55E",
    marginLeft: 6,
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
