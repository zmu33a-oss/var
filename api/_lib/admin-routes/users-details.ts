import {
  fetchAdminUserDetails,
  handleOptions,
  readAdminConfig,
  requireAdminSession,
  requireServerKey,
  sendJson,
} from "../admin-shared.js";

export async function handler(request: any, response: any) {
  if (handleOptions(request, response)) {
    return;
  }

  if ((request.method ?? "GET") !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const config = readAdminConfig();

  try {
    await requireAdminSession(request, config);
    requireServerKey(config);

    const url = new URL(request.url ?? "http://localhost", "http://localhost");
    const displayVarId =
      url.searchParams.get("displayVarId")?.trim() ||
      url.searchParams.get("q")?.trim() ||
      "";

    if (!displayVarId) {
      sendJson(response, 400, {
        ok: false,
        error: "أدخل VAR ID للمستخدم.",
        code: "MISSING_DISPLAY_VAR_ID",
      });
      return;
    }

    const result = await fetchAdminUserDetails(config, displayVarId);

    if (!result) {
      sendJson(response, 404, {
        ok: false,
        error: "لم يتم العثور على الحساب.",
        code: "NOT_FOUND",
      });
      return;
    }

    sendJson(response, 200, {
      ok: true,
      user: result.user,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "MISSING_SESSION"
        ? 401
        : code === "NOT_ADMIN"
          ? 403
          : code === "MISSING_API_KEY"
            ? 503
            : 500;

    sendJson(response, status, {
      ok: false,
      error:
        code === "MISSING_API_KEY"
          ? "أضف APPWRITE_API_KEY لقراءة بيانات المستخدم."
          : code === "MISSING_SESSION"
            ? "الجلسة منتهية، أعد تسجيل الدخول."
            : code === "NOT_ADMIN"
              ? "هذا الحساب ليس لديه صلاحية أدمن."
              : "تعذر جلب بيانات المستخدم.",
      code,
    });
  }
}
