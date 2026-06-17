// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  AppwriteUserRole,
  AppwriteSocialMode,
  AppwriteSocialAction,
  AppwritePostRecord,
  AppwritePostsPage,
  AppwritePostEngagementAggregate,
  AppwritePostReplyRecord,
  AppwriteLockedPrediction,
  AppwritePointsLedgerEntry,
  AppwriteSocialInteractionRecord,
  AppwriteDirectMessageRecord,
  AppwriteVarSocialSummary,
  AppwriteVarProfile,
  AppwriteAuthUser,
  AppwriteProfileIndexRecord,
  AppwriteSocialInteractionInput,
  AppwriteRecoveryChallenge,
  AppwriteGoogleOAuthChallenge,
  AppwriteCollectionIds,
  AppwriteProjectConfig,
  AppwriteConfig,
  AppwriteProfilePrefs,
  AppwritePostInput,
} from "./appwrite.types";

// ─── Config ───────────────────────────────────────────────────────────────────
export {
  VAR_ADMIN_USERNAME,
  VAR_DISPLAY_DIGIT_COUNT,
  DEFAULT_APPWRITE_AVATAR_URL,
  CONFIGURED_VAR_ADMIN_EMAIL,
  PROJECT_DEFAULTS,
  COLLECTION_DEFAULTS,
  APPWRITE_CONFIG,
  getMissingAppwriteProjectFields,
  getMissingAppwriteDataFields,
  hasAppwriteProjectConfig,
  hasAppwriteDataConfig,
  getMissingAppwritePostsFields,
  hasAppwritePostsConfig,
  getAppwritePostsConfigurationError,
  hasAppwriteProfileImagesBucketConfig,
  getAppwriteProfileImagesBucketConfigurationError,
  hasAppwriteVarLibraryConfig,
  getMissingAppwriteVarProfileFields,
  hasAppwriteVarProfileConfig,
  getMissingAppwriteSocialInteractionFields,
  hasAppwriteSocialInteractionsConfig,
  getAppwriteConfigurationError,
} from "./appwrite.config";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export {
  normalizeAppwriteUsername,
  normalizeAppwriteVarId,
  buildAppwriteVarId,
  normalizeAppwriteDisplayVarId,
  buildAppwriteDisplayVarId,
  readAppwriteString,
  resolveAppwriteAvatarUrl,
  readAppwriteNumber,
  readAppwriteBoolean,
  createEmptyAppwriteVarSocialSummary,
  toAppwriteProfilePrefs,
  resolveAdminRole,
  toAppwritePostRecord,
  isAppwritePostHidden,
  createEmptyPostEngagementAggregate,
  toAppwriteAuthUser,
  toAppwriteProfileIndexRecord,
  toAppwriteLockedPrediction,
  isLockedPredictionDocument,
  toAppwritePointsLedgerEntry,
  toAppwriteSocialInteractionRecord,
  toAppwritePostReplyRecord,
  toAppwriteDirectMessageRecord,
  isUnauthorizedAppwriteError,
  isPermissionDeniedAppwriteError,
  isInvalidAppwriteQueryError,
  isActiveAppwriteSessionError,
  isNotFoundAppwriteError,
  isConflictAppwriteError,
  isUnknownAttributeAppwriteError,
  shouldDisableAppwriteCollectionRead,
  summarizeAppwriteSocialInteractions,
} from "./appwrite.helpers";

// ─── Client ───────────────────────────────────────────────────────────────────
export {
  IS_WEB_RUNTIME,
  AppwriteID,
  AppwriteQuery,
  client,
  appwriteClient,
  account,
  appwriteAccount,
  appwriteDatabases,
  appwriteStorage,
  appwriteAvatars,
  getAccountService,
  getDatabasesService,
  hasConfiguredCollection,
  subscribeToAppwriteCollection,
  chunkAppwriteQueryValues,
  listCollectionDocumentsByVarId,
  listCollectionDocuments,
  listCollectionDocumentsByVarIdSafely,
  listCollectionDocumentsSafely,
} from "./appwrite.client";

export type {
  AppwriteAccountInstance,
  AppwriteDatabasesInstance,
  AppwriteStorageInstance,
  AppwriteAvatarsInstance,
  RealtimePayload,
} from "./appwrite.client";

// ─── State ────────────────────────────────────────────────────────────────────
export {
  canAttemptAppwriteCollectionRead,
  disableAppwriteCollectionRead,
  clearDisabledAppwriteCollectionRead,
  restoreProfileIndexReadCapability,
  restoreSocialInteractionsReadCapability,
} from "./appwrite.state";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export {
  hasStoredAppwriteSession,
  getAppwriteRecoveryRedirectUrl,
  readAppwriteRecoveryChallenge,
  hasAppwriteRecoveryChallenge,
  clearAppwriteRecoveryChallenge,
  readAppwriteGoogleOAuthChallenge,
  clearAppwriteGoogleOAuthChallenge,
  loginAppwriteWithGoogle,
  completeAppwriteGoogleOAuthSession,
  getCurrentAppwriteUser,
  loginAppwriteUser,
  signupAppwriteUser,
  requestAppwritePasswordRecovery,
  completeAppwritePasswordRecovery,
  saveAppwriteUserProfile,
  logoutAppwriteUser,
} from "./appwrite.auth";

// ─── Posts ────────────────────────────────────────────────────────────────────
export {
  listAppwritePosts,
  listAppwritePostsByVarId,
  createAppwritePost,
  updateAppwritePost,
  deleteAppwritePost,
} from "./appwrite.posts";

export { uploadAppwritePostImage, buildAppwriteFileViewUrl } from "./appwrite.storage";

export {
  listAppwriteVarLibraryItems,
  createAppwriteVarLibraryItem,
  deleteAppwriteVarLibraryItem,
} from "./appwrite.varLibrary";

export {
  isAppwriteStorageViewUrl,
  isSameAppwriteImagesBucketUrl,
} from "./appwrite.storage";

export type {
  AppwriteVarLibraryRecord,
  AppwriteVarLibraryInput,
} from "./appwrite.types";

// ─── Social ───────────────────────────────────────────────────────────────────
export {
  listAppwriteDirectMessages,
  sendAppwriteDirectMessage,
  listAppwriteVarSocialInteractions,
  listAppwriteXRepliesByTargetIds,
  listAppwriteXEngagementByTargetIds,
  listAppwriteXReposts,
  listAppwriteFollowingVarIds,
  syncAppwriteSocialInteraction,
} from "./appwrite.social";
export { submitAppwritePostReport } from "./appwrite.reports";

export {
  listFansPostsByClub,
  listFansPostsByVarId,
  createFansPost,
} from "./appwrite.fansPosts";

export type {
  AppwriteFansPostRecord,
  CreateFansPostInput,
} from "./appwrite.fansPosts";

// ─── Notifications ────────────────────────────────────────────────────────────
export {
  saveAppwriteNotification,
  loadAppwriteNotifications,
  isNotificationAlreadySaved,
  markNotificationSaved,
} from "./appwrite.notifications";

// ─── Profile ─────────────────────────────────────────────────────────────────
export {
  createEmptyAppwriteVarProfile,
  getAppwriteVarProfile,
  findAppwriteProfileIndexByDisplayVarId,
  listAppwriteProfileIndexesByVarIds,
  syncAppwriteProfileIndexRecord,
} from "./appwrite.profile";
