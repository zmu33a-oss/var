import type {
  AppwritePostDocument,
  AppwritePostInput,
  AppwritePostRecord,
} from "./appwrite.types";
import { APPWRITE_CONFIG, hasAppwritePostsConfig } from "./appwrite.config";
import {
  normalizeAppwriteVarId,
  toAppwritePostRecord,
  shouldDisableAppwriteCollectionRead,
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

export async function listAppwritePosts(): Promise<AppwritePostRecord[]> {
  if (!canAttemptAppwriteCollectionRead(APPWRITE_CONFIG.postsCollectionId)) {
    return [];
  }

  const databases = getPostsDatabase();
  let response;

  try {
    response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.postsCollectionId,
    );
  } catch (error) {
    if (shouldDisableAppwriteCollectionRead(error)) {
      disableAppwriteCollectionRead(APPWRITE_CONFIG.postsCollectionId);
      return [];
    }

    throw error;
  }

  return response.documents
    .map((document) =>
      toAppwritePostRecord(document as unknown as AppwritePostDocument),
    )
    .sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );
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

  return response.documents
    .map((document) =>
      toAppwritePostRecord(document as unknown as AppwritePostDocument),
    )
    .sort(
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
    },
  );

  return toAppwritePostRecord(document as unknown as AppwritePostDocument);
}
