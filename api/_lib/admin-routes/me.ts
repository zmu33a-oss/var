import {
  handleOptions,
  readAdminConfig,
  requireAdminSession,
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
    const admin = await requireAdminSession(request, config);
    sendJson(response, 200, {
      ok: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "MISSING_SESSION" ? 401 : code === "NOT_ADMIN" ? 403 : 500;

    sendJson(response, status, {
      ok: false,
      error:
        code === "NOT_ADMIN"
          ? "هذا الحساب ليس لديه صلاحية أدمن."
          : code === "MISSING_SESSION"
            ? "سجّل الدخول أولاً."
            : "تعذر التحقق من الجلسة.",
      code,
    });
  }
}
