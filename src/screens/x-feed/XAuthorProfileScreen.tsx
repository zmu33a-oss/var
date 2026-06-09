import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { buildComposerDisplayVarId } from "../../appshell/appshell.helpers";
import { normalizeMembershipCardTier } from "../../lib/membershipCardTier";
import { VarIdentityCard } from "../profile/components/identity";
import { DEFAULT_CLUB_NAME } from "../profile/profile.constants";
import {
  getNationalityLabels,
  resolveProfileAvatarUri,
} from "../profile/profile.helpers";
import {
  AUTHOR_SWIPE_HORIZONTAL_PADDING,
  AUTHOR_SWIPE_LABEL_INSET,
  AUTHOR_SWIPE_THRESHOLD,
  AUTHOR_SWIPE_THUMB_SIZE,
  AUTHOR_SWIPE_THUMB_TOP_OFFSET,
  AUTHOR_SWIPE_TRACK_HEIGHT,
  type OpenedAuthorProfile,
} from "./x-feed.types";

const AUTHOR_SWIPE_BLUE = "#1A8CD8";
const AUTHOR_SWIPE_BLUE_FOLLOWING = "#1578BE";

export function XAuthorProfileScreen(props: {
  profile: OpenedAuthorProfile;
  canToggleFollow: boolean;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onPlaySwipeSound: () => Promise<void> | void;
  onClose: () => void;
}) {
  const { width: viewportWidth } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(viewportWidth - 24, 320), 440);
  const nationalityLabels = getNationalityLabels(props.profile.nationality || "");
  const displayVarId = buildComposerDisplayVarId(
    props.profile.displayVarId,
    props.profile.authorId,
  );

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#03060E", "#050A14", "#02040A"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        {props.canToggleFollow ? (
          <XAuthorSwipeFollowControl
            isFollowing={props.isFollowing}
            onComplete={props.onToggleFollow}
            onPlaySound={props.onPlaySwipeSound}
          />
        ) : (
          <View style={styles.staticPill}>
            <Text style={styles.staticPillText}>هذا حسابك</Text>
          </View>
        )}

        <Pressable style={styles.closeButton} onPress={props.onClose}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <VarIdentityCard
          width={cardWidth}
          avatarUri={resolveProfileAvatarUri(props.profile.avatarUri)}
          displayName={props.profile.displayName}
          displayVarId={displayVarId}
          association={
            props.profile.association?.trim() || DEFAULT_CLUB_NAME
          }
          joinDate={props.profile.joinDate || ""}
          nationalityArabic={nationalityLabels.arabic}
          nationalityEnglish={nationalityLabels.english}
          cardTier={normalizeMembershipCardTier(props.profile.cardTier)}
        />
      </ScrollView>
    </View>
  );
}

export function XAuthorSwipeFollowControl(props: {
  isFollowing: boolean;
  onComplete: () => void;
  onPlaySound: () => Promise<void> | void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const maxOffset = Math.max(
    0,
    trackWidth - AUTHOR_SWIPE_THUMB_SIZE - AUTHOR_SWIPE_HORIZONTAL_PADDING * 2,
  );
  const label = props.isFollowing ? "اسحب للإلغاء" : "اسحب للمتابعة";

  useEffect(() => {
    if (!isBusy) {
      translateX.setValue(0);
    }
  }, [isBusy, props.isFollowing, translateX]);

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const resetThumb = () => {
    Animated.spring(translateX, {
      toValue: 0,
      bounciness: 0,
      speed: 20,
      useNativeDriver: false,
    }).start(() => {
      setIsBusy(false);
    });
  };

  const completeSwipe = async () => {
    if (isBusy) {
      return;
    }

    setIsBusy(true);
    await props.onPlaySound();
    await Promise.resolve(props.onComplete());
    resetThumb();
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !isBusy && maxOffset > 0,
    onMoveShouldSetPanResponder: (_event, gestureState) =>
      !isBusy &&
      maxOffset > 0 &&
      gestureState.dx > 6 &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderMove: (_event, gestureState) => {
      const nextOffset = Math.max(0, Math.min(maxOffset, gestureState.dx));
      translateX.setValue(nextOffset);
    },
    onPanResponderRelease: (_event, gestureState) => {
      if (gestureState.dx >= maxOffset * AUTHOR_SWIPE_THRESHOLD) {
        Animated.timing(translateX, {
          toValue: maxOffset,
          duration: 130,
          useNativeDriver: false,
        }).start(() => {
          void completeSwipe();
        });
        return;
      }

      resetThumb();
    },
    onPanResponderTerminate: resetThumb,
  });

  return (
    <View style={styles.swipeShell}>
      <View
        onLayout={handleTrackLayout}
        style={[
          styles.swipeTrack,
          props.isFollowing ? styles.swipeTrackActive : null,
        ]}
      >
        <Text numberOfLines={1} style={styles.swipeLabel}>
          {label}
        </Text>

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.swipeThumb,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <Ionicons
            name={props.isFollowing ? "checkmark" : "add"}
            size={20}
            color={AUTHOR_SWIPE_BLUE}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#02040A",
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  staticPill: {
    minWidth: 128,
    height: 42,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  staticPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 36,
  },
  swipeShell: {
    width: 156,
  },
  swipeTrack: {
    height: AUTHOR_SWIPE_TRACK_HEIGHT,
    borderRadius: 999,
    justifyContent: "center",
    backgroundColor: AUTHOR_SWIPE_BLUE,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
  },
  swipeTrackActive: {
    backgroundColor: AUTHOR_SWIPE_BLUE_FOLLOWING,
    borderColor: "rgba(255,255,255,0.28)",
  },
  swipeLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    textAlign: "center",
    paddingLeft: AUTHOR_SWIPE_LABEL_INSET,
    paddingRight: AUTHOR_SWIPE_HORIZONTAL_PADDING + 6,
    zIndex: 1,
  },
  swipeThumb: {
    position: "absolute",
    left: AUTHOR_SWIPE_HORIZONTAL_PADDING,
    top: AUTHOR_SWIPE_THUMB_TOP_OFFSET,
    width: AUTHOR_SWIPE_THUMB_SIZE,
    height: AUTHOR_SWIPE_THUMB_SIZE,
    borderRadius: AUTHOR_SWIPE_THUMB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
});
