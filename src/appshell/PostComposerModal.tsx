import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import SealCheckIcon from "../components/SealCheckIcon";
import {
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../lib/crossPlatformStyles";
import {
  normalizeAuthorId,
  buildComposerDisplayVarId,
} from "./appshell.helpers";
import { styles } from "./appshell.styles";

export function PostComposerModal(props: {
  visible: boolean;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatarUri: string;
  displayVarId: string;
  authorIdLocked: boolean;
  isPublishing: boolean;
  statusMessage?: string;
  onChangeTitle: (value: string) => void;
  onChangeContent: (value: string) => void;
  onChangeAuthorId: (value: string) => void;
  mediaUri?: string;
  onAttachImage: () => void;
  onRemoveImage: () => void;
  onClose: () => void;
  onPublish: () => void;
}) {
  const resolvedPublishAuthorId = normalizeAuthorId(
    props.authorId || props.displayVarId,
  );
  const publishDisabled =
    props.isPublishing ||
    !props.content.trim() ||
    !resolvedPublishAuthorId ||
    resolvedPublishAuthorId === "local-user";
  const [isBodySlashVisible, setIsBodySlashVisible] = useState(true);
  const normalizedAuthorName =
    props.authorName.trim() || normalizeAuthorId(props.authorId);
  const normalizedAuthorAvatarUri = props.authorAvatarUri.trim();
  const normalizedMediaUri = props.mediaUri?.trim() || "";
  const compactDisplayVarId = buildComposerDisplayVarId(
    props.displayVarId,
    props.authorId,
  );
  const authorInitial = normalizedAuthorName.slice(0, 1) || "V";
  const shouldShowBodySlash = props.content.length === 0;

  useEffect(() => {
    if (!props.visible || !shouldShowBodySlash) {
      setIsBodySlashVisible(true);
      return;
    }

    const blinkTimer = setInterval(() => {
      setIsBodySlashVisible((currentValue) => !currentValue);
    }, 520);

    return () => {
      clearInterval(blinkTimer);
    };
  }, [props.visible, shouldShowBodySlash]);

  return (
    <Modal
      transparent
      animationType="slide"
      visible={props.visible}
      onRequestClose={props.onClose}
    >
      <View style={styles.studioModalBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={props.onClose}
        />

        <View style={styles.postComposerCardShell}>
          <Pressable
            style={styles.postComposerCloseButton}
            onPress={props.onClose}
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </Pressable>

          <View style={styles.postComposerHeaderBar}>
            <Text style={styles.postComposerHeaderTitle}>رسالة جديدة</Text>

            <View style={styles.postComposerHeaderBrandWrap}>
              <Text style={styles.postComposerHeaderBrandText}>VAR</Text>
              <Text style={styles.postComposerHeaderBrandTag}>POST</Text>
            </View>
          </View>

          <View style={styles.postComposerDividerLine} />

          <View style={styles.postComposerIdentityRow}>
            <View style={styles.postComposerIdentityCluster}>
              <View style={styles.postComposerIdentityNameBlock}>
                <View style={styles.postComposerIdentityNameRow}>
                  <Text style={styles.postComposerIdentityNameValue}>
                    {normalizedAuthorName}
                  </Text>

                  <SealCheckIcon
                    size={22}
                    style={styles.postComposerIdentityNameIcon}
                  />

                  {props.authorIdLocked ? (
                    <Text style={styles.postComposerIdentityCompactVar}>
                      {compactDisplayVarId}
                    </Text>
                  ) : (
                    <TextInput
                      autoCapitalize="none"
                      placeholder="VAR ID"
                      placeholderTextColor="rgba(255,255,255,0.34)"
                      style={styles.postComposerIdentityCompactInput}
                      textAlign="center"
                      value={props.authorId}
                      onChangeText={props.onChangeAuthorId}
                    />
                  )}
                </View>
              </View>

              <View style={styles.postComposerIdentityAvatarColumn}>
                {normalizedAuthorAvatarUri ? (
                  <Image
                    source={{ uri: normalizedAuthorAvatarUri }}
                    style={styles.postComposerIdentityAvatar}
                  />
                ) : (
                  <View style={styles.postComposerIdentityAvatarFallback}>
                    <Text style={styles.postComposerIdentityAvatarFallbackText}>
                      {authorInitial}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.postComposerBodyCard}>
            {shouldShowBodySlash ? (
              <View
                {...getNativePointerEventsProps("none")}
                style={[
                  styles.postComposerBodySlashLayer,
                  getWebPointerEventsStyle("none"),
                ]}
              >
                <View
                  style={[
                    styles.postComposerBodySlash,
                    !isBodySlashVisible
                      ? styles.postComposerBodySlashHidden
                      : null,
                  ]}
                />
              </View>
            ) : null}

            <TextInput
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={props.content}
              onChangeText={props.onChangeContent}
              style={styles.postComposerBodyInput}
              textAlign="center"
              caretHidden
            />
          </View>

          {normalizedMediaUri ? (
            <View style={styles.postComposerMediaPreviewWrap}>
              <Image
                source={{ uri: normalizedMediaUri }}
                style={styles.postComposerMediaPreview}
              />
              <Pressable
                style={styles.postComposerMediaRemoveButton}
                onPress={props.onRemoveImage}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.postComposerFooterHint}>
            <Text style={styles.postComposerFooterHintAccent}>ملاحظة:</Text> لقد
            اكرمنا ربي بدين يحثنا على حسن الخلق فاختر لكلماتك ما يناسب دينك.
          </Text>

          {props.statusMessage?.trim() ? (
            <Text style={styles.postComposerStatusMessage}>
              {props.statusMessage}
            </Text>
          ) : null}

          <View style={styles.postComposerActionsRow}>
            <Pressable
              style={[
                styles.postComposerPrimaryAction,
                publishDisabled
                  ? styles.postComposerPrimaryActionDisabled
                  : null,
              ]}
              disabled={publishDisabled}
              onPress={props.onPublish}
            >
              <Ionicons name="paper-plane" size={17} color="#FFFFFF" />
              <Text style={styles.postComposerPrimaryActionText}>
                {props.isPublishing ? "جارٍ النشر..." : "نشر"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.postComposerAttachAction}
              onPress={props.onAttachImage}
            >
              <Ionicons
                name="attach"
                size={26}
                color="rgba(255,255,255,0.86)"
              />
            </Pressable>

            <View style={styles.postComposerActionSpacer} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
