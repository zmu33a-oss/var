import {
  handleOptions,
  normalizeDisplayVarId,
  readAdminConfig,
  readJsonBody,
  requireAdminSession,
  requireServerKey,
  sendJson,
  updateAdminUserDetails,
  writeAdminAuditLog,
} from "../admin-shared";

function readBodyString(body: Record<string, unknown>, key: string) {
  return typeof body[key] === "string" ? body[key].trim() : undefined;
}

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
    const displayVarId = readBodyString(body, "displayVarId") || "";

    if (!normalizeDisplayVarId(displayVarId) && !displayVarId) {
      sendJson(response, 400, {
        ok: false,
        error: "رقم VAR الظاهر غير صالح.",
        code: "INVALID_DISPLAY_VAR_ID",
      });
      return;
    }

    const user = await updateAdminUserDetails(config, {
      displayVarId,
      email: readBodyString(body, "email"),
      password: readBodyString(body, "password"),
      displayName: readBodyString(body, "displayName"),
      username: readBodyString(body, "username"),
      displayVarIdNext: readBodyString(body, "displayVarIdNext"),
      phoneNumber: readBodyString(body, "phoneNumber"),
      nationalId: readBodyString(body, "nationalId"),
      bio: readBodyString(body, "bio"),
      location: readBodyString(body, "location"),
      profession: readBodyString(body, "profession"),
      birthDate: readBodyString(body, "birthDate"),
      nationality: readBodyString(body, "nationality"),
      association: readBodyString(body, "association"),
      avatarUrl: readBodyString(body, "avatarUrl"),
    });

    await writeAdminAuditLog(config, {
      action: "update_user_account",
      targetId:
        typeof user.displayVarId === "string" && user.displayVarId
          ? user.displayVarId
          : displayVarId,
      admin,
      details: "تحديث بيانات الحساب من لوحة الإدارة",
    });

    sendJson(response, 200, {
      ok: true,
      user,
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
            : message === "PROFILE_NOT_FOUND"
              ? 404
              : message === "INVALID_EMAIL" ||
                  message === "WEAK_PASSWORD" ||
                  message === "DISPLAY_VAR_ID_TAKEN"
                ? 400
                : 500;

    sendJson(response, status, {
      ok: false,
      error:
        message === "MISSING_API_KEY"
          ? "أضف APPWRITE_API_KEY لتعديل بيانات المستخدم."
          : message === "PROFILE_NOT_FOUND"
            ? "لم يتم العثور على الحساب."
            : message === "INVALID_EMAIL"
              ? "البريد الإلكتروني غير صالح."
              : message === "WEAK_PASSWORD"
                ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل."
                : message === "DISPLAY_VAR_ID_TAKEN"
                  ? "رقم VAR هذا مستخدم من حساب آخر."
                  : "تعذر تحديث بيانات المستخدم.",
      code: message,
    });
  }
}
