import {
  handleOptions,
  listAdminAuditLogs,
  readAdminConfig,
  requireAdminSession,
  requireServerKey,
  sendJson,
} from "../../_lib/admin-shared";

export default async function handler(request: any, response: any) {
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

    const logs = await listAdminAuditLogs(config, 50);

    sendJson(response, 200, {
      ok: true,
      logs,
      collectionId: config.auditCollectionId,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    sendJson(response, code === "MISSING_API_KEY" ? 503 : 500, {
      ok: false,
      error: "تعذر تحميل سجل العمليات.",
      code,
    });
  }
}
