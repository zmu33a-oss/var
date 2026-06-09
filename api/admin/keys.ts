import { sendJson } from "../_lib/admin-shared.js";
import { handler as keysListHandler } from "../_lib/admin-routes/keys-list.js";
import { handler as keysCreateHandler } from "../_lib/admin-routes/keys-create.js";
import { handler as keysRevokeHandler } from "../_lib/admin-routes/keys-revoke.js";
import { handler as keysDeleteHandler } from "../_lib/admin-routes/keys-delete.js";

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

  switch (action) {
    case "list":
      await keysListHandler(request, response);
      return;
    case "create":
      await keysCreateHandler(request, response);
      return;
    case "revoke":
      await keysRevokeHandler(request, response);
      return;
    case "delete":
      await keysDeleteHandler(request, response);
      return;
    default:
      sendJson(response, 404, { ok: false, error: "المسار غير موجود." });
  }
}
