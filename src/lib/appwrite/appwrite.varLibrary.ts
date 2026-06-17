import type {
  AppwriteVarLibraryDocument,
  AppwriteVarLibraryInput,
  AppwriteVarLibraryRecord,
} from "./appwrite.types";
import { APPWRITE_CONFIG, hasAppwriteVarLibraryConfig } from "./appwrite.config";
import {
  AppwriteID,
  AppwriteQuery,
  getDatabasesBridge,
} from "./appwrite.client";

function getVarLibraryDatabase() {
  if (!hasAppwriteVarLibraryConfig()) {
    throw new Error(
      "مجموعة مكتبة فار غير مضبوطة. أضف EXPO_PUBLIC_APPWRITE_VAR_LIBRARY_COLLECTION_ID أو شغّل ensure-var-library-collection.cjs",
    );
  }

  return getDatabasesBridge();
}

export function toAppwriteVarLibraryRecord(
  document: AppwriteVarLibraryDocument,
): AppwriteVarLibraryRecord {
  return {
    id: document.$id,
    name: typeof document.name === "string" ? document.name.trim() : "",
    club: typeof document.club === "string" ? document.club.trim() : "",
    position:
      typeof document.position === "string" ? document.position.trim() : "",
    imageUri:
      typeof document.imageUri === "string" ? document.imageUri.trim() : "",
    active: document.active !== false && document.active !== "false",
    createdByVarId:
      typeof document.createdByVarId === "string"
        ? document.createdByVarId.trim()
        : undefined,
    createdAt: document.$createdAt,
  };
}

export async function listAppwriteVarLibraryItems(): Promise<
  AppwriteVarLibraryRecord[]
> {
  if (!hasAppwriteVarLibraryConfig()) {
    return [];
  }

  const databases = getVarLibraryDatabase();
  const response = await databases.listDocuments(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.varLibraryCollectionId,
    [
      AppwriteQuery.equal("active", true),
      AppwriteQuery.orderDesc("$createdAt"),
      AppwriteQuery.limit(100),
    ],
  );

  return response.documents
    .map((document) =>
      toAppwriteVarLibraryRecord(document as unknown as AppwriteVarLibraryDocument),
    )
    .filter((item) => item.name && item.imageUri);
}

export async function createAppwriteVarLibraryItem(
  input: AppwriteVarLibraryInput,
): Promise<AppwriteVarLibraryRecord> {
  const databases = getVarLibraryDatabase();
  const document = await databases.createDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.varLibraryCollectionId,
    AppwriteID.unique(),
    {
      name: input.name.trim(),
      club: input.club.trim(),
      position: input.position.trim() || "لاعب",
      imageUri: input.imageUri.trim(),
      active: true,
      ...(input.createdByVarId?.trim()
        ? { createdByVarId: input.createdByVarId.trim() }
        : {}),
    },
  );

  return toAppwriteVarLibraryRecord(
    document as unknown as AppwriteVarLibraryDocument,
  );
}

export async function deleteAppwriteVarLibraryItem(itemId: string): Promise<void> {
  const databases = getVarLibraryDatabase();

  await databases.deleteDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.varLibraryCollectionId,
    itemId.trim(),
  );
}
