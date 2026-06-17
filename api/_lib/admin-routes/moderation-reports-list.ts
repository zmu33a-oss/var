import {
  handleOptions,
  listAdminReports,
  readAdminConfig,
  requireAdminSession,
  requireServerKey,
  sendJson,
} from "../admin-shared";

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
    const status = url.searchParams.get("status")?.trim() || "open";
    const limitParam = Number.parseInt(
      url.searchParams.get("limit") ?? "25",
      10,
    );
    const offsetParam = Number.parseInt(
      url.searchParams.get("offset") ?? "0",
      10,
    );

    const { reports, total, source, limit, offset } = await listAdminReports(
      config,
      {
        status,
        limit: Number.isFinite(limitParam) ? limitParam : 25,
        offset: Number.isFinite(offsetParam) ? offsetParam : 0,
      },
    );

    sendJson(response, 200, {
      ok: true,
      reports,
      total,
      source,
      limit,
      offset,
      status,
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
          ? "أضف APPWRITE_API_KEY لعرض البلاغات."
          : code === "MISSING_SESSION"
            ? "الجلسة منتهية، أعد تسجيل الدخول."
            : code === "NOT_ADMIN"
              ? "هذا الحساب ليس لديه صلاحية أدمن."
              : "تعذر تحميل البلاغات.",
      code,
    });
  }
}
