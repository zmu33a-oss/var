import type {
  AppwriteAccountDocument,
  AppwriteAuthUser,
  AppwriteLockedPrediction,
  AppwritePointsDocument,
  AppwritePointsLedgerEntry,
  AppwritePostDocument,
  AppwritePostEngagementAggregate,
  AppwritePostRecord,
  AppwritePostReplyRecord,
  AppwriteDirectMessageRecord,
  AppwritePredictionDocument,
  AppwriteProfileIndexDocument,
  AppwriteProfileIndexRecord,
  AppwriteProfilePrefs,
  AppwriteSocialAction,
  AppwriteSocialInteractionDocument,
  AppwriteSocialInteractionRecord,
  AppwriteSocialMode,
  AppwriteUserRole,
  AppwriteVarSocialSummary,
} from "./appwrite.types";
import { normalizeMembershipCardTier } from "../membershipCardTier";
import {
  VAR_ADMIN_USERNAME,
  VAR_DISPLAY_DIGIT_COUNT,
  DEFAULT_APPWRITE_AVATAR_URL,
  CONFIGURED_VAR_ADMIN_EMAIL,
} from "./appwrite.config";

// ─── VarId / Username normalizers ──────────────────────────────────────────

export function normalizeAppwriteUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._]/g, "");
}

export function normalizeAppwriteVarId(value: string) {
  const normalizedValue = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue.startsWith("VAR-")
    ? normalizedValue
    : `VAR-${normalizedValue}`;
}

export function buildAppwriteVarId(accountId: string) {
  return normalizeAppwriteVarId(accountId);
}

export function normalizeAppwriteDisplayVarId(value: string) {
  const digitsOnly = value.trim().replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  return `VAR-${digitsOnly
    .slice(-VAR_DISPLAY_DIGIT_COUNT)
    .padStart(VAR_DISPLAY_DIGIT_COUNT, "0")}`;
}

export function buildAppwriteDisplayVarId(accountId: string) {
  const normalizedSource = accountId
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!normalizedSource) {
    return "";
  }

  let accumulator = 0;

  for (const character of normalizedSource) {
    accumulator = (accumulator * 131 + character.charCodeAt(0)) % 90000000;
  }

  return normalizeAppwriteDisplayVarId(String(accumulator + 10000000));
}

// ─── Primitive readers ──────────────────────────────────────────────────────

export function readAppwriteString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function resolveAppwriteAvatarUrl(...values: unknown[]) {
  for (const value of values) {
    const normalizedValue = readAppwriteString(value);

    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return DEFAULT_APPWRITE_AVATAR_URL;
}

export function readAppwriteNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsedValue = Number(value.trim());

      if (!Number.isNaN(parsedValue) && Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return 0;
}

export function readAppwriteBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    return ["true", "1", "yes", "locked", "active"].includes(normalizedValue);
  }

  if (typeof value === "number") {
    return value > 0;
  }

  return false;
}

// ─── Social mode / action normalizers ─────────────────────────────────────

export function normalizeAppwriteSocialMode(
  value: unknown,
): AppwriteSocialMode {
  const normalizedValue = readAppwriteString(value).toLowerCase();

  if (normalizedValue === "tiktok") {
    return "tiktok";
  }

  if (normalizedValue === "profile") {
    return "profile";
  }

  return "x";
}

export function normalizeAppwriteSocialAction(
  value: unknown,
): AppwriteSocialAction {
  const normalizedValue = readAppwriteString(value).toLowerCase();

  if (normalizedValue === "post") return "post";
  if (normalizedValue === "comment") return "comment";
  if (normalizedValue === "message") return "message";
  if (normalizedValue === "like") return "like";
  if (normalizedValue === "repost") return "repost";
  if (normalizedValue === "share") return "share";
  if (normalizedValue === "save") return "save";
  if (normalizedValue === "follow") return "follow";

  return "reply";
}

// ─── Empty factory ──────────────────────────────────────────────────────────

export function createEmptyAppwriteVarSocialSummary(): AppwriteVarSocialSummary {
  return {
    x: { posts: 0, likes: 0, replies: 0, reposts: 0, shares: 0 },
    tiktok: { uploads: 0, likes: 0, comments: 0, saves: 0, shares: 0 },
    totalActiveInteractions: 0,
    records: [],
  };
}

// ─── Prefs parser ──────────────────────────────────────────────────────────

export function toAppwriteProfilePrefs(
  rawPrefs: unknown,
): AppwriteProfilePrefs {
  if (!rawPrefs || typeof rawPrefs !== "object") {
    return {};
  }

  const prefs = rawPrefs as Record<string, unknown>;
  const roleValue = prefs.role;

  return {
    varId:
      typeof prefs.varId === "string"
        ? normalizeAppwriteVarId(prefs.varId)
        : "",
    displayVarId:
      typeof prefs.displayVarId === "string"
        ? normalizeAppwriteDisplayVarId(prefs.displayVarId)
        : "",
    username:
      typeof prefs.username === "string"
        ? normalizeAppwriteUsername(prefs.username)
        : "",
    phoneNumber:
      typeof prefs.phoneNumber === "string" ? prefs.phoneNumber.trim() : "",
    nationalId:
      typeof prefs.nationalId === "string" ? prefs.nationalId.trim() : "",
    bio: typeof prefs.bio === "string" ? prefs.bio.trim() : "",
    location: typeof prefs.location === "string" ? prefs.location.trim() : "",
    profession:
      typeof prefs.profession === "string" ? prefs.profession.trim() : "",
    birthDate:
      typeof prefs.birthDate === "string" ? prefs.birthDate.trim() : "",
    nationality:
      typeof prefs.nationality === "string" ? prefs.nationality.trim() : "",
    association:
      typeof prefs.association === "string" ? prefs.association.trim() : "",
    leagueClub:
      typeof prefs.leagueClub === "string" ? prefs.leagueClub.trim() : "",
    avatarUri: resolveAppwriteAvatarUrl(prefs.avatarUri, prefs.avatarUrl),
    avatarUrl: resolveAppwriteAvatarUrl(prefs.avatarUrl, prefs.avatarUri),
    role:
      roleValue === "admin"
        ? "admin"
        : roleValue === "member"
          ? "member"
          : undefined,
    adminLabel:
      typeof prefs.adminLabel === "string" ? prefs.adminLabel.trim() : "",
    isVerified: readBoolishAppwriteValue(prefs.isVerified),
    cardTier:
      prefs.cardTier === "classic" ||
      prefs.cardTier === "gold" ||
      prefs.cardTier === "platinum"
        ? prefs.cardTier
        : undefined,
  };
}

// ─── Role resolver ──────────────────────────────────────────────────────────

export function resolveAdminRole(
  email: string,
  username: string,
  prefsRole?: AppwriteUserRole,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = normalizeAppwriteUsername(username);

  if (
    CONFIGURED_VAR_ADMIN_EMAIL &&
    normalizedEmail === CONFIGURED_VAR_ADMIN_EMAIL
  ) {
    return "admin" as const;
  }

  if (prefsRole === "admin") {
    return "admin" as const;
  }

  if (
    !CONFIGURED_VAR_ADMIN_EMAIL &&
    normalizedUsername === VAR_ADMIN_USERNAME
  ) {
    return "admin" as const;
  }

  return "member" as const;
}

// ─── Document → Record converters ──────────────────────────────────────────

export function createEmptyPostEngagementAggregate(): AppwritePostEngagementAggregate {
  return {
    likes: 0,
    reposts: 0,
    shares: 0,
    likedByMe: false,
    repostedByMe: false,
    sharedByMe: false,
  };
}

export function isAppwritePostHidden(document: AppwritePostDocument): boolean {
  if (readAppwriteBoolean(document.isHidden)) {
    return true;
  }

  if (typeof document.status === "string") {
    return document.status.trim().toLowerCase() === "hidden";
  }

  return false;
}

export function toAppwritePostRecord(
  document: AppwritePostDocument,
): AppwritePostRecord {
  const authorId =
    typeof document.authorId === "string" ? document.authorId.trim() : "";
  const varId =
    typeof document.varId === "string"
      ? normalizeAppwriteVarId(document.varId)
      : normalizeAppwriteVarId(authorId);

  const mediaUri =
    typeof document.mediaUri === "string" ? document.mediaUri.trim() : "";
  const fromVarLibrary =
    document.fromVarLibrary === true ||
    document.fromVarLibrary === "true" ||
    document.fromVarLibrary === 1;

  return {
    id: document.$id,
    title: typeof document.title === "string" ? document.title : "",
    content: typeof document.content === "string" ? document.content : "",
    authorId,
    varId,
    mediaUri: mediaUri || undefined,
    fromVarLibrary: fromVarLibrary || undefined,
    createdAt: document.$createdAt,
  };
}

export function toAppwriteAuthUser(
  document: AppwriteAccountDocument,
): AppwriteAuthUser {
  const email = typeof document.email === "string" ? document.email.trim() : "";
  const name = typeof document.name === "string" ? document.name.trim() : "";
  const prefs = toAppwriteProfilePrefs(document.prefs);
  const resolvedVarId = prefs.varId || buildAppwriteVarId(document.$id);
  const resolvedDisplayVarId =
    prefs.displayVarId || buildAppwriteDisplayVarId(document.$id);
  const fallbackUsername = normalizeAppwriteUsername(
    resolvedDisplayVarId.replace(/^VAR-/i, "") ||
      resolvedVarId.replace(/^VAR-/i, "") ||
      document.$id,
  );
  const resolvedUsername = prefs.username || fallbackUsername;
  const resolvedRole = resolveAdminRole(email, resolvedUsername, prefs.role);
  const createdAt =
    typeof document.$createdAt === "string" ? document.$createdAt : "";

  return {
    id: document.$id,
    varId: resolvedVarId,
    displayVarId: resolvedDisplayVarId,
    name: name || resolvedDisplayVarId || "VAR Member",
    email,
    username: resolvedUsername,
    phoneNumber: prefs.phoneNumber || "",
    nationalId: prefs.nationalId || "",
    bio: prefs.bio || "",
    location: prefs.location || "",
    profession: prefs.profession || "",
    birthDate: prefs.birthDate || "",
    nationality: prefs.nationality || "",
    association: prefs.association || "",
    leagueClub: prefs.leagueClub || "",
    avatarUri: prefs.avatarUri || "",
    role: resolvedRole,
    adminLabel: resolvedRole === "admin" ? prefs.adminLabel || "VAR" : "",
    isVerified: prefs.isVerified === true || resolvedRole === "admin",
    cardTier: normalizeMembershipCardTier(prefs.cardTier),
    createdAt,
  };
}

export function toAppwriteProfileIndexRecord(
  document: AppwriteProfileIndexDocument,
): AppwriteProfileIndexRecord {
  const roleValue = readAppwriteString(document.role);

  return {
    id: document.$id,
    userId: readAppwriteString(document.userId) || document.$id,
    varId: normalizeAppwriteVarId(readAppwriteString(document.varId)),
    displayVarId: normalizeAppwriteDisplayVarId(
      readAppwriteString(document.displayVarId),
    ),
    displayName: readAppwriteString(document.displayName),
    username: normalizeAppwriteUsername(readAppwriteString(document.username)),
    avatarUri: resolveAppwriteAvatarUrl(document.avatarUrl, document.avatarUri),
    role: roleValue === "admin" ? "admin" : "member",
    isVerified:
      readBoolishAppwriteValue(document.isVerified) ||
      roleValue === "admin",
    cardTier: normalizeMembershipCardTier(document.cardTier),
    createdAt:
      typeof document.$createdAt === "string" ? document.$createdAt : "",
  };
}

function readBoolishAppwriteValue(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }

  return false;
}

export function toAppwriteLockedPrediction(
  document: AppwritePredictionDocument,
): AppwriteLockedPrediction {
  return {
    id: document.$id,
    varId: normalizeAppwriteVarId(readAppwriteString(document.varId)),
    title:
      readAppwriteString(document.title) ||
      readAppwriteString(document.question) ||
      readAppwriteString(document.matchLabel) ||
      "Prediction",
    choice:
      readAppwriteString(document.choice) ||
      readAppwriteString(document.selection) ||
      readAppwriteString(document.prediction),
    competition:
      readAppwriteString(document.competition) ||
      readAppwriteString(document.league),
    status: readAppwriteString(document.status) || "locked",
    lockedAt:
      readAppwriteString(document.lockedAt) ||
      readAppwriteString(document.$createdAt),
    pointsAwarded: readAppwriteNumber(document.pointsAwarded, document.points),
  };
}

export function isLockedPredictionDocument(
  document: AppwritePredictionDocument,
) {
  const normalizedStatus = readAppwriteString(document.status).toLowerCase();

  return (
    readAppwriteBoolean(document.isLocked) ||
    readAppwriteBoolean(document.locked) ||
    Boolean(readAppwriteString(document.lockedAt)) ||
    ["locked", "submitted", "closed", "settled"].includes(normalizedStatus)
  );
}

export function toAppwritePointsLedgerEntry(
  document: AppwritePointsDocument,
): AppwritePointsLedgerEntry {
  return {
    id: document.$id,
    varId: normalizeAppwriteVarId(readAppwriteString(document.varId)),
    amount: readAppwriteNumber(
      document.points,
      document.amount,
      document.earnedPoints,
      document.delta,
    ),
    reason:
      readAppwriteString(document.reason) ||
      readAppwriteString(document.title) ||
      readAppwriteString(document.description),
    createdAt: readAppwriteString(document.$createdAt),
  };
}

export function toAppwriteSocialInteractionRecord(
  document: AppwriteSocialInteractionDocument,
  fallbackAction?: AppwriteSocialAction,
  fallbackMode: AppwriteSocialMode = "x",
): AppwriteSocialInteractionRecord {
  return {
    id: document.$id,
    varId: normalizeAppwriteVarId(readAppwriteString(document.varId)),
    mode: normalizeAppwriteSocialMode(
      document.mode || document.surface || fallbackMode,
    ),
    action: normalizeAppwriteSocialAction(
      document.action || document.type || fallbackAction,
    ),
    targetId:
      readAppwriteString(document.targetId) ||
      readAppwriteString(document.postId) ||
      readAppwriteString(document.videoId),
    active:
      typeof document.active === "undefined"
        ? true
        : readAppwriteBoolean(document.active),
    value:
      readAppwriteString(document.value) ||
      readAppwriteString(document.content),
    createdAt: readAppwriteString(document.$createdAt),
  };
}

export function toAppwritePostReplyRecord(
  document: AppwriteSocialInteractionDocument,
): AppwritePostReplyRecord {
  return {
    id: document.$id,
    postTargetId:
      readAppwriteString(document.targetId) ||
      readAppwriteString(document.postId),
    varId: normalizeAppwriteVarId(readAppwriteString(document.varId)),
    content:
      readAppwriteString(document.value) ||
      readAppwriteString(document.content),
    createdAt: readAppwriteString(document.$createdAt),
  };
}

export function toAppwriteDirectMessageRecord(
  document: AppwriteSocialInteractionDocument,
): AppwriteDirectMessageRecord {
  return {
    id: document.$id,
    senderVarId: normalizeAppwriteVarId(readAppwriteString(document.varId)),
    recipientVarId: normalizeAppwriteVarId(
      readAppwriteString(document.targetId),
    ),
    content:
      readAppwriteString(document.value) ||
      readAppwriteString(document.content),
    createdAt: readAppwriteString(document.$createdAt),
  };
}

// ─── Error detectors ────────────────────────────────────────────────────────

export function isUnauthorizedAppwriteError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: unknown;
    type?: unknown;
    message?: unknown;
  };
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";

  return (
    candidate.code === 401 ||
    candidate.type === "user_unauthorized" ||
    message.includes("unauthorized") ||
    message.includes("missing scope") ||
    message.includes("guest")
  );
}

export function isPermissionDeniedAppwriteError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: unknown;
    type?: unknown;
    message?: unknown;
  };
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";

  return (
    candidate.code === 401 ||
    candidate.type === "general_unauthorized_scope" ||
    message.includes("no permissions provided") ||
    message.includes("not authorized") ||
    message.includes("missing scope")
  );
}

export function isInvalidAppwriteQueryError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: unknown;
    type?: unknown;
    message?: unknown;
  };
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";

  return (
    candidate.code === 400 ||
    candidate.type === "general_query_invalid" ||
    message.includes("invalid query") ||
    message.includes("invalid queries")
  );
}

export function isActiveAppwriteSessionError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { type?: unknown; message?: unknown };
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";

  return (
    candidate.type === "user_session_already_exists" ||
    message.includes("session is active") ||
    message.includes("session already") ||
    message.includes("creation of a session is prohibited")
  );
}

export function isNotFoundAppwriteError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: unknown;
    type?: unknown;
    message?: unknown;
  };
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";

  return (
    candidate.code === 404 ||
    candidate.type === "document_not_found" ||
    message.includes("not found")
  );
}

export function isConflictAppwriteError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: unknown;
    type?: unknown;
    message?: unknown;
  };
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";

  return (
    candidate.code === 409 ||
    candidate.type === "document_already_exists" ||
    message.includes("already exists") ||
    message.includes("conflict")
  );
}

export function isUnknownAttributeAppwriteError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: unknown;
    type?: unknown;
    message?: unknown;
  };
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";

  return (
    candidate.code === 400 ||
    candidate.type === "document_invalid_structure" ||
    message.includes("unknown attribute") ||
    message.includes("invalid document structure") ||
    message.includes("attribute not found")
  );
}

export function shouldDisableAppwriteCollectionRead(error: unknown) {
  return (
    isUnauthorizedAppwriteError(error) ||
    isPermissionDeniedAppwriteError(error) ||
    isInvalidAppwriteQueryError(error)
  );
}

// ─── Social summary builder ─────────────────────────────────────────────────

export function summarizeAppwriteSocialInteractions(
  records: AppwriteSocialInteractionRecord[],
  xPostsCount: number,
): AppwriteVarSocialSummary {
  const summary = createEmptyAppwriteVarSocialSummary();

  summary.x.posts = xPostsCount;
  summary.records = records
    .slice()
    .sort(
      (left, right) =>
        Date.parse(right.createdAt || "") - Date.parse(left.createdAt || ""),
    );

  for (const record of records) {
    if (!record.active) continue;
    if (record.mode === "profile") continue;

    summary.totalActiveInteractions += 1;

    if (record.mode === "tiktok") {
      if (record.action === "post") summary.tiktok.uploads += 1;
      if (record.action === "like") summary.tiktok.likes += 1;
      if (record.action === "comment" || record.action === "reply")
        summary.tiktok.comments += 1;
      if (record.action === "save") summary.tiktok.saves += 1;
      if (record.action === "share") summary.tiktok.shares += 1;
      continue;
    }

    if (record.action === "like") summary.x.likes += 1;
    if (record.action === "reply" || record.action === "comment")
      summary.x.replies += 1;
    if (record.action === "repost") summary.x.reposts += 1;
    if (record.action === "share") summary.x.shares += 1;
  }

  return summary;
}
