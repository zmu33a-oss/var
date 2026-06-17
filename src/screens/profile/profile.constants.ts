export const SLIDE_HORIZONTAL_PADDING = 8;
export const SLIDE_THUMB_SIZE = 64;
export const SLIDE_THRESHOLD = 0.58;
export const DEFAULT_CLUB_NAME = "الهلال";
export const DEFAULT_PLAYER_AVATAR_URI =
  "https://api.dicebear.com/9.x/personas/png?seed=alhilal-player&backgroundColor=c0d7ff,dbeafe,e2e8f0";
export const KSA_EMBLEM = require("../../../assets/icons/ksa.png");
export const PROFILE_ARABIC_FONT_FAMILY = "ProfileArabic";
export const PROFILE_ARABIC_FONT = require("../../../assets/images/alfont_com_zainpcv2mob600-zainpcv2.ttf");
export const ARABIC_TEXT_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
export const ARABIC_DIACRITICS_PATTERN = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
export const ARABIC_TATWEEL_PATTERN = /\u0640/g;

export const ARABIC_AUTO_ENGLISH_LABELS: Record<string, string> = {
  الهلال: "AL HILAL",
  النصر: "AL NASSR",
  الأهلي: "AL AHLI",
  الاهلي: "AL AHLI",
  الاتحاد: "AL ITTIHAD",
  الشباب: "AL SHABAB",
  الاتفاق: "AL ETTIFAQ",
};

export const ARABIC_TO_LATIN_MAP: Record<string, string> = {
  ا: "a",
  أ: "a",
  إ: "i",
  آ: "a",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "w",
  ي: "y",
  ى: "a",
  ة: "a",
  ؤ: "w",
  ئ: "y",
  ء: "a",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

export type ProfileScreenProps = {
  canOpenAdmin: boolean;
  onOpenAdmin: () => void;
  onOpenAdminWeb: () => void;
  adminDisplayVarId?: string;
  adminRoleLabel?: string;
  posts: import("../../app.types").Post[];
  fansPosts?: import("../../app.types").Post[];
  profile: import("../../app.types").ProfileData;
  followedProfiles: import("../../app.types").FollowingProfileCard[];
  socialInteractions?: import("../../app.types").SocialInteractionRecord[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onSaveProfile: (
    profile: import("../../app.types").ProfileData,
  ) => void | Promise<void>;
  onSignOut: () => void;
  onAddUserByDisplayVarId: (
    displayVarId: string,
  ) => Promise<{ ok: boolean; message: string }>;
  onOpenFansAssociation?: (options?: {
    sheetTab?: "posts" | "comments" | "likes" | "reposts";
  }) => void;
};

export type SwipeActionControlProps = {
  label: string;
  completedLabel: string;
  arabicFontFamily?: string;
  busy?: boolean;
  completed?: boolean;
  resetAfterComplete?: boolean;
  resetDelayMs?: number;
  iconName?: "logo-apple" | "logo-whatsapp" | "log-out-outline";
  iconColor?: string;
  onComplete: () => void | Promise<void>;
  onReachedEnd?: () => void | Promise<void>;
};

export type ProfileFieldKey =
  | "displayName"
  | "displayVarId"
  | "nationality"
  | "association"
  | "leagueClub"
  | "email"
  | "phoneNumber"
  | "avatarUri";

export const NATIONALITY_LABELS: Record<
  string,
  { arabic: string; english: string }
> = {
  سعودي: { arabic: "سعودي", english: "SAUDI" },
  سعودية: { arabic: "سعودية", english: "SAUDI" },
  محايد: { arabic: "محايد", english: "NEUTRAL" },
  محايدة: { arabic: "محايدة", english: "NEUTRAL" },
  saudi: { arabic: "سعودي", english: "SAUDI" },
  "saudi arabian": { arabic: "سعودي", english: "SAUDI" },
  ksa: { arabic: "سعودي", english: "SAUDI" },
  neutral: { arabic: "محايد", english: "NEUTRAL" },
};
