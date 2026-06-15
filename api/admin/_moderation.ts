import { sendJson } from "../_lib/admin-shared";
import { handler as reportsListHandler } from "../_lib/admin-routes/moderation-reports-list";
import { handler as reportsReviewHandler } from "../_lib/admin-routes/moderation-reports-review";
import { handler as flaggedPostsHandler } from "../_lib/admin-routes/moderation-flagged-posts";
import { handler as aiFlagHandler } from "../_lib/admin-routes/moderation-ai-flag";
import { handler as commentsListHandler } from "../_lib/admin-routes/moderation-comments-list";
import { handler as commentsHideHandler } from "../_lib/admin-routes/moderation-comments-hide";
import { handler as commentsDeleteHandler } from "../_lib/admin-routes/moderation-comments-delete";
import { handler as reportsDetailHandler } from "../_lib/admin-routes/moderation-reports-detail";
import { handler as aiSettingsHandler } from "../_lib/admin-routes/moderation-ai-settings";
import { handler as aiScanHandler } from "../_lib/admin-routes/moderation-ai-scan";

type AdminHandler = (request: any, response: any) => Promise<void> | void;

const ROUTES: Record<string, AdminHandler> = {
  reports: reportsListHandler,
  "reports-detail": reportsDetailHandler,
  review: reportsReviewHandler,
  "flagged-posts": flaggedPostsHandler,
  "ai-flag": aiFlagHandler,
  "ai-settings": aiSettingsHandler,
  "ai-scan": aiScanHandler,
  comments: commentsListHandler,
  "comments-hide": commentsHideHandler,
  "comments-delete": commentsDeleteHandler,
};

function readAction(request: any) {
  const rawAction = request.query?.action;
  if (typeof rawAction === "string" && rawAction.trim()) {
    return rawAction.trim();
  }

  try {
    const url = new URL(request.url ?? "http://localhost", "http://localhost");
    return url.searchParams.get("action")?.trim() || "reports";
  } catch {
    return "reports";
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
