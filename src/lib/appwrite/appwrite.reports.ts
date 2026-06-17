import { APPWRITE_CONFIG } from "./appwrite.config";
import {
  AppwriteID,
  AppwriteQuery,
  getDatabasesBridge,
  hasConfiguredCollection,
  listCollectionDocumentsSafely,
} from "./appwrite.client";

const REPORTS_COLLECTION_ID =
  process.env.EXPO_PUBLIC_APPWRITE_REPORTS_COLLECTION_ID?.trim() || "reports";

function hasReportsCollectionConfigured() {
  return Boolean(
    APPWRITE_CONFIG.databaseId.trim() &&
      REPORTS_COLLECTION_ID.trim() &&
      hasConfiguredCollection(REPORTS_COLLECTION_ID),
  );
}

export async function submitAppwritePostReport(input: {
  postId: string;
  postVarId: string;
  reporterVarId: string;
  contentPreview: string;
  reason?: string;
}) {
  if (!hasReportsCollectionConfigured()) {
    return null;
  }

  const postId = input.postId.trim();
  const postVarId = input.postVarId.trim();
  const reporterVarId = input.reporterVarId.trim();

  if (!postId || !postVarId || !reporterVarId) {
    return null;
  }

  const databases = getDatabasesBridge();

  try {
    const existing = await listCollectionDocumentsSafely(REPORTS_COLLECTION_ID, [
      AppwriteQuery.equal("postId", postId),
      AppwriteQuery.equal("reporterVarId", reporterVarId),
      AppwriteQuery.equal("status", "open"),
      AppwriteQuery.limit(1),
    ]);

    if (existing.length > 0) {
      return existing[0];
    }

    const createdDocument = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      REPORTS_COLLECTION_ID,
      AppwriteID.unique(),
      {
        postId,
        postVarId,
        reporterVarId,
        contentPreview: input.contentPreview.trim().slice(0, 500),
        reason: input.reason?.trim() || "user_report",
        status: "open",
        source: "user",
        aiScore: "0",
        aiFlags: "",
      },
    );

    return createdDocument;
  } catch {
    return null;
  }
}
