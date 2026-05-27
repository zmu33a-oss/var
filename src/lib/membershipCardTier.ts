export type MembershipCardTier = "classic" | "gold" | "platinum";

export const MEMBERSHIP_CARD_TIERS: MembershipCardTier[] = [
  "classic",
  "gold",
  "platinum",
];

export function normalizeMembershipCardTier(
  value: unknown,
): MembershipCardTier {
  if (value === "gold" || value === "platinum" || value === "classic") {
    return value;
  }

  return "classic";
}

export function getMembershipCardTierLabel(tier: MembershipCardTier) {
  return tier.toUpperCase();
}

export function getMembershipCardTierArabicLabel(tier: MembershipCardTier) {
  switch (tier) {
    case "gold":
      return "ذهبية";
    case "platinum":
      return "بلاتينيوم";
    default:
      return "كلاسيك";
  }
}

export type MembershipCardTheme = {
  frontGradient: string[];
  backGradient: string[];
  sheenGradient: string[];
  primaryText: string;
  secondaryText: string;
  mutedText: string;
  watermark: string;
  borderColor: string;
  qrColor: string;
  qrBackground: string;
  idBadgeBackground: string;
  idBadgeText: string;
  flipButtonBorder: string;
  flipButtonText: string;
  shadowColor: string;
};

export const MEMBERSHIP_CARD_THEMES: Record<
  MembershipCardTier,
  MembershipCardTheme
> = {
  classic: {
    frontGradient: ["#0B0F2A", "#121A3A", "#0A0E24", "#151B3D"],
    backGradient: ["#0A0D22", "#111735", "#0B1028", "#131A34"],
    sheenGradient: ["rgba(255,255,255,0.08)", "transparent"],
    primaryText: "#FFFFFF",
    secondaryText: "rgba(255,255,255,0.82)",
    mutedText: "rgba(255,255,255,0.55)",
    watermark: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.14)",
    qrColor: "#FFFFFF",
    qrBackground: "transparent",
    idBadgeBackground: "#050505",
    idBadgeText: "#FFFFFF",
    flipButtonBorder: "rgba(255,255,255,0.18)",
    flipButtonText: "#D7DEFF",
    shadowColor: "#05070D",
  },
  gold: {
    frontGradient: ["#D5B370", "#EED8A7", "#C29F5C", "#E6CC92", "#AF8C47"],
    backGradient: ["#AF8C47", "#C29F5C", "#B8934E", "#9A7838"],
    sheenGradient: ["rgba(255,255,255,0.18)", "transparent"],
    primaryText: "#111111",
    secondaryText: "#1A1A1A",
    mutedText: "rgba(17,17,17,0.55)",
    watermark: "rgba(0,0,0,0.05)",
    borderColor: "rgba(255,255,255,0.20)",
    qrColor: "#2A1E08",
    qrBackground: "transparent",
    idBadgeBackground: "transparent",
    idBadgeText: "#050505",
    flipButtonBorder: "rgba(201,169,98,0.35)",
    flipButtonText: "#E8D5A3",
    shadowColor: "#bca168",
  },
  platinum: {
    frontGradient: ["#D8DCE3", "#F4F6FA", "#C5CAD3", "#E8ECF1", "#B8BEC8"],
    backGradient: ["#B8BEC8", "#D8DCE3", "#C5CAD3", "#AEB4BF"],
    sheenGradient: ["rgba(255,255,255,0.42)", "transparent"],
    primaryText: "#111111",
    secondaryText: "#1A1A1A",
    mutedText: "rgba(17,17,17,0.55)",
    watermark: "rgba(0,0,0,0.04)",
    borderColor: "rgba(255,255,255,0.34)",
    qrColor: "#111111",
    qrBackground: "transparent",
    idBadgeBackground: "transparent",
    idBadgeText: "#050505",
    flipButtonBorder: "rgba(17,17,17,0.18)",
    flipButtonText: "#DDE2EA",
    shadowColor: "#9AA3B2",
  },
};

export function getMembershipCardTheme(tier: MembershipCardTier) {
  return MEMBERSHIP_CARD_THEMES[tier];
}
