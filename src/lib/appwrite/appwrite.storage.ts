import { Platform } from "react-native";
import { APPWRITE_CONFIG } from "./appwrite.config";
import { AppwriteID, appwriteStorage } from "./appwrite.client";

export function buildAppwriteFileViewUrl(bucketId: string, fileId: string) {
  const projectId = APPWRITE_CONFIG.projectId.trim();

  return `${APPWRITE_CONFIG.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
}

export async function uploadAppwritePostImage(
  localUri: string,
  varId: string,
): Promise<string> {
  const normalizedUri = localUri.trim();
  const bucketId = APPWRITE_CONFIG.profileImagesBucketId.trim();

  if (!normalizedUri) {
    throw new Error("لم يتم اختيار صورة.");
  }

  if (!bucketId || !appwriteStorage) {
    return normalizedUri;
  }

  const fileName = `post-${varId.replace(/[^a-zA-Z0-9_-]/g, "")}-${Date.now()}.jpg`;

  if (Platform.OS === "web") {
    const response = await fetch(normalizedUri);
    const blob = await response.blob();
    const file = new File([blob], fileName, {
      type: blob.type || "image/jpeg",
    });
    const created = await appwriteStorage.createFile(
      bucketId,
      AppwriteID.unique(),
      file,
    );

    return buildAppwriteFileViewUrl(bucketId, created.$id);
  }

  const created = await appwriteStorage.createFile(
    bucketId,
    AppwriteID.unique(),
    {
      name: fileName,
      type: "image/jpeg",
      size: 0,
      uri: normalizedUri,
    },
  );

  return buildAppwriteFileViewUrl(bucketId, created.$id);
}
