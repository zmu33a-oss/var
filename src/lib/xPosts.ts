export type XComment = {
  id: string;
  authorName: string;
  authorHandle: string;
  authorId?: string;
  text: string;
};

export type XPost = {
  id: number;
  user: string;
  handle: string;
  authorId?: string;
  time: string;
  content: string;
  image?: string;
  comments?: XComment[];
  likedByMe?: boolean;
  repostedByMe?: boolean;
  sharedByMe?: boolean;
  stats: {
    replies: number;
    retweets: number;
    likes: number;
    shares: number;
  };
};

export function buildXHandle(name: string): string {
  const safeHandle = name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\u0600-\u06FF_]/g, "")
    .toLowerCase();

  return `@${safeHandle || "xtik_user"}`;
}

const X_POSTS_STORAGE_KEY = "webplus:x-posts";

export const defaultXPosts: XPost[] = [
  {
    id: 1,
    user: "Xtik Sports",
    handle: "@xtik_sports",
    time: "2m",
    content:
      "الهلال يدخل المباراة بقوة كبيرة الليلة، والأجواء الجماهيرية مشتعلة قبل صافرة البداية 🔥⚽",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
    stats: { replies: 18, retweets: 52, likes: 410, shares: 0 },
  },
  {
    id: 2,
    user: "Gemini AI",
    handle: "@gemini_tech",
    time: "5m",
    content:
      "لقد قمت بإصلاح مشكلة الملفات ودمجتها في ملف واحد لتعمل المعاينة بشكل صحيح. التصميم الآن جاهز!",
    stats: { replies: 12, retweets: 45, likes: 230, shares: 0 },
  },
  {
    id: 3,
    user: "برمجة وتصميم",
    handle: "@dev_designer",
    time: "20m",
    content:
      "واجهة إكس مع إضافة لسان الإشعارات العلوي تجعل الوصول للمجموعات أسرع بكثير.",
    stats: { replies: 5, retweets: 12, likes: 88, shares: 0 },
  },
];

function isValidPost(value: unknown): value is XPost {
  if (!value || typeof value !== "object") return false;

  const post = value as Partial<XPost> & {
    stats?: Partial<XPost["stats"]>;
    comments?: unknown[];
  };

  return (
    typeof post.id === "number" &&
    typeof post.user === "string" &&
    typeof post.handle === "string" &&
    (post.authorId === undefined || typeof post.authorId === "string") &&
    typeof post.time === "string" &&
    typeof post.content === "string" &&
    (!!post.image === false || typeof post.image === "string") &&
    (post.comments === undefined ||
      (Array.isArray(post.comments) &&
        post.comments.every(
          (comment) =>
            typeof comment === "string" ||
            (typeof comment === "object" &&
              comment !== null &&
              typeof (comment as XComment).id === "string" &&
              typeof (comment as XComment).authorName === "string" &&
              typeof (comment as XComment).authorHandle === "string" &&
              typeof (comment as XComment).text === "string"),
        ))) &&
    (post.likedByMe === undefined || typeof post.likedByMe === "boolean") &&
    (post.repostedByMe === undefined ||
      typeof post.repostedByMe === "boolean") &&
    (post.sharedByMe === undefined || typeof post.sharedByMe === "boolean") &&
    typeof post.stats?.replies === "number" &&
    typeof post.stats?.retweets === "number" &&
    typeof post.stats?.likes === "number" &&
    (post.stats?.shares === undefined || typeof post.stats?.shares === "number")
  );
}

function normalizeComments(
  comments: unknown[] | undefined,
): XComment[] | undefined {
  if (!comments?.length) return undefined;

  return comments
    .map((comment, index) => {
      if (typeof comment === "string") {
        return {
          id: `legacy-comment-${index}`,
          authorName: "مستخدم",
          authorHandle: "@user",
          text: comment,
        } satisfies XComment;
      }

      if (
        comment &&
        typeof comment === "object" &&
        typeof (comment as XComment).id === "string" &&
        typeof (comment as XComment).authorName === "string" &&
        typeof (comment as XComment).authorHandle === "string" &&
        typeof (comment as XComment).text === "string"
      ) {
        return comment as XComment;
      }

      return null;
    })
    .filter((comment): comment is XComment => comment !== null);
}

function normalizePost(post: XPost): XPost {
  return {
    ...post,
    comments: normalizeComments(post.comments),
    stats: {
      ...post.stats,
      shares: post.stats.shares ?? 0,
    },
  };
}

export function normalizeXPosts(posts: unknown): XPost[] | null {
  if (!Array.isArray(posts)) return null;

  const normalizedPosts = posts
    .filter(isValidPost)
    .map((post) => normalizePost(post));

  return normalizedPosts.length ? normalizedPosts : null;
}

export function loadXPosts(): XPost[] {
  if (typeof window === "undefined") return defaultXPosts;

  try {
    const raw = window.localStorage.getItem(X_POSTS_STORAGE_KEY);
    if (!raw) return defaultXPosts;

    const parsed = JSON.parse(raw);
    return normalizeXPosts(parsed) ?? defaultXPosts;
  } catch {
    return defaultXPosts;
  }
}

export function saveXPosts(posts: XPost[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(X_POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // Ignore storage failures so posting still works in memory.
  }
}
