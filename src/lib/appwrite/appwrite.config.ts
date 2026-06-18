import type {
  AppwriteConfig,
  AppwriteCollectionIds,
  AppwriteProjectConfig,
} from "./appwrite.types";

export const VAR_ADMIN_USERNAME = "var";
export const VAR_DISPLAY_DIGIT_COUNT = 8;
export const DEFAULT_APPWRITE_AVATAR_URL =
  "https://api.dicebear.com/9.x/personas/png?seed=webplus-user&backgroundColor=c0d7ff,dbeafe,e2e8f0";
export const CONFIGURED_VAR_ADMIN_EMAIL =
  process.env.EXPO_PUBLIC_VAR_ADMIN_EMAIL?.trim().toLowerCase() || "";

export const PROJECT_DEFAULTS: AppwriteProjectConfig = {
  projectId:
    process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID?.trim() ||
    "69ff62d9001bf7dcd933",
  projectName: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_NAME?.trim() || "var",
  endpoint:
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT?.trim() ||
    "https://fra.cloud.appwrite.io/v1",
  platform:
    process.env.EXPO_PUBLIC_APPWRITE_PLATFORM?.trim() || "com.xtik.webplus",
};

export const COLLECTION_DEFAULTS: AppwriteCollectionIds = {
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID?.trim() || "",
  profilesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID?.trim() || "",
  predictionsCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_PREDICTIONS_COLLECTION_ID?.trim() || "",
  pointsCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_POINTS_COLLECTION_ID?.trim() || "",
  socialInteractionsCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_SOCIAL_INTERACTIONS_COLLECTION_ID?.trim() ||
    "",
  postsCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_POSTS_COLLECTION_ID?.trim() || "",
  commentsCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_COMMENTS_COLLECTION_ID?.trim() || "",
  likesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_LIKES_COLLECTION_ID?.trim() || "",
  sharesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_SHARES_COLLECTION_ID?.trim() || "",
  profileImagesBucketId:
    process.env.EXPO_PUBLIC_APPWRITE_PROFILE_IMAGES_BUCKET_ID?.trim() || "",
  varLibraryCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_VAR_LIBRARY_COLLECTION_ID?.trim() ||
    "var_library",
  fansPostsCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_FANS_POSTS_COLLECTION_ID?.trim() || "",
};

export const APPWRITE_CONFIG: AppwriteConfig = {
  ...PROJECT_DEFAULTS,
  ...COLLECTION_DEFAULTS,
};

export function getMissingAppwriteProjectFields() {
  return Object.entries(PROJECT_DEFAULTS)
    .filter(([, value]) => !value)
    .map(([key]) => key as keyof AppwriteProjectConfig);
}

export function getMissingAppwriteDataFields() {
  return Object.entries(COLLECTION_DEFAULTS)
    .filter(([, value]) => !value)
    .map(([key]) => key as keyof AppwriteCollectionIds);
}

export function hasAppwriteProjectConfig() {
  return getMissingAppwriteProjectFields().length === 0;
}

export function hasAppwriteDataConfig() {
  return getMissingAppwriteDataFields().length === 0;
}

export const APPWRITE_PLACEHOLDER_VALUES = new Set([
  "your_project_id",
  "your_database_id",
  "your_posts_collection_id",
  "your_predictions_collection_id",
  "your_points_collection_id",
  "your_social_interactions_collection_id",
]);

function isAppwritePlaceholderValue(value: string) {
  return APPWRITE_PLACEHOLDER_VALUES.has(value.trim().toLowerCase());
}

export function getMissingAppwritePostsFields() {
  return (["databaseId", "postsCollectionId"] as const).filter((key) => {
    const value = APPWRITE_CONFIG[key].trim();

    return !value || isAppwritePlaceholderValue(value);
  });
}

export function hasAppwritePostsConfig() {
  return getMissingAppwritePostsFields().length === 0;
}

export function hasAppwriteProfileImagesBucketConfig() {
  const bucketId = APPWRITE_CONFIG.profileImagesBucketId.trim();

  return Boolean(bucketId) && !isAppwritePlaceholderValue(bucketId);
}

export function getAppwriteProfileImagesBucketConfigurationError(): string | null {
  if (hasAppwriteProfileImagesBucketConfig()) {
    return null;
  }

  return "نشر صور المنشورات يحتاج EXPO_PUBLIC_APPWRITE_PROFILE_IMAGES_BUCKET_ID في ملف .env (من Appwrite → Storage → Bucket ID)، ثم أعد تشغيل التطبيق.";
}

export function getAppwritePostsConfigurationError(): string | null {
  const projectError = getAppwriteConfigurationError();

  if (projectError) {
    return projectError;
  }

  if (isAppwritePlaceholderValue(APPWRITE_CONFIG.databaseId)) {
    return "ملف .env ما زال يحتوي your_database_id. هذا ليس معرّف Appwrite الحقيقي. من Console → Databases افتح قاعدة البيانات وانسخ Database ID إلى EXPO_PUBLIC_APPWRITE_DATABASE_ID.";
  }

  if (isAppwritePlaceholderValue(APPWRITE_CONFIG.postsCollectionId)) {
    return "ملف .env ما زال يحتوي your_posts_collection_id. من Console → Databases → posts انسخ Collection ID إلى EXPO_PUBLIC_APPWRITE_POSTS_COLLECTION_ID.";
  }

  const missingFields = getMissingAppwritePostsFields();

  if (missingFields.length) {
    return `ربط منشورات Appwrite غير مكتمل. أضف في .env: ${missingFields.join(", ")}`;
  }

  return null;
}

export function getMissingAppwriteVarProfileFields() {
  return (
    [
      "databaseId",
      "predictionsCollectionId",
      "pointsCollectionId",
      "socialInteractionsCollectionId",
    ] as const
  ).filter((key) => !APPWRITE_CONFIG[key]);
}

export function hasAppwriteVarProfileConfig() {
  return getMissingAppwriteVarProfileFields().length === 0;
}

export function getMissingAppwriteSocialInteractionFields() {
  return (["databaseId", "socialInteractionsCollectionId"] as const).filter(
    (key) => !APPWRITE_CONFIG[key],
  );
}

export function hasAppwriteSocialInteractionsConfig() {
  return getMissingAppwriteSocialInteractionFields().length === 0;
}

export function getAppwriteConfigurationError(): string | null {
  if (
    !APPWRITE_CONFIG.projectId ||
    APPWRITE_PLACEHOLDER_VALUES.has(APPWRITE_CONFIG.projectId)
  ) {
    return "ضع EXPO_PUBLIC_APPWRITE_PROJECT_ID الصحيح من Appwrite Console → Project Settings → General.";
  }

  if (
    !APPWRITE_CONFIG.endpoint ||
    !APPWRITE_CONFIG.endpoint.startsWith("http")
  ) {
    return "ضع EXPO_PUBLIC_APPWRITE_ENDPOINT الصحيح (مثل https://fra.cloud.appwrite.io/v1).";
  }

  return null;
}
