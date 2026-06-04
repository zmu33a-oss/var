import { sendJson } from "../_lib/admin-shared.js";
import { handler as auditListHandler } from "../_lib/admin-routes/audit-list.js";

function readAction(request: any) {
  const rawAction = request.query?.action;
  if (typeof rawAction === "string" && rawAction.trim()) {
    return rawAction.trim();
  }

  try {
    const url = new URL(request.url ?? "http://localhost", "http://localhost");
    return url.searchParams.get("action")?.trim() || "list";
  } catch {
    return "list";
  }
}

export default async function handler(request: any, response: any) {
  const action = readAction(request);

  if (action !== "list") {
    sendJson(response, 404, { ok: false, error: "المسار غير موجود." });
    return;
  }

  await auditListHandler(request, response);
}
