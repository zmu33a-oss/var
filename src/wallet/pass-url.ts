import type { ProfileData } from "../app.types";

type WalletPassUrlOptions = {
  profile: ProfileData;
  clubName: string;
  totalPosts: number;
  totalReplies: number;
  totalLikes: number;
};

const DIRECT_WALLET_PASS_URL =
  process.env.EXPO_PUBLIC_WALLET_PASS_URL?.trim() ?? "";

const WALLET_PASS_API_URL =
  process.env.EXPO_PUBLIC_WALLET_PASS_API_URL?.trim() ??
  (process.env.EXPO_PUBLIC_APP_URL?.trim()
    ? `${process.env.EXPO_PUBLIC_APP_URL.replace(/\/+$/, "")}/api/wallet-pass`
    : "");

function buildQueryString(values: Record<string, string>) {
  return Object.entries(values)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
}

export function getConfiguredWalletPassUrl() {
  return DIRECT_WALLET_PASS_URL;
}

export function resolveWalletPassUrl(options: WalletPassUrlOptions) {
  const profilePassUrl = options.profile.walletPassUrl?.trim();

  if (profilePassUrl) {
    return profilePassUrl;
  }

  if (DIRECT_WALLET_PASS_URL) {
    return DIRECT_WALLET_PASS_URL;
  }

  if (!WALLET_PASS_API_URL) {
    return "";
  }

  const queryString = buildQueryString({
    displayName: options.profile.displayName,
    username: options.profile.username,
    bio: options.profile.bio,
    location: options.profile.location,
    email: options.profile.email,
    phoneNumber: options.profile.phoneNumber,
    profession: options.profile.profession,
    nationalId: options.profile.nationalId,
    nationality: options.profile.nationality,
    joinDate: options.profile.joinDate,
    clubName: options.clubName,
    totalPosts: String(options.totalPosts),
    totalReplies: String(options.totalReplies),
    totalLikes: String(options.totalLikes),
  });

  return `${WALLET_PASS_API_URL}${WALLET_PASS_API_URL.includes("?") ? "&" : "?"}${queryString}`;
}
