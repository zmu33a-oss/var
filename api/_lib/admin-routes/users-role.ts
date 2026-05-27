import {
  findProfileByDisplayVarId,
  handleOptions,
  normalizeDisplayVarId,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
  syncAccountRolePref,
  updateProfileRole,
  writeAdminAuditLog,
} from "../admin-shared";

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
    const roleValue =
      typeof body.role === "string" ? body.role.trim().toLowerCase() : "";
    const role = roleValue === "admin" ? "admin" : "member";

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

    await updateProfileRole(config, profile.$id, role);

    try {
      await syncAccountRolePref(config, userId, role);
    } catch {
      // optional prefs sync
    }

    await writeAdminAuditLog(config, {
      action: "change_role",
      targetId:
        typeof profile.displayVarId === "string"
          ? profile.displayVarId
          : displayVarId,
      admin,
      details: role === "admin" ? "ترقية إلى أدمن" : "تخفيض إلى عضو",
    });

    sendJson(response, 200, {
      ok: true,
      role,
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
          ? "أضف APPWRITE_API_KEY لتغيير الرتبة."
          : "تعذر تحديث رتبة المستخدم.",
      code: message,
    });
  }
}
