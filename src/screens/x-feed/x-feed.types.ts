import type {
  FollowingProfileCard,
  IconName,
  Post,
  PostReply,
} from "../../app.types";
import type { MembershipCardTier } from "../../lib/membershipCardTier";

export type XFeedTab = "profile" | "timeline";

export type AuthorProfileTab =
  | "likes"
  | "posts"
  | "replies"
  | "predictions"
  | "bio";

export type AuthorProfileSectionVisibility = Record<AuthorProfileTab, boolean>;

export type AuthorProfileSectionNoticeDismissal = Record<
  AuthorProfileTab,
  boolean
>;

export type OpenedAuthorProfile = {
  authorId: string;
  displayName: string;
  displayVarId: string;
  avatarUri: string;
  verified: boolean;
  role: "admin" | "member";
  username: string;
  joinDate?: string;
  nationality?: string;
  association?: string;
  cardTier?: MembershipCardTier;
};

export type WebAudioInstance = {
  currentTime: number;
  preload?: string;
  play?: () => Promise<void> | void;
  pause?: () => void;
};

export type WebAudioConstructor = new (src?: string) => WebAudioInstance;

export type OpenedAuthorReplyItem = PostReply & {
  sourcePost: Post;
};

export type HashtagTrendEntry = {
  key: string;
  label: string;
  itemCount: number;
  mentionsTotal: number;
  latestContextLabel: string;
  latestSnippet: string;
  order: number;
  anchorPost: Post;
};

export type PrivateMessageEntry = {
  id: string;
  sender: "me" | "peer";
  content: string;
  timeLabel: string;
  createdAt: string;
};

export type MessageThreadEntry = {
  id: string;
  statusLabel: string;
  displayName: string;
  displayVarId: string;
  timeLabel: string;
  preview: string;
  avatarUri: string;
  verified: boolean;
  unread: boolean;
  messageCount: number;
  profile: FollowingProfileCard;
  messages: PrivateMessageEntry[];
};

export type XNotificationTarget =
  | { type: "thread"; threadVarId: string }
  | { type: "post"; postId: number };

export type XNotificationEntry = {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  iconName: IconName;
  accentColor: string;
  avatarUri: string;
  verified: boolean;
  sortOrder: number;
  target?: XNotificationTarget;
};

export type MessageThreadProfileLike = {
  varId: string;
  displayVarId: string;
  displayName: string;
  username: string;
  avatarUri: string;
  role: "admin" | "member";
};

export const AUTHOR_PROFILE_TAB_LABELS: Record<AuthorProfileTab, string> = {
  likes: "الإعجابات",
  posts: "المشاركات",
  replies: "الردود",
  predictions: "التوقعات",
  bio: "نبذة",
};

export const AUTHOR_PROFILE_TAB_ICONS: Record<AuthorProfileTab, IconName> = {
  likes: "heart",
  posts: "people",
  replies: "chatbubble-ellipses",
  predictions: "sparkles",
  bio: "document-text",
};

export const AUTHOR_PROFILE_TAB_DESCRIPTIONS: Record<AuthorProfileTab, string> =
  {
    likes: "التحكم في ظهور صفحة الإعجابات لبقية المستخدمين.",
    posts: "التحكم في ظهور صفحة المشاركات العامة لبقية المستخدمين.",
    replies: "التحكم في ظهور الردود والتعليقات الخاصة بهذا الحساب.",
    predictions: "التحكم في ظهور صفحة التوقعات والإحصاءات المرتبطة بها.",
    bio: "التحكم في ظهور نبذة الحساب المختصرة لبقية المستخدمين.",
  };

export const AUTHOR_SWIPE_TRACK_HEIGHT = 44;
export const AUTHOR_SWIPE_THUMB_SIZE = 38;
export const AUTHOR_SWIPE_HORIZONTAL_PADDING = 5;
export const AUTHOR_SWIPE_THRESHOLD = 0.74;
export const AUTHOR_SWIPE_THUMB_TOP_OFFSET =
  (AUTHOR_SWIPE_TRACK_HEIGHT - AUTHOR_SWIPE_THUMB_SIZE) / 2;
export const AUTHOR_SWIPE_LABEL_INSET =
  AUTHOR_SWIPE_THUMB_SIZE + AUTHOR_SWIPE_HORIZONTAL_PADDING + 10;

export function createDefaultAuthorProfileSectionVisibility(): AuthorProfileSectionVisibility {
  return {
    likes: true,
    posts: true,
    replies: true,
    predictions: true,
    bio: true,
  };
}

export function createDefaultAuthorProfileSectionNoticeDismissal(): AuthorProfileSectionNoticeDismissal {
  return {
    likes: false,
    posts: false,
    replies: false,
    predictions: false,
    bio: false,
  };
}
