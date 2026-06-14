import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import SealCheckIcon from "../../components/SealCheckIcon";
import { createCompatStyleSheet } from "../../lib/crossPlatformStyles";

export type FansCommunityPost = {
  id: string;
  author: string;
  varId: string;
  time: string;
  content: string;
  replyCount: number;
  avatarUri?: string;
  verified?: boolean;
};


function resolveAvatarUri(seed: string) {
  return `https://api.dicebear.com/7.x/personas/png?seed=${encodeURIComponent(seed)}&backgroundColor=0a0f1c,111827,1e293b&size=128`;
}

function FansCommunityMessageRow(props: { post: FansCommunityPost; canInteract: boolean }) {
  const { post } = props;
  const avatarUri = post.avatarUri?.trim() || resolveAvatarUri(post.author);

  return (
    <View style={styles.messageRow}>
      <Image source={{ uri: avatarUri }} style={styles.avatar} />

      <View style={styles.messageBody}>
        <View style={styles.headRow}>
          <View style={styles.metaBlock}>
            <View style={styles.metaLine}>
              <Text style={styles.authorName}>{post.author}</Text>
              {post.verified ? (
                <SealCheckIcon size={14} style={styles.verifiedIcon} />
              ) : null}
              <Text style={styles.varId}>{post.varId}</Text>
              <Text style={styles.timeDot}>·</Text>
              <Text style={styles.time}>{post.time}</Text>
            </View>
          </View>

          <Pressable style={styles.menuButton} accessibilityRole="button">
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color="rgba(255,255,255,0.56)"
            />
          </Pressable>
        </View>

        <Text style={styles.messageText}>{post.content}</Text>

        {props.canInteract ? (
          <Pressable
            style={styles.replyRow}
            accessibilityRole="button"
            accessibilityLabel={`${post.replyCount} رد`}
          >
            <Ionicons name="return-up-back" size={14} color="#F97316" />
            <Text style={styles.replyText}>{post.replyCount} رد</Text>
          </Pressable>
        ) : (
          <View style={styles.replyRow}>
            <Ionicons name="return-up-back" size={14} color="rgba(255,255,255,0.22)" />
            <Text style={styles.replyTextMuted}>{post.replyCount} رد</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function FansCommunityFeed(props: {
  canInteract: boolean;
  clubId?: string | null;
  posts: FansCommunityPost[];
}) {
  if (props.posts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="chatbubbles-outline" size={36} color="rgba(255,255,255,0.18)" />
        <Text style={styles.emptyText}>لا توجد رسائل بعد — كن أول من يكتب!</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {props.posts.map((post, index) => (
        <View key={post.id}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <FansCommunityMessageRow post={post} canInteract={props.canInteract} />
        </View>
      ))}
    </View>
  );
}

const styles = createCompatStyleSheet({
  root: {
    width: "100%",
    backgroundColor: "#000000",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginHorizontal: 16,
  },
  messageRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  messageBody: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
    alignItems: "flex-end",
  },
  headRow: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  metaBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 10,
  },
  menuButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  metaLine: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexWrap: "wrap",
  },
  authorName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 3,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  varId: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  timeDot: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 14,
    marginLeft: 6,
  },
  time: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 13,
    fontWeight: "600",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A8CD8",
  },
  messageText: {
    alignSelf: "stretch",
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "right",
    marginTop: 6,
  },
  replyRow: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 10,
    paddingTop: 2,
    gap: 6,
  },
  replyText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 14,
  },
  replyTextMuted: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 14,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
