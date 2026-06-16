import { Linking } from "react-native";
import { IS_WEB_RUNTIME } from "../../lib/appwrite/appwrite.client";

const DEFAULT_SUPPORT_WHATSAPP = "966547778281";
const DEFAULT_SUPPORT_MESSAGE = "مرحباً VAR لدي استفسار";

export function normalizeWhatsAppPhoneNumber(raw: string) {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length === 10) {
    digits = `966${digits.slice(1)}`;
  }

  if (digits.length === 9 && digits.startsWith("5")) {
    digits = `966${digits}`;
  }

  return digits;
}

export function resolveVarSupportWhatsAppPhone() {
  const configured = process.env.EXPO_PUBLIC_VAR_SUPPORT_WHATSAPP?.trim() || "";

  return (
    normalizeWhatsAppPhoneNumber(configured || DEFAULT_SUPPORT_WHATSAPP) ||
    DEFAULT_SUPPORT_WHATSAPP
  );
}

export function buildVarSupportWhatsAppUrl(options?: {
  phone?: string;
  message?: string;
}) {
  const phone = normalizeWhatsAppPhoneNumber(
    options?.phone || resolveVarSupportWhatsAppPhone(),
  );
  const message = encodeURIComponent(
    options?.message?.trim() || DEFAULT_SUPPORT_MESSAGE,
  );

  return `https://wa.me/${phone}?text=${message}`;
}

export async function openVarSupportWhatsApp(options?: {
  message?: string;
}): Promise<{ ok: boolean; message: string }> {
  const url = buildVarSupportWhatsAppUrl(options);

  try {
    if (IS_WEB_RUNTIME && typeof window !== "undefined") {
      const popup = window.open(url, "_blank", "noopener,noreferrer");

      if (!popup) {
        window.location.assign(url);
      }

      return { ok: true, message: "تم فتح واتساب." };
    }

    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      return { ok: false, message: "تعذر فتح واتساب على هذا الجهاز." };
    }

    await Linking.openURL(url);
    return { ok: true, message: "تم فتح واتساب." };
  } catch {
    return { ok: false, message: "تعذر فتح واتساب الآن." };
  }
}
