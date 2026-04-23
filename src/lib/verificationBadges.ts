import type { VerificationBadgeVariant } from "./adminApi";

export const VERIFICATION_BADGE_OPTIONS: VerificationBadgeVariant[] = [
  "yellow",
  "blue",
];

export function normalizeVerificationBadge(
  value: unknown,
): VerificationBadgeVariant {
  return value === "blue" ? "blue" : "yellow";
}

export function getVerificationBadgeAccentLabel(
  variant: VerificationBadgeVariant,
) {
  return variant === "blue" ? "الزرقاء" : "الصفراء";
}

export function getVerificationBadgeShortLabel(
  variant: VerificationBadgeVariant,
) {
  return variant === "blue" ? "أزرق" : "أصفر";
}

export function getVerificationBadgeStatusLabel(
  variant: VerificationBadgeVariant,
) {
  return `موثق ${getVerificationBadgeShortLabel(variant)}`;
}

export function getVerificationBadgeButtonLabel(
  variant: VerificationBadgeVariant,
) {
  return variant === "blue" ? "توثيق أزرق" : "توثيق أصفر";
}

export function getVerificationBadgeA11yLabel(
  variant: VerificationBadgeVariant,
) {
  return `حساب موثق بالشارة ${getVerificationBadgeAccentLabel(variant)}`;
}
