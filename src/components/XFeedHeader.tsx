import { useFonts } from "expo-font";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { XFeedTab } from "../screens/x-feed/x-feed.types";
import {
  PROFILE_ARABIC_FONT,
  PROFILE_ARABIC_FONT_FAMILY,
} from "../screens/profile/profile.constants";

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
  onOpenProfile?: () => void;
  customTabLabel?: string;
  showTabChevron?: boolean;
  onTabPress?: () => void;
  leftElement?: ReactNode;
  leftSlotWidth?: number;
  avatarUri?: string;
  onOpenAvatar?: () => void;
  onAvatarLayout?: (y: number, height: number) => void;
};

export default function XFeedHeader(props: XFeedHeaderProps) {
  const [isArabicFontLoaded] = useFonts({
    [PROFILE_ARABIC_FONT_FAMILY]: PROFILE_ARABIC_FONT,
  });
  const tabFontFamily = isArabicFontLoaded
    ? PROFILE_ARABIC_FONT_FAMILY
    : undefined;

  const metrics = useMemo(() => {
    const layoutWidth = Math.min(props.windowWidth, SHELL_WIDTH);
    const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / SHELL_WIDTH));
    return {
      xTopBarPaddingTop: Math.round(44 * chromeScale),
      xTopBarPaddingHorizontal: Math.round(12 * chromeScale),
      xTopBarPaddingBottom: Math.max(10, Math.round(10 * chromeScale)),
      xTopBarItemSize: Math.round(36 * chromeScale),
      xTopBarChatIconSize: Math.round(34 * chromeScale),
      xTopBarUnreadIndicatorSize: Math.round(14 * chromeScale),
      xHeaderLogoImageWidth: Math.round(132 * chromeScale),
      xHeaderLogoImageHeight: Math.round(82 * chromeScale),
      chromeScale,
    };
  }, [props.windowWidth]);

  const normalizedNotificationCount = Math.max(0, props.notificationCount ?? 0);
  const isNotificationButtonActive = props.notificationsActive ?? false;
  const isTimelineActive = props.activeTab !== "profile";

  return (
    <>
      <View
        style={[
          styles.xTopBar,
          {
            paddingTop: metrics.xTopBarPaddingTop,
            paddingHorizontal: metrics.xTopBarPaddingHorizontal,
            paddingBottom: metrics.xTopBarPaddingBottom,
          },
        ]}
      >
        <View
          style={[
            styles.xTopBarSpacer,
            {
              width: props.leftSlotWidth ?? metrics.xTopBarItemSize,
              height: metrics.xTopBarItemSize,
            },
          ]}
        >
          {props.leftElement ?? null}
        </View>

        <View style={styles.xTopBarCenter}>
          <Image
            source={VAR_WORDMARK_ICON}
            resizeMode="contain"
            style={[
              styles.xHeaderLogoImage,
              {
                width: metrics.xHeaderLogoImageWidth,
                height: metrics.xHeaderLogoImageHeight,
              },
            ]}
          />
        </View>

        {props.avatarUri ? (
          <Pressable
            style={[
              styles.xTopBarAvatarButton,
              { width: metrics.xTopBarItemSize, height: metrics.xTopBarItemSize },
            ]}
            onPress={props.onOpenAvatar}
            onLayout={(e) => {
              const { y, height } = e.nativeEvent.layout;
              props.onAvatarLayout?.(y, height);
            }}
          >
            <Image
              source={{ uri: props.avatarUri }}
              resizeMode="cover"
              style={styles.xTopBarAvatar}
            />
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.xTopBarChatButton,
              isNotificationButtonActive ? styles.xTopBarChatButtonActive : null,
              { width: metrics.xTopBarItemSize, height: metrics.xTopBarItemSize },
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
                width: metrics.xTopBarChatIconSize,
                height: metrics.xTopBarChatIconSize,
              }}
            />
            {normalizedNotificationCount ? (
              <Image
                source={VAR_CHAT_UNREAD_INDICATOR}
                resizeMode="contain"
                style={[
                  styles.xTopBarUnreadIndicator,
                  {
                    width: metrics.xTopBarUnreadIndicatorSize,
                    height: metrics.xTopBarUnreadIndicatorSize,
                  },
                ]}
              />
            ) : null}
          </Pressable>
        )}
      </View>

      <View style={styles.xTabsBar}>
        <Pressable
          style={styles.xTabsInnerCentered}
          onPress={props.onTabPress ?? (() => props.onChangeTab("timeline"))}
          accessibilityRole="button"
          accessibilityLabel={props.customTabLabel ?? "تايم لاين"}
        >
          <View style={styles.xHomeTabLabelRow}>
            <View style={styles.xHomeTabLiveDot} />
            <Text
              style={[
                styles.xHomeTabText,
                tabFontFamily ? { fontFamily: tabFontFamily } : null,
                isTimelineActive ? styles.xHomeTabTextActive : null,
              ]}
            >
              {props.customTabLabel ?? "تايم لاين"}
            </Text>
            {props.showTabChevron ? (
              <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 4 }} />
            ) : null}
          </View>
        </Pressable>
      </View>
    </>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  xTopBarAvatarButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  xTopBarAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
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
  xHeaderLogoImage: {
    width: 158,
    height: 104,
  },
  xTopBarSpacer: {
    width: 42,
    height: 42,
    overflow: "visible",
    alignItems: "center",
    justifyContent: "center",
  },
  xTabsBar: {
    backgroundColor: "rgba(0,0,0,0.98)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    paddingTop: 2,
    paddingBottom: 8,
    alignItems: "center",
  },
  xTabsInnerCentered: {
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
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
    fontSize: 17,
    fontWeight: "700",
  },
  xHomeTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
