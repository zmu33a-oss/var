import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FAN_CLUBS } from "../../app.data";
import type { FanClubId } from "../../app.types";
import { createCompatStyleSheet } from "../../lib/crossPlatformStyles";
import FansCommunityComposer from "./FansCommunityComposer";
import FansCommunityFeed from "./FansCommunityFeed";
import { FANS_FEED_TOP_PADDING, FANS_SCROLL_BOTTOM_PADDING } from "./fans.layout.constants";

type FansClubRoomScreenProps = {
  clubId: FanClubId;
  isLoggedIn: boolean;
  userLeagueClub: string;
  onRequireAuth: (message?: string) => void;
  onClose: () => void;
};

export default function FansClubRoomScreen(props: FansClubRoomScreenProps) {
  const club = useMemo(
    () => FAN_CLUBS.find((c) => c.id === props.clubId) ?? null,
    [props.clubId],
  );

  const canPost = useMemo(() => {
    if (!props.isLoggedIn || !props.userLeagueClub?.trim()) return false;
    try {
      const parsed = JSON.parse(props.userLeagueClub) as Record<string, string>;
      return Object.values(parsed).some(
        (name) =>
          name.trim() === club?.title.trim() ||
          name.trim() === props.clubId.trim(),
      );
    } catch {
      return false;
    }
  }, [props.isLoggedIn, props.userLeagueClub, props.clubId, club]);

  if (!club) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={props.onClose} hitSlop={8}>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            ملتقى {club.title}
          </Text>
          {canPost ? (
            <View style={styles.memberBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#34D399" />
              <Text style={styles.memberBadgeText}>عضو الرابطة</Text>
            </View>
          ) : (
            <View style={styles.viewerBadge}>
              <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.45)" />
              <Text style={styles.viewerBadgeText}>وضع المشاهدة</Text>
            </View>
          )}
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FansCommunityFeed canInteract={canPost} />
      </ScrollView>

      <FansCommunityComposer
        isLoggedIn={props.isLoggedIn}
        canPost={canPost}
        activeClubTitle={club.title}
        onRequireAuth={props.onRequireAuth}
      />
    </View>
  );
}

const styles = createCompatStyleSheet({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#000000",
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "flex-end",
    gap: 3,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "right",
  },
  memberBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  memberBadgeText: {
    color: "#34D399",
    fontSize: 12,
    fontWeight: "700",
  },
  viewerBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  viewerBadgeText: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    paddingTop: FANS_FEED_TOP_PADDING,
    paddingBottom: FANS_SCROLL_BOTTOM_PADDING,
    backgroundColor: "#000000",
  },
});
