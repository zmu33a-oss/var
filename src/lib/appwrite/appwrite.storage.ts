import { Platform } from "react-native";
import {
  APPWRITE_CONFIG,
  hasAppwriteProfileImagesBucketConfig,
  getAppwriteProfileImagesBucketConfigurationError,
} from "./appwrite.config";
import { AppwriteID, appwriteStorage } from "./appwrite.client";

type AppwriteStorageBridge = {
  createFile: (
    bucketId: string,
    fileId: string,
    file: unknown,
  ) => Promise<{ $id: string }>;
};

const REMOTE_IMAGE_URI_PATTERN = /^https?:\/\//i;

function isInlineImageUri(uri: string) {
  return uri.startsWith("data:") || uri.startsWith("blob:");
}

export function isAppwriteStorageViewUrl(uri: string) {
  const normalizedUri = uri.trim();
  const endpoint = APPWRITE_CONFIG.endpoint.trim().replace(/\/+$/, "");

  if (!normalizedUri || !endpoint) {
    return false;
  }

  return normalizedUri.startsWith(`${endpoint}/storage/buckets/`);
}

export function isSameAppwriteImagesBucketUrl(uri: string) {
  const bucketId = APPWRITE_CONFIG.profileImagesBucketId.trim();
  const normalizedUri = uri.trim();

  if (!bucketId || !isAppwriteStorageViewUrl(normalizedUri)) {
    return false;
  }

  return normalizedUri.includes(`/storage/buckets/${bucketId}/files/`);
}

async function readUploadableImageBlob(uri: string): Promise<Blob> {
  const normalizedUri = uri.trim();

  if (!normalizedUri) {
    throw new Error("لم يتم اختيار صورة.");
  }

  if (Platform.OS === "web") {
    try {
      const response = await fetch(normalizedUri, {
        mode: "cors",
        credentials: "omit",
      });

      if (!response.ok) {
        throw new Error(`تعذر قراءة الصورة (${response.status}).`);
      }

      return response.blob();
    } catch (error) {
      if (isSameAppwriteImagesBucketUrl(normalizedUri)) {
        throw new Error(
          "تعذر الوصول للصورة من التخزين. تأكد من صلاحيات قراءة bucket الصور في Appwrite.",
        );
      }

      throw error instanceof Error
        ? error
        : new Error("تعذر تحميل الصورة للنشر.");
    }
  }

  throw new Error("رفع الصور من هذا الجهاز غير مدعوم حالياً بدون bucket.");
}

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

  if (isSameAppwriteImagesBucketUrl(normalizedUri)) {
    return normalizedUri;
  }

  if (!hasAppwriteProfileImagesBucketConfig() || !appwriteStorage) {
    if (isInlineImageUri(normalizedUri) || normalizedUri.length > 2048) {
      throw new Error(
        getAppwriteProfileImagesBucketConfigurationError() ||
          "رفع الصور غير مفعّل في الإعدادات.",
      );
    }

    if (REMOTE_IMAGE_URI_PATTERN.test(normalizedUri)) {
      return normalizedUri;
    }

    throw new Error("رابط الصورة غير صالح للنشر.");
  }

  const storage = appwriteStorage as unknown as AppwriteStorageBridge;
  const fileName = `post-${varId.replace(/[^a-zA-Z0-9_-]/g, "")}-${Date.now()}.jpg`;

  if (Platform.OS === "web") {
    const blob = await readUploadableImageBlob(normalizedUri);
    const fileType = blob.type || "image/jpeg";
    const file = new File([blob], fileName, { type: fileType });
    const created = await storage.createFile(
      bucketId,
      AppwriteID.unique(),
      file,
    );

    return buildAppwriteFileViewUrl(bucketId, created.$id);
  }

  const created = await storage.createFile(bucketId, AppwriteID.unique(), {
    name: fileName,
    type: "image/jpeg",
    size: 0,
    uri: normalizedUri,
  });

  return buildAppwriteFileViewUrl(bucketId, created.$id);
}
