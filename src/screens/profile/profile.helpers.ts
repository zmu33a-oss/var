import type * as ImagePicker from "expo-image-picker";
import type { ProfileData } from "../../app.types";
import {
  ARABIC_AUTO_ENGLISH_LABELS,
  ARABIC_DIACRITICS_PATTERN,
  ARABIC_TATWEEL_PATTERN,
  ARABIC_TEXT_PATTERN,
  ARABIC_TO_LATIN_MAP,
  DEFAULT_PLAYER_AVATAR_URI,
  NATIONALITY_LABELS,
} from "./profile.constants";

export function transliterateArabicToken(value: string): string {
  const normalizedValue = value
    .replace(ARABIC_DIACRITICS_PATTERN, "")
    .replace(ARABIC_TATWEEL_PATTERN, "");

  const mappedValue = ARABIC_AUTO_ENGLISH_LABELS[normalizedValue];

  if (mappedValue) {
    return mappedValue;
  }

  if (normalizedValue.startsWith("ال") && normalizedValue.length > 2) {
    const remainder: string = transliterateArabicToken(normalizedValue.slice(2));
    return remainder ? `AL ${remainder}` : "AL";
  }

  let result = "";

  for (const char of normalizedValue) {
    result += ARABIC_TO_LATIN_MAP[char] ?? char;
  }

  return result;
}

export function getAutomaticEnglishLabel(value: string) {
  return value
    .trim()
    .replace(ARABIC_DIACRITICS_PATTERN, "")
    .replace(ARABIC_TATWEEL_PATTERN, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) =>
      ARABIC_TEXT_PATTERN.test(token) ? transliterateArabicToken(token) : token,
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function getArabicFontStyle(fontFamily?: string, value?: string) {
  if (!fontFamily) {
    return undefined;
  }

  if (value && !ARABIC_TEXT_PATTERN.test(value)) {
    return undefined;
  }

  return { fontFamily };
}

export function getEnglishProfileName(
  displayName: string,
  fallbackValue: string,
) {
  const trimmedDisplayName = displayName.trim();

  if (!trimmedDisplayName) {
    return fallbackValue;
  }

  if (/[A-Za-z]/.test(trimmedDisplayName)) {
    return trimmedDisplayName;
  }

  return getAutomaticEnglishLabel(trimmedDisplayName) || fallbackValue;
}

export function getEnglishProfileLine(profile: ProfileData) {
  const emailAlias = profile.email
    .split("@")[0]
    ?.replace(/[._-]+/g, " ")
    .trim();
  const usernameAlias = profile.username.replace(/^@/, "").trim();

  return getEnglishProfileName(
    profile.displayName,
    emailAlias || usernameAlias || "member profile",
  );
}

export function resolveProfileAvatarUri(avatarUri?: string) {
  const normalizedAvatarUri = avatarUri?.trim();

  return normalizedAvatarUri || DEFAULT_PLAYER_AVATAR_URI;
}

export function readSelectedProfileAvatarUri(
  asset?: ImagePicker.ImagePickerAsset,
) {
  if (!asset) {
    return "";
  }

  if (asset.base64?.trim()) {
    return `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
  }

  return asset.uri?.trim() || "";
}

export function getNationalityLabels(nationality: string) {
  const trimmedNationality = nationality.trim();

  if (!trimmedNationality) {
    return { arabic: "", english: "" };
  }

  const mappedLabels = NATIONALITY_LABELS[trimmedNationality.toLowerCase()];

  if (mappedLabels) {
    return mappedLabels;
  }

  if (/[A-Za-z]/.test(trimmedNationality)) {
    return {
      arabic: trimmedNationality,
      english: trimmedNationality.toUpperCase(),
    };
  }

  return {
    arabic: trimmedNationality,
    english: getAutomaticEnglishLabel(trimmedNationality) || trimmedNationality,
  };
}
