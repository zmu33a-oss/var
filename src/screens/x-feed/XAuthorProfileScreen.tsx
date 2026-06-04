import {
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  type LayoutChangeEvent,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SealCheckIcon from "../../components/SealCheckIcon";
import type { Post } from "../../app.types";
import type { AppwriteLockedPrediction } from "../../lib/appwrite";
import { XPostCard } from "./XPostCard";
import {
  AUTHOR_PROFILE_TAB_ICONS,
  AUTHOR_PROFILE_TAB_LABELS,
  AUTHOR_SWIPE_HORIZONTAL_PADDING,
  AUTHOR_SWIPE_THRESHOLD,
  AUTHOR_SWIPE_THUMB_SIZE,
  AUTHOR_SWIPE_THUMB_TOP_OFFSET,
  AUTHOR_SWIPE_TRACK_HEIGHT,
  type AuthorProfileSectionNoticeDismissal,
  type AuthorProfileSectionVisibility,
  type AuthorProfileTab,
  type OpenedAuthorProfile,
  type OpenedAuthorReplyItem,
} from "./x-feed.types";

export function XAuthorProfileScreen(props: {
  profile: OpenedAuthorProfile;
  posts: Post[];
  replyItems: OpenedAuthorReplyItem[];
  topLikedPosts: Post[];
  likesTotal: number;
  postsRepliesTotal: number;
  postsSharesTotal: number;
  lockedPredictions: AppwriteLockedPrediction[];
  activeTab: AuthorProfileTab;
  canToggleFollow: boolean;
  isFollowing: boolean;
  sectionNoticeDismissal: AuthorProfileSectionNoticeDismissal;
  sectionVisibility: AuthorProfileSectionVisibility;
  onChangeTab: (tab: AuthorProfileTab) => void;
  onDismissSectionNotice: (tab: AuthorProfileTab) => void;
  onLikePost: (post: Post) => void;
  onOpenMessageThread: (profile: OpenedAuthorProfile) => void;
  onOpenAuthor: (post: Post) => void;
  onToggleSectionVisibility: (tab: AuthorProfileTab) => void;
  onReplyPost: (post: Post) => void;
  onRepostPost: (post: Post) => void;
  onSharePost: (post: Post) => void;
  onToggleFollow: () => void;
  onPlaySwipeSound: () => Promise<void> | void;
  onClose: () => void;
  onOpenPost: (post: Post) => void;
}) {
  const memberSinceLabel = (() => {
    const joinDate = props.profile.joinDate?.trim();

    if (!joinDate) {
      return "—";
    }

    const parsedTime = Date.parse(joinDate);

    if (!Number.isNaN(parsedTime)) {
      return new Intl.DateTimeFormat("ar-SA", {
        month: "long",
        year: "numeric",
      }).format(new Date(parsedTime));
    }

    return joinDate;
  })();
  const nationalityLabel = props.profile.nationality?.trim() || "—";
  const deferredActiveTab = useDeferredValue(props.activeTab);
  const isOwnProfile = !props.canToggleFollow;
  const isDeferredTabVisible = props.sectionVisibility[deferredActiveTab];
  const handleLabel = props.profile.username
    ? `@${props.profile.username}`
    : props.profile.displayVarId;
  const roleLabel = props.profile.role === "admin" ? "ADMIN" : "MEMBER";
  const likesPanelPosts = props.topLikedPosts.length
    ? props.topLikedPosts
    : props.posts.slice(0, 3);
  const likedPostsCount = props.posts.filter((post) => post.likes > 0).length;
  const bioSummary = props.profile.username
    ? `${props.profile.displayName} يظهر داخل WEBPLUS باسم ${handleLabel} ويستخدم هوية ${roleLabel} داخل بطاقة VAR الحالية.`
    : `${props.profile.displayName} يستخدم هوية ${roleLabel} داخل WEBPLUS ويرتبط بالمعرف ${props.profile.displayVarId}.`;
  const authorProfileSections: Array<{
    id: AuthorProfileTab;
    label: string;
    count: number;
    iconName: (typeof AUTHOR_PROFILE_TAB_ICONS)[AuthorProfileTab];
    isVisible: boolean;
  }> = [
    {
      id: "likes",
      label: AUTHOR_PROFILE_TAB_LABELS.likes,
      count: likedPostsCount,
      iconName: AUTHOR_PROFILE_TAB_ICONS.likes,
      isVisible: props.sectionVisibility.likes,
    },
    {
      id: "posts",
      label: AUTHOR_PROFILE_TAB_LABELS.posts,
      count: props.posts.length,
      iconName: AUTHOR_PROFILE_TAB_ICONS.posts,
      isVisible: props.sectionVisibility.posts,
    },
    {
      id: "replies",
      label: AUTHOR_PROFILE_TAB_LABELS.replies,
      count: props.replyItems.length,
      iconName: AUTHOR_PROFILE_TAB_ICONS.replies,
      isVisible: props.sectionVisibility.replies,
    },
    {
      id: "predictions",
      label: AUTHOR_PROFILE_TAB_LABELS.predictions,
      count: props.lockedPredictions.length,
      iconName: AUTHOR_PROFILE_TAB_ICONS.predictions,
      isVisible: props.sectionVisibility.predictions,
    },
    {
      id: "bio",
      label: AUTHOR_PROFILE_TAB_LABELS.bio,
      count: bioSummary.trim() ? 1 : 0,
      iconName: AUTHOR_PROFILE_TAB_ICONS.bio,
      isVisible: props.sectionVisibility.bio,
    },
  ];
  const shouldShowSectionNotice =
    isOwnProfile &&
    !isDeferredTabVisible &&
    !props.sectionNoticeDismissal[deferredActiveTab];

  return (
    <View style={styles.xAuthorScreen}>
      <View style={styles.xAuthorHeader}>
        {props.canToggleFollow ? (
          <XAuthorSwipeFollowControl
            isFollowing={props.isFollowing}
            onComplete={props.onToggleFollow}
            onPlaySound={props.onPlaySwipeSound}
          />
        ) : (
          <View style={styles.xAuthorStaticPill}>
            <Text style={styles.xAuthorStaticPillText}>هذا حسابك</Text>
          </View>
        )}

        <Pressable style={styles.xAuthorCloseButton} onPress={props.onClose}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.xAuthorScrollArea}
        contentContainerStyle={styles.xAuthorContent}
      >
        <LinearGradient
          colors={["#000000", "#000000", "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.xAuthorHeroCard}
        >
          <View style={styles.xAuthorHeroAccentGlow} />

          <View style={styles.xAuthorPreviewHeaderLine}>
            <View style={styles.xAuthorPreviewAvatarRing}>
              {props.profile.avatarUri.trim() ? (
                <Image
                  source={{ uri: props.profile.avatarUri }}
                  style={styles.xAuthorPreviewAvatarImage}
                />
              ) : (
                <View style={styles.xAuthorPreviewAvatarFallback}>
                  <Text style={styles.xAuthorPreviewAvatarText}>
                    {props.profile.displayName.slice(0, 1) || "V"}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.xAuthorPreviewCopy}>
              <View style={styles.xAuthorHeroNameRow}>
                {props.profile.verified ? (
                  <SealCheckIcon
                    size={17}
                    style={styles.xAuthorHeroVerifiedIcon}
                  />
                ) : null}
                <Text numberOfLines={1} style={styles.xAuthorHeroName}>
                  {props.profile.displayName}
                </Text>
              </View>

              <View style={styles.xAuthorPreviewInfoRow}>
                <Text numberOfLines={1} style={styles.xAuthorPreviewHandle}>
                  {handleLabel}
                </Text>
                <Text numberOfLines={1} style={styles.xAuthorPreviewVarId}>
                  {props.profile.displayVarId.replace(/^@+/, "")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.xAuthorPreviewMetricGrid}>
            <View style={styles.xAuthorPreviewMetricCard}>
              <Text style={styles.xAuthorPreviewMetricValue}>
                {props.posts.length}
              </Text>
              <Text style={styles.xAuthorPreviewMetricLabel}>منشورات</Text>
            </View>
            <View style={styles.xAuthorPreviewMetricCard}>
              <Text style={styles.xAuthorPreviewMetricValue}>
                {props.likesTotal}
              </Text>
              <Text style={styles.xAuthorPreviewMetricLabel}>إعجابات</Text>
            </View>
            <View style={styles.xAuthorPreviewMetricCard}>
              <Text style={styles.xAuthorPreviewMetricValue}>
                {props.replyItems.length}
              </Text>
              <Text style={styles.xAuthorPreviewMetricLabel}>ردود</Text>
            </View>
          </View>

          <View style={styles.xAuthorPreviewMetaGrid}>
            <View style={styles.xAuthorPreviewMetaItem}>
              <Text style={styles.xAuthorPreviewMetaValue}>{roleLabel}</Text>
              <Text style={styles.xAuthorPreviewMetaLabel}>ROLE</Text>
            </View>
            <View style={styles.xAuthorPreviewMetaItem}>
              <Text style={styles.xAuthorPreviewMetaValue}>
                {memberSinceLabel}
              </Text>
              <Text style={styles.xAuthorPreviewMetaLabel}>JOIN</Text>
            </View>
            <View style={styles.xAuthorPreviewMetaItem}>
              <Text style={styles.xAuthorPreviewMetaValue}>
                {nationalityLabel}
              </Text>
              <Text style={styles.xAuthorPreviewMetaLabel}>NATIONALITY</Text>
            </View>
          </View>

          {props.canToggleFollow ? (
            <Pressable
              style={styles.xAuthorMessageButton}
              onPress={() => props.onOpenMessageThread(props.profile)}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={15}
                color="#0C1722"
              />
              <Text style={styles.xAuthorMessageButtonText}>محادثة</Text>
            </Pressable>
          ) : null}
        </LinearGradient>

        <View style={styles.xAuthorHorizontalControlsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.xAuthorHorizontalControlsStrip}
          >
            {authorProfileSections.map((section) => {
              const isSelected = props.activeTab === section.id;

              return (
                <Pressable
                  key={section.id}
                  style={[
                    styles.xAuthorHorizontalControlCard,
                    isSelected ? styles.xAuthorHorizontalControlCardActive : null,
                  ]}
                  onPress={() => {
                    startTransition(() => {
                      props.onChangeTab(section.id);
                    });
                  }}
                >
                  <View style={styles.xAuthorHorizontalControlTopRow}>
                    <View
                      style={[
                        styles.xAuthorHorizontalControlIcon,
                        isSelected
                          ? styles.xAuthorHorizontalControlIconActive
                          : null,
                      ]}
                    >
                      <Ionicons
                        name={section.iconName}
                        size={16}
                        color={isSelected ? "#0B1220" : "#F4C565"}
                      />
                    </View>
                    <Text style={styles.xAuthorHorizontalControlCount}>
                      {section.count}
                    </Text>
                  </View>

                  <Text numberOfLines={1} style={styles.xAuthorHorizontalControlLabel}>
                    {section.label}
                  </Text>

                  {isOwnProfile ? (
                    <Pressable
                      style={[
                        styles.xAuthorVisibilitySwitch,
                        section.isVisible
                          ? styles.xAuthorVisibilitySwitchActive
                          : null,
                      ]}
                      onPress={(event) => {
                        event.stopPropagation?.();
                        props.onToggleSectionVisibility(section.id);
                      }}
                    >
                      <Text
                        style={[
                          styles.xAuthorVisibilitySwitchText,
                          section.isVisible
                            ? styles.xAuthorVisibilitySwitchTextActive
                            : null,
                        ]}
                      >
                        {section.isVisible ? "ON" : "OFF"}
                      </Text>
                      <View
                        style={[
                          styles.xAuthorVisibilitySwitchKnob,
                          section.isVisible
                            ? styles.xAuthorVisibilitySwitchKnobActive
                            : null,
                        ]}
                      />
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {shouldShowSectionNotice ? (
          <XAuthorSectionVisibilityNotice
            tab={deferredActiveTab}
            onDismiss={() => props.onDismissSectionNotice(deferredActiveTab)}
          />
        ) : null}

        {deferredActiveTab === "likes" ? (
          <>
            {!isOwnProfile && !isDeferredTabVisible ? (
              <XAuthorSectionHiddenCard tab={deferredActiveTab} />
            ) : likesPanelPosts.length ? (
              <View style={styles.xAuthorFeedSection}>
                {likesPanelPosts.map((post) => (
                  <XPostCard
                    key={`likes-${post.id}`}
                    post={post}
                    onOpen={() => props.onOpenPost(post)}
                    onReply={() => props.onReplyPost(post)}
                    onRepost={() => props.onRepostPost(post)}
                    onLike={() => props.onLikePost(post)}
                    onShare={() => props.onSharePost(post)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.xAuthorEmptyCard}>
                <Text style={styles.xAuthorEmptyTitle}>
                  لا توجد إعجابات بعد
                </Text>
                <Text style={styles.xAuthorEmptyText}>
                  ستظهر هنا أكثر المشاركات التي حصلت على إعجاب داخل الصفحة.
                </Text>
              </View>
            )}
          </>
        ) : null}

        {deferredActiveTab === "posts" ? (
          !isOwnProfile && !isDeferredTabVisible ? (
            <XAuthorSectionHiddenCard tab={deferredActiveTab} />
          ) : props.posts.length ? (
            <View style={styles.xAuthorFeedSection}>
              {props.posts.map((post) => (
                <XPostCard
                  key={`posts-${post.id}`}
                  post={post}
                  onOpen={() => props.onOpenPost(post)}
                  onReply={() => props.onReplyPost(post)}
                  onRepost={() => props.onRepostPost(post)}
                  onLike={() => props.onLikePost(post)}
                  onShare={() => props.onSharePost(post)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.xAuthorEmptyCard}>
              <Text style={styles.xAuthorEmptyTitle}>لا توجد مشاركات بعد</Text>
              <Text style={styles.xAuthorEmptyText}>
                هذا الحساب لم ينشر منشورات ظاهرة داخل التايم لاين الحالي.
              </Text>
            </View>
          )
        ) : null}

        {deferredActiveTab === "replies" ? (
          !isOwnProfile && !isDeferredTabVisible ? (
            <XAuthorSectionHiddenCard tab={deferredActiveTab} />
          ) : props.replyItems.length ? (
            <View style={styles.xAuthorFeedSection}>
              {props.replyItems.map((reply) => (
                <XAuthorReplyThreadCard
                  key={`reply-${reply.id}-${reply.sourcePost.id}`}
                  reply={reply}
                  onLikeSourcePost={() => props.onLikePost(reply.sourcePost)}
                  onOpenSourceAuthor={() =>
                    props.onOpenAuthor(reply.sourcePost)
                  }
                  onOpenSourcePost={() => props.onOpenPost(reply.sourcePost)}
                  onReplySourcePost={() => props.onReplyPost(reply.sourcePost)}
                  onRepostSourcePost={() =>
                    props.onRepostPost(reply.sourcePost)
                  }
                  onShareSourcePost={() => props.onSharePost(reply.sourcePost)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.xAuthorEmptyCard}>
              <Text style={styles.xAuthorEmptyTitle}>لا توجد ردود بعد</Text>
              <Text style={styles.xAuthorEmptyText}>
                ستظهر هنا الردود التي كتبها هذا الحساب على المنشورات داخل صفحة
                X.
              </Text>
            </View>
          )
        ) : null}

        {deferredActiveTab === "predictions" ? (
          !isOwnProfile && !isDeferredTabVisible ? (
            <XAuthorSectionHiddenCard tab={deferredActiveTab} />
          ) : props.lockedPredictions.length ? (
            <View style={styles.xAuthorFeedSection}>
              {props.lockedPredictions.map((prediction) => {
                const predictionMeta = [
                  prediction.choice,
                  prediction.competition,
                ]
                  .filter(Boolean)
                  .join(" • ");

                return (
                  <View
                    key={prediction.id}
                    style={styles.xAuthorPredictionItem}
                  >
                    <Text style={styles.xAuthorPredictionItemTitle}>
                      {prediction.title || "توقع بدون عنوان"}
                    </Text>
                    <Text style={styles.xAuthorPredictionItemMeta}>
                      {predictionMeta || prediction.status}
                    </Text>
                    <View style={styles.xAuthorPredictionItemFooter}>
                      <Text style={styles.xAuthorPredictionItemPoints}>
                        {prediction.pointsAwarded
                          ? `+${prediction.pointsAwarded} نقطة`
                          : prediction.status}
                      </Text>
                      <Text style={styles.xAuthorPredictionItemTime}>
                        {prediction.lockedAt}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.xAuthorEmptyCard}>
              <Text style={styles.xAuthorEmptyTitle}>لا توجد توقعات بعد</Text>
              <Text style={styles.xAuthorEmptyText}>
                ستظهر هنا التوقعات المقفلة المرتبطة بهذا الحساب من قسم الدوريات.
              </Text>
            </View>
          )
        ) : null}

        {deferredActiveTab === "bio" ? (
          !isOwnProfile && !isDeferredTabVisible ? (
            <XAuthorSectionHiddenCard tab={deferredActiveTab} />
          ) : (
            <View style={styles.xAuthorPredictionCard}>
              <Text style={styles.xAuthorPredictionTitle}>نبذة الحساب</Text>
              <Text style={styles.xAuthorPredictionText}>{bioSummary}</Text>

              <View style={styles.xAuthorBioRow}>
                <Text style={styles.xAuthorBioValue}>{handleLabel}</Text>
                <Text style={styles.xAuthorBioLabel}>المعرف</Text>
              </View>
              <View style={styles.xAuthorBioRow}>
                <Text style={styles.xAuthorBioValue}>{roleLabel}</Text>
                <Text style={styles.xAuthorBioLabel}>الهوية</Text>
              </View>
              <View style={styles.xAuthorBioRow}>
                <Text style={styles.xAuthorBioValue}>{memberSinceLabel}</Text>
                <Text style={styles.xAuthorBioLabel}>الانضمام</Text>
              </View>
            </View>
          )
        ) : null}
      </ScrollView>
    </View>
  );
}

export function XAuthorSectionVisibilityNotice(props: {
  tab: AuthorProfileTab;
  onDismiss: () => void;
}) {
  return (
    <View style={styles.xAuthorSectionNoticeCard}>
      <Pressable
        style={styles.xAuthorSectionNoticeCloseButton}
        onPress={props.onDismiss}
      >
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.82)" />
      </Pressable>

      <Text style={styles.xAuthorSectionNoticeText}>
        عند إيقاف هذا الخيار لن تظهر صفحة
        {` ${AUTHOR_PROFILE_TAB_LABELS[props.tab]} `}
        للمستخدمين، وستبقى ظاهرة لك أنت فقط.
      </Text>
    </View>
  );
}

export function XAuthorSectionHiddenCard(props: { tab: AuthorProfileTab }) {
  return (
    <View style={styles.xAuthorEmptyCard}>
      <Text style={styles.xAuthorEmptyTitle}>القسم مخفي</Text>
      <Text style={styles.xAuthorEmptyText}>
        صفحة {AUTHOR_PROFILE_TAB_LABELS[props.tab]} غير معروضة لبقية المستخدمين
        حاليًا بواسطة صاحب الحساب.
      </Text>
    </View>
  );
}

export function XAuthorReplyThreadCard(props: {
  reply: OpenedAuthorReplyItem;
  onLikeSourcePost: () => void;
  onOpenSourceAuthor: () => void;
  onOpenSourcePost: () => void;
  onReplySourcePost: () => void;
  onRepostSourcePost: () => void;
  onShareSourcePost: () => void;
}) {
  return (
    <View style={styles.xAuthorReplyThreadCard}>
      <View style={styles.xReplyThreadRow}>
        <View style={styles.xAvatarTiny}>
          {props.reply.authorAvatarUri?.trim() ? (
            <Image
              source={{ uri: props.reply.authorAvatarUri }}
              style={styles.xAvatarTinyImage}
            />
          ) : (
            <Text style={styles.xAvatarTinyText}>
              {props.reply.author.slice(0, 1)}
            </Text>
          )}
        </View>

        <View style={styles.xReplyThreadContent}>
          <Text style={styles.xAuthorReplyingToText}>
            رد على منشور {props.reply.sourcePost.author}
          </Text>

          <View style={styles.xPostMetaLine}>
            <Text style={styles.xPostAuthor}>{props.reply.author}</Text>
            {props.reply.authorVerified ? (
              <SealCheckIcon size={14} style={styles.xVerifiedIcon} />
            ) : null}
            <Text style={styles.xPostHandle}>{props.reply.handle}</Text>
            <Text style={styles.xPostDot}>·</Text>
            <Text style={styles.xPostTime}>{props.reply.time}</Text>
          </View>

          <Text style={styles.xReplyThreadBody}>{props.reply.content}</Text>

          <View style={styles.xAuthorEmbeddedPostWrap}>
            <XPostCard
              post={props.reply.sourcePost}
              onOpen={props.onOpenSourcePost}
              onOpenAuthor={props.onOpenSourceAuthor}
              onReply={props.onReplySourcePost}
              onRepost={props.onRepostSourcePost}
              onLike={props.onLikeSourcePost}
              onShare={props.onShareSourcePost}
            />
          </View>
        </View>
      </View>
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
    <View style={styles.xAuthorSwipeShell} onLayout={handleTrackLayout}>
      <View
        style={[
          styles.xAuthorSwipeTrack,
          props.isFollowing ? styles.xAuthorSwipeTrackActive : null,
        ]}
      >
        <Text
          style={[
            styles.xAuthorSwipeLabel,
            props.isFollowing ? styles.xAuthorSwipeLabelActive : null,
          ]}
        >
          {label}
        </Text>

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.xAuthorSwipeThumb,
            props.isFollowing ? styles.xAuthorSwipeThumbActive : null,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <Ionicons
            name={props.isFollowing ? "checkmark" : "add"}
            size={20}
            color={props.isFollowing ? "#FFFFFF" : "#0C1420"}
          />
        </Animated.View>
      </View>
    </View>
  );
}

export function XAuthorActivityCard(props: {
  post: Post;
  accentLabel: string;
  accentValue: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.xAuthorActivityCard} onPress={props.onPress}>
      <View style={styles.xAuthorActivityHeader}>
        <View style={styles.xAuthorActivityAccentPill}>
          <Text style={styles.xAuthorActivityAccentValue}>
            {props.accentValue}
          </Text>
          <Text style={styles.xAuthorActivityAccentLabel}>
            {props.accentLabel}
          </Text>
        </View>

        <Text style={styles.xAuthorActivityTime}>{props.post.time}</Text>
      </View>

      {props.post.title ? (
        <Text style={styles.xAuthorActivityTitle}>{props.post.title}</Text>
      ) : null}

      <Text numberOfLines={3} style={styles.xAuthorActivityBody}>
        {props.post.content}
      </Text>

      <View style={styles.xAuthorActivityFooter}>
        <Text style={styles.xAuthorActivityFooterText}>
          {props.post.shares} مشاركة
        </Text>
        <Text style={styles.xAuthorActivityFooterText}>
          {props.post.replies} رد
        </Text>
        <Text style={styles.xAuthorActivityFooterText}>
          {props.post.likes} إعجاب
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  xAuthorScreen: {
    flex: 1,
    backgroundColor: "#05080F",
  },
  xAuthorHeader: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  xAuthorCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  xAuthorStaticPill: {
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
  xAuthorStaticPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  xAuthorScrollArea: {
    flex: 1,
  },
  xAuthorContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 36,
  },
  xAuthorSwipeShell: {
    width: 156,
  },
  xAuthorSwipeTrack: {
    height: AUTHOR_SWIPE_TRACK_HEIGHT,
    borderRadius: 999,
    paddingHorizontal: AUTHOR_SWIPE_HORIZONTAL_PADDING,
    justifyContent: "center",
    backgroundColor: "rgba(12,77,79,0.84)",
    borderWidth: 1,
    borderColor: "rgba(152,244,224,0.22)",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
  },
  xAuthorSwipeTrackActive: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: "rgba(255,255,255,0.98)",
  },
  xAuthorSwipeLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 28,
  },
  xAuthorSwipeLabelActive: {
    color: "#0C1722",
  },
  xAuthorSwipeThumb: {
    position: "absolute",
    left: AUTHOR_SWIPE_HORIZONTAL_PADDING,
    top: AUTHOR_SWIPE_THUMB_TOP_OFFSET,
    width: AUTHOR_SWIPE_THUMB_SIZE,
    height: AUTHOR_SWIPE_THUMB_SIZE,
    borderRadius: AUTHOR_SWIPE_THUMB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  xAuthorSwipeThumbActive: {
    backgroundColor: "#113843",
    shadowOpacity: 0.12,
  },
  xAuthorHeroCard: {
    borderRadius: 26,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "#000000",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 12,
  },
  xAuthorHeroAccentGlow: {
    position: "absolute",
    top: -56,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "transparent",
  },
  xAuthorPreviewHeaderLine: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 13,
  },
  xAuthorPreviewAvatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 4,
    backgroundColor: "rgba(244,197,101,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  xAuthorPreviewAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 34,
  },
  xAuthorPreviewAvatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D9BF0",
  },
  xAuthorPreviewAvatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  xAuthorPreviewCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
  },
  xAuthorPreviewInfoRow: {
    alignItems: "flex-end",
    marginTop: 8,
    gap: 5,
  },
  xAuthorPreviewHandle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
    maxWidth: "100%",
  },
  xAuthorPreviewVarId: {
    color: "#F4C565",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
    letterSpacing: 0.3,
    maxWidth: "100%",
  },
  xAuthorPreviewMetricGrid: {
    flexDirection: "row-reverse",
    gap: 8,
    marginTop: 16,
  },
  xAuthorPreviewMetricCard: {
    flex: 1,
    minHeight: 62,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  xAuthorPreviewMetricValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  xAuthorPreviewMetricLabel: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
  xAuthorPreviewMetaGrid: {
    gap: 8,
    marginTop: 10,
  },
  xAuthorPreviewMetaItem: {
    minHeight: 38,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.26)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  xAuthorPreviewMetaLabel: {
    color: "rgba(255,255,255,0.46)",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "right",
    letterSpacing: 0.6,
  },
  xAuthorPreviewMetaValue: {
    flex: 1,
    minWidth: 0,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "left",
    marginRight: 12,
  },
  xFollowingCardGlow: {
    position: "absolute",
    top: -24,
    left: -18,
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  xAuthorHeroTopRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xFollowingBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  xFollowingBadgeText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontWeight: "900",
    marginRight: 6,
    letterSpacing: 0.6,
  },
  xAuthorPrivatePill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  xAuthorPrivateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },
  xAuthorPrivateText: {
    marginRight: 8,
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  xAuthorHeroBody: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    marginTop: 18,
  },
  xAuthorHeroAvatarColumn: {
    width: 90,
    alignItems: "center",
  },
  xAuthorHeroAvatarWrap: {
    width: 86,
    height: 112,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  xAuthorHeroAvatarImage: {
    width: "100%",
    height: "100%",
  },
  xAuthorHeroAvatarText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
  },
  xAuthorMessageButton: {
    marginTop: 10,
    minWidth: 88,
    height: 34,
    borderRadius: 12,
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.96)",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  xAuthorMessageButtonText: {
    color: "#0C1722",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    marginRight: 6,
  },
  xAuthorHeroIdentityBlock: {
    flex: 1,
    marginLeft: 14,
    alignItems: "flex-end",
  },
  xAuthorHeroNameRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  xAuthorHeroName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "right",
  },
  xAuthorHeroVerifiedIcon: {
    marginLeft: 6,
  },
  xAuthorHeroHandle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  xAuthorInfoBlock: {
    alignSelf: "stretch",
    marginTop: 14,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  xAuthorInfoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  xAuthorInfoLabel: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "right",
    letterSpacing: 0.6,
  },
  xAuthorInfoValue: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "right",
    marginLeft: 12,
  },
  xAuthorHorizontalControlsSection: {
    marginTop: 14,
    alignSelf: "stretch",
  },
  xAuthorHorizontalControlsStrip: {
    flexDirection: "row-reverse",
    gap: 10,
    paddingVertical: 2,
    paddingLeft: 2,
  },
  xAuthorHorizontalControlCard: {
    width: 132,
    minHeight: 118,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "stretch",
  },
  xAuthorHorizontalControlCardActive: {
    backgroundColor: "rgba(244,197,101,0.12)",
    borderColor: "rgba(244,197,101,0.38)",
  },
  xAuthorHorizontalControlTopRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xAuthorHorizontalControlIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,197,101,0.12)",
    borderWidth: 1,
    borderColor: "rgba(244,197,101,0.20)",
  },
  xAuthorHorizontalControlIconActive: {
    backgroundColor: "#F4C565",
    borderColor: "#F4C565",
  },
  xAuthorHorizontalControlCount: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "left",
  },
  xAuthorHorizontalControlLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 10,
  },
  xAuthorVisibilitySwitch: {
    height: 28,
    borderRadius: 999,
    marginTop: 10,
    paddingHorizontal: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  xAuthorVisibilitySwitchActive: {
    backgroundColor: "rgba(52,211,153,0.16)",
    borderColor: "rgba(52,211,153,0.34)",
  },
  xAuthorVisibilitySwitchText: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  xAuthorVisibilitySwitchTextActive: {
    color: "#86EFAC",
  },
  xAuthorVisibilitySwitchKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.46)",
  },
  xAuthorVisibilitySwitchKnobActive: {
    backgroundColor: "#34D399",
  },
  xAuthorFeedSection: {
    alignSelf: "stretch",
    marginHorizontal: -16,
  },
  xAuthorSectionNoticeCard: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(166,229,212,0.18)",
    backgroundColor: "rgba(19,35,33,0.96)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingLeft: 44,
    alignItems: "flex-end",
  },
  xAuthorSectionNoticeCloseButton: {
    position: "absolute",
    left: 12,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  xAuthorSectionNoticeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "right",
  },
  xAuthorEmptyCard: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: "flex-end",
  },
  xAuthorEmptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
  },
  xAuthorEmptyText: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "right",
    marginTop: 8,
  },
  xAuthorPredictionCard: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: "flex-end",
  },
  xAuthorPredictionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
  },
  xAuthorPredictionText: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "right",
    marginTop: 8,
  },
  xAuthorPredictionItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    alignItems: "flex-end",
  },
  xAuthorPredictionItemTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },
  xAuthorPredictionItemMeta: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  xAuthorPredictionItemFooter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  xAuthorPredictionItemPoints: {
    color: "#34D399",
    fontSize: 12,
    fontWeight: "900",
  },
  xAuthorPredictionItemTime: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 11,
    fontWeight: "700",
  },
  xAuthorPredictionStatsRow: {
    flexDirection: "row-reverse",
    alignSelf: "stretch",
    marginTop: 14,
  },
  xAuthorPredictionStatPill: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  xAuthorPredictionStatValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  xAuthorPredictionStatLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  xAuthorBioRow: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  xAuthorBioLabel: {
    color: "rgba(255,255,255,0.46)",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
  },
  xAuthorBioValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "left",
    marginLeft: 12,
  },
  xAuthorReplyThreadCard: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  xReplyThreadRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  xReplyThreadContent: {
    flex: 1,
    marginRight: 12,
    alignItems: "flex-end",
  },
  xReplyThreadBody: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "right",
    marginTop: 6,
  },
  xAvatarTiny: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A8CD8",
  },
  xAvatarTinyImage: {
    width: "100%",
    height: "100%",
  },
  xAvatarTinyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  xVerifiedIcon: {
    marginLeft: 4,
    marginRight: 0,
  },
  xPostMetaLine: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexWrap: "wrap",
  },
  xPostAuthor: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 3,
  },
  xPostHandle: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  xPostTime: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 13,
    fontWeight: "600",
  },
  xPostDot: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 14,
    marginLeft: 6,
  },
  xAuthorReplyingToText: {
    color: "rgba(29,155,240,0.84)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 6,
  },
  xAuthorEmbeddedPostWrap: {
    alignSelf: "stretch",
    marginTop: 12,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#000000",
  },
  xAuthorActivityCard: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: "flex-end",
  },
  xAuthorActivityHeader: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xAuthorActivityAccentPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  xAuthorActivityAccentValue: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  xAuthorActivityAccentLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 10,
    fontWeight: "700",
    marginRight: 6,
  },
  xAuthorActivityTime: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    fontWeight: "700",
  },
  xAuthorActivityTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 12,
    alignSelf: "stretch",
  },
  xAuthorActivityBody: {
    color: "#E7EEF5",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
    alignSelf: "stretch",
    marginTop: 8,
  },
  xAuthorActivityFooter: {
    alignSelf: "stretch",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  xAuthorActivityFooterText: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    fontWeight: "700",
  },
});
