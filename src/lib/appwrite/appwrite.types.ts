export type AppwriteUserRole = "admin" | "member";

export type AppwriteSocialMode = "x" | "tiktok" | "profile" | "notification";

export type AppwriteSocialAction =
  | "post"
  | "reply"
  | "comment"
  | "message"
  | "like"
  | "repost"
  | "share"
  | "save"
  | "follow"
  | "notify";

export type AppwritePostFeedScope = "x" | "fans";

export type AppwritePostRecord = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  varId: string;
  mediaUri?: string;
  fromVarLibrary?: boolean;
  feedScope?: AppwritePostFeedScope;
  createdAt: string;
};

export type AppwritePostsPage = {
  records: AppwritePostRecord[];
  total: number;
};

export type AppwritePostEngagementAggregate = {
  likes: number;
  reposts: number;
  shares: number;
  likedByMe: boolean;
  repostedByMe: boolean;
  sharedByMe: boolean;
};

export type AppwritePostReplyRecord = {
  id: string;
  postTargetId: string;
  varId: string;
  content: string;
  createdAt: string;
};

export type AppwriteLockedPrediction = {
  id: string;
  varId: string;
  title: string;
  choice: string;
  competition: string;
  status: string;
  lockedAt: string;
  pointsAwarded: number;
};

export type AppwritePointsLedgerEntry = {
  id: string;
  varId: string;
  amount: number;
  reason: string;
  createdAt: string;
};

export type AppwriteSocialInteractionRecord = {
  id: string;
  varId: string;
  mode: AppwriteSocialMode;
  action: AppwriteSocialAction;
  targetId: string;
  active: boolean;
  value: string;
  createdAt: string;
};

export type AppwriteDirectMessageRecord = {
  id: string;
  senderVarId: string;
  recipientVarId: string;
  content: string;
  createdAt: string;
};

export type AppwriteVarSocialSummary = {
  x: {
    posts: number;
    likes: number;
    replies: number;
    reposts: number;
    shares: number;
  };
  tiktok: {
    uploads: number;
    likes: number;
    comments: number;
    saves: number;
    shares: number;
  };
  totalActiveInteractions: number;
  records: AppwriteSocialInteractionRecord[];
};

export type AppwriteVarProfile = {
  varId: string;
  lockedPredictions: AppwriteLockedPrediction[];
  earnedPoints: number;
  pointsLedger: AppwritePointsLedgerEntry[];
  social: AppwriteVarSocialSummary;
};

export type AppwriteAuthUser = {
  id: string;
  varId: string;
  displayVarId: string;
  name: string;
  email: string;
  username: string;
  phoneNumber: string;
  nationalId: string;
  bio: string;
  location: string;
  profession: string;
  birthDate: string;
  nationality: string;
  association: string;
  leagueClub: string;
  avatarUri: string;
  role: AppwriteUserRole;
  adminLabel: string;
  isVerified: boolean;
  cardTier: "classic" | "gold" | "platinum";
  createdAt: string;
};

export type AppwriteProfileIndexRecord = {
  id: string;
  userId: string;
  varId: string;
  displayVarId: string;
  displayName: string;
  username: string;
  avatarUri: string;
  role: AppwriteUserRole;
  isVerified: boolean;
  cardTier: "classic" | "gold" | "platinum";
  createdAt: string;
};

export type AppwriteSocialInteractionInput = {
  varId: string;
  mode: AppwriteSocialMode;
  action: AppwriteSocialAction;
  targetId: string;
  active?: boolean;
  value?: string;
};

export type AppwriteRecoveryChallenge = {
  userId: string;
  secret: string;
  email: string;
};

export type AppwriteGoogleOAuthChallenge = {
  status: "success" | "failure";
  userId: string;
  secret: string;
};

export type AppwriteCollectionIds = {
  databaseId: string;
  profilesCollectionId: string;
  predictionsCollectionId: string;
  pointsCollectionId: string;
  socialInteractionsCollectionId: string;
  postsCollectionId: string;
  commentsCollectionId: string;
  likesCollectionId: string;
  sharesCollectionId: string;
  profileImagesBucketId: string;
  varLibraryCollectionId: string;
  fansPostsCollectionId: string;
};

export type AppwriteVarLibraryRecord = {
  id: string;
  name: string;
  club: string;
  position: string;
  imageUri: string;
  active: boolean;
  createdByVarId?: string;
  createdAt: string;
};

export type AppwriteVarLibraryInput = {
  name: string;
  club: string;
  position: string;
  imageUri: string;
  createdByVarId?: string;
};

export type AppwriteVarLibraryDocument = {
  $id: string;
  $createdAt: string;
  name?: unknown;
  club?: unknown;
  position?: unknown;
  imageUri?: unknown;
  active?: unknown;
  createdByVarId?: unknown;
};

export type AppwriteProjectConfig = {
  projectId: string;
  projectName: string;
  endpoint: string;
  platform: string;
};

export type AppwriteConfig = AppwriteProjectConfig & AppwriteCollectionIds;

// Internal document types (not exported)
export type AppwriteProfilePrefs = {
  varId?: string;
  displayVarId?: string;
  username?: string;
  phoneNumber?: string;
  nationalId?: string;
  bio?: string;
  location?: string;
  profession?: string;
  birthDate?: string;
  nationality?: string;
  association?: string;
  leagueClub?: string;
  avatarUri?: string;
  avatarUrl?: string;
  role?: AppwriteUserRole;
  adminLabel?: string;
  isVerified?: boolean;
  cardTier?: "classic" | "gold" | "platinum";
};

export type AppwritePostInput = {
  title: string;
  content: string;
  varId: string;
  mediaUri?: string;
  fromVarLibrary?: boolean;
  feedScope?: AppwritePostFeedScope;
};

export type AppwritePostDocument = {
  $id: string;
  $createdAt: string;
  title?: unknown;
  content?: unknown;
  authorId?: unknown;
  varId?: unknown;
  mediaUri?: unknown;
  fromVarLibrary?: unknown;
  feedScope?: unknown;
  isHidden?: unknown;
  status?: unknown;
};

export type AppwriteAccountDocument = {
  $id: string;
  $createdAt?: unknown;
  name?: unknown;
  email?: unknown;
  prefs?: unknown;
};

export type AppwriteProfileIndexDocument = {
  $id: string;
  $createdAt?: unknown;
  userId?: unknown;
  varId?: unknown;
  displayVarId?: unknown;
  displayName?: unknown;
  username?: unknown;
  avatarUri?: unknown;
  avatarUrl?: unknown;
  role?: unknown;
  isVerified?: unknown;
  cardTier?: unknown;
};

export type AppwritePredictionDocument = {
  $id: string;
  $createdAt: string;
  varId?: unknown;
  title?: unknown;
  question?: unknown;
  matchLabel?: unknown;
  choice?: unknown;
  selection?: unknown;
  prediction?: unknown;
  competition?: unknown;
  league?: unknown;
  status?: unknown;
  lockedAt?: unknown;
  isLocked?: unknown;
  locked?: unknown;
  pointsAwarded?: unknown;
  points?: unknown;
};

export type AppwritePointsDocument = {
  $id: string;
  $createdAt: string;
  varId?: unknown;
  points?: unknown;
  amount?: unknown;
  earnedPoints?: unknown;
  delta?: unknown;
  reason?: unknown;
  title?: unknown;
  description?: unknown;
};

export type AppwriteSocialInteractionDocument = {
  $id: string;
  $createdAt: string;
  varId?: unknown;
  mode?: unknown;
  surface?: unknown;
  action?: unknown;
  type?: unknown;
  targetId?: unknown;
  postId?: unknown;
  videoId?: unknown;
  active?: unknown;
  value?: unknown;
  content?: unknown;
};
