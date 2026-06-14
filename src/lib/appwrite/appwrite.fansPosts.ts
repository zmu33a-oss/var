import { APPWRITE_CONFIG } from "./appwrite.config";
import {
  AppwriteID,
  AppwriteQuery,
  getDatabasesBridge,
  hasConfiguredCollection,
} from "./appwrite.client";
import { normalizeAppwriteVarId, readAppwriteString } from "./appwrite.helpers";

export type AppwriteFansPostRecord = {
  id: string;
  clubId: string;
  varId: string;
  author: string;
  avatarUri: string;
  verified: boolean;
  content: string;
  createdAt: string;
};

type AppwriteFansPostDocument = Record<string, unknown> & { $id: string; $createdAt: string };

function hasFansPostsConfig(): boolean {
  return (
    hasConfiguredCollection(APPWRITE_CONFIG.fansPostsCollectionId) &&
    Boolean(APPWRITE_CONFIG.databaseId.trim())
  );
}

function toFansPostRecord(doc: AppwriteFansPostDocument): AppwriteFansPostRecord {
  return {
    id: doc.$id,
    clubId: readAppwriteString(doc.clubId),
    varId: readAppwriteString(doc.varId),
    author: readAppwriteString(doc.author),
    avatarUri: readAppwriteString(doc.avatarUri),
    verified: Boolean(doc.verified),
    content: readAppwriteString(doc.content),
    createdAt: doc.$createdAt,
  };
}

export async function listFansPostsByClub(
  clubId: string,
  limit = 50,
): Promise<AppwriteFansPostRecord[]> {
  if (!hasFansPostsConfig()) return [];

  try {
    const databases = getDatabasesBridge();
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.fansPostsCollectionId,
      [
        AppwriteQuery.equal("clubId", clubId),
        AppwriteQuery.orderDesc("$createdAt"),
        AppwriteQuery.limit(limit),
      ],
    );
    return (response.documents as AppwriteFansPostDocument[]).map(toFansPostRecord);
  } catch (err) {
    console.error("[listFansPostsByClub] error:", err);
    return [];
  }
}

export type CreateFansPostInput = {
  clubId: string;
  varId: string;
  author: string;
  avatarUri: string;
  verified: boolean;
  content: string;
};

export async function createFansPost(
  input: CreateFansPostInput,
): Promise<AppwriteFansPostRecord | null> {
  if (!hasFansPostsConfig()) return null;

  try {
    const databases = getDatabasesBridge();
    const normalizedVarId = normalizeAppwriteVarId(input.varId) || input.varId;
    const doc = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.fansPostsCollectionId,
      AppwriteID.unique(),
      {
        clubId: input.clubId,
        varId: normalizedVarId,
        author: input.author.trim(),
        avatarUri: input.avatarUri.trim(),
        verified: input.verified,
        content: input.content.trim(),
      },
    );
    return toFansPostRecord(doc as unknown as AppwriteFansPostDocument);
  } catch (err) {
    console.error("[createFansPost] error:", err);
    return null;
  }
}
