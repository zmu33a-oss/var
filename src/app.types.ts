import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type GradientPair = [string, string];
export type MainTab = "home" | "fans" | "leagues" | "account";
export type Tab = MainTab;
export type HomeMode = "tiktok" | "x";
export type AuthMode = "login" | "signup";
export type LeagueTab = "events" | "lineup" | "predictions" | "live" | null;
export type FanClubId =
  | "hilal" | "nassr" | "ittihad" | "ahli" | "shabab"
  | "ittefaq" | "qadisiyah" | "raed" | "fayha" | "damak" | "tai" | "khaleej" | "abha" | "taawun" | "fateh" | "wehda"
  | "mancity" | "manutd" | "liverpool" | "chelsea" | "arsenal" | "tottenham" | "newcastle" | "astonvilla"
  | "westham" | "brighton" | "bournemouth" | "leicester" | "everton" | "wolves" | "crystalpalace" | "nottingham"
  | "fulham" | "brentford" | "southampton" | "ipswich"
  | "realmadrid" | "barcelona" | "atletico" | "sevilla" | "villarreal" | "betis" | "sociedad" | "athleticbilbao"
  | "valencia" | "osasuna" | "alaves" | "mallorca" | "celtavigo" | "leganes" | "getafe" | "espanyol"
  | "rayo" | "valladolid" | "laspalmas" | "girona"
  | "psg" | "marseille" | "monaco" | "lyon" | "lille" | "nice" | "rennes" | "strasbourg"
  | "montpellier" | "nantes" | "bordeaux" | "lens" | "toulouse" | "angers" | "reims" | "clermont"
  | "auxerre" | "brest" | "lehavre" | "saintetienne"
  | "juventus" | "milan" | "intermilan" | "napoli" | "roma" | "lazio" | "fiorentina" | "atalanta"
  | "torino" | "bologna" | "sassuolo" | "udinese" | "monza" | "empoli" | "lecce" | "verona"
  | "cagliari" | "genoa" | "frosinone" | "como";
export type MembershipCardTier = "classic" | "gold" | "platinum";
export type IconName = ComponentProps<typeof Ionicons>["name"];

export type ChatMessage = {
  id: string;
  sender: string;
  content: string;
  time: string;
  mine?: boolean;
};

export type PendingAuthIntent =
  | { type: "open-x-post" }
  | { type: "reply-post"; postId: number }
  | { type: "toggle-post-like"; postId: number }
  | { type: "toggle-post-repost"; postId: number }
  | { type: "share-post"; postId: number }
  | { type: "toggle-follow-author"; authorVarId: string }
  | { type: "toggle-support"; clubId: FanClubId };

export type Palette = {
  accent: string;
  panel: string;
  gradient: GradientPair;
  label: string;
};

export type Video = {
  id: number;
  creatorName: string;
  creatorHandle: string;
  caption: string;
  mediaUri?: string;
  likes: number;
  saves: number;
  shares: number;
  comments: number;
  likedByMe: boolean;
  savedByMe: boolean;
  sharedByMe: boolean;
  theme: GradientPair;
  tag: string;
};

export type PostRepostMeta = {
  interactionId?: string;
  varId: string;
  author: string;
  authorAvatarUri?: string;
  authorVerified?: boolean;
  handle: string;
  time: string;
};

export type Post = {
  id: number;
  feedKey?: string;
  sourceId?: string;
  title?: string;
  authorId?: string;
  author: string;
  authorAvatarUri?: string;
  authorVerified?: boolean;
  handle: string;
  time: string;
  content: string;
  mediaUri?: string;
  fromVarLibrary?: boolean;
  repostMeta?: PostRepostMeta;
  replyItems?: PostReply[];
  likes: number;
  replies: number;
  reposts: number;
  shares: number;
  likedByMe: boolean;
  repostedByMe?: boolean;
  sharedByMe?: boolean;
};

export type PostReply = {
  id: number;
  author: string;
  authorAvatarUri?: string;
  authorVerified?: boolean;
  handle: string;
  time: string;
  content: string;
};

export type FollowingProfileCard = {
  varId: string;
  displayVarId: string;
  displayName: string;
  username: string;
  avatarUri: string;
  role: "admin" | "member";
  cardTier?: "classic" | "gold" | "platinum";
};

export type FanClub = {
  id: FanClubId;
  leagueId: string;
  title: string;
  crowdLabel: string;
  summary: string;
  trendLabel: string;
  gradient: GradientPair;
  icon: IconName;
};

export type TacticalPlayer = {
  id: string;
  name: string;
  number: number;
  x: number;
  y: number;
  gradient: GradientPair;
};

export type BenchPlayer = {
  id: string;
  name: string;
  number: number;
};

export type NewsItem = {
  id: string;
  badge: string;
  title: string;
  summary: string;
  time: string;
  accent: string;
};

export type MatchEvent = {
  id: string;
  minute: string;
  title: string;
  detail: string;
};

export type LockedPredictionSummary = {
  id: string;
  title: string;
  choice: string;
  competition: string;
  status: string;
  lockedAt: string;
  pointsAwarded: number;
};

export type ProfileSocialMetrics = {
  xPosts: number;
  xLikes: number;
  xReplies: number;
  xReposts: number;
  xShares: number;
  tiktokUploads: number;
  tiktokLikes: number;
  tiktokComments: number;
  tiktokSaves: number;
  tiktokShares: number;
  totalInteractions: number;
};

export type ProfileData = {
  varId: string;
  displayVarId: string;
  displayName: string;
  username: string;
  bio: string;
  location: string;
  email: string;
  phoneNumber: string;
  profession: string;
  nationalId: string;
  birthDate: string;
  nationality: string;
  association: string;
  leagueClub: string;
  joinDate: string;
  avatarUri: string;
  avatarFrameEnabled: boolean;
  isVerified: boolean;
  cardTier: MembershipCardTier;
  role: "admin" | "member";
  earnedPoints: number;
  lockedPredictions: LockedPredictionSummary[];
  socialMetrics: ProfileSocialMetrics;
  walletPassAdded: boolean;
  walletPassUrl?: string;
};

export type MetricTile = {
  id: string;
  label: string;
  value: string;
  color: string;
  icon: IconName;
};
