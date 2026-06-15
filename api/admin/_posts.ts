import { sendJson } from "../_lib/admin-shared";
import { handler as postsListHandler } from "../_lib/admin-routes/posts-list";
import { handler as postsHideHandler } from "../_lib/admin-routes/posts-hide";
import { handler as postsDeleteHandler } from "../_lib/admin-routes/posts-delete";

type AdminHandler = (request: any, response: any) => Promise<void> | void;

const ROUTES: Record<string, AdminHandler> = {
  list: postsListHandler,
  hide: postsHideHandler,
  delete: postsDeleteHandler,
};

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
  const routeHandler = ROUTES[readAction(request)];

  if (!routeHandler) {
    sendJson(response, 404, { ok: false, error: "المسار غير موجود." });
    return;
  }

  await routeHandler(request, response);
}
