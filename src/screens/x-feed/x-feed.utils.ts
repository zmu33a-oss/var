import type { AppwriteDirectMessageRecord } from "../../lib/appwrite";
import { I18nManager } from "react-native";
import { normalizeAuthorId } from "../../appshell/appshell.helpers";
import type { Post } from "../../app.types";
import type {
  HashtagTrendEntry,
  MessageThreadEntry,
  MessageThreadProfileLike,
  PrivateMessageEntry,
} from "./x-feed.types";
import { FANS_BOTTOM_NAV_RESERVE } from "../fans/fans.layout.constants";

export const HASHTAG_PATTERN = /#[A-Za-z0-9_\u0600-\u06FF]+/g;

export function buildMessageThreadEntry(
  profile: MessageThreadProfileLike,
  messages: PrivateMessageEntry[],
): MessageThreadEntry {
  const normalizedPeerVarId = profile.varId.trim();
  const normalizedUsername = profile.username.trim();
  const latestMessage = messages[messages.length - 1];

  return {
    id: normalizedPeerVarId,
    statusLabel: messages.length ? "محادثة خاصة" : "جاهزة للبدء",
    displayName: profile.displayName.trim(),
    displayVarId: normalizedUsername
      ? `@${normalizedUsername}`
      : profile.displayVarId.trim(),
    timeLabel: latestMessage?.timeLabel || "خاص",
    preview: latestMessage?.content || "اضغط لبدء محادثة خاصة",
    avatarUri: profile.avatarUri.trim(),
    verified: profile.role === "admin",
    unread: latestMessage?.sender === "peer",
    messageCount: messages.length,
    profile: {
      varId: normalizedPeerVarId,
      displayVarId: profile.displayVarId.trim(),
      displayName: profile.displayName.trim(),
      username: normalizedUsername,
      avatarUri: profile.avatarUri.trim(),
      role: profile.role,
    },
    messages,
  };
}

export function buildComposerDisplayVarId(
  displayVarId: string,
  authorId: string,
) {
  const normalizedDisplayVarId = displayVarId.trim();

  if (normalizedDisplayVarId) {
    return normalizedDisplayVarId;
  }

  const normalizedAuthorId = authorId.trim().replace(/^@/, "") || "local-user";

  if (normalizedAuthorId.length <= 8) {
    return normalizedAuthorId.toUpperCase();
  }

  return normalizedAuthorId.slice(-8).toUpperCase();
}

export function extractHashtags(text: string) {
  return text.match(HASHTAG_PATTERN) ?? [];
}

export function normalizeHashtagKey(tag: string) {
  return tag.trim().toLocaleLowerCase();
}

export function compactHashtagSnippet(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function buildNotificationSnippet(text: string, fallback: string) {
  const compactText = compactHashtagSnippet(text);

  if (!compactText) {
    return fallback;
  }

  if (compactText.length <= 92) {
    return compactText;
  }

  return `${compactText.slice(0, 92).trim()}...`;
}

export function formatPrivateMessageTimeLabel(createdAt: string) {
  const parsedDate = Date.parse(createdAt);

  if (Number.isNaN(parsedDate)) {
    return "الآن";
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - parsedDate) / 60000),
  );

  if (diffMinutes < 1) {
    return "الآن";
  }

  if (diffMinutes < 60) {
    return `قبل ${diffMinutes} دقيقة`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `قبل ${diffHours} ساعة`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `قبل ${diffDays} يوم`;
  }

  return new Date(parsedDate).toLocaleDateString("ar-SA");
}

export function buildTrendingHashtags(posts: Post[]): HashtagTrendEntry[] {
  const hashtagMap = new Map<string, HashtagTrendEntry>();

  const registerHashtagSource = (
    text: string,
    order: number,
    contextLabel: string,
    anchorPost: Post,
  ) => {
    const matches = extractHashtags(text);

    if (!matches.length) {
      return;
    }

    const snippet = compactHashtagSnippet(text);
    const mentionsByKey = new Map<string, { label: string; count: number }>();

    matches.forEach((match) => {
      const normalizedKey = normalizeHashtagKey(match);
      const existingMention = mentionsByKey.get(normalizedKey);

      if (existingMention) {
        existingMention.count += 1;
        return;
      }

      mentionsByKey.set(normalizedKey, { label: match, count: 1 });
    });

    mentionsByKey.forEach((mentionData, normalizedKey) => {
      const existingEntry = hashtagMap.get(normalizedKey);

      if (!existingEntry) {
        hashtagMap.set(normalizedKey, {
          key: normalizedKey,
          label: mentionData.label,
          itemCount: 1,
          mentionsTotal: mentionData.count,
          latestContextLabel: contextLabel,
          latestSnippet: snippet,
          order,
          anchorPost,
        });
        return;
      }

      existingEntry.itemCount += 1;
      existingEntry.mentionsTotal += mentionData.count;

      if (order < existingEntry.order) {
        existingEntry.label = mentionData.label;
        existingEntry.latestContextLabel = contextLabel;
        existingEntry.latestSnippet = snippet;
        existingEntry.order = order;
        existingEntry.anchorPost = anchorPost;
      }
    });
  };

  posts.forEach((post, postIndex) => {
    const postSourceText = [post.title?.trim(), post.content.trim()]
      .filter(Boolean)
      .join(" ");

    registerHashtagSource(
      postSourceText,
      postIndex * 100,
      `منشور · ${post.time}`,
      post,
    );

    (post.replyItems ?? []).forEach((reply, replyIndex) => {
      registerHashtagSource(
        reply.content,
        postIndex * 100 + replyIndex + 1,
        `رد ${reply.author} · ${reply.time}`,
        post,
      );
    });
  });

  return [...hashtagMap.values()].sort((left, right) => {
    if (right.itemCount !== left.itemCount) {
      return right.itemCount - left.itemCount;
    }

    if (right.mentionsTotal !== left.mentionsTotal) {
      return right.mentionsTotal - left.mentionsTotal;
    }

    return left.order - right.order;
  });
}

export function buildPrivateMessageEntry(
  record: AppwriteDirectMessageRecord,
  currentUserVarId: string,
): PrivateMessageEntry {
  const normalizedCurrentUserVarId = normalizeAuthorId(currentUserVarId);
  const normalizedSenderVarId = normalizeAuthorId(record.senderVarId);
  const normalizedCreatedAt =
    record.createdAt.trim() || new Date().toISOString();

  return {
    id: record.id,
    sender:
      normalizedSenderVarId === normalizedCurrentUserVarId ? "me" : "peer",
    content: record.content.trim(),
    timeLabel: formatPrivateMessageTimeLabel(normalizedCreatedAt),
    createdAt: normalizedCreatedAt,
  };
}

const X_FEED_SHELL_WIDTH = 430;
const X_BOTTOM_DOCK_HORIZONTAL_INSET = 8;
const X_COMPOSE_FAB_BOTTOM_GAP = 10;

/** يطابق أبعاد BottomNav — لتوسيط زر الرسالة فوق تبويب الحساب. */
export function resolveXComposeFabLayout(windowWidth: number) {
  const layoutWidth = Math.min(windowWidth, X_FEED_SHELL_WIDTH);
  const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / X_FEED_SHELL_WIDTH));
  const size = Math.round(56 * chromeScale);
  const bottom = FANS_BOTTOM_NAV_RESERVE + X_COMPOSE_FAB_BOTTOM_GAP;
  const dockInset = Math.round(X_BOTTOM_DOCK_HORIZONTAL_INSET * chromeScale);
  const navPadding = Math.round(6 * chromeScale);
  const centerActionWidth = Math.round(88 * chromeScale);
  const navWidth = layoutWidth - dockInset * 2;
  const tabWidth = (navWidth - navPadding * 2 - centerActionWidth) / 4;
  const accountTabCenterFromStart = dockInset + navPadding + tabWidth / 2;
  const accountTabCenterFromEnd =
    layoutWidth - dockInset - navPadding - tabWidth / 2;
  const accountTabCenterX = I18nManager.isRTL
    ? accountTabCenterFromEnd
    : accountTabCenterFromStart;

  return {
    left: Math.round(accountTabCenterX - size / 2),
    bottom,
    size,
  };
}
