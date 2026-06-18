import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FANS_SHEET_BOTTOM_INSET } from "../screens/fans/fans.layout.constants";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type UserActivityMenuItem = {
  icon: IoniconName;
  label: string;
  tab: string;
};

export type UserActivitySheetTab = {
  id: string;
  label: string;
};

type UserActivityOverlayProps = {
  menuVisible: boolean;
  sheetVisible: boolean;
  menuItems: UserActivityMenuItem[];
  sheetTabs: UserActivitySheetTab[];
  activeTab: string;
  avatarBottom: number;
  avatarUri?: string;
  displayName: string;
  varId?: string;
  menuItemAnims: Animated.Value[];
  sheetAnim: Animated.Value;
  sheetBottomInset?: number;
  onCloseMenu: () => void;
  onCloseSheet: () => void;
  onOpenSheet: (tab: string) => void;
  onTabChange: (tab: string) => void;
  children: ReactNode;
};

export function UserActivityOverlay(props: UserActivityOverlayProps) {
  const sheetBottomInset = props.sheetBottomInset ?? FANS_SHEET_BOTTOM_INSET;

  return (
    <>
      {props.menuVisible ? (
        <>
          <Pressable style={styles.menuBackdrop} onPress={props.onCloseMenu} />
          {props.menuItems.map((item, index) => (
            <Animated.View
              key={item.tab}
              style={[
                styles.menuItem,
                { top: props.avatarBottom + 6 + index * 44 },
                {
                  opacity: props.menuItemAnims[index],
                  transform: [
                    {
                      translateY: props.menuItemAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Pressable
                style={styles.menuIconBtn}
                onPress={() => props.onOpenSheet(item.tab)}
              >
                <Ionicons name={item.icon} size={20} color="#FFFFFF" />
                <Text style={styles.menuIconLabel}>{item.label}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </>
      ) : null}

      {props.sheetVisible ? (
        <>
          <Pressable style={styles.sheetBackdrop} onPress={props.onCloseSheet} />
          <Animated.View
            style={[
              styles.sheetPanel,
              { bottom: sheetBottomInset },
              {
                opacity: props.sheetAnim,
                transform: [
                  {
                    scale: props.sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable style={styles.sheetCloseBtn} onPress={props.onCloseSheet}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <View style={styles.sheetHeader}>
              {props.avatarUri ? (
                <Image
                  source={{ uri: props.avatarUri }}
                  style={styles.sheetAvatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.sheetAvatar, styles.sheetAvatarPlaceholder]}>
                  <Ionicons name="person" size={28} color="rgba(255,255,255,0.5)" />
                </View>
              )}
              <Text style={styles.sheetDisplayName}>
                {props.displayName || props.varId || "مستخدم"}
              </Text>
              {props.varId ? (
                <Text style={styles.sheetVarId}>@{props.varId}</Text>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sheetTabsScroll}
              contentContainerStyle={styles.sheetTabs}
            >
              {props.sheetTabs.map((tab) => (
                <Pressable
                  key={tab.id}
                  style={[
                    styles.sheetTab,
                    props.activeTab === tab.id && styles.sheetTabActive,
                  ]}
                  onPress={() => props.onTabChange(tab.id)}
                >
                  <Text
                    style={[
                      styles.sheetTabText,
                      props.activeTab === tab.id && styles.sheetTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView
              style={styles.sheetPostsScroll}
              showsVerticalScrollIndicator={false}
            >
              {props.children}
            </ScrollView>
          </Animated.View>
        </>
      ) : null}
    </>
  );
}

export function UserActivitySheetEmpty(props: { text: string }) {
  return <Text style={styles.sheetEmpty}>{props.text}</Text>;
}

export function UserActivitySheetPostItem(props: {
  content: string;
  likes?: number;
  replies?: number;
  meta?: string;
}) {
  return (
    <View style={styles.sheetPostItem}>
      {props.meta ? <Text style={styles.sheetPostMetaLabel}>{props.meta}</Text> : null}
      <Text style={styles.sheetPostText} numberOfLines={3}>
        {props.content}
      </Text>
      {props.likes !== undefined || props.replies !== undefined ? (
        <View style={styles.sheetPostMeta}>
          {props.likes !== undefined ? (
            <>
              <Ionicons name="heart" size={12} color="rgba(255,255,255,0.35)" />
              <Text style={styles.sheetPostMetaText}>{props.likes}</Text>
            </>
          ) : null}
          {props.replies !== undefined ? (
            <>
              <Ionicons
                name="chatbubble-outline"
                size={12}
                color="rgba(255,255,255,0.35)"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sheetPostMetaText}>{props.replies}</Text>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 98,
  },
  menuItem: {
    position: "absolute",
    right: 10,
    zIndex: 99,
  },
  menuIconBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(18,18,24,0.97)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    paddingVertical: 9,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 140,
  },
  menuIconLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 100,
  },
  sheetPanel: {
    position: "absolute",
    top: "5%",
    left: "5%",
    right: "5%",
    backgroundColor: "rgba(12,12,16,0.98)",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
    zIndex: 101,
    padding: 20,
    overflow: "hidden",
  },
  sheetCloseBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  sheetHeader: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
  },
  sheetAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.25)",
    marginBottom: 12,
  },
  sheetAvatarPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetDisplayName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  sheetVarId: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    marginTop: 3,
    textAlign: "center",
  },
  sheetTabsScroll: {
    flexGrow: 0,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sheetTabs: {
    flexDirection: "row-reverse",
    alignItems: "stretch",
  },
  sheetTab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  sheetTabActive: {
    borderBottomWidth: 2,
    borderColor: "#F4C565",
  },
  sheetTabText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "600",
  },
  sheetTabTextActive: {
    color: "#F4C565",
  },
  sheetPostsScroll: {
    flex: 1,
  },
  sheetPostItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetPostMetaLabel: {
    color: "#F4C565",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 4,
  },
  sheetPostText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    textAlign: "right",
    lineHeight: 19,
  },
  sheetPostMeta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  sheetPostMetaText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginLeft: 4,
  },
  sheetEmpty: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    textAlign: "center",
    paddingTop: 24,
  },
});
