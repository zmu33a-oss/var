import {
  getAdminReportDetails,
  handleOptions,
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
    const reportId = url.searchParams.get("reportId")?.trim() ?? "";
    const legacy = url.searchParams.get("legacy") === "1";

    if (!reportId) {
      sendJson(response, 400, { ok: false, error: "معرّف البلاغ مطلوب." });
      return;
    }

    const details = await getAdminReportDetails(config, { reportId, legacy });

    sendJson(response, 200, {
      ok: true,
      ...details,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status =
      code === "MISSING_SESSION"
        ? 401
        : code === "NOT_ADMIN"
          ? 403
          : code === "REPORT_NOT_FOUND"
            ? 404
            : code === "MISSING_API_KEY"
              ? 503
              : 500;

    sendJson(response, status, {
      ok: false,
      error:
        code === "REPORT_NOT_FOUND"
          ? "لم يتم العثور على البلاغ."
          : "تعذر تحميل تفاصيل البلاغ.",
      code,
    });
  }
}
