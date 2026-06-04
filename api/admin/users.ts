import { sendJson } from "../_lib/admin-shared.js";
import { handler as usersListHandler } from "../_lib/admin-routes/users-list.js";
import { handler as usersLookupHandler } from "../_lib/admin-routes/users-lookup.js";
import { handler as usersRoleHandler } from "../_lib/admin-routes/users-role.js";
import { handler as usersDeleteHandler } from "../_lib/admin-routes/users-delete.js";
import { handler as usersVerificationHandler } from "../_lib/admin-routes/users-verification.js";
import { handler as usersCardTierHandler } from "../_lib/admin-routes/users-card-tier.js";
import { handler as usersMigrateCardTiersHandler } from "../_lib/admin-routes/users-migrate-card-tiers.js";
import { handler as usersStatusHandler } from "../_lib/admin-routes/users-status.js";

type AdminHandler = (request: any, response: any) => Promise<void> | void;

const ROUTES: Record<string, AdminHandler> = {
  list: usersListHandler,
  lookup: usersLookupHandler,
  role: usersRoleHandler,
  delete: usersDeleteHandler,
  verification: usersVerificationHandler,
  "card-tier": usersCardTierHandler,
  "migrate-card-tiers": usersMigrateCardTiersHandler,
  status: usersStatusHandler,
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
