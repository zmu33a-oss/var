import type {
  AppwriteAuthUser,
  AppwriteLockedPrediction,
  AppwritePointsDocument,
  AppwritePointsLedgerEntry,
  AppwritePredictionDocument,
  AppwriteProfileIndexDocument,
  AppwriteProfileIndexRecord,
  AppwriteVarProfile,
} from "./appwrite.types";
import { APPWRITE_CONFIG } from "./appwrite.config";
import {
  normalizeAppwriteVarId,
  normalizeAppwriteDisplayVarId,
  normalizeAppwriteUsername,
  resolveAppwriteAvatarUrl,
  toAppwriteProfileIndexRecord,
  toAppwriteLockedPrediction,
  toAppwritePointsLedgerEntry,
  isLockedPredictionDocument,
  isPermissionDeniedAppwriteError,
  isNotFoundAppwriteError,
  isConflictAppwriteError,
  isUnknownAttributeAppwriteError,
  isUnauthorizedAppwriteError,
  isInvalidAppwriteQueryError,
} from "./appwrite.helpers";
import {
  AppwriteQuery,
  getDatabasesBridge,
  hasConfiguredCollection,
  chunkAppwriteQueryValues,
  listCollectionDocumentsByVarIdSafely,
  listCollectionDocumentsSafely,
} from "./appwrite.client";
import { canAttemptAppwriteCollectionRead } from "./appwrite.state";
import {
  canReadProfileIndexCollection,
  canWriteProfileIndexCollection,
  setCanReadProfileIndexCollection,
  setCanWriteProfileIndexCollection,
  disableAppwriteCollectionRead,
  restoreProfileIndexReadCapability,
} from "./appwrite.state";
import { listAppwriteVarSocialInteractions } from "./appwrite.social";

// ─── Empty profile factory ────────────────────────────────────────────────────

export function createEmptyAppwriteVarProfile(): AppwriteVarProfile {
  return {
    varId: "",
    lockedPredictions: [],
    earnedPoints: 0,
    pointsLedger: [],
    social: {
      records: [],
      totalActiveInteractions: 0,
      x: { posts: 0, likes: 0, replies: 0, reposts: 0, shares: 0 },
      tiktok: { uploads: 0, likes: 0, comments: 0, saves: 0, shares: 0 },
    },
  };
}

// ─── Predictions and points ───────────────────────────────────────────────────

async function listAppwriteLockedPredictions(
  varId: string,
): Promise<AppwriteLockedPrediction[]> {
  const documents = await listCollectionDocumentsByVarIdSafely(
    APPWRITE_CONFIG.predictionsCollectionId,
    varId,
  );

  return documents
    .map((document) => document as unknown as AppwritePredictionDocument)
    .filter(isLockedPredictionDocument)
    .map(toAppwriteLockedPrediction)
    .sort(
      (left, right) => Date.parse(right.lockedAt) - Date.parse(left.lockedAt),
    );
}

async function listAppwritePointsLedger(
  varId: string,
): Promise<AppwritePointsLedgerEntry[]> {
  const documents = await listCollectionDocumentsByVarIdSafely(
    APPWRITE_CONFIG.pointsCollectionId,
    varId,
  );

  return documents
    .map((document) => document as unknown as AppwritePointsDocument)
    .map(toAppwritePointsLedgerEntry)
    .sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );
}

// ─── Profile index ────────────────────────────────────────────────────────────

export async function getAppwriteVarProfile(
  varId: string,
): Promise<AppwriteVarProfile> {
  const normalizedVarId = normalizeAppwriteVarId(varId);

  if (!normalizedVarId) {
    return createEmptyAppwriteVarProfile();
  }

  const [lockedPredictions, pointsLedger, social] = await Promise.all([
    listAppwriteLockedPredictions(normalizedVarId),
    listAppwritePointsLedger(normalizedVarId),
    listAppwriteVarSocialInteractions(normalizedVarId),
  ]);

  return {
    varId: normalizedVarId,
    lockedPredictions,
    earnedPoints: pointsLedger.reduce((sum, entry) => sum + entry.amount, 0),
    pointsLedger,
    social,
  } satisfies AppwriteVarProfile;
}

export async function findAppwriteProfileIndexByDisplayVarId(
  displayVarId: string,
): Promise<AppwriteProfileIndexRecord | null> {
  if (
    !hasConfiguredCollection(APPWRITE_CONFIG.profilesCollectionId) ||
    !canReadProfileIndexCollection ||
    !canAttemptAppwriteCollectionRead(APPWRITE_CONFIG.profilesCollectionId)
  ) {
    return null;
  }

  const normalizedDisplayVarId = normalizeAppwriteDisplayVarId(displayVarId);

  if (!normalizedDisplayVarId) {
    return null;
  }

  const databases = getDatabasesBridge();
  let response;

  try {
    response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.profilesCollectionId,
      [
        AppwriteQuery.equal("displayVarId", normalizedDisplayVarId),
        AppwriteQuery.limit(1),
      ],
    );
  } catch (error) {
    if (
      isUnauthorizedAppwriteError(error) ||
      isPermissionDeniedAppwriteError(error) ||
      isInvalidAppwriteQueryError(error)
    ) {
      disableAppwriteCollectionRead(APPWRITE_CONFIG.profilesCollectionId);
      setCanReadProfileIndexCollection(false);
      return null;
    }

    throw error;
  }

  const matchedDocument = response.documents[0];

  if (!matchedDocument) {
    return null;
  }

  return toAppwriteProfileIndexRecord(
    matchedDocument as unknown as AppwriteProfileIndexDocument,
  );
}

export async function listAppwriteProfileIndexesByVarIds(
  varIds: string[],
): Promise<AppwriteProfileIndexRecord[]> {
  if (
    !hasConfiguredCollection(APPWRITE_CONFIG.profilesCollectionId) ||
    !canReadProfileIndexCollection ||
    !canAttemptAppwriteCollectionRead(APPWRITE_CONFIG.profilesCollectionId)
  ) {
    return [];
  }

  const normalizedVarIds = Array.from(
    new Set(
      varIds.map((value) => normalizeAppwriteVarId(value)).filter(Boolean),
    ),
  );

  if (!normalizedVarIds.length) {
    return [];
  }

  let profileDocuments;

  try {
    profileDocuments = await Promise.all(
      chunkAppwriteQueryValues(normalizedVarIds).map((varIdChunk) =>
        listCollectionDocumentsSafely(APPWRITE_CONFIG.profilesCollectionId, [
          AppwriteQuery.equal("varId", varIdChunk),
        ]),
      ),
    );
  } catch (error) {
    if (
      isPermissionDeniedAppwriteError(error) ||
      isInvalidAppwriteQueryError(error)
    ) {
      setCanReadProfileIndexCollection(false);
      return [];
    }

    throw error;
  }

  const profileIndexMap = new Map<string, AppwriteProfileIndexRecord>();

  for (const document of profileDocuments.flat()) {
    const nextRecord = toAppwriteProfileIndexRecord(
      document as unknown as AppwriteProfileIndexDocument,
    );

    if (nextRecord.varId) {
      profileIndexMap.set(nextRecord.varId, nextRecord);
    }
  }

  return Array.from(profileIndexMap.values());
}

// ─── Profile index sync ───────────────────────────────────────────────────────

function buildAppwriteProfileIndexBasePayload(user: AppwriteAuthUser) {
  return {
    userId: user.id.trim(),
    varId: normalizeAppwriteVarId(user.varId),
    displayVarId: normalizeAppwriteDisplayVarId(user.displayVarId),
    displayName: user.name.trim(),
    username: normalizeAppwriteUsername(user.username),
    role: user.role,
    isVerified: user.isVerified ? "true" : "false",
    cardTier: user.cardTier,
  };
}

function buildAppwriteProfileIndexPayloads(user: AppwriteAuthUser) {
  const avatarUrl = resolveAppwriteAvatarUrl(user.avatarUri);
  const basePayload = buildAppwriteProfileIndexBasePayload(user);

  return [
    {
      ...basePayload,
      avatarUrl,
    },
    {
      ...basePayload,
      avatarUri: avatarUrl,
    },
  ];
}

async function tryProfileIndexDocumentMutation(
  payloads: ReturnType<typeof buildAppwriteProfileIndexPayloads>,
  mutation: (
    payload: Record<string, string>,
  ) => Promise<AppwriteProfileIndexRecord>,
) {
  let lastError: unknown = null;

  for (const payload of payloads) {
    try {
      return await mutation(payload);
    } catch (error) {
      lastError = error;

      if (isUnknownAttributeAppwriteError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export async function syncAppwriteProfileIndexRecord(
  user: AppwriteAuthUser,
): Promise<AppwriteProfileIndexRecord | null> {
  if (
    !hasConfiguredCollection(APPWRITE_CONFIG.profilesCollectionId) ||
    !canWriteProfileIndexCollection
  ) {
    return null;
  }

  const databases = getDatabasesBridge();
  const payloads = buildAppwriteProfileIndexPayloads(user);

  try {
    const syncedRecord = await tryProfileIndexDocumentMutation(
      payloads,
      async (payload) => {
        const updatedDocument = await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.profilesCollectionId,
          user.id,
          payload,
        );

        return toAppwriteProfileIndexRecord(
          updatedDocument as unknown as AppwriteProfileIndexDocument,
        );
      },
    );

    restoreProfileIndexReadCapability();
    return syncedRecord;
  } catch (error) {
    if (isPermissionDeniedAppwriteError(error)) {
      setCanWriteProfileIndexCollection(false);
      return null;
    }

    if (!isNotFoundAppwriteError(error)) {
      console.warn("Appwrite profile index sync skipped.", error);
      return null;
    }
  }

  try {
    const syncedRecord = await tryProfileIndexDocumentMutation(
      payloads,
      async (payload) => {
        const createdDocument = await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.profilesCollectionId,
          user.id,
          payload,
        );

        return toAppwriteProfileIndexRecord(
          createdDocument as unknown as AppwriteProfileIndexDocument,
        );
      },
    );

    restoreProfileIndexReadCapability();
    return syncedRecord;
  } catch (error) {
    if (isPermissionDeniedAppwriteError(error)) {
      setCanWriteProfileIndexCollection(false);
      return null;
    }

    if (!isConflictAppwriteError(error)) {
      console.warn("Appwrite profile index creation skipped.", error);
      return null;
    }
  }

  try {
    const syncedRecord = await tryProfileIndexDocumentMutation(
      payloads,
      async (payload) => {
        const updatedDocument = await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.profilesCollectionId,
          user.id,
          payload,
        );

        return toAppwriteProfileIndexRecord(
          updatedDocument as unknown as AppwriteProfileIndexDocument,
        );
      },
    );

    restoreProfileIndexReadCapability();
    return syncedRecord;
  } catch (error) {
    if (isPermissionDeniedAppwriteError(error)) {
      setCanWriteProfileIndexCollection(false);
      return null;
    }

    console.warn("Appwrite profile index final sync skipped.", error);
    return null;
  }
}
