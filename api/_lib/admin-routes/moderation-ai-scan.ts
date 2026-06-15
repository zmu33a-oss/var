import { Databases, Query } from "node-appwrite";
import {
  analyzeTextForModeration,
  readAiModerationSettings,
} from "../ai-moderation.js";
import {
  createServerClient,
  flagAdminPostForModeration,
  handleOptions,
  readAdminConfig,
  readJsonBody,
  readPostHidden,
  readPostModerationMeta,
  requireAdminSession,
  requireServerKey,
  sendJson,
  updatePostVisibility,
  writeAdminAuditLog,
} from "../admin-shared";

type ScanResultItem = {
  postId: string;
  score: number;
  flags: string[];
  flagged: boolean;
  autoHidden: boolean;
  skipped: boolean;
};

export async function handler(request: any, response: any) {
  if (handleOptions(request, response)) {
    return;
  }

  if ((request.method ?? "POST") !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const config = readAdminConfig();
  const settings = readAiModerationSettings();

  try {
    const admin = await requireAdminSession(request, config);
    requireServerKey(config);

    if (!settings.enabled) {
      sendJson(response, 503, {
        ok: false,
        error: "AI moderation معطّل. اضبط AI_MODERATION_ENABLED=true.",
      });
      return;
    }

    const body = readJsonBody(request);
    const limitParam = Number.parseInt(String(body.limit ?? "25"), 10);
    const limit = Math.min(
      Math.max(Number.isFinite(limitParam) ? limitParam : 25, 1),
      50,
    );
    const skipFlagged = body.skipFlagged !== false;

    const databases = new Databases(createServerClient(config));
    const responseDocuments = await databases.listDocuments(
      config.databaseId,
      config.postsCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(limit)],
    );

    const results: ScanResultItem[] = [];
    let flaggedCount = 0;
    let autoHiddenCount = 0;

    for (const document of responseDocuments.documents) {
      const postId = document.$id;
      const title = typeof document.title === "string" ? document.title : "";
      const content =
        typeof document.content === "string" ? document.content : "";
      const moderation = readPostModerationMeta(
        document as unknown as Record<string, unknown>,
      );

      if (
        skipFlagged &&
        (moderation.moderationStatus === "flagged" || moderation.aiScore >= settings.threshold)
      ) {
        results.push({
          postId,
          score: moderation.aiScore,
          flags: moderation.aiFlags ? moderation.aiFlags.split(",") : [],
          flagged: false,
          autoHidden: false,
          skipped: true,
        });
        continue;
      }

      const analysis = analyzeTextForModeration(
        `${title}\n${content}`.trim(),
        settings,
      );

      if (!analysis.shouldFlag) {
        results.push({
          postId,
          score: analysis.score,
          flags: analysis.flags,
          flagged: false,
          autoHidden: false,
          skipped: false,
        });
        continue;
      }

      await flagAdminPostForModeration(config, {
        postId,
        aiScore: analysis.score,
        aiFlags: analysis.flags.join(",") || "ai_auto",
        moderationStatus: "flagged",
      });

      let autoHidden = false;
      if (analysis.shouldAutoHide && !readPostHidden(document as unknown as Record<string, unknown>)) {
        await updatePostVisibility(config, postId, true);
        autoHidden = true;
        autoHiddenCount += 1;
      }

      await writeAdminAuditLog(config, {
        action: "ai_flag_post",
        targetId: postId,
        admin,
        details: `فحص تلقائي · score ${analysis.score} · ${analysis.flags.join(",")}`,
      });

      flaggedCount += 1;
      results.push({
        postId,
        score: analysis.score,
        flags: analysis.flags,
        flagged: true,
        autoHidden,
        skipped: false,
      });
    }

    sendJson(response, 200, {
      ok: true,
      scanned: responseDocuments.documents.length,
      flagged: flaggedCount,
      autoHidden: autoHiddenCount,
      threshold: settings.threshold,
      results,
      by: admin.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    sendJson(response, message === "MISSING_API_KEY" ? 503 : 500, {
      ok: false,
      error: "تعذر تشغيل فحص AI.",
      code: message,
    });
  }
}
