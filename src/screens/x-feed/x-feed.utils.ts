import type { AppwriteDirectMessageRecord } from "../../lib/appwrite";
import type { MessageThreadEntry, MessageThreadProfileLike, PrivateMessageEntry } from "./x-feed.types";

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

export const HASHTAG_PATTERN = /#[A-Za-z0-9_\u0600-\u06FF]+/g;

export function buildComposerDisplayVarId(displayVarId: string, authorId: string) {
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

export function buildPrivateMessageEntry(
  record: AppwriteDirectMessageRecord,
  currentUserVarId: string,
): PrivateMessageEntry {
  const normalizedCurrentUserVarId = currentUserVarId.trim();
  const normalizedSenderVarId = record.senderVarId.trim();
  const normalizedCreatedAt = record.createdAt.trim() || new Date().toISOString();

  return {
    id: record.id,
    sender: normalizedSenderVarId === normalizedCurrentUserVarId ? "me" : "peer",
    content: record.content.trim(),
    timeLabel: formatPrivateMessageTimeLabel(normalizedCreatedAt),
    createdAt: normalizedCreatedAt,
  };
}
