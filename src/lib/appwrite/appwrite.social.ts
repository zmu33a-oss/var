import type {
  AppwriteDirectMessageRecord,
  AppwritePostReplyRecord,
  AppwriteSocialInteractionDocument,
  AppwriteSocialInteractionInput,
  AppwriteSocialInteractionRecord,
  AppwriteVarSocialSummary,
} from "./appwrite.types";
import { APPWRITE_CONFIG } from "./appwrite.config";
import {
  normalizeAppwriteVarId,
  toAppwriteDirectMessageRecord,
  toAppwritePostReplyRecord,
  toAppwriteSocialInteractionRecord,
  createEmptyAppwriteVarSocialSummary,
  summarizeAppwriteSocialInteractions,
  isPermissionDeniedAppwriteError,
  isInvalidAppwriteQueryError,
} from "./appwrite.helpers";
import {
  AppwriteID,
  AppwriteQuery,
  getDatabasesBridge,
  hasConfiguredCollection,
  chunkAppwriteQueryValues,
  listCollectionDocumentsByVarId,
  listCollectionDocumentsByVarIdSafely,
  listCollectionDocumentsSafely,
} from "./appwrite.client";
import {
  canAttemptAppwriteCollectionRead,
  canReadSocialInteractionsCollection,
  setCanReadSocialInteractionsCollection,
  restoreSocialInteractionsReadCapability,
} from "./appwrite.state";
import { listAppwritePostsByVarId } from "./appwrite.posts";

// ─── Direct Messages ──────────────────────────────────────────────────────────

export async function listAppwriteDirectMessages(
  varId: string,
): Promise<AppwriteDirectMessageRecord[]> {
  if (
    !hasConfiguredCollection(APPWRITE_CONFIG.socialInteractionsCollectionId) ||
    !canReadSocialInteractionsCollection ||
    !canAttemptAppwriteCollectionRead(
      APPWRITE_CONFIG.socialInteractionsCollectionId,
    )
  ) {
    return [] as AppwriteDirectMessageRecord[];
  }

  const normalizedVarId = normalizeAppwriteVarId(varId);

  if (!normalizedVarId) {
    return [] as AppwriteDirectMessageRecord[];
  }

  const sharedQueries = [
    AppwriteQuery.equal("mode", "profile"),
    AppwriteQuery.equal("action", "message"),
  ];

  try {
    const [sentDocuments, receivedDocuments] = await Promise.all([
      listCollectionDocumentsSafely(
        APPWRITE_CONFIG.socialInteractionsCollectionId,
        [...sharedQueries, AppwriteQuery.equal("varId", normalizedVarId)],
      ),
      listCollectionDocumentsSafely(
        APPWRITE_CONFIG.socialInteractionsCollectionId,
        [...sharedQueries, AppwriteQuery.equal("targetId", normalizedVarId)],
      ),
    ]);

    restoreSocialInteractionsReadCapability();

    return Array.from(
      new Map(
        [...sentDocuments, ...receivedDocuments].map((document) => {
          const typedDocument = document as AppwriteSocialInteractionDocument;

          return [
            typedDocument.$id,
            toAppwriteDirectMessageRecord(typedDocument),
          ] as const;
        }),
      ).values(),
    ).sort(
      (left, right) =>
        Date.parse(left.createdAt || "") - Date.parse(right.createdAt || ""),
    );
  } catch (error) {
    if (
      isPermissionDeniedAppwriteError(error) ||
      isInvalidAppwriteQueryError(error)
    ) {
      setCanReadSocialInteractionsCollection(false);
      return [] as AppwriteDirectMessageRecord[];
    }

    throw error;
  }
}

export async function sendAppwriteDirectMessage(input: {
  senderVarId: string;
  recipientVarId: string;
  content: string;
}): Promise<AppwriteDirectMessageRecord | null> {
  const createdRecord = await syncAppwriteSocialInteraction({
    varId: input.senderVarId,
    mode: "profile",
    action: "message",
    targetId: input.recipientVarId,
    value: input.content,
  });

  if (!createdRecord) {
    return null;
  }

  return {
    id: createdRecord.id,
    senderVarId: createdRecord.varId,
    recipientVarId: normalizeAppwriteVarId(createdRecord.targetId),
    content: createdRecord.value,
    createdAt: createdRecord.createdAt,
  } satisfies AppwriteDirectMessageRecord;
}

// ─── Social interactions ──────────────────────────────────────────────────────

export async function listAppwriteVarSocialInteractions(
  varId: string,
): Promise<AppwriteVarSocialSummary> {
  const xPosts = await listAppwritePostsByVarId(varId);

  if (
    hasConfiguredCollection(APPWRITE_CONFIG.socialInteractionsCollectionId) &&
    canReadSocialInteractionsCollection
  ) {
    const socialDocuments = await listCollectionDocumentsByVarIdSafely(
      APPWRITE_CONFIG.socialInteractionsCollectionId,
      varId,
    );

    const socialRecords = socialDocuments.map((document) =>
      toAppwriteSocialInteractionRecord(
        document as unknown as AppwriteSocialInteractionDocument,
      ),
    );

    return summarizeAppwriteSocialInteractions(socialRecords, xPosts.length);
  }

  const [commentDocuments, likeDocuments, shareDocuments] = await Promise.all([
    listCollectionDocumentsByVarIdSafely(
      APPWRITE_CONFIG.commentsCollectionId,
      varId,
    ),
    listCollectionDocumentsByVarIdSafely(
      APPWRITE_CONFIG.likesCollectionId,
      varId,
    ),
    listCollectionDocumentsByVarIdSafely(
      APPWRITE_CONFIG.sharesCollectionId,
      varId,
    ),
  ]);

  const socialRecords = [
    ...commentDocuments.map((document) =>
      toAppwriteSocialInteractionRecord(
        document as unknown as AppwriteSocialInteractionDocument,
        "reply",
      ),
    ),
    ...likeDocuments.map((document) =>
      toAppwriteSocialInteractionRecord(
        document as unknown as AppwriteSocialInteractionDocument,
        "like",
      ),
    ),
    ...shareDocuments.map((document) =>
      toAppwriteSocialInteractionRecord(
        document as unknown as AppwriteSocialInteractionDocument,
        "share",
      ),
    ),
  ];

  return summarizeAppwriteSocialInteractions(socialRecords, xPosts.length);
}

export async function listAppwriteXRepliesByTargetIds(
  targetIds: string[],
): Promise<AppwritePostReplyRecord[]> {
  if (
    !hasConfiguredCollection(APPWRITE_CONFIG.socialInteractionsCollectionId) ||
    !canReadSocialInteractionsCollection ||
    !canAttemptAppwriteCollectionRead(
      APPWRITE_CONFIG.socialInteractionsCollectionId,
    )
  ) {
    return [];
  }

  const normalizedTargetIds = Array.from(
    new Set(targetIds.map((value) => value.trim()).filter(Boolean)),
  );

  if (!normalizedTargetIds.length) {
    return [];
  }

  let replyDocuments;

  try {
    replyDocuments = await Promise.all(
      chunkAppwriteQueryValues(normalizedTargetIds).map((targetIdChunk) =>
        listCollectionDocumentsSafely(
          APPWRITE_CONFIG.socialInteractionsCollectionId,
          [
            AppwriteQuery.equal("mode", "x"),
            AppwriteQuery.equal("action", ["reply", "comment"]),
            AppwriteQuery.equal("targetId", targetIdChunk),
            AppwriteQuery.equal("active", true),
          ],
        ),
      ),
    );
  } catch (error) {
    if (
      isPermissionDeniedAppwriteError(error) ||
      isInvalidAppwriteQueryError(error)
    ) {
      setCanReadSocialInteractionsCollection(false);
      return [];
    }

    throw error;
  }

  return replyDocuments
    .flat()
    .map((document) =>
      toAppwritePostReplyRecord(
        document as unknown as AppwriteSocialInteractionDocument,
      ),
    )
    .filter((record) => record.postTargetId && record.content)
    .sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );
}

export async function listAppwriteFollowingVarIds(
  varId: string,
): Promise<string[]> {
  if (
    !hasConfiguredCollection(APPWRITE_CONFIG.socialInteractionsCollectionId) ||
    !canReadSocialInteractionsCollection ||
    !canAttemptAppwriteCollectionRead(
      APPWRITE_CONFIG.socialInteractionsCollectionId,
    )
  ) {
    return [];
  }

  const normalizedVarId = normalizeAppwriteVarId(varId);

  if (!normalizedVarId) {
    return [];
  }

  const documents = await listCollectionDocumentsByVarIdSafely(
    APPWRITE_CONFIG.socialInteractionsCollectionId,
    normalizedVarId,
    [
      AppwriteQuery.equal("mode", "profile"),
      AppwriteQuery.equal("action", "follow"),
      AppwriteQuery.equal("active", true),
    ],
  );

  return Array.from(
    new Set(
      documents
        .map((document) =>
          toAppwriteSocialInteractionRecord(
            document as unknown as AppwriteSocialInteractionDocument,
            "follow",
            "profile",
          ),
        )
        .map((record) => normalizeAppwriteVarId(record.targetId))
        .filter(Boolean),
    ),
  );
}

export async function syncAppwriteSocialInteraction(
  input: AppwriteSocialInteractionInput,
): Promise<AppwriteSocialInteractionRecord | null> {
  if (
    !hasConfiguredCollection(APPWRITE_CONFIG.socialInteractionsCollectionId)
  ) {
    return null;
  }

  const normalizedVarId = normalizeAppwriteVarId(input.varId);
  const normalizedTargetId = normalizeAppwriteVarId(input.targetId);

  if (!normalizedVarId || !normalizedTargetId) {
    return null;
  }

  const databases = getDatabasesBridge();
  const nextActive = input.active ?? true;
  const payload = {
    varId: normalizedVarId,
    mode: input.mode,
    action: input.action,
    targetId: normalizedTargetId,
    active: nextActive,
    value: input.value?.trim() || "",
  };
  const isToggleAction = ["like", "repost", "share", "save", "follow"].includes(
    input.action,
  );

  if (!isToggleAction) {
    const createdDocument = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.socialInteractionsCollectionId,
      AppwriteID.unique(),
      payload,
    );

    const createdRecord = toAppwriteSocialInteractionRecord(
      createdDocument as unknown as AppwriteSocialInteractionDocument,
    );

    restoreSocialInteractionsReadCapability();
    return createdRecord;
  }

  const existingDocuments = await listCollectionDocumentsByVarId(
    APPWRITE_CONFIG.socialInteractionsCollectionId,
    normalizedVarId,
    [
      AppwriteQuery.equal("mode", input.mode),
      AppwriteQuery.equal("action", input.action),
      AppwriteQuery.equal("targetId", normalizedTargetId),
      AppwriteQuery.limit(1),
    ],
  );

  const existingDocument = existingDocuments[0] as
    | AppwriteSocialInteractionDocument
    | undefined;

  if (existingDocument?.$id) {
    const updatedDocument = await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.socialInteractionsCollectionId,
      existingDocument.$id,
      payload,
    );

    const updatedRecord = toAppwriteSocialInteractionRecord(
      updatedDocument as unknown as AppwriteSocialInteractionDocument,
    );

    restoreSocialInteractionsReadCapability();
    return updatedRecord;
  }

  const createdDocument = await databases.createDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.socialInteractionsCollectionId,
    AppwriteID.unique(),
    payload,
  );

  const createdRecord = toAppwriteSocialInteractionRecord(
    createdDocument as unknown as AppwriteSocialInteractionDocument,
  );

  restoreSocialInteractionsReadCapability();
  return createdRecord;
}
