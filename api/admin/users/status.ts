import {
  findProfileByDisplayVarId,
  handleOptions,
  normalizeDisplayVarId,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
  updateProfileAccountStatus,
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
    const statusValue =
      typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
    const status = statusValue === "suspended" ? "suspended" : "active";

    if (!normalizeDisplayVarId(displayVarId)) {
      sendJson(response, 400, { error: "رقم VAR الظاهر غير صالح." });
      return;
    }

    const profile = await findProfileByDisplayVarId(config, displayVarId);
    if (!profile) {
      sendJson(response, 404, { error: "لم يتم العثور على الحساب." });
      return;
    }

    await updateProfileAccountStatus(config, profile.$id, status);

    await writeAdminAuditLog(config, {
      action: status === "suspended" ? "suspend_account" : "activate_account",
      targetId:
        typeof profile.displayVarId === "string"
          ? profile.displayVarId
          : displayVarId,
      admin,
      details: status === "suspended" ? "إيقاف حساب" : "إعادة تفعيل",
    });

    sendJson(response, 200, {
      ok: true,
      status,
      displayVarId:
        typeof profile.displayVarId === "string"
          ? profile.displayVarId
          : displayVarId,
      by: admin.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    sendJson(response, message === "MISSING_API_KEY" ? 503 : 500, {
      ok: false,
      error:
        message.includes("attribute")
          ? "أضف حقل accountStatus (string) في collection profiles."
          : "تعذر تحديث حالة الحساب.",
      code: message,
    });
  }
}
