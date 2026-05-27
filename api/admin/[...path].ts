import { sendJson } from "../_lib/admin-shared";
import { handler as healthHandler } from "../_lib/admin-routes/health";
import { handler as loginHandler } from "../_lib/admin-routes/login";
import { handler as meHandler } from "../_lib/admin-routes/me";
import { handler as auditListHandler } from "../_lib/admin-routes/audit-list";
import { handler as postsListHandler } from "../_lib/admin-routes/posts-list";
import { handler as postsHideHandler } from "../_lib/admin-routes/posts-hide";
import { handler as postsDeleteHandler } from "../_lib/admin-routes/posts-delete";
import { handler as usersListHandler } from "../_lib/admin-routes/users-list";
import { handler as usersLookupHandler } from "../_lib/admin-routes/users-lookup";
import { handler as usersRoleHandler } from "../_lib/admin-routes/users-role";
import { handler as usersDeleteHandler } from "../_lib/admin-routes/users-delete";
import { handler as usersVerificationHandler } from "../_lib/admin-routes/users-verification";
import { handler as usersCardTierHandler } from "../_lib/admin-routes/users-card-tier";
import { handler as usersMigrateCardTiersHandler } from "../_lib/admin-routes/users-migrate-card-tiers";
import { handler as usersStatusHandler } from "../_lib/admin-routes/users-status";

type AdminHandler = (request: any, response: any) => Promise<void> | void;

const ROUTES: Record<string, AdminHandler> = {
  health: healthHandler,
  login: loginHandler,
  me: meHandler,
  "audit/list": auditListHandler,
  "posts/list": postsListHandler,
  "posts/hide": postsHideHandler,
  "posts/delete": postsDeleteHandler,
  "users/list": usersListHandler,
  "users/lookup": usersLookupHandler,
  "users/role": usersRoleHandler,
  "users/delete": usersDeleteHandler,
  "users/verification": usersVerificationHandler,
  "users/card-tier": usersCardTierHandler,
  "users/migrate-card-tiers": usersMigrateCardTiersHandler,
  "users/status": usersStatusHandler,
};

function normalizeRoute(request: any) {
  const pathValue = request.query?.path;

  if (pathValue !== undefined && pathValue !== null && pathValue !== "") {
    const segments = Array.isArray(pathValue)
      ? pathValue
      : String(pathValue).split("/");

    const joined = segments
      .map((segment) => String(segment).trim())
      .filter(Boolean)
      .join("/");

    if (joined) {
      return joined;
    }
  }

  const rawUrl = String(request.url ?? "");
  let pathname = rawUrl;

  try {
    pathname = rawUrl.includes("://")
      ? new URL(rawUrl).pathname
      : rawUrl.split("?")[0] || "";
  } catch {
    pathname = rawUrl.split("?")[0] || "";
  }

  const marker = "/api/admin/";

  if (pathname.includes(marker)) {
    return pathname
      .slice(pathname.indexOf(marker) + marker.length)
      .replace(/^\/+|\/+$/g, "");
  }

  if (pathname.endsWith("/api/admin")) {
    return "";
  }

  return "";
}

export default async function handler(request: any, response: any) {
  const route = normalizeRoute(request);
  const routeHandler = ROUTES[route];

  if (!routeHandler) {
    sendJson(response, 404, { ok: false, error: "المسار غير موجود." });
    return;
  }

  await routeHandler(request, response);
}
