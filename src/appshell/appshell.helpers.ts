import { Platform } from "react-native";
import {
  type AppwriteAuthUser,
  type AppwritePostReplyRecord,
  type AppwritePostRecord,
  type AppwriteProfileIndexRecord,
  type AppwriteVarProfile,
} from "../lib/appwrite";
import { INITIAL_PROFILE } from "../app.data";
import { normalizeAppwriteVarId } from "../lib/appwrite/appwrite.helpers";
import type {
  FollowingProfileCard,
  Post,
  PostReply,
  ProfileData,
} from "../app.types";

export const PROFILE_AVATAR_STORAGE_PREFIX = "webplus.profile-avatar";
export const AUTH_USER_STORAGE_KEY = "webplus.appwrite-user";
export const AUTH_USER_COOKIE_KEY = "webplus-appwrite-user";
export const AUTH_USER_SNAPSHOT_TTL_MS = 30 * 60 * 1000;
export const GOOGLE_AUTH_STORAGE_KEY = "webplus.google-auth-pending";
export const GOOGLE_AUTH_COOKIE_KEY = "webplus-google-auth-pending";
export const GOOGLE_AUTH_TTL_MS = 5 * 60 * 1000;

export type StoredAuthUserSnapshot = {
  user: AppwriteAuthUser;
  savedAt: number;
};

export type StoredGoogleAuthSnapshot = {
  startedAt: number;
};

export type WebStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export function normalizeAuthorId(authorId: string) {
  const trimmedAuthorId = authorId.trim().replace(/^@/, "");

  if (!trimmedAuthorId || trimmedAuthorId === "local-user") {
    return "local-user";
  }

  return normalizeAppwriteVarId(trimmedAuthorId) || "local-user";
}

export function formatProfileJoinDate(createdAt: string) {
  const parsedTime = Date.parse(createdAt);

  if (Number.isNaN(parsedTime)) {
    return createdAt.trim() || INITIAL_PROFILE.joinDate;
  }

  return new Intl.DateTimeFormat("ar-SA", {
    month: "long",
    year: "numeric",
  }).format(new Date(parsedTime));
}

export function createPostHandle(authorId: string) {
  return `@${normalizeAuthorId(authorId)}`;
}

export function buildComposerDisplayVarId(
  displayVarId: string,
  authorId: string,
) {
  const normalizedDisplayVarId = displayVarId.trim();

  if (normalizedDisplayVarId) {
    return normalizedDisplayVarId;
  }

  const normalizedAuthorId = normalizeAuthorId(authorId);

  if (normalizedAuthorId.length <= 8) {
    return normalizedAuthorId.toUpperCase();
  }

  return normalizedAuthorId.slice(-8).toUpperCase();
}

export function formatPostTime(createdAt: string) {
  const parsedTime = Date.parse(createdAt);

  if (Number.isNaN(parsedTime)) {
    return "الآن";
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - parsedTime) / 60000),
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

  return `قبل ${Math.floor(diffHours / 24)} يوم`;
}

export function getSessionRestoreNotice(error: unknown) {
  if (!(error instanceof Error)) {
    return "تعذر استعادة جلسة Appwrite.";
  }

  const normalizedMessage = error.message.toLowerCase();

  if (
    normalizedMessage.includes("load failed") ||
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network request failed") ||
    normalizedMessage.includes("origin") ||
    normalizedMessage.includes("domain") ||
    normalizedMessage.includes("platform") ||
    normalizedMessage.includes("whitelist")
  ) {
    return "تعذر استعادة الجلسة لأن Appwrite لا يسمح بهذا الدومين حاليًا. أضف var-var.vercel.app داخل Platforms > Web في Appwrite.";
  }

  return `تعذر استعادة جلسة Appwrite: ${error.message}`;
}

export function buildDefaultPostAuthorId(profile: ProfileData) {
  const varId = profile.varId.trim();

  if (varId) {
    return varId;
  }

  const username = profile.username.trim();

  if (username) {
    return normalizeAuthorId(username);
  }

  return normalizeAuthorId(profile.email.trim().split("@")[0] || "local-user");
}

export function buildProfileIdentity(authUser: AppwriteAuthUser) {
  const username = normalizeAuthorId(
    authUser.username || authUser.email.trim().split("@")[0] || authUser.id,
  );

  return {
    displayName: authUser.name.trim() || username,
    username: `@${username.replace(/^@+/, "")}`,
  };
}

export function getProfileFallbackValue(
  currentValue: string,
  seededValue: string,
) {
  return currentValue === seededValue ? "" : currentValue;
}

export function readStoredProfileAvatar(varId: string) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return "";
  }

  const storageKey = `${PROFILE_AVATAR_STORAGE_PREFIX}:${varId.trim() || "guest"}`;

  try {
    return window.localStorage.getItem(storageKey)?.trim() || "";
  } catch {
    return "";
  }
}

export function storeProfileAvatar(varId: string, avatarUri: string) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  const storageKey = `${PROFILE_AVATAR_STORAGE_PREFIX}:${varId.trim() || "guest"}`;

  try {
    const normalizedAvatarUri = avatarUri.trim();

    if (normalizedAvatarUri) {
      window.localStorage.setItem(storageKey, normalizedAvatarUri);
      return;
    }

    window.localStorage.removeItem(storageKey);
  } catch {
    // Ignore localStorage quota or access failures and keep the UI responsive.
  }
}

export function readAuthCookieValue(cookieName: string) {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return "";
  }

  const matchedCookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${cookieName}=`));

  if (!matchedCookie) {
    return "";
  }

  try {
    return decodeURIComponent(matchedCookie.slice(cookieName.length + 1));
  } catch {
    return "";
  }
}

export function writeAuthCookieValue(
  cookieName: string,
  rawValue: string | null,
) {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return;
  }

  const secureFlag =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  if (!rawValue) {
    document.cookie = `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax${secureFlag}`;
    return;
  }

  document.cookie = `${cookieName}=${encodeURIComponent(rawValue)}; Path=/; Max-Age=${Math.floor(
    AUTH_USER_SNAPSHOT_TTL_MS / 1000,
  )}; SameSite=Lax${secureFlag}`;
}

export function readWebStorageValue(
  storage: WebStorageLike | undefined,
  storageKey: string,
) {
  if (!storage) {
    return "";
  }

  try {
    return storage.getItem(storageKey)?.trim() || "";
  } catch {
    return "";
  }
}

export function writeWebStorageValue(
  storage: WebStorageLike | undefined,
  storageKey: string,
  value: string | null,
) {
  if (!storage) {
    return;
  }

  try {
    if (value) {
      storage.setItem(storageKey, value);
      return;
    }

    storage.removeItem(storageKey);
  } catch {
    // Ignore per-storage failures so the remaining fallbacks can still work.
  }
}

export function clearStoredAuthUserSnapshot() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  writeWebStorageValue(window.sessionStorage, AUTH_USER_STORAGE_KEY, null);
  writeWebStorageValue(window.localStorage, AUTH_USER_STORAGE_KEY, null);
  writeAuthCookieValue(AUTH_USER_COOKIE_KEY, null);
}

export function writeStoredAuthUser(user: AppwriteAuthUser | null) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  if (!user) {
    clearStoredAuthUserSnapshot();
    return;
  }

  const snapshot: StoredAuthUserSnapshot = {
    user,
    savedAt: Date.now(),
  };
  const serializedSnapshot = JSON.stringify(snapshot);

  writeWebStorageValue(
    window.localStorage,
    AUTH_USER_STORAGE_KEY,
    serializedSnapshot,
  );
  writeWebStorageValue(
    window.sessionStorage,
    AUTH_USER_STORAGE_KEY,
    serializedSnapshot,
  );
  writeAuthCookieValue(AUTH_USER_COOKIE_KEY, serializedSnapshot);
}

export function readStoredAuthUser() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  try {
    const rawSnapshot =
      readWebStorageValue(window.sessionStorage, AUTH_USER_STORAGE_KEY) ||
      readWebStorageValue(window.localStorage, AUTH_USER_STORAGE_KEY) ||
      readAuthCookieValue(AUTH_USER_COOKIE_KEY);

    if (!rawSnapshot) {
      return null;
    }

    const parsedSnapshot = JSON.parse(
      rawSnapshot,
    ) as StoredAuthUserSnapshot | null;
    const savedAt =
      typeof parsedSnapshot?.savedAt === "number" ? parsedSnapshot.savedAt : 0;

    if (!savedAt || Date.now() - savedAt > AUTH_USER_SNAPSHOT_TTL_MS) {
      clearStoredAuthUserSnapshot();
      return null;
    }

    const user = parsedSnapshot?.user;

    if (!user || typeof user !== "object") {
      clearStoredAuthUserSnapshot();
      return null;
    }

    const candidate = user as Partial<AppwriteAuthUser>;

    if (
      typeof candidate.id !== "string" ||
      typeof candidate.email !== "string" ||
      typeof candidate.varId !== "string" ||
      (candidate.role !== "admin" && candidate.role !== "member")
    ) {
      clearStoredAuthUserSnapshot();
      return null;
    }

    return candidate as AppwriteAuthUser;
  } catch {
    return null;
  }
}

export function clearStoredGoogleAuthSnapshot() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  writeWebStorageValue(window.sessionStorage, GOOGLE_AUTH_STORAGE_KEY, null);
  writeWebStorageValue(window.localStorage, GOOGLE_AUTH_STORAGE_KEY, null);
  writeAuthCookieValue(GOOGLE_AUTH_COOKIE_KEY, null);
}

export function writeStoredGoogleAuthSnapshot() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  const serializedSnapshot = JSON.stringify({
    startedAt: Date.now(),
  } satisfies StoredGoogleAuthSnapshot);

  writeWebStorageValue(
    window.localStorage,
    GOOGLE_AUTH_STORAGE_KEY,
    serializedSnapshot,
  );
  writeWebStorageValue(
    window.sessionStorage,
    GOOGLE_AUTH_STORAGE_KEY,
    serializedSnapshot,
  );
  writeAuthCookieValue(GOOGLE_AUTH_COOKIE_KEY, serializedSnapshot);
}

export function readStoredGoogleAuthSnapshot() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  try {
    const rawSnapshot =
      readWebStorageValue(window.sessionStorage, GOOGLE_AUTH_STORAGE_KEY) ||
      readWebStorageValue(window.localStorage, GOOGLE_AUTH_STORAGE_KEY) ||
      readAuthCookieValue(GOOGLE_AUTH_COOKIE_KEY);

    if (!rawSnapshot) {
      return null;
    }

    const parsedSnapshot = JSON.parse(
      rawSnapshot,
    ) as StoredGoogleAuthSnapshot | null;
    const startedAt =
      typeof parsedSnapshot?.startedAt === "number"
        ? parsedSnapshot.startedAt
        : 0;

    if (!startedAt || Date.now() - startedAt > GOOGLE_AUTH_TTL_MS) {
      clearStoredGoogleAuthSnapshot();
      return null;
    }

    return parsedSnapshot;
  } catch {
    clearStoredGoogleAuthSnapshot();
    return null;
  }
}

export function waitForTimeout(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export function mergeProfileWithAuthUser(
  currentProfile: ProfileData,
  authUser: AppwriteAuthUser,
): ProfileData {
  const identity = buildProfileIdentity(authUser);

  return {
    ...currentProfile,
    varId: authUser.varId || currentProfile.varId,
    displayVarId: authUser.displayVarId || currentProfile.displayVarId,
    displayName: identity.displayName,
    username: identity.username,
    email: authUser.email || currentProfile.email,
    phoneNumber:
      authUser.phoneNumber ||
      getProfileFallbackValue(
        currentProfile.phoneNumber,
        INITIAL_PROFILE.phoneNumber,
      ),
    nationalId:
      authUser.nationalId ||
      getProfileFallbackValue(
        currentProfile.nationalId,
        INITIAL_PROFILE.nationalId,
      ),
    bio:
      authUser.bio ||
      getProfileFallbackValue(currentProfile.bio, INITIAL_PROFILE.bio),
    location:
      authUser.location ||
      getProfileFallbackValue(
        currentProfile.location,
        INITIAL_PROFILE.location,
      ),
    profession:
      authUser.profession ||
      (authUser.role === "admin"
        ? "VAR Admin"
        : getProfileFallbackValue(
            currentProfile.profession,
            INITIAL_PROFILE.profession,
          ) || "Appwrite Member"),
    birthDate:
      authUser.birthDate ||
      getProfileFallbackValue(
        currentProfile.birthDate,
        INITIAL_PROFILE.birthDate,
      ),
    nationality:
      authUser.nationality ||
      getProfileFallbackValue(
        currentProfile.nationality,
        INITIAL_PROFILE.nationality,
      ),
    avatarUri:
      authUser.avatarUri ||
      currentProfile.avatarUri ||
      readStoredProfileAvatar(authUser.varId || currentProfile.varId),
    joinDate: authUser.createdAt
      ? formatProfileJoinDate(authUser.createdAt)
      : currentProfile.joinDate,
    isVerified:
      authUser.isVerified ||
      authUser.role === "admin" ||
      currentProfile.isVerified,
  };
}

export function mergeProfileWithVarProfile(
  currentProfile: ProfileData,
  varProfile: AppwriteVarProfile,
): ProfileData {
  return {
    ...currentProfile,
    varId: varProfile.varId || currentProfile.varId,
    earnedPoints: varProfile.earnedPoints,
    lockedPredictions: varProfile.lockedPredictions.map((prediction) => ({
      id: prediction.id,
      title: prediction.title,
      choice: prediction.choice,
      competition: prediction.competition,
      status: prediction.status,
      lockedAt: prediction.lockedAt,
      pointsAwarded: prediction.pointsAwarded,
    })),
    socialMetrics: {
      xPosts: varProfile.social.x.posts,
      xLikes: varProfile.social.x.likes,
      xReplies: varProfile.social.x.replies,
      xReposts: varProfile.social.x.reposts,
      xShares: varProfile.social.x.shares,
      tiktokUploads: varProfile.social.tiktok.uploads,
      tiktokLikes: varProfile.social.tiktok.likes,
      tiktokComments: varProfile.social.tiktok.comments,
      tiktokSaves: varProfile.social.tiktok.saves,
      tiktokShares: varProfile.social.tiktok.shares,
      totalInteractions: varProfile.social.totalActiveInteractions,
    },
  };
}

export type PostIdentityOverrides = {
  author?: string;
  handle?: string;
  authorAvatarUri?: string;
  authorVerified?: boolean;
};

export function buildProfilePostHandle(
  username: string,
  fallbackAuthorId: string,
) {
  return buildComposerDisplayVarId(username, fallbackAuthorId);
}

export function buildCurrentUserPostIdentity(input: {
  varId: string;
  profile: ProfileData;
  appwriteUser: AppwriteAuthUser | null;
}): PostIdentityOverrides {
  const normalizedAuthorId = normalizeAuthorId(input.varId);
  const trimmedDisplayName =
    input.appwriteUser?.name?.trim() || input.profile.displayName.trim();
  const trimmedDisplayVarId =
    input.appwriteUser?.displayVarId?.trim() ||
    input.profile.displayVarId.trim();
  const trimmedAvatarUri =
    input.appwriteUser?.avatarUri?.trim() || input.profile.avatarUri.trim();

  return {
    author: trimmedDisplayName || normalizedAuthorId,
    handle: buildProfilePostHandle(trimmedDisplayVarId, normalizedAuthorId),
    authorAvatarUri: trimmedAvatarUri || undefined,
    authorVerified:
      Boolean(input.appwriteUser?.isVerified) ||
      input.appwriteUser?.role === "admin",
  };
}

export function buildProfileIndexPostIdentity(
  profileIndex: AppwriteProfileIndexRecord | null | undefined,
  fallbackAuthorId: string,
): PostIdentityOverrides {
  if (!profileIndex) {
    return {};
  }

  const normalizedAuthorId = normalizeAuthorId(
    profileIndex.varId || fallbackAuthorId,
  );
  const trimmedDisplayName = profileIndex.displayName.trim();
  const trimmedDisplayVarId = profileIndex.displayVarId.trim();
  const trimmedAvatarUri = profileIndex.avatarUri.trim();

  return {
    author: trimmedDisplayName || normalizedAuthorId,
    handle: buildProfilePostHandle(trimmedDisplayVarId, normalizedAuthorId),
    authorAvatarUri: trimmedAvatarUri || undefined,
    authorVerified:
      profileIndex.isVerified || profileIndex.role === "admin",
  };
}

export function buildFollowingProfileCard(
  profileIndex: AppwriteProfileIndexRecord | null | undefined,
  fallbackVarId: string,
): FollowingProfileCard {
  const normalizedVarId = normalizeAuthorId(
    profileIndex?.varId || fallbackVarId,
  );
  const trimmedDisplayVarId = buildComposerDisplayVarId(
    profileIndex?.displayVarId?.trim() || "",
    normalizedVarId,
  );
  const trimmedDisplayName =
    profileIndex?.displayName?.trim() || trimmedDisplayVarId || normalizedVarId;

  return {
    varId: normalizedVarId,
    displayVarId: trimmedDisplayVarId,
    displayName: trimmedDisplayName,
    username: profileIndex?.username?.trim() || "",
    avatarUri: profileIndex?.avatarUri?.trim() || "",
    role: profileIndex?.role === "admin" ? "admin" : "member",
  };
}

export function mapAppwritePostRecordToPost(
  record: AppwritePostRecord,
  index = 0,
  identityOverrides?: PostIdentityOverrides,
): Post {
  const createdAtValue = Date.parse(record.createdAt);
  const normalizedAuthorId = normalizeAuthorId(record.varId || record.authorId);
  const trimmedAuthor = identityOverrides?.author?.trim();
  const trimmedHandle = identityOverrides?.handle?.trim();
  const trimmedAvatarUri = identityOverrides?.authorAvatarUri?.trim();

  return {
    id: (Number.isNaN(createdAtValue) ? Date.now() : createdAtValue) + index,
    sourceId: record.id,
    title: record.title,
    authorId: normalizedAuthorId,
    author: trimmedAuthor || normalizedAuthorId,
    authorAvatarUri: trimmedAvatarUri || undefined,
    authorVerified: identityOverrides?.authorVerified,
    handle: trimmedHandle || buildProfilePostHandle("", normalizedAuthorId),
    time: formatPostTime(record.createdAt),
    content: record.content,
    replyItems: [],
    likes: 0,
    replies: 0,
    reposts: 0,
    shares: 0,
    likedByMe: false,
    repostedByMe: false,
    sharedByMe: false,
  };
}

export function mapAppwriteReplyRecordToPostReply(
  record: AppwritePostReplyRecord,
  index = 0,
  identityOverrides?: PostIdentityOverrides,
): PostReply {
  const createdAtValue = Date.parse(record.createdAt);
  const normalizedAuthorId = normalizeAuthorId(record.varId);
  const trimmedAuthor = identityOverrides?.author?.trim();
  const trimmedHandle = identityOverrides?.handle?.trim();
  const trimmedAvatarUri = identityOverrides?.authorAvatarUri?.trim();

  return {
    id: (Number.isNaN(createdAtValue) ? Date.now() : createdAtValue) + index,
    author: trimmedAuthor || normalizedAuthorId,
    authorAvatarUri: trimmedAvatarUri || undefined,
    authorVerified: identityOverrides?.authorVerified,
    handle: trimmedHandle || buildProfilePostHandle("", normalizedAuthorId),
    time: formatPostTime(record.createdAt),
    content: record.content,
  };
}
