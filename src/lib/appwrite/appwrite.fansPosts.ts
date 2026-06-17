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

export async function listFansPostsByVarId(
  varId: string | string[],
  limit = 50,
): Promise<AppwriteFansPostRecord[]> {
  if (!hasFansPostsConfig()) return [];

  const normalizedIds = [
    ...new Set(
      (Array.isArray(varId) ? varId : [varId])
        .map((value) => normalizeAppwriteVarId(value))
        .filter(Boolean),
    ),
  ];
  if (normalizedIds.length === 0) return [];

  try {
    const databases = getDatabasesBridge();
    const batches = await Promise.all(
      normalizedIds.map((normalizedVarId) =>
        databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.fansPostsCollectionId,
          [
            AppwriteQuery.equal("varId", normalizedVarId),
            AppwriteQuery.orderDesc("$createdAt"),
            AppwriteQuery.limit(limit),
          ],
        ),
      ),
    );

    const seen = new Set<string>();
    const merged: AppwriteFansPostRecord[] = [];
    for (const response of batches) {
      for (const doc of response.documents as AppwriteFansPostDocument[]) {
        if (seen.has(doc.$id)) continue;
        seen.add(doc.$id);
        merged.push(toFansPostRecord(doc));
      }
    }

    merged.sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
    return merged.slice(0, limit);
  } catch (err) {
    console.error("[listFansPostsByVarId] error:", err);
    return [];
  }
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
