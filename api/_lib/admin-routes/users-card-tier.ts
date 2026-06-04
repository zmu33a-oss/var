import {
  findProfileByDisplayVarId,
  handleOptions,
  normalizeAdminCardTier,
  normalizeDisplayVarId,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
  syncAccountCardTierPref,
  updateProfileCardTier,
  writeAdminAuditLog,
} from "../admin-shared.js";

export async function handler(request: any, response: any) {
  if (handleOptions(request, response)) {
    return;
  }

  if ((request.method ?? "POST") !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const config = readAdminConfig();

  try {
    const admin = await requireAdminSession(request, config);
    requireServerKey(config);

    const body = readJsonBody(request);
    const displayVarId =
      typeof body.displayVarId === "string" ? body.displayVarId : "";
    const cardTier = normalizeAdminCardTier(body.cardTier);

    if (!normalizeDisplayVarId(displayVarId)) {
      sendJson(response, 400, { error: "رقم VAR الظاهر غير صالح." });
      return;
    }

    if (!cardTier) {
      sendJson(response, 400, {
        error: "نوع البطاقة غير صالح. استخدم classic أو gold أو platinum.",
      });
      return;
    }

    const profile = await findProfileByDisplayVarId(config, displayVarId);
    if (!profile) {
      sendJson(response, 404, { error: "لم يتم العثور على الحساب." });
      return;
    }

    const userId =
      typeof profile.userId === "string" ? profile.userId : profile.$id;

    await updateProfileCardTier(
      config,
      profile as unknown as Record<string, unknown>,
      cardTier,
    );

    try {
      await syncAccountCardTierPref(config, userId, cardTier);
    } catch {
      // optional prefs sync
    }

    await writeAdminAuditLog(config, {
      action: "set_card_tier",
      targetId:
        typeof profile.displayVarId === "string"
          ? profile.displayVarId
          : displayVarId,
      admin,
      details: `تعيين بطاقة ${cardTier}`,
    });

    sendJson(response, 200, {
      ok: true,
      cardTier,
      displayVarId:
        typeof profile.displayVarId === "string"
          ? profile.displayVarId
          : displayVarId,
      by: admin.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      message === "MISSING_SESSION"
        ? 401
        : message === "NOT_ADMIN"
          ? 403
          : message === "MISSING_API_KEY"
            ? 503
            : 500;

    const normalizedMessage = message.toLowerCase();

    sendJson(response, status, {
      ok: false,
      error:
        message === "MISSING_API_KEY"
          ? "أضف APPWRITE_API_KEY في Vercel لتعيين البطاقة."
          : normalizedMessage.includes("missing required attribute") &&
              normalizedMessage.includes("admin")
            ? "سجلات Profiles تفتقد حقل admin المطلوب. عطّه قيمة مثل VAR أو MEMBER، أو أزل Required من عمود admin."
            : normalizedMessage.includes("cardtier") &&
                normalizedMessage.includes("attribute")
              ? "أضف حقل cardTier (string) في collection profiles داخل Appwrite."
              : message.includes("attribute")
                ? "تحقق من أعمدة Profiles في Appwrite: cardTier (string) و admin (text)."
                : "تعذر تحديث نوع البطاقة.",
      code: message,
    });
  }
}
