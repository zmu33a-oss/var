import { Platform, Share } from "react-native";
import type { MembershipCardTier } from "../../lib/membershipCardTier";
import { buildVarCardShareMessage } from "./profileCardConnect.utils";
import { shareVarFrontCardImage } from "./profileCardShareImage.utils";

export type VarCardShareOutcome = {
  cancelled?: boolean;
  message: string;
};

export async function shareVarIdentityCard(options: {
  displayVarId: string;
  cardTier: MembershipCardTier;
  cardWidth: number;
}): Promise<VarCardShareOutcome> {
  const { message, shareUrl } = buildVarCardShareMessage(options.displayVarId);

  try {
    if (Platform.OS === "web") {
      const shareResult = await shareVarFrontCardImage({
        cardTier: options.cardTier,
        displayVarId: options.displayVarId,
        width: options.cardWidth,
      });

      if (shareResult === "shared") {
        return { message: "تم فتح مشاركة صورة بطاقة VAR." };
      }

      if (shareResult === "downloaded") {
        return {
          message: "تم تنزيل صورة البطاقة بنفس التصميم والباركود.",
        };
      }

      return { message: "تعذر تجهيز صورة البطاقة على هذا المتصفح." };
    }

    await Share.share({
      message,
      title: "مشاركة بطاقة VAR",
      url: shareUrl.startsWith("http") ? shareUrl : undefined,
    });

    return { message: "تم فتح نافذة المشاركة." };
  } catch (error) {
    const shareError = error as { name?: string };

    if (shareError.name === "AbortError") {
      return { cancelled: true, message: "" };
    }

    if (Platform.OS === "web") {
      return { message: "تعذر مشاركة صورة البطاقة الآن." };
    }

    return { message: "تعذر فتح نافذة المشاركة." };
  }
}
