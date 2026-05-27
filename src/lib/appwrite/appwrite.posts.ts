import type {
  AppwritePostDocument,
  AppwritePostInput,
  AppwritePostRecord,
  AppwritePostsPage,
} from "./appwrite.types";
import { APPWRITE_CONFIG, hasAppwritePostsConfig } from "./appwrite.config";
import {
  normalizeAppwriteVarId,
  toAppwritePostRecord,
  shouldDisableAppwriteCollectionRead,
  isAppwritePostHidden,
} from "./appwrite.helpers";
import {
  AppwriteID,
  AppwriteQuery,
  getDatabasesBridge,
  hasConfiguredCollection,
} from "./appwrite.client";
import {
  canAttemptAppwriteCollectionRead,
  disableAppwriteCollectionRead,
} from "./appwrite.state";

// ─── Internal: posts database getter ─────────────────────────────────────────

function getPostsDatabase() {
  if (!hasAppwritePostsConfig()) {
    throw new Error(
      "Posts collection is missing EXPO_PUBLIC_APPWRITE_DATABASE_ID or EXPO_PUBLIC_APPWRITE_POSTS_COLLECTION_ID.",
    );
  }

  return getDatabasesBridge();
}

// ─── Posts functions ──────────────────────────────────────────────────────────

function mapVisibleAppwritePostRecords(
  documents: unknown[],
): AppwritePostRecord[] {
  return documents
    .filter(
      (document) =>
        !isAppwritePostHidden(document as AppwritePostDocument),
    )
    .map((document) =>
      toAppwritePostRecord(document as AppwritePostDocument),
    );
}

export async function listAppwritePosts(options?: {
  limit?: number;
  offset?: number;
}): Promise<AppwritePostsPage> {
  if (!canAttemptAppwriteCollectionRead(APPWRITE_CONFIG.postsCollectionId)) {
    return { records: [], total: 0 };
  }

  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;
  const databases = getPostsDatabase();
  let response;

  try {
    response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.postsCollectionId,
      [
        AppwriteQuery.orderDesc("$createdAt"),
        AppwriteQuery.limit(limit),
        AppwriteQuery.offset(offset),
      ],
    );
  } catch (error) {
    if (shouldDisableAppwriteCollectionRead(error)) {
      disableAppwriteCollectionRead(APPWRITE_CONFIG.postsCollectionId);
      return { records: [], total: 0 };
    }

    throw error;
  }

  const records = mapVisibleAppwritePostRecords(response.documents).sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );

  return {
    records,
    total: response.total,
  };
}

export async function listAppwritePostsByVarId(
  varId: string,
): Promise<AppwritePostRecord[]> {
  if (
    !hasAppwritePostsConfig() ||
    !canAttemptAppwriteCollectionRead(APPWRITE_CONFIG.postsCollectionId)
  ) {
    return [];
  }

  const normalizedVarId = normalizeAppwriteVarId(varId);

  if (!normalizedVarId) {
    return [];
  }

  const databases = getPostsDatabase();
  let response;

  try {
    response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.postsCollectionId,
      [
        AppwriteQuery.equal("authorId", normalizedVarId),
        AppwriteQuery.limit(100),
      ],
    );
  } catch (error) {
    if (shouldDisableAppwriteCollectionRead(error)) {
      disableAppwriteCollectionRead(APPWRITE_CONFIG.postsCollectionId);
      return [];
    }

    throw error;
  }

  return mapVisibleAppwritePostRecords(response.documents).sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export async function createAppwritePost(
  input: AppwritePostInput,
): Promise<AppwritePostRecord> {
  const databases = getPostsDatabase();
  const normalizedVarId = normalizeAppwriteVarId(input.varId);
  const document = await databases.createDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.postsCollectionId,
    AppwriteID.unique(),
    {
      title: input.title.trim(),
      content: input.content.trim(),
      authorId: normalizedVarId,
      varId: normalizedVarId,
      ...(input.mediaUri?.trim()
        ? { mediaUri: input.mediaUri.trim() }
        : {}),
    },
  );

  return toAppwritePostRecord(document as unknown as AppwritePostDocument);
}

export async function updateAppwritePost(
  postId: string,
  input: { title?: string; content?: string },
): Promise<AppwritePostRecord> {
  const databases = getPostsDatabase();
  const payload: Record<string, string> = {};

  if (typeof input.title === "string") {
    payload.title = input.title.trim();
  }

  if (typeof input.content === "string") {
    payload.content = input.content.trim();
  }

  const document = await databases.updateDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.postsCollectionId,
    postId.trim(),
    payload,
  );

  return toAppwritePostRecord(document as unknown as AppwritePostDocument);
}

export async function deleteAppwritePost(postId: string): Promise<void> {
  const databases = getPostsDatabase();

  await databases.deleteDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.postsCollectionId,
    postId.trim(),
  );
}
