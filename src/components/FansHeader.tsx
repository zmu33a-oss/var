import { useFonts } from "expo-font";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  PROFILE_ARABIC_FONT,
  PROFILE_ARABIC_FONT_FAMILY,
} from "../screens/profile/profile.constants";

const SHELL_WIDTH = 430;
const VAR_WORDMARK_ICON = require("../../assets/icons/var.png");
const VAR_CHAT_ICON = require("../../assets/icons/varchat.png");
const VAR_CHAT_UNREAD_INDICATOR = require("../../assets/icons/images-blac.png");

type FansHeaderProps = {
  windowWidth: number;
  clubLabel?: string;
  showTabChevron?: boolean;
  onTabPress?: () => void;
  leftElement?: ReactNode;
  leftSlotWidth?: number;
  avatarUri?: string;
  onOpenAvatar?: () => void;
  onAvatarLayout?: (bottom: number) => void;
  notificationCount?: number;
};

export default function FansHeader(props: FansHeaderProps) {
  const [isArabicFontLoaded] = useFonts({
    [PROFILE_ARABIC_FONT_FAMILY]: PROFILE_ARABIC_FONT,
  });
  const tabFontFamily = isArabicFontLoaded ? PROFILE_ARABIC_FONT_FAMILY : undefined;

  const metrics = useMemo(() => {
    const layoutWidth = Math.min(props.windowWidth, SHELL_WIDTH);
    const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / SHELL_WIDTH));
    return {
      paddingTop: Math.max(6, Math.round(8 * chromeScale)),
      paddingHorizontal: Math.round(12 * chromeScale),
      paddingBottom: Math.max(6, Math.round(8 * chromeScale)),
      itemSize: Math.round(36 * chromeScale),
      chatIconSize: Math.round(34 * chromeScale),
      unreadSize: Math.round(14 * chromeScale),
      logoWidth: Math.round(136 * chromeScale),
      logoHeight: Math.round(72 * chromeScale),
      chromeScale,
    };
  }, [props.windowWidth]);

  const leftColumnWidth = props.leftSlotWidth ?? metrics.itemSize;
  const normalizedNotificationCount = Math.max(0, props.notificationCount ?? 0);

  const notificationButton = (
    <Pressable
      style={[styles.chatButton, { width: metrics.itemSize, height: metrics.itemSize }]}
    >
      <Image
        source={VAR_CHAT_ICON}
        resizeMode="contain"
        style={{ width: metrics.chatIconSize, height: metrics.chatIconSize }}
      />
      {normalizedNotificationCount ? (
        <Image
          source={VAR_CHAT_UNREAD_INDICATOR}
          resizeMode="contain"
          style={[
            styles.unreadIndicator,
            { width: metrics.unreadSize, height: metrics.unreadSize },
          ]}
        />
      ) : null}
    </Pressable>
  );

  return (
    <>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: metrics.paddingTop,
            paddingHorizontal: metrics.paddingHorizontal,
            paddingBottom: metrics.paddingBottom,
          },
        ]}
      >
        <View
          style={[styles.leftSlot, { width: leftColumnWidth, height: metrics.itemSize }]}
        >
          {props.leftElement ?? notificationButton}
        </View>

        <View style={styles.center}>
          <Image
            source={VAR_WORDMARK_ICON}
            resizeMode="contain"
            style={{ width: metrics.logoWidth, height: metrics.logoHeight }}
          />
        </View>

        {props.avatarUri ? (
          <Pressable
            style={[styles.avatarButton, { width: metrics.itemSize, height: metrics.itemSize }]}
            onPress={props.onOpenAvatar}
            onLayout={(e) => {
              const { y, height } = e.nativeEvent.layout;
              props.onAvatarLayout?.(metrics.paddingTop + y + height);
            }}
          >
            <Image source={{ uri: props.avatarUri }} resizeMode="cover" style={styles.avatar} />
          </Pressable>
        ) : (
          <View style={{ width: metrics.itemSize, height: metrics.itemSize }} />
        )}
      </View>

      <View style={styles.tabsBar}>
        <Pressable
          style={styles.tabsInner}
          onPress={props.onTabPress}
          accessibilityRole="button"
          accessibilityLabel={props.clubLabel ?? "رابطتي"}
        >
          <View style={styles.tabLabelRow}>
            <View style={styles.liveDot} />
            <Text
              style={[
                styles.tabText,
                tabFontFamily ? { fontFamily: tabFontFamily } : null,
              ]}
            >
              {props.clubLabel ?? "رابطتي"}
            </Text>
            {props.showTabChevron ? (
              <Ionicons
                name="chevron-down"
                size={14}
                color="rgba(255,255,255,0.7)"
                style={{ marginRight: 4 }}
              />
            ) : null}
          </View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: "rgba(0,0,0,0.96)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSlot: {
    overflow: "visible",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },
  chatButton: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadIndicator: {
    position: "absolute",
    top: -2,
    right: 0,
  },
  tabsBar: {
    backgroundColor: "rgba(0,0,0,0.98)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    paddingTop: 0,
    paddingBottom: 6,
    alignItems: "center",
  },
  tabsInner: {
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  tabLabelRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#22C55E",
    marginLeft: 6,
  },
  tabText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
});
