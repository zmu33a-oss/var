import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Post } from "../../app.types";
import { XPostCard } from "./XPostCard";
import { styles } from "./x-feed.styles";

type XPostReplyComposerModalProps = {
  targetPost: Post | null;
  replyDraft: string;
  authorName: string;
  authorAvatarUri: string;
  authorVarId: string;
  authorInitial: string;
  onChangeReplyDraft: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onOpenAuthor?: (post: Post) => void;
};

export function XPostReplyComposerModal(props: XPostReplyComposerModalProps) {
  const [isReplySlashVisible, setIsReplySlashVisible] = useState(true);
  const hasTypedReply = props.replyDraft.length > 0;
  const canSubmitReply = props.replyDraft.trim().length > 0;

  useEffect(() => {
    if (!props.targetPost || hasTypedReply) {
      setIsReplySlashVisible(true);
      return;
    }

    const blinkTimer = setInterval(() => {
      setIsReplySlashVisible((currentValue) => !currentValue);
    }, 520);

    return () => {
      clearInterval(blinkTimer);
    };
  }, [hasTypedReply, props.targetPost]);

  return (
    <Modal
      visible={Boolean(props.targetPost)}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={props.onClose}
    >
      <View style={styles.xReplyComposerScreen}>
        <View style={styles.xReplyComposerTopBar}>
          <Pressable
            style={styles.xReplyComposerCancelButton}
            onPress={props.onClose}
          >
            <Text style={styles.xReplyComposerCancelButtonText}>إلغاء</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.xDetailScrollArea}
          contentContainerStyle={styles.xReplyScreenContent}
        >
          {props.targetPost ? (
            <>
              <XPostCard
                post={props.targetPost}
                onOpenAuthor={
                  props.onOpenAuthor
                    ? () => props.onOpenAuthor?.(props.targetPost as Post)
                    : undefined
                }
                interactive={false}
                onOpen={() => undefined}
                onReply={() => undefined}
                onRepost={() => undefined}
                onShare={() => undefined}
                onLike={() => undefined}
                showActionRow={false}
              />

              <View style={styles.xReplyComposerCard}>
                <View style={styles.xReplyComposerIdentityRow}>
                  <View style={styles.xReplyComposerAvatarWrap}>
                    {props.authorAvatarUri ? (
                      <Image
                        source={{ uri: props.authorAvatarUri }}
                        style={styles.xReplyComposerAvatarImage}
                      />
                    ) : (
                      <Text style={styles.xReplyComposerAvatarFallbackText}>
                        {props.authorInitial}
                      </Text>
                    )}
                  </View>

                  <View style={styles.xReplyComposerIdentityText}>
                    <Text style={styles.xReplyComposerIdentityName}>
                      {props.authorName}
                    </Text>
                    <Text style={styles.xReplyComposerIdentityVarId}>
                      {props.authorVarId}
                    </Text>
                  </View>

                  <View style={styles.xReplyComposerBrandWrap}>
                    <Text style={styles.xReplyComposerBrandText}>VAR</Text>
                    <Text style={styles.xReplyComposerBrandAccent}>POST</Text>
                  </View>
                </View>

                <View style={styles.xReplyComposerInputCard}>
                  {!hasTypedReply ? (
                    <View style={styles.xReplyComposerSlashLayer}>
                      <View
                        style={[
                          styles.xReplyComposerSlash,
                          !isReplySlashVisible
                            ? styles.xReplyComposerSlashHidden
                            : null,
                        ]}
                      />
                    </View>
                  ) : null}

                  <TextInput
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    value={props.replyDraft}
                    onChangeText={props.onChangeReplyDraft}
                    placeholder=""
                    style={styles.xReplyComposerInput}
                    textAlign="right"
                    caretHidden
                  />

                  <View style={styles.xReplyComposerActionsRow}>
                    <Pressable
                      style={styles.xReplyComposerSendAction}
                      onPress={props.onSubmit}
                      disabled={!canSubmitReply}
                    >
                      <Text style={styles.xReplyComposerSendLabel}>رد</Text>
                      <Ionicons
                        name={
                          hasTypedReply ? "arrow-undo" : "arrow-undo-outline"
                        }
                        size={15}
                        color={
                          hasTypedReply ? "#FFFFFF" : "rgba(15,151,167,0.88)"
                        }
                      />
                    </Pressable>

                    <View style={styles.xReplyComposerAttachAction}>
                      <Ionicons name="attach" size={27} color="#0F97A7" />
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
