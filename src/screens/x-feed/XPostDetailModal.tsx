import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { Post } from "../../app.types";
import { XPostCard, XReplyCard } from "./XPostCard";
import { styles } from "./x-feed.styles";

type XPostDetailModalProps = {
  post: Post | null;
  onClose: () => void;
  onReply: (post: Post) => void;
  onRepost: (post: Post) => void;
  onShare: (post: Post) => void;
  onLike: (post: Post) => void;
  onOpenAuthor?: (post: Post) => void;
};

export function XPostDetailModal(props: XPostDetailModalProps) {
  return (
    <Modal
      visible={Boolean(props.post)}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={props.onClose}
    >
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
          {props.post ? (
            <>
              <XPostCard
                post={props.post}
                onOpenAuthor={
                  props.onOpenAuthor
                    ? () => props.onOpenAuthor?.(props.post as Post)
                    : undefined
                }
                interactive={false}
                onOpen={() => undefined}
                onReply={() => props.onReply(props.post as Post)}
                onRepost={() => props.onRepost(props.post as Post)}
                onShare={() => props.onShare(props.post as Post)}
                onLike={() => props.onLike(props.post as Post)}
              />

              {(props.post.replyItems ?? []).length ? (
                <View style={styles.xDetailRepliesSection}>
                  <Text style={styles.xDetailRepliesTitle}>الردود</Text>
                  {(props.post.replyItems ?? []).map((reply) => (
                    <XReplyCard key={reply.id} reply={reply} />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
