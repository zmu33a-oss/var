import {
  deleteProfileAndUser,
  findProfileByDisplayVarId,
  handleOptions,
  normalizeDisplayVarId,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
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

    if (!normalizeDisplayVarId(displayVarId)) {
      sendJson(response, 400, { error: "رقم VAR الظاهر غير صالح." });
      return;
    }

    const profile = await findProfileByDisplayVarId(config, displayVarId);
    if (!profile) {
      sendJson(response, 404, { error: "لم يتم العثور على الحساب." });
      return;
    }

    await deleteProfileAndUser(
      config,
      profile as unknown as Record<string, unknown>,
      admin.id,
    );

    await writeAdminAuditLog(config, {
      action: "delete_account",
      targetId:
        typeof profile.displayVarId === "string"
          ? profile.displayVarId
          : displayVarId,
      admin,
      details: "حذف حساب مستخدم",
    });

    sendJson(response, 200, {
      ok: true,
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
            : message === "CANNOT_DELETE_SELF"
              ? 400
              : 500;

    sendJson(response, status, {
      ok: false,
      error:
        message === "CANNOT_DELETE_SELF"
          ? "لا يمكنك حذف حسابك الحالي."
          : message === "MISSING_API_KEY"
            ? "أضف APPWRITE_API_KEY لحذف المستخدمين."
            : "تعذر حذف الحساب.",
      code: message,
    });
  }
}
