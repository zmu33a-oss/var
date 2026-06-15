import {
  handleOptions,
  listAdminComments,
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
    const limitParam = Number.parseInt(
      url.searchParams.get("limit") ?? "50",
      10,
    );

    const { comments, total, source } = await listAdminComments(config, {
      limit: Number.isFinite(limitParam) ? limitParam : 50,
    });

    sendJson(response, 200, {
      ok: true,
      comments,
      total,
      source,
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
          ? "أضف APPWRITE_API_KEY لقراءة التعليقات."
          : "تعذر تحميل التعليقات.",
      code,
    });
  }
}
