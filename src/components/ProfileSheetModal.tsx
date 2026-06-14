import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { XProfileHub } from "../screens/x-feed/XProfileHub";
import type { FollowingProfileCard } from "../app.types";
import type { MessageThreadEntry } from "../screens/x-feed/x-feed.types";

type ProfileSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  displayName: string;
  displayVarId: string;
  avatarUri: string;
  isVerified?: boolean;
  role?: "admin" | "member";
  followedProfiles: FollowingProfileCard[];
  messageThreads: MessageThreadEntry[];
  unreadMessageCount: number;
  onRequireAuth: () => void;
  onOpenPublicProfile: () => void;
  onOpenThread: (thread: MessageThreadEntry) => void;
  onComposeLookup: (displayVarId: string) => Promise<FollowingProfileCard | null>;
  onOpenNewThread: (profile: FollowingProfileCard) => void;
};

const SHEET_HEIGHT_RATIO = 0.88;

export default function ProfileSheetModal(props: ProfileSheetModalProps) {
  const { height } = useWindowDimensions();
  const sheetHeight = height * SHEET_HEIGHT_RATIO;
  const slideAnim = useRef(new Animated.Value(sheetHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (props.visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
          speed: 14,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: sheetHeight,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [props.visible, sheetHeight, slideAnim, backdropAnim]);

  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="none"
      onRequestClose={props.onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { height: sheetHeight, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handleBar} />
          <Pressable style={styles.closeHitArea} onPress={props.onClose} />
          <View style={styles.content}>
            <XProfileHub
              isLoggedIn={props.isLoggedIn}
              displayName={props.displayName}
              displayVarId={props.displayVarId}
              avatarUri={props.avatarUri}
              isVerified={props.isVerified}
              role={props.role}
              followedProfiles={props.followedProfiles}
              messageThreads={props.messageThreads}
              unreadMessageCount={props.unreadMessageCount}
              onRequireAuth={props.onRequireAuth}
              onOpenPublicProfile={props.onOpenPublicProfile}
              onOpenThread={props.onOpenThread}
              onComposeLookup={props.onComposeLookup}
              onOpenNewThread={props.onOpenNewThread}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: "#0a0a0a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  closeHitArea: {
    height: 16,
  },
  content: {
    flex: 1,
  },
});
