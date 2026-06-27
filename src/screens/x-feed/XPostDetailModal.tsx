import { Ionicons } from "@expo/vector-icons";
import { Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import type { Post } from "../../app.types";
import { XPostCard, XReplyCard } from "./XPostCard";
import { styles } from "./x-feed.styles";

type XPostDetailModalProps = {
  post: Post | null;
  onClose: () => void;
  onReply: (post: Post) => void;
  beforeRepost?: (post: Post) => boolean;
  onRepost: (post: Post) => void;
  onShare: (post: Post) => void;
  onLike: (post: Post) => void;
  onOpenAuthor?: (post: Post) => void;
};

export function XPostDetailModal(props: XPostDetailModalProps) {
  if (!props.post) {
    return null;
  }

  const post = props.post;

  const content = (
    <View style={styles.xDetailScreen}>
      <View style={styles.xDetailHeader}>
        <View style={styles.xDetailHeaderSpacer} />
        <Text style={styles.xDetailHeaderTitle}>المنشور</Text>
        <Pressable style={styles.xDetailCloseButton} onPress={props.onClose}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.xDetailScrollArea}
        contentContainerStyle={styles.xDetailContent}
      >
        <XPostCard
          post={post}
          onOpenAuthor={
            props.onOpenAuthor ? () => props.onOpenAuthor?.(post) : undefined
          }
          interactive={false}
          onOpen={() => undefined}
          onReply={() => props.onReply(post)}
          beforeRepost={
            props.beforeRepost ? () => props.beforeRepost!(post) : undefined
          }
          onRepost={() => props.onRepost(post)}
          onShare={() => props.onShare(post)}
          onLike={() => props.onLike(post)}
        />

        {(post.replyItems ?? []).length ? (
          <View style={styles.xDetailRepliesSection}>
            <Text style={styles.xDetailRepliesTitle}>الردود</Text>
            {(post.replyItems ?? []).map((reply) => (
              <XReplyCard key={reply.id} reply={reply} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );

  if (Platform.OS === "web") {
    return <View style={styles.xPostDetailOverlay}>{content}</View>;
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
      onRequestClose={props.onClose}
    >
      {content}
    </Modal>
  );
}
