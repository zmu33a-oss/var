import { sendJson } from "../_lib/admin-shared.js";
import { handler as settingsGetHandler } from "../_lib/admin-routes/settings-get.js";
import { handler as settingsUpdateHandler } from "../_lib/admin-routes/settings-update.js";

function readAction(request: any) {
  const rawAction = request.query?.action;
  if (typeof rawAction === "string" && rawAction.trim()) {
    return rawAction.trim();
  }

  try {
    const url = new URL(request.url ?? "http://localhost", "http://localhost");
    return url.searchParams.get("action")?.trim() || "get";
  } catch {
    return "get";
  }
}

export default async function handler(request: any, response: any) {
  const action = readAction(request);

  switch (action) {
    case "get":
      await settingsGetHandler(request, response);
      return;
    case "update":
      await settingsUpdateHandler(request, response);
      return;
    default:
      sendJson(response, 404, { ok: false, error: "المسار غير موجود." });
  }
}
