import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import XFeedHeader from "../components/XFeedHeader";
import {
  getMissingAppwriteSocialInteractionFields,
  hasAppwriteSocialInteractionsConfig,
  listAppwriteDirectMessages,
  listAppwriteProfileIndexesByVarIds,
  sendAppwriteDirectMessage,
} from "../lib/appwrite";
import type {
  FollowingProfileCard,
  PendingAuthIntent,
  Post,
} from "../app.types";
import { normalizeAuthorId } from "../appshell/appshell.helpers";
import type {
  AuthorProfileSectionNoticeDismissal,
  AuthorProfileSectionVisibility,
  AuthorProfileTab,
  HashtagTrendEntry,
  MessageThreadEntry,
  OpenedAuthorProfile,
  PrivateMessageEntry,
  WebAudioConstructor,
  WebAudioInstance,
  XNotificationEntry,
} from "./x-feed/x-feed.types";
import {
  buildComposerDisplayVarId,
  buildMessageThreadEntry,
  buildNotificationSnippet,
  buildPrivateMessageEntry,
  buildTrendingHashtags,
} from "./x-feed/x-feed.utils";
import {
  createDefaultAuthorProfileSectionNoticeDismissal,
  createDefaultAuthorProfileSectionVisibility,
} from "./x-feed/x-feed.types";
import { XPostCard, XReplyCard } from "./x-feed/XPostCard";
import {
  XMessagesScreen,
  XNotificationsScreen,
} from "./x-feed/XMessagesScreen";
import { XHashtagTrendCard } from "./x-feed/XHashtagDirectory";
import { XFollowingDeck } from "./x-feed/XFollowingDeck";
import { XAuthorProfileScreen } from "./x-feed/XAuthorProfileScreen";
import { styles } from "./x-feed/x-feed.styles";
import ChatOverlay from "./ChatOverlay";
import {
  requestNotificationPermissions,
  showMessageNotification,
} from "../lib/notifications/notifications.service";
import {
  subscribeToAppwriteCollection,
  saveAppwriteNotification,
  loadAppwriteNotifications,
  isNotificationAlreadySaved,
  markNotificationSaved,
} from "../lib/appwrite";

type XFeedScreenProps = {
  isLoggedIn: boolean;
  posts: Post[];
  onCreatePost: () => void;
  onRequireAuth: (message?: string, pendingIntent?: PendingAuthIntent) => void;
  onTogglePostLike: (postId: number) => void;
  onTogglePostRepost: (postId: number) => void;
  onSharePost: (postId: number) => void;
  currentUserVarId: string;
  currentUserDisplayName: string;
  currentUserDisplayVarId: string;
  currentUserAvatarUri: string;
  currentUserJoinDate?: string;
  currentUserNationality?: string;
  currentUserUsername?: string;
  currentUserRole?: "admin" | "member";
  currentUserIsVerified?: boolean;
  followedAuthorIds: string[];
  followedProfiles: FollowingProfileCard[];
  onToggleAuthorFollow: (authorVarId: string) => void;
  onSubmitPostReply: (postId: number, text: string) => void;
  resumeReplyPostId: number | null;
  onReplyIntentConsumed: () => void;
  onShowNotice?: (message: string) => void;
};

type OpenedAuthorReplyItem = import("../app.types").PostReply & {
  sourcePost: Post;
};

const CLICK_SOUND = require("../../assets/audio/click.mp3.mp3");

export default function XFeedScreen(props: XFeedScreenProps) {
  const { width: windowWidth } = useWindowDimensions();
  const {
    isLoggedIn,
    posts,
    onRequireAuth,
    onTogglePostLike,
    onTogglePostRepost,
    onSharePost,
    currentUserVarId,
    currentUserDisplayName,
    currentUserDisplayVarId,
    currentUserAvatarUri,
    currentUserJoinDate,
    currentUserNationality,
    currentUserUsername,
    currentUserRole,
    currentUserIsVerified,
    followedAuthorIds,
    followedProfiles,
    onToggleAuthorFollow,
    onSubmitPostReply,
    resumeReplyPostId,
    onReplyIntentConsumed,
    onShowNotice,
  } = props;
  const normalizedCurrentUserVarId = normalizeAuthorId(currentUserVarId);
  const resolvedCurrentUserDisplayVarId = buildComposerDisplayVarId(
    currentUserDisplayVarId,
    normalizedCurrentUserVarId,
  );
  const isCurrentUserAuthor = (authorVarId: string) => {
    const normalizedAuthorVarId = normalizeAuthorId(authorVarId);

    return (
      Boolean(normalizedCurrentUserVarId) &&
      normalizedAuthorVarId === normalizedCurrentUserVarId
    );
  };
  const isAuthorFollowed = (authorVarId: string) =>
    followedAuthorIds.some(
      (followedId) =>
        normalizeAuthorId(followedId) === normalizeAuthorId(authorVarId),
    );
  const [activeTab, setActiveTab] = useState<
    "following" | "for-you" | "messages"
  >("for-you");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyTargetPost, setReplyTargetPost] = useState<Post | null>(null);
  const [openedPost, setOpenedPost] = useState<Post | null>(null);
  const [openedMessageThreadVarId, setOpenedMessageThreadVarId] = useState<
    string | null
  >(null);
  const [openedMessageThreadProfile, setOpenedMessageThreadProfile] =
    useState<FollowingProfileCard | null>(null);
  const [isHashtagDirectoryOpen, setIsHashtagDirectoryOpen] = useState(false);
  const [openedAuthorProfile, setOpenedAuthorProfile] =
    useState<OpenedAuthorProfile | null>(null);
  const [authorProfileTab, setAuthorProfileTab] =
    useState<AuthorProfileTab>("likes");
  const [
    authorProfileVisibilityByAuthorId,
    setAuthorProfileVisibilityByAuthorId,
  ] = useState<Record<string, AuthorProfileSectionVisibility>>({});
  const [
    authorProfileNoticeDismissalByAuthorId,
    setAuthorProfileNoticeDismissalByAuthorId,
  ] = useState<Record<string, AuthorProfileSectionNoticeDismissal>>({});
  const [isReplySlashVisible, setIsReplySlashVisible] = useState(true);
  const [privateMessagesByVarId, setPrivateMessagesByVarId] = useState<
    Record<string, PrivateMessageEntry[]>
  >({});
  const [messagePeerProfilesByVarId, setMessagePeerProfilesByVarId] = useState<
    Record<string, FollowingProfileCard>
  >({});
  const [seenPrivateMessageIds, setSeenPrivateMessageIds] = useState<
    Record<string, true>
  >({});
  const [activityNotifications, setActivityNotifications] = useState<
    XNotificationEntry[]
  >([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [seenNotificationIds, setSeenNotificationIds] = useState<
    Record<string, true>
  >({});
  const [isSendingPrivateMessage, setIsSendingPrivateMessage] = useState(false);
  const [persistedNotifications, setPersistedNotifications] = useState<
    XNotificationEntry[]
  >([]);
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());
  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null);
  const swipeSoundRef = useRef<WebAudioInstance | null>(null);
  const clickSoundUri = useMemo(() => {
    try {
      const resolvedSource = Image.resolveAssetSource(CLICK_SOUND);

      if (resolvedSource?.uri) {
        return resolvedSource.uri;
      }
    } catch {
      // Ignore asset resolution failures on unsupported platforms.
    }

    return typeof CLICK_SOUND === "string" ? CLICK_SOUND : null;
  }, []);

  const layoutWidth = Math.min(windowWidth, 430);
  const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / 430));
  const xScreenBottomPadding = Math.round(132 * chromeScale);
  const xHashtagButtonSize = Math.round(48 * chromeScale);
  const normalizedReplyAuthorName =
    currentUserDisplayName.trim() || normalizedCurrentUserVarId || "VAR User";
  const normalizedReplyAuthorAvatarUri = currentUserAvatarUri.trim();
  const normalizedReplyAuthorVarId = buildComposerDisplayVarId(
    currentUserDisplayVarId,
    normalizedCurrentUserVarId,
  );
  const normalizedReplyAuthorDisplayName = normalizedReplyAuthorName
    .trim()
    .toLowerCase();
  const normalizedReplyAuthorHandle = `@${normalizedReplyAuthorVarId
    .trim()
    .replace(/^@/, "")
    .toLowerCase()}`;
  const replyAuthorInitial = normalizedReplyAuthorName.slice(0, 1) || "V";
  const hasTypedReply = replyDraft.length > 0;
  const canSubmitReply = replyDraft.trim().length > 0;

  const pushActivityNotification = (
    notification: Omit<XNotificationEntry, "sortOrder"> & {
      sortOrder?: number;
    },
  ) => {
    startTransition(() => {
      setActivityNotifications((currentNotifications) =>
        [
          {
            ...notification,
            sortOrder: notification.sortOrder ?? Date.now(),
          },
          ...currentNotifications.filter(
            (candidate) => candidate.id !== notification.id,
          ),
        ].slice(0, 40),
      );
    });
  };

  const resolveAuthorSnapshot = (authorVarId: string) => {
    const normalizedAuthorVarId = normalizeAuthorId(authorVarId);

    if (isCurrentUserAuthor(normalizedAuthorVarId)) {
      return {
        displayName: currentUserDisplayName.trim() || "VAR User",
        avatarUri: currentUserAvatarUri.trim(),
        verified: Boolean(currentUserIsVerified),
      };
    }

    const matchingProfile = followedProfiles.find(
      (profile) => normalizeAuthorId(profile.varId) === normalizedAuthorVarId,
    );
    const matchingPost = posts.find(
      (post) => normalizeAuthorId(post.authorId || "") === normalizedAuthorVarId,
    );

    return {
      displayName:
        matchingProfile?.displayName.trim() ||
        matchingPost?.author.trim() ||
        normalizedAuthorVarId,
      avatarUri:
        matchingProfile?.avatarUri.trim() ||
        matchingPost?.authorAvatarUri?.trim() ||
        "",
      verified:
        matchingProfile?.role === "admin" ||
        Boolean(matchingPost?.authorVerified),
    };
  };

  const trendingHashtags = useMemo(() => buildTrendingHashtags(posts), [posts]);

  useEffect(() => {
    let isActive = true;

    if (!isLoggedIn || !normalizedCurrentUserVarId) {
      setPrivateMessagesByVarId({});
      setMessagePeerProfilesByVarId({});
      setSeenPrivateMessageIds({});
      return;
    }

    const syncPrivateMessages = async () => {
      try {
        const directMessages = await listAppwriteDirectMessages(
          normalizedCurrentUserVarId,
        );

        if (!isActive) {
          return;
        }

        const nextMessagesByVarId: Record<string, PrivateMessageEntry[]> = {};
        const peerVarIds = Array.from(
          new Set(
            directMessages
              .map((record) => {
                const normalizedSenderVarId = normalizeAuthorId(
                  record.senderVarId,
                );
                const normalizedRecipientVarId = normalizeAuthorId(
                  record.recipientVarId,
                );

                return normalizedSenderVarId === normalizedCurrentUserVarId
                  ? normalizedRecipientVarId
                  : normalizedSenderVarId;
              })
              .filter(
                (peerVarId) =>
                  Boolean(peerVarId) &&
                  peerVarId !== normalizedCurrentUserVarId,
              ),
          ),
        );

        directMessages.forEach((record) => {
          const normalizedSenderVarId = normalizeAuthorId(record.senderVarId);
          const normalizedRecipientVarId = normalizeAuthorId(
            record.recipientVarId,
          );
          const peerVarId =
            normalizedSenderVarId === normalizedCurrentUserVarId
              ? normalizedRecipientVarId
              : normalizedSenderVarId;

          if (!peerVarId || peerVarId === normalizedCurrentUserVarId) {
            return;
          }

          nextMessagesByVarId[peerVarId] = [
            ...(nextMessagesByVarId[peerVarId] ?? []),
            buildPrivateMessageEntry(record, normalizedCurrentUserVarId),
          ];
        });

        const profileIndexes = peerVarIds.length
          ? await listAppwriteProfileIndexesByVarIds(peerVarIds)
          : [];

        if (!isActive) {
          return;
        }

        const nextPeerProfiles = profileIndexes.reduce<
          Record<string, FollowingProfileCard>
        >((currentMap, profile) => {
          const normalizedPeerVarId = normalizeAuthorId(profile.varId);

          if (
            !normalizedPeerVarId ||
            normalizedPeerVarId === normalizedCurrentUserVarId
          ) {
            return currentMap;
          }

          currentMap[normalizedPeerVarId] = {
            varId: normalizedPeerVarId,
            displayVarId: profile.displayVarId,
            displayName: profile.displayName,
            username: profile.username,
            avatarUri: profile.avatarUri,
            role: profile.role,
          };

          return currentMap;
        }, {});

        // ── Part B: fire local notification for each new incoming message ──
        const notifiedIds = notifiedMessageIdsRef.current;
        Object.entries(nextMessagesByVarId).forEach(
          ([peerVarId, peerMessages]) => {
            const peerProfile = nextPeerProfiles[peerVarId];
            const senderLabel =
              peerProfile?.displayName || peerProfile?.displayVarId || peerVarId;

            peerMessages.forEach((msg) => {
              if (msg.sender !== "peer") return;
              if (notifiedIds.has(msg.id)) return;
              notifiedIds.add(msg.id);
              void showMessageNotification(senderLabel, msg.content);
            });
          },
        );

        setPrivateMessagesByVarId(nextMessagesByVarId);
        setMessagePeerProfilesByVarId(nextPeerProfiles);
      } catch (error) {
        console.warn("Appwrite direct message sync skipped.", error);
      }
    };

    void syncPrivateMessages();

    // Part C: 60s fallback poll — Realtime subscription handles real-time updates
    const syncTimer = setInterval(() => {
      void syncPrivateMessages();
    }, 60000);

    return () => {
      isActive = false;
      clearInterval(syncTimer);
    };
  }, [isLoggedIn, normalizedCurrentUserVarId]);

  // ── Part B: request notification permissions once on login ────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    void requestNotificationPermissions();
  }, [isLoggedIn]);

  // ── Part C: Appwrite Realtime — trigger immediate sync on new DM ──────────
  useEffect(() => {
    if (!isLoggedIn || !normalizedCurrentUserVarId) {
      realtimeUnsubscribeRef.current?.();
      realtimeUnsubscribeRef.current = null;
      return;
    }

    const { APPWRITE_CONFIG } = require("../lib/appwrite") as {
      APPWRITE_CONFIG: { databaseId: string; socialInteractionsCollectionId: string };
    };

    const unsubscribe = subscribeToAppwriteCollection(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.socialInteractionsCollectionId,
      (payload, events) => {
        const isCreate = events.some((e) => e.includes(".create"));
        if (!isCreate) return;

        const mode = payload.mode as string | undefined;
        const action = payload.action as string | undefined;
        const targetId = payload.targetId as string | undefined;

        if (
          mode === "profile" &&
          action === "message" &&
          normalizeAuthorId(targetId ?? "") === normalizedCurrentUserVarId
        ) {
          // New incoming DM — trigger an immediate sync rather than waiting 60s
          startTransition(() => {
            // Re-trigger the polling effect by bumping a ref (sync will run in next tick)
            void (async () => {
              try {
                const {
                  listAppwriteDirectMessages: listDMs,
                  listAppwriteProfileIndexesByVarIds: listProfiles,
                } = require("../lib/appwrite") as typeof import("../lib/appwrite");

                const directMessages = await listDMs(normalizedCurrentUserVarId);
                const nextMsgsByVarId: Record<string, import("./x-feed/x-feed.types").PrivateMessageEntry[]> = {};
                const peerSet = new Set<string>();

                directMessages.forEach((record) => {
                  const senderNorm = normalizeAuthorId(record.senderVarId);
                  const recipNorm = normalizeAuthorId(record.recipientVarId);
                  const peerVarId =
                    senderNorm === normalizedCurrentUserVarId ? recipNorm : senderNorm;
                  if (!peerVarId || peerVarId === normalizedCurrentUserVarId) return;
                  peerSet.add(peerVarId);
                  nextMsgsByVarId[peerVarId] = [
                    ...(nextMsgsByVarId[peerVarId] ?? []),
                    buildPrivateMessageEntry(record, normalizedCurrentUserVarId),
                  ];
                });

                const profileIndexes = peerSet.size
                  ? await listProfiles([...peerSet])
                  : [];
                const nextPeerProfiles = profileIndexes.reduce<Record<string, import("../app.types").FollowingProfileCard>>(
                  (acc, p) => {
                    const pid = normalizeAuthorId(p.varId);
                    if (pid && pid !== normalizedCurrentUserVarId) {
                      acc[pid] = { varId: pid, displayVarId: p.displayVarId, displayName: p.displayName, username: p.username, avatarUri: p.avatarUri, role: p.role };
                    }
                    return acc;
                  },
                  {},
                );

                const notifiedIds = notifiedMessageIdsRef.current;
                Object.entries(nextMsgsByVarId).forEach(([peerVarId, msgs]) => {
                  const profile = nextPeerProfiles[peerVarId];
                  const label = profile?.displayName || profile?.displayVarId || peerVarId;
                  msgs.forEach((msg) => {
                    if (msg.sender !== "peer" || notifiedIds.has(msg.id)) return;
                    notifiedIds.add(msg.id);
                    void showMessageNotification(label, msg.content);
                  });
                });

                setPrivateMessagesByVarId(nextMsgsByVarId);
                setMessagePeerProfilesByVarId(nextPeerProfiles);
              } catch {
                // Ignore realtime sync errors
              }
            })();
          });
        }
      },
    );

    realtimeUnsubscribeRef.current = unsubscribe;

    return () => {
      realtimeUnsubscribeRef.current?.();
      realtimeUnsubscribeRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, normalizedCurrentUserVarId]);

  // ── Part D: load persisted notifications from Appwrite on login ───────────
  useEffect(() => {
    if (!isLoggedIn || !normalizedCurrentUserVarId) {
      setPersistedNotifications([]);
      return;
    }

    void (async () => {
      try {
        const loaded = await loadAppwriteNotifications(normalizedCurrentUserVarId);
        setPersistedNotifications(loaded);
        loaded.forEach((n) => markNotificationSaved(n.id));
      } catch {
        // Ignore load failures
      }
    })();
  }, [isLoggedIn, normalizedCurrentUserVarId]);

  useEffect(() => {
    const normalizedOpenedThreadVarId = normalizeAuthorId(
      openedMessageThreadVarId?.trim() || "",
    );

    if (!normalizedOpenedThreadVarId) {
      return;
    }

    const threadMessages =
      privateMessagesByVarId[normalizedOpenedThreadVarId] ?? [];

    if (!threadMessages.length) {
      return;
    }

    setSeenPrivateMessageIds((currentIds) => {
      let didChange = false;
      const nextIds = { ...currentIds };

      threadMessages.forEach((message) => {
        if (message.sender !== "peer" || nextIds[message.id]) {
          return;
        }

        nextIds[message.id] = true;
        didChange = true;
      });

      return didChange ? nextIds : currentIds;
    });
  }, [openedMessageThreadVarId, privateMessagesByVarId]);

  const messageProfilesByVarId = useMemo(() => {
    const nextProfiles: Record<string, FollowingProfileCard> = {};

    followedProfiles.forEach((profile) => {
      const normalizedPeerVarId = profile.varId.trim();

      if (
        !normalizedPeerVarId ||
        normalizedPeerVarId === normalizedCurrentUserVarId
      ) {
        return;
      }

      nextProfiles[normalizedPeerVarId] = profile;
    });

    Object.entries(messagePeerProfilesByVarId).forEach(
      ([peerVarId, profile]) => {
        if (!peerVarId || peerVarId === normalizedCurrentUserVarId) {
          return;
        }

        nextProfiles[peerVarId] = profile;
      },
    );

    if (openedMessageThreadProfile?.varId.trim()) {
      nextProfiles[openedMessageThreadProfile.varId.trim()] =
        openedMessageThreadProfile;
    }

    if (openedAuthorProfile?.authorId.trim()) {
      nextProfiles[openedAuthorProfile.authorId.trim()] = {
        varId: openedAuthorProfile.authorId.trim(),
        displayVarId: openedAuthorProfile.displayVarId,
        displayName: openedAuthorProfile.displayName,
        username: openedAuthorProfile.username,
        avatarUri: openedAuthorProfile.avatarUri,
        role: openedAuthorProfile.role,
      };
    }

    return nextProfiles;
  }, [
    followedProfiles,
    messagePeerProfilesByVarId,
    normalizedCurrentUserVarId,
    openedAuthorProfile,
    openedMessageThreadProfile,
  ]);

  const messageThreads = useMemo(() => {
    return Array.from(
      new Set([
        ...Object.keys(messageProfilesByVarId),
        ...Object.keys(privateMessagesByVarId),
      ]),
    )
      .filter(
        (peerVarId) =>
          Boolean(peerVarId) && peerVarId !== normalizedCurrentUserVarId,
      )
      .map((peerVarId) => {
        const profile = messageProfilesByVarId[peerVarId] ?? {
          varId: peerVarId,
          displayVarId: peerVarId,
          displayName: peerVarId,
          username: "",
          avatarUri: "",
          role: "member" as const,
        };
        const threadMessages = privateMessagesByVarId[peerVarId] ?? [];
        const latestMessage = threadMessages[threadMessages.length - 1];

        return {
          ...buildMessageThreadEntry(profile, threadMessages),
          unread: threadMessages.some(
            (message) =>
              message.sender === "peer" && !seenPrivateMessageIds[message.id],
          ),
          latestTimestamp: Date.parse(latestMessage?.createdAt || "") || 0,
        };
      })
      .sort((left, right) => {
        if (right.latestTimestamp !== left.latestTimestamp) {
          return right.latestTimestamp - left.latestTimestamp;
        }

        if (right.messageCount !== left.messageCount) {
          return right.messageCount - left.messageCount;
        }

        return left.displayName.localeCompare(right.displayName, "ar");
      })
      .map(({ latestTimestamp: _latestTimestamp, ...thread }) => thread);
  }, [
    messageProfilesByVarId,
    normalizedCurrentUserVarId,
    privateMessagesByVarId,
    seenPrivateMessageIds,
  ]);

  const openedMessageThread = useMemo(() => {
    const existingThread =
      messageThreads.find(
        (thread) => thread.profile.varId.trim() === openedMessageThreadVarId,
      ) || null;

    if (existingThread) {
      return existingThread;
    }

    const normalizedOpenedAuthorId = openedAuthorProfile?.authorId.trim() || "";

    if (
      !normalizedOpenedAuthorId ||
      normalizedOpenedAuthorId !== openedMessageThreadVarId ||
      normalizedOpenedAuthorId === normalizedCurrentUserVarId
    ) {
      return null;
    }

    return buildMessageThreadEntry(
      {
        varId: normalizedOpenedAuthorId,
        displayVarId:
          openedAuthorProfile?.displayVarId || normalizedOpenedAuthorId,
        displayName:
          openedAuthorProfile?.displayName || normalizedOpenedAuthorId,
        username: openedAuthorProfile?.username || "",
        avatarUri: openedAuthorProfile?.avatarUri || "",
        role: openedAuthorProfile?.role || "member",
      },
      privateMessagesByVarId[normalizedOpenedAuthorId] ?? [],
    );
  }, [
    messageThreads,
    openedAuthorProfile,
    openedMessageThreadVarId,
    normalizedCurrentUserVarId,
    privateMessagesByVarId,
  ]);

  const derivedNotifications = useMemo(() => {
    const nextNotifications: XNotificationEntry[] = [];

    messageThreads.forEach((thread, threadIndex) => {
      const latestMessage = thread.messages[thread.messages.length - 1];

      if (!latestMessage || latestMessage.sender !== "peer") {
        return;
      }

      nextNotifications.push({
        id: `dm-${thread.id}-${latestMessage.id}`,
        title: "رسالة خاصة جديدة",
        body: `${thread.displayName}: ${latestMessage.content}`,
        timeLabel: latestMessage.timeLabel || thread.timeLabel,
        iconName: "mail-unread-outline",
        accentColor: "#38BDF8",
        avatarUri: thread.avatarUri,
        verified: thread.verified,
        sortOrder: 500000 - threadIndex,
        target: {
          type: "thread",
          threadVarId: thread.profile.varId.trim(),
        },
      });
    });

    posts.forEach((post, postIndex) => {
      const normalizedPostAuthorId = post.authorId?.trim() || "";

      if (normalizedPostAuthorId !== normalizedCurrentUserVarId) {
        return;
      }

      const postSnippet = buildNotificationSnippet(
        [post.title?.trim(), post.content.trim()].filter(Boolean).join(" "),
        "يوجد نشاط جديد على أحد منشوراتك.",
      );

      (post.replyItems ?? [])
        .filter((reply) => {
          const replyAuthorName = reply.author.trim().toLowerCase();
          const replyHandle = reply.handle.trim().toLowerCase();

          return (
            replyAuthorName !== normalizedReplyAuthorDisplayName &&
            replyHandle !== normalizedReplyAuthorHandle
          );
        })
        .forEach((reply, replyIndex) => {
          nextNotifications.push({
            id: `reply-${post.id}-${reply.id}`,
            title: "رد جديد على منشورك",
            body: `${reply.author}: ${buildNotificationSnippet(reply.content, postSnippet)}`,
            timeLabel: reply.time,
            iconName: "chatbubble-ellipses-outline",
            accentColor: "#34D399",
            avatarUri: reply.authorAvatarUri?.trim() || "",
            verified: Boolean(reply.authorVerified),
            sortOrder: 400000 - postIndex * 100 - replyIndex,
            target: {
              type: "post",
              postId: post.id,
            },
          });
        });

      const engagementTotal = post.likes + post.reposts + post.shares;

      if (!engagementTotal) {
        return;
      }

      nextNotifications.push({
        id: `engagement-${post.id}-${post.likes}-${post.reposts}-${post.shares}`,
        title: "نشاط على منشورك",
        body: `${post.likes} إعجاب · ${post.reposts} إعادة نشر · ${post.shares} مشاركة · ${postSnippet}`,
        timeLabel: post.time,
        iconName: "sparkles-outline",
        accentColor: "#F59E0B",
        avatarUri: normalizedReplyAuthorAvatarUri,
        verified: false,
        sortOrder: 300000 - postIndex,
        target: {
          type: "post",
          postId: post.id,
        },
      });
    });

    return nextNotifications.sort(
      (left, right) => right.sortOrder - left.sortOrder,
    );
  }, [
    messageThreads,
    normalizedCurrentUserVarId,
    normalizedReplyAuthorAvatarUri,
    normalizedReplyAuthorDisplayName,
    normalizedReplyAuthorHandle,
    posts,
  ]);

  const notificationEntries = useMemo(() => {
    const notificationsById = new Map<string, XNotificationEntry>();

    // Persisted (Appwrite) < activity < derived — later entries win
    [...persistedNotifications, ...activityNotifications, ...derivedNotifications].forEach(
      (notification) => {
        notificationsById.set(notification.id, notification);
      },
    );

    return [...notificationsById.values()].sort(
      (left, right) => right.sortOrder - left.sortOrder,
    );
  }, [activityNotifications, derivedNotifications, persistedNotifications]);

  const notificationCards = useMemo(
    () =>
      notificationEntries.map((notification) => ({
        ...notification,
        unread: !seenNotificationIds[notification.id],
      })),
    [notificationEntries, seenNotificationIds],
  );

  const unreadNotificationCount = useMemo(
    () =>
      notificationCards.filter((notification) => notification.unread).length,
    [notificationCards],
  );

  // ── Part D: save new notifications to Appwrite (after notificationEntries) ─
  useEffect(() => {
    if (!isLoggedIn || !normalizedCurrentUserVarId) return;

    notificationEntries.forEach((notification) => {
      if (isNotificationAlreadySaved(notification.id)) return;
      markNotificationSaved(notification.id);
      void saveAppwriteNotification(normalizedCurrentUserVarId, notification);
    });
  }, [isLoggedIn, normalizedCurrentUserVarId, notificationEntries]);

  useEffect(() => {
    if (!isNotificationsOpen || !notificationEntries.length) {
      return;
    }

    setSeenNotificationIds((currentIds) => {
      let didChange = false;
      const nextIds = { ...currentIds };

      notificationEntries.forEach((notification) => {
        if (!nextIds[notification.id]) {
          nextIds[notification.id] = true;
          didChange = true;
        }
      });

      return didChange ? nextIds : currentIds;
    });
  }, [isNotificationsOpen, notificationEntries]);

  useEffect(() => {
    if (!resumeReplyPostId || !isLoggedIn) {
      return;
    }

    const targetPost = posts.find((post) => post.id === resumeReplyPostId);

    if (targetPost) {
      setReplyDraft("");
      setReplyTargetPost(targetPost);
    }

    onReplyIntentConsumed();
  }, [isLoggedIn, onReplyIntentConsumed, posts, resumeReplyPostId]);

  useEffect(() => {
    if (Platform.OS !== "web" || !clickSoundUri) {
      swipeSoundRef.current = null;
      return;
    }

    const audioConstructor = (
      globalThis as typeof globalThis & { Audio?: WebAudioConstructor }
    ).Audio;

    if (!audioConstructor) {
      swipeSoundRef.current = null;
      return;
    }

    const sound = new audioConstructor(clickSoundUri);
    sound.preload = "auto";
    swipeSoundRef.current = sound;

    return () => {
      try {
        sound.pause?.();
      } catch {
        // Ignore teardown failures and keep the UI responsive.
      }

      swipeSoundRef.current = null;
    };
  }, [clickSoundUri]);

  useEffect(() => {
    if (!openedPost) {
      return;
    }

    const nextOpenedPost = posts.find((post) => post.id === openedPost.id);

    if (!nextOpenedPost) {
      setOpenedPost(null);
      return;
    }

    if (nextOpenedPost !== openedPost) {
      setOpenedPost(nextOpenedPost);
    }
  }, [openedPost, posts]);

  useEffect(() => {
    if (activeTab === "for-you") {
      return;
    }

    setOpenedMessageThreadProfile(null);
    setOpenedMessageThreadVarId(null);
    setPrivateDraft("");
    setIsHashtagDirectoryOpen(false);
    setOpenedPost(null);
    setOpenedAuthorProfile(null);
    setReplyTargetPost(null);
    setReplyDraft("");
  }, [activeTab]);

  useEffect(() => {
    if (!replyTargetPost || hasTypedReply) {
      setIsReplySlashVisible(true);
      return;
    }

    const blinkTimer = setInterval(() => {
      setIsReplySlashVisible((currentValue) => !currentValue);
    }, 520);

    return () => {
      clearInterval(blinkTimer);
    };
  }, [hasTypedReply, replyTargetPost]);

  const resolvedOpenedAuthorProfile = useMemo(() => {
    if (!openedAuthorProfile) {
      return null;
    }

    const normalizedAuthorId = normalizeAuthorId(openedAuthorProfile.authorId);
    const viewingOwnProfile = isCurrentUserAuthor(normalizedAuthorId);
    const matchingFollowedProfile = followedProfiles.find(
      (profile) => normalizeAuthorId(profile.varId) === normalizedAuthorId,
    );
    const latestAuthorPost = posts.find(
      (post) => normalizeAuthorId(post.authorId || "") === normalizedAuthorId,
    );

    return {
      authorId: normalizedAuthorId,
      displayName: viewingOwnProfile
        ? currentUserDisplayName.trim() || openedAuthorProfile.displayName
        : matchingFollowedProfile?.displayName?.trim() ||
          latestAuthorPost?.author?.trim() ||
          openedAuthorProfile.displayName,
      displayVarId: viewingOwnProfile
        ? resolvedCurrentUserDisplayVarId
        : buildComposerDisplayVarId(
            matchingFollowedProfile?.displayVarId?.trim() ||
              openedAuthorProfile.displayVarId,
            normalizedAuthorId,
          ),
      avatarUri: viewingOwnProfile
        ? currentUserAvatarUri.trim() || openedAuthorProfile.avatarUri
        : matchingFollowedProfile?.avatarUri?.trim() ||
          latestAuthorPost?.authorAvatarUri?.trim() ||
          openedAuthorProfile.avatarUri,
      verified: viewingOwnProfile
        ? Boolean(currentUserIsVerified)
        : matchingFollowedProfile?.role === "admin" ||
          Boolean(latestAuthorPost?.authorVerified) ||
          openedAuthorProfile.verified,
      role: viewingOwnProfile
        ? currentUserRole || (currentUserIsVerified ? "admin" : "member")
        : matchingFollowedProfile?.role ||
          (latestAuthorPost?.authorVerified ? "admin" : openedAuthorProfile.role),
      username: viewingOwnProfile
        ? currentUserUsername?.trim() || openedAuthorProfile.username
        : matchingFollowedProfile?.username?.trim() ||
          openedAuthorProfile.username,
      joinDate: viewingOwnProfile
        ? currentUserJoinDate || openedAuthorProfile.joinDate
        : openedAuthorProfile.joinDate,
      nationality: viewingOwnProfile
        ? currentUserNationality || openedAuthorProfile.nationality
        : openedAuthorProfile.nationality,
    } satisfies OpenedAuthorProfile;
  }, [
    currentUserAvatarUri,
    currentUserDisplayName,
    currentUserDisplayVarId,
    currentUserIsVerified,
    currentUserJoinDate,
    currentUserNationality,
    currentUserRole,
    currentUserUsername,
    followedProfiles,
    openedAuthorProfile,
    posts,
    resolvedCurrentUserDisplayVarId,
  ]);

  const openedAuthorPosts = useMemo(() => {
    const normalizedAuthorId =
      resolvedOpenedAuthorProfile?.authorId.trim() || "";

    if (!normalizedAuthorId) {
      return [] as Post[];
    }

    return posts.filter(
      (post) => normalizeAuthorId(post.authorId || "") === normalizedAuthorId,
    );
  }, [posts, resolvedOpenedAuthorProfile?.authorId]);

  const openedAuthorTopLikedPosts = useMemo(
    () =>
      [...openedAuthorPosts]
        .sort((left, right) => right.likes - left.likes)
        .slice(0, 3),
    [openedAuthorPosts],
  );

  const openedAuthorReplyItems = useMemo(() => {
    const normalizedUsername =
      resolvedOpenedAuthorProfile?.username.trim().toLowerCase() || "";
    const normalizedHandle = normalizedUsername ? `@${normalizedUsername}` : "";
    const normalizedDisplayName =
      resolvedOpenedAuthorProfile?.displayName.trim().toLowerCase() || "";

    if (!normalizedHandle && !normalizedDisplayName) {
      return [] as OpenedAuthorReplyItem[];
    }

    return posts.flatMap((post) =>
      (post.replyItems ?? [])
        .filter((reply) => {
          const replyHandle = reply.handle.trim().toLowerCase();
          const replyAuthor = reply.author.trim().toLowerCase();

          return (
            (normalizedHandle && replyHandle === normalizedHandle) ||
            (normalizedDisplayName && replyAuthor === normalizedDisplayName)
          );
        })
        .map((reply) => ({
          ...reply,
          sourcePost: post,
        })),
    );
  }, [
    posts,
    resolvedOpenedAuthorProfile?.displayName,
    resolvedOpenedAuthorProfile?.username,
  ]);

  const openedAuthorLikesTotal = useMemo(
    () => openedAuthorPosts.reduce((sum, post) => sum + post.likes, 0),
    [openedAuthorPosts],
  );

  const openedAuthorRepliesTotal = useMemo(
    () => openedAuthorPosts.reduce((sum, post) => sum + post.replies, 0),
    [openedAuthorPosts],
  );

  const openedAuthorSharesTotal = useMemo(
    () => openedAuthorPosts.reduce((sum, post) => sum + post.shares, 0),
    [openedAuthorPosts],
  );

  const openedAuthorSectionVisibility = useMemo(() => {
    const normalizedAuthorId =
      resolvedOpenedAuthorProfile?.authorId.trim() || "";

    if (!normalizedAuthorId) {
      return createDefaultAuthorProfileSectionVisibility();
    }

    return (
      authorProfileVisibilityByAuthorId[normalizedAuthorId] ??
      createDefaultAuthorProfileSectionVisibility()
    );
  }, [
    authorProfileVisibilityByAuthorId,
    resolvedOpenedAuthorProfile?.authorId,
  ]);

  const openedAuthorSectionNoticeDismissal = useMemo(() => {
    const normalizedAuthorId =
      resolvedOpenedAuthorProfile?.authorId.trim() || "";

    if (!normalizedAuthorId) {
      return createDefaultAuthorProfileSectionNoticeDismissal();
    }

    return (
      authorProfileNoticeDismissalByAuthorId[normalizedAuthorId] ??
      createDefaultAuthorProfileSectionNoticeDismissal()
    );
  }, [
    authorProfileNoticeDismissalByAuthorId,
    resolvedOpenedAuthorProfile?.authorId,
  ]);

  const toggleAuthorSectionVisibility = (
    authorId: string,
    tab: AuthorProfileTab,
  ) => {
    const normalizedAuthorId = authorId.trim();

    if (!normalizedAuthorId) {
      return;
    }

    setAuthorProfileVisibilityByAuthorId((currentVisibility) => {
      const currentAuthorVisibility =
        currentVisibility[normalizedAuthorId] ??
        createDefaultAuthorProfileSectionVisibility();

      return {
        ...currentVisibility,
        [normalizedAuthorId]: {
          ...currentAuthorVisibility,
          [tab]: !currentAuthorVisibility[tab],
        },
      };
    });
  };

  const dismissAuthorSectionNotice = (
    authorId: string,
    tab: AuthorProfileTab,
  ) => {
    const normalizedAuthorId = authorId.trim();

    if (!normalizedAuthorId) {
      return;
    }

    setAuthorProfileNoticeDismissalByAuthorId((currentDismissal) => {
      const currentAuthorDismissal =
        currentDismissal[normalizedAuthorId] ??
        createDefaultAuthorProfileSectionNoticeDismissal();

      return {
        ...currentDismissal,
        [normalizedAuthorId]: {
          ...currentAuthorDismissal,
          [tab]: true,
        },
      };
    });
  };

  const closeReplyComposer = () => {
    setReplyDraft("");
    setReplyTargetPost(null);
  };

  const openPrivateMessageThread = (thread: MessageThreadEntry) => {
    if (!isLoggedIn) {
      onRequireAuth("سجل الدخول لفتح الرسائل الخاصة داخل صفحة X.");
      return;
    }

    setOpenedPost(null);
    setOpenedAuthorProfile(null);
    setReplyTargetPost(null);
    setReplyDraft("");
    setIsHashtagDirectoryOpen(false);
    setIsNotificationsOpen(false);
    setOpenedMessageThreadProfile(thread.profile);
    setOpenedMessageThreadVarId(normalizeAuthorId(thread.profile.varId));
  };

  const openAuthorPrivateMessageThread = (profile: OpenedAuthorProfile) => {
    openPrivateMessageThread(
      buildMessageThreadEntry(
        {
          varId: profile.authorId,
          displayVarId: profile.displayVarId,
          displayName: profile.displayName,
          username: profile.username,
          avatarUri: profile.avatarUri,
          role: profile.role,
        },
        privateMessagesByVarId[normalizeAuthorId(profile.authorId)] ?? [],
      ),
    );
  };

  const closePrivateMessageThread = () => {
    setOpenedMessageThreadProfile(null);
    setOpenedMessageThreadVarId(null);
  };

  const openNotifications = () => {
    setOpenedPost(null);
    setOpenedAuthorProfile(null);
    setReplyTargetPost(null);
    setReplyDraft("");
    setOpenedMessageThreadProfile(null);
    setOpenedMessageThreadVarId(null);
    setIsHashtagDirectoryOpen(false);
    setIsNotificationsOpen(true);
  };

  const closeNotifications = () => {
    setIsNotificationsOpen(false);
  };

  const openNotificationTarget = (notification: XNotificationEntry) => {
    setIsNotificationsOpen(false);

    const notificationTarget = notification.target;

    if (!notificationTarget) {
      return;
    }

    if (notificationTarget.type === "thread") {
      const matchingThread = messageThreads.find(
        (thread) =>
          thread.profile.varId.trim() === notificationTarget.threadVarId,
      );

      if (matchingThread) {
        openPrivateMessageThread(matchingThread);
      }

      return;
    }

    const matchingPost = posts.find(
      (post) => post.id === notificationTarget.postId,
    );

    if (!matchingPost) {
      return;
    }

    setActiveTab("for-you");
    setOpenedAuthorProfile(null);
    setReplyTargetPost(null);
    setReplyDraft("");
    setOpenedMessageThreadProfile(null);
    setOpenedMessageThreadVarId(null);
    setIsHashtagDirectoryOpen(false);
    setOpenedPost(matchingPost);
  };

  const submitPrivateMessage = async (messageText: string): Promise<boolean> => {
    const normalizedPeerVarId = normalizeAuthorId(
      openedMessageThreadVarId?.trim() || "",
    );
    const trimmedDraft = messageText.trim();

    if (!trimmedDraft || isSendingPrivateMessage) {
      return false;
    }

    if (!isLoggedIn || !normalizedCurrentUserVarId) {
      onRequireAuth("سجل الدخول لإرسال رسالة خاصة.");
      return false;
    }

    if (!normalizedPeerVarId || normalizedPeerVarId === normalizedCurrentUserVarId) {
      onShowNotice?.("تعذر تحديد المستخدم المستلم للرسالة.");
      return false;
    }

    if (!hasAppwriteSocialInteractionsConfig()) {
      const missingFields = getMissingAppwriteSocialInteractionFields().join(", ");
      onShowNotice?.(
        `ربط Appwrite غير مكتمل للرسائل. أضف: ${missingFields}. انسخ .env.example إلى .env وعبّئ معرفات قاعدة البيانات والتفاعلات.`,
      );
      return false;
    }

    setIsSendingPrivateMessage(true);

    try {
      const createdMessage = await sendAppwriteDirectMessage({
        senderVarId: normalizedCurrentUserVarId,
        recipientVarId: normalizedPeerVarId,
        content: trimmedDraft,
      });

      if (!createdMessage) {
        onShowNotice?.(
          "تعذر حفظ الرسالة في Appwrite. تحقق من EXPO_PUBLIC_APPWRITE_DATABASE_ID و EXPO_PUBLIC_APPWRITE_SOCIAL_INTERACTIONS_COLLECTION_ID.",
        );
        return false;
      }

      const nextMessage = buildPrivateMessageEntry(
        createdMessage,
        normalizedCurrentUserVarId,
      );

      setPrivateMessagesByVarId((currentMap) => ({
        ...currentMap,
        [normalizedPeerVarId]: [
          ...(currentMap[normalizedPeerVarId] ?? []).filter(
            (message) => message.id !== nextMessage.id,
          ),
          nextMessage,
        ],
      }));
      onShowNotice?.("تم إرسال الرسالة وحفظها في Appwrite.");
      return true;
    } catch (error) {
      onShowNotice?.(
        error instanceof Error
          ? `تعذر إرسال الرسالة: ${error.message}`
          : "تعذر إرسال الرسالة إلى Appwrite.",
      );
      return false;
    } finally {
      setIsSendingPrivateMessage(false);
    }
  };

  const openHashtagDirectory = () => {
    setOpenedPost(null);
    setOpenedAuthorProfile(null);
    setReplyTargetPost(null);
    setReplyDraft("");
    setIsHashtagDirectoryOpen(true);
  };

  const closeHashtagDirectory = () => {
    setIsHashtagDirectoryOpen(false);
  };

  const closePostDetail = () => {
    setOpenedPost(null);
  };

  const closeAuthorProfile = () => {
    setOpenedAuthorProfile(null);
  };

  const openPostDetail = (post: Post) => {
    setOpenedPost(post);
  };

  const openHashtagTrend = (trend: HashtagTrendEntry) => {
    setIsHashtagDirectoryOpen(false);
    setOpenedPost(trend.anchorPost);
  };

  const playSwipeSound = async () => {
    const sound = swipeSoundRef.current;

    if (!sound) {
      return;
    }

    try {
      sound.currentTime = 0;

      const playback = sound.play?.();

      if (
        playback &&
        typeof playback === "object" &&
        "catch" in playback &&
        typeof playback.catch === "function"
      ) {
        await playback.catch(() => undefined);
      }
    } catch {
      // Ignore playback failures so swipe completion remains responsive.
    }
  };

  const toggleAuthorFollowByVarId = (authorVarId: string) => {
    const normalizedAuthorVarId = authorVarId.trim();
    const isCurrentlyFollowing = isAuthorFollowed(normalizedAuthorVarId);

    if (
      !normalizedAuthorVarId ||
      normalizedAuthorVarId === normalizedCurrentUserVarId
    ) {
      return;
    }

    if (!isLoggedIn) {
      setOpenedAuthorProfile(null);
      onRequireAuth("سجل الدخول لمتابعة هذا المستخدم.", {
        type: "toggle-follow-author",
        authorVarId: normalizedAuthorVarId,
      });
      return;
    }

    onToggleAuthorFollow(normalizedAuthorVarId);

    const authorSnapshot = resolveAuthorSnapshot(normalizedAuthorVarId);

    pushActivityNotification({
      id: `follow-${normalizedAuthorVarId}-${isCurrentlyFollowing ? "off" : "on"}-${Date.now()}`,
      title: isCurrentlyFollowing ? "تم إلغاء المتابعة" : "تمت متابعة الحساب",
      body: `${isCurrentlyFollowing ? "أوقفت متابعة" : "بدأت متابعة"} ${authorSnapshot.displayName}.`,
      timeLabel: "الآن",
      iconName: isCurrentlyFollowing
        ? "person-remove-outline"
        : "person-add-outline",
      accentColor: isCurrentlyFollowing ? "#F97316" : "#34D399",
      avatarUri: authorSnapshot.avatarUri,
      verified: authorSnapshot.verified,
    });
  };

  const handlePostLike = (post: Post) => {
    const nextLiked = !post.likedByMe;

    if (!isLoggedIn) {
      onRequireAuth("سجل الدخول للتفاعل مع منشورات X.", {
        type: "toggle-post-like",
        postId: post.id,
      });
      return;
    }

    onTogglePostLike(post.id);

    if (!nextLiked) {
      return;
    }

    pushActivityNotification({
      id: `like-${post.id}-${Date.now()}`,
      title: "إعجاب داخل X",
      body: `أضفت إعجابًا على منشور ${post.author}.`,
      timeLabel: "الآن",
      iconName: "heart-outline",
      accentColor: "#FB7185",
      avatarUri: post.authorAvatarUri?.trim() || "",
      verified: Boolean(post.authorVerified),
      target: {
        type: "post",
        postId: post.id,
      },
    });
  };

  const handlePostRepost = (post: Post) => {
    const nextReposted = !post.repostedByMe;

    if (!isLoggedIn) {
      onRequireAuth("سجل الدخول لإعادة نشر منشورات X.", {
        type: "toggle-post-repost",
        postId: post.id,
      });
      return;
    }

    onTogglePostRepost(post.id);

    if (!nextReposted) {
      return;
    }

    pushActivityNotification({
      id: `repost-${post.id}-${Date.now()}`,
      title: "إعادة نشر داخل X",
      body: `أعدت نشر منشور ${post.author}.`,
      timeLabel: "الآن",
      iconName: "repeat",
      accentColor: "#6EE7B7",
      avatarUri: post.authorAvatarUri?.trim() || "",
      verified: Boolean(post.authorVerified),
      target: {
        type: "post",
        postId: post.id,
      },
    });
  };

  const handlePostShare = (post: Post) => {
    if (!isLoggedIn) {
      onRequireAuth("سجل الدخول لمشاركة منشورات X.", {
        type: "share-post",
        postId: post.id,
      });
      return;
    }

    void onSharePost(post.id);
  };

  const handleAuthorFollow = (post: Post) => {
    toggleAuthorFollowByVarId(post.authorId?.trim() || "");
  };

  const openAuthorProfile = (post: Post) => {
    const normalizedAuthorId =
      post.authorId?.trim() || post.author?.trim() || post.handle?.trim() || "";

    if (!normalizedAuthorId) {
      return;
    }

    const normalizedId = normalizeAuthorId(
      post.authorId?.trim() || post.author?.trim() || post.handle?.trim() || "",
    );
    const normalizedPostHandle = post.handle.trim().replace(/^@+/, "").toLowerCase();
    const normalizedUsername = (currentUserUsername || "").trim().toLowerCase();
    const isCurrentUser =
      isCurrentUserAuthor(normalizedId) ||
      (Boolean(currentUserDisplayName.trim()) &&
        post.author.trim() === currentUserDisplayName.trim()) ||
      (Boolean(normalizedUsername) &&
        normalizedPostHandle === normalizedUsername);

    const matchingFollowedProfile = followedProfiles.find(
      (profile) => normalizeAuthorId(profile.varId) === normalizedId,
    );

    setOpenedPost(null);
    setReplyTargetPost(null);
    setAuthorProfileTab("likes");
    setOpenedAuthorProfile({
      authorId: normalizedId,
      displayName: isCurrentUser
        ? currentUserDisplayName.trim() || post.author.trim()
        : matchingFollowedProfile?.displayName?.trim() || post.author.trim(),
      displayVarId: isCurrentUser
        ? resolvedCurrentUserDisplayVarId
        : buildComposerDisplayVarId(
            matchingFollowedProfile?.displayVarId?.trim() || "",
            normalizedId,
          ),
      avatarUri: isCurrentUser
        ? currentUserAvatarUri.trim()
        : matchingFollowedProfile?.avatarUri?.trim() ||
          post.authorAvatarUri?.trim() ||
          "",
      verified: isCurrentUser
        ? Boolean(currentUserIsVerified)
        : matchingFollowedProfile?.role === "admin" ||
          Boolean(post.authorVerified),
      role: isCurrentUser
        ? currentUserRole || (currentUserIsVerified ? "admin" : "member")
        : matchingFollowedProfile?.role ||
          (post.authorVerified ? "admin" : "member"),
      username: isCurrentUser
        ? currentUserUsername?.trim() || ""
        : matchingFollowedProfile?.username?.trim() || "",
      joinDate: isCurrentUser ? currentUserJoinDate : undefined,
      nationality: isCurrentUser ? currentUserNationality : undefined,
    });
  };

  const openPostFromAuthorProfile = (post: Post) => {
    setOpenedAuthorProfile(null);
    setOpenedPost(post);
  };

  const openReplyComposer = (post: Post) => {
    if (!isLoggedIn) {
      onRequireAuth("سجل الدخول للرد على منشورات X.", {
        type: "reply-post",
        postId: post.id,
      });
      return;
    }

    setReplyDraft("");
    setReplyTargetPost(post);
  };

  const submitReply = () => {
    if (!replyTargetPost || !replyDraft.trim()) {
      return;
    }

    const submittedReply = replyDraft.trim();

    onSubmitPostReply(replyTargetPost.id, replyDraft);
    pushActivityNotification({
      id: `reply-out-${replyTargetPost.id}-${Date.now()}`,
      title: "تم إرسال ردك",
      body: buildNotificationSnippet(
        submittedReply,
        `أرسلت ردًا على منشور ${replyTargetPost.author}.`,
      ),
      timeLabel: "الآن",
      iconName: "chatbubble-ellipses-outline",
      accentColor: "#34D399",
      avatarUri: replyTargetPost.authorAvatarUri?.trim() || "",
      verified: Boolean(replyTargetPost.authorVerified),
      target: {
        type: "post",
        postId: replyTargetPost.id,
      },
    });
    closeReplyComposer();
  };

  return (
    <View style={styles.xScreen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.xScrollArea}
        contentContainerStyle={[
          styles.xScreenContent,
          { paddingBottom: xScreenBottomPadding },
        ]}
      >
        <XFeedHeader
          windowWidth={windowWidth}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          notificationCount={unreadNotificationCount}
          notificationsActive={isNotificationsOpen}
          onOpenNotifications={openNotifications}
        />

        {activeTab === "following" ? (
          <XFollowingDeck
            isLoggedIn={isLoggedIn}
            profiles={followedProfiles}
            onRequireAuth={() => onRequireAuth("سجل الدخول لعرض المتابَعين.")}
            onUnfollow={onToggleAuthorFollow}
          />
        ) : activeTab === "messages" ? (
          <XMessagesScreen
            isLoggedIn={isLoggedIn}
            threads={messageThreads}
            onRequireAuth={() =>
              onRequireAuth("سجل الدخول لعرض الرسائل الخاصة داخل صفحة X.")
            }
            onOpenThread={openPrivateMessageThread}
          />
        ) : (
          <>
            {posts.length ? (
              posts.map((post) => (
                <XPostCard
                  key={post.id}
                  post={post}
                  canToggleFollow={Boolean(
                    post.authorId?.trim() &&
                    post.authorId.trim() !== normalizedCurrentUserVarId,
                  )}
                  isFollowingAuthor={Boolean(
                    post.authorId?.trim() && isAuthorFollowed(post.authorId),
                  )}
                  onToggleFollow={() => handleAuthorFollow(post)}
                  onOpenAuthor={() => openAuthorProfile(post)}
                  onOpen={() => openPostDetail(post)}
                  onReply={() => openReplyComposer(post)}
                  onRepost={() => handlePostRepost(post)}
                  onShare={() => handlePostShare(post)}
                  onLike={() => handlePostLike(post)}
                />
              ))
            ) : (
              <View style={styles.xEmptyStateCard}>
                <Text style={styles.xEmptyStateTitle}>لا توجد منشورات بعد</Text>
                <Text style={styles.xEmptyStateText}>
                  افتح نافذة النشر وأضف أول Post إلى جدول Appwrite.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Pressable
        style={[
          styles.xHashtagButton,
          {
            width: xHashtagButtonSize,
            height: xHashtagButtonSize,
            borderRadius: Math.round(15 * chromeScale),
          },
        ]}
        onPress={openHashtagDirectory}
      >
        <Text style={styles.xHashtagButtonText}>#</Text>
      </Pressable>

      <Modal
        visible={isHashtagDirectoryOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeHashtagDirectory}
      >
        <View style={styles.xHashtagScreen}>
          <View style={styles.xHashtagHeader}>
            <View style={styles.xHashtagHeaderBadge}>
              <Text style={styles.xHashtagHeaderBadgeText}># VAR</Text>
            </View>

            <View style={styles.xHashtagHeaderTextBlock}>
              <Text style={styles.xHashtagHeaderTitle}>الهاشتاقات</Text>
              <Text style={styles.xHashtagHeaderSubtitle}>
                {trendingHashtags.length
                  ? `${trendingHashtags.length} هاشتاق مرتب حسب الأكثر تداولاً`
                  : "أي هاشتاق جديد داخل المنشورات أو الردود سيظهر هنا تلقائيًا"}
              </Text>
            </View>

            <Pressable
              style={styles.xHashtagCloseButton}
              onPress={closeHashtagDirectory}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.xDetailScrollArea}
            contentContainerStyle={styles.xHashtagContent}
          >
            {trendingHashtags.length ? (
              <>
                <View style={styles.xHashtagHeroCard}>
                  <Text style={styles.xHashtagHeroEyebrow}>الأكثر تداولاً</Text>
                  <Text style={styles.xHashtagHeroTitle}>
                    {trendingHashtags[0].label}
                  </Text>
                  <Text style={styles.xHashtagHeroMeta}>
                    {trendingHashtags[0].itemCount} منشور أو رد
                  </Text>
                </View>

                {trendingHashtags.map((trend, index) => (
                  <XHashtagTrendCard
                    key={trend.key}
                    index={index}
                    trend={trend}
                    onPress={() => openHashtagTrend(trend)}
                  />
                ))}
              </>
            ) : (
              <View style={styles.xHashtagEmptyCard}>
                <Text style={styles.xHashtagEmptyTitle}>
                  لا توجد هاشتاقات بعد
                </Text>
                <Text style={styles.xHashtagEmptyText}>
                  أضف هاشتاق داخل أي منشور أو رد مثل #VAR أو #الهلال وسيظهر هنا
                  تلقائيًا مع ترتيب الأكثر تداولاً في الأعلى.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={isNotificationsOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeNotifications}
      >
        <XNotificationsScreen
          isLoggedIn={isLoggedIn}
          notifications={notificationCards}
          onClose={closeNotifications}
          onOpenNotification={openNotificationTarget}
          onRequireAuth={() => onRequireAuth("سجل الدخول لعرض إشعارات X.")}
        />
      </Modal>

      {/* ── Part A: ChatOverlay replaces the old full-screen DM Modal ── */}
      <ChatOverlay
        thread={openedMessageThread}
        onSend={submitPrivateMessage}
        isSending={isSendingPrivateMessage}
        onClose={closePrivateMessageThread}
      />

      <Modal
        visible={Boolean(openedPost)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closePostDetail}
      >
        <View style={styles.xDetailScreen}>
          <View style={styles.xDetailHeader}>
            <View style={styles.xDetailHeaderSpacer} />

            <Text style={styles.xDetailHeaderTitle}>المنشور</Text>

            <Pressable
              style={styles.xDetailCloseButton}
              onPress={closePostDetail}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.xDetailScrollArea}
            contentContainerStyle={styles.xDetailContent}
          >
            {openedPost ? (
              <>
                <XPostCard
                  post={openedPost}
                  canToggleFollow={Boolean(
                    openedPost.authorId?.trim() &&
                    openedPost.authorId.trim() !== normalizedCurrentUserVarId,
                  )}
                  isFollowingAuthor={Boolean(
                    openedPost.authorId?.trim() &&
                    isAuthorFollowed(openedPost.authorId),
                  )}
                  onToggleFollow={() => handleAuthorFollow(openedPost)}
                  onOpenAuthor={() => openAuthorProfile(openedPost)}
                  interactive={false}
                  onOpen={() => undefined}
                  onReply={() => openReplyComposer(openedPost)}
                  onRepost={() => handlePostRepost(openedPost)}
                  onShare={() => handlePostShare(openedPost)}
                  onLike={() => handlePostLike(openedPost)}
                />

                {(openedPost.replyItems ?? []).length ? (
                  <View style={styles.xDetailRepliesSection}>
                    <Text style={styles.xDetailRepliesTitle}>الردود</Text>

                    {(openedPost.replyItems ?? []).map((reply) => (
                      <XReplyCard key={reply.id} reply={reply} />
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={Boolean(resolvedOpenedAuthorProfile)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeAuthorProfile}
      >
        {resolvedOpenedAuthorProfile ? (
          <XAuthorProfileScreen
            activeTab={authorProfileTab}
            canToggleFollow={
              resolvedOpenedAuthorProfile.authorId !==
              normalizedCurrentUserVarId
            }
            isFollowing={isAuthorFollowed(
              resolvedOpenedAuthorProfile.authorId,
            )}
            likesTotal={openedAuthorLikesTotal}
            posts={openedAuthorPosts}
            replyItems={openedAuthorReplyItems}
            postsRepliesTotal={openedAuthorRepliesTotal}
            postsSharesTotal={openedAuthorSharesTotal}
            profile={resolvedOpenedAuthorProfile}
            sectionNoticeDismissal={openedAuthorSectionNoticeDismissal}
            sectionVisibility={openedAuthorSectionVisibility}
            topLikedPosts={openedAuthorTopLikedPosts}
            onChangeTab={setAuthorProfileTab}
            onClose={closeAuthorProfile}
            onDismissSectionNotice={(tab) =>
              dismissAuthorSectionNotice(
                resolvedOpenedAuthorProfile.authorId,
                tab,
              )
            }
            onLikePost={handlePostLike}
            onOpenMessageThread={openAuthorPrivateMessageThread}
            onOpenPost={openPostFromAuthorProfile}
            onOpenAuthor={openAuthorProfile}
            onPlaySwipeSound={playSwipeSound}
            onReplyPost={openReplyComposer}
            onRepostPost={handlePostRepost}
            onSharePost={handlePostShare}
            onToggleSectionVisibility={(tab) =>
              toggleAuthorSectionVisibility(
                resolvedOpenedAuthorProfile.authorId,
                tab,
              )
            }
            onToggleFollow={() =>
              toggleAuthorFollowByVarId(resolvedOpenedAuthorProfile.authorId)
            }
          />
        ) : null}
      </Modal>

      <Modal
        visible={Boolean(replyTargetPost)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeReplyComposer}
      >
        <View style={styles.xReplyComposerScreen}>
          <View style={styles.xReplyComposerTopBar}>
            <Pressable
              style={styles.xReplyComposerCancelButton}
              onPress={closeReplyComposer}
            >
              <Text style={styles.xReplyComposerCancelButtonText}>إلغاء</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.xDetailScrollArea}
            contentContainerStyle={styles.xReplyScreenContent}
          >
            {replyTargetPost ? (
              <>
                <XPostCard
                  post={replyTargetPost}
                  canToggleFollow={false}
                  isFollowingAuthor={false}
                  onToggleFollow={() => undefined}
                  onOpenAuthor={() => openAuthorProfile(replyTargetPost)}
                  interactive={false}
                  onOpen={() => undefined}
                  onReply={() => undefined}
                  onRepost={() => undefined}
                  onShare={() => undefined}
                  onLike={() => undefined}
                  showActionRow={false}
                  showSyntheticMedia={false}
                />

                <View style={styles.xReplyComposerCard}>
                  <View style={styles.xReplyComposerIdentityRow}>
                    <View style={styles.xReplyComposerAvatarWrap}>
                      {normalizedReplyAuthorAvatarUri ? (
                        <Image
                          source={{ uri: normalizedReplyAuthorAvatarUri }}
                          style={styles.xReplyComposerAvatarImage}
                        />
                      ) : (
                        <Text style={styles.xReplyComposerAvatarFallbackText}>
                          {replyAuthorInitial}
                        </Text>
                      )}
                    </View>

                    <View style={styles.xReplyComposerIdentityText}>
                      <Text style={styles.xReplyComposerIdentityName}>
                        {normalizedReplyAuthorName}
                      </Text>
                      <Text style={styles.xReplyComposerIdentityVarId}>
                        {normalizedReplyAuthorVarId}
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
                      value={replyDraft}
                      onChangeText={setReplyDraft}
                      placeholder=""
                      style={styles.xReplyComposerInput}
                      textAlign="right"
                      caretHidden
                    />

                    <View style={styles.xReplyComposerActionsRow}>
                      <Pressable
                        style={styles.xReplyComposerSendAction}
                        onPress={submitReply}
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
    </View>
  );
}

