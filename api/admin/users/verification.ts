import {
  findProfileByDisplayVarId,
  handleOptions,
  normalizeDisplayVarId,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
  syncAccountVerifiedPref,
  updateProfileVerification,
  writeAdminAuditLog,
} from "../../_lib/admin-shared";

export default async function handler(request: any, response: any) {
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
    const verified = Boolean(body.verified);

    if (!normalizeDisplayVarId(displayVarId)) {
      sendJson(response, 400, { error: "رقم VAR الظاهر غير صالح." });
      return;
    }

    const profile = await findProfileByDisplayVarId(config, displayVarId);
    if (!profile) {
      sendJson(response, 404, { error: "لم يتم العثور على الحساب." });
      return;
    }

    const userId =
      typeof profile.userId === "string" ? profile.userId : profile.$id;

    await updateProfileVerification(config, profile.$id, verified);

    try {
      await syncAccountVerifiedPref(config, userId, verified);
    } catch {
      // optional prefs sync
    }

    await writeAdminAuditLog(config, {
      action: verified ? "grant_verification" : "revoke_verification",
      targetId:
        typeof profile.displayVarId === "string"
          ? profile.displayVarId
          : displayVarId,
      admin,
      details: verified ? "منح توثيق" : "إلغاء توثيق",
    });

    sendJson(response, 200, {
      ok: true,
      verified,
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

    sendJson(response, status, {
      ok: false,
      error:
        message === "MISSING_API_KEY"
          ? "أضف APPWRITE_API_KEY في Vercel لتنفيذ التوثيق."
          : message.includes("attribute")
            ? "أضف حقل isVerified (boolean) في collection profiles داخل Appwrite."
            : "تعذر تحديث التوثيق.",
      code: message,
    });
  }
}
