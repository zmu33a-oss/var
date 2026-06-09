import { Databases } from "node-appwrite";
import {
  analyzeTextForModeration,
  readAiModerationSettings,
  verifyAiWebhookSecret,
} from "./_lib/ai-moderation.js";
import {
  createServerClient,
  flagAdminPostForModeration,
  handleOptions,
  readAdminConfig,
  readJsonBody,
  readPostHidden,
  requireServerKey,
  sendJson,
  updatePostVisibility,
} from "./_lib/admin-shared.js";

export default async function handler(request: any, response: any) {
  if (handleOptions(request, response)) {
    return;
  }

  if ((request.method ?? "POST") !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  if (!verifyAiWebhookSecret(request)) {
    sendJson(response, 401, {
      ok: false,
      error: "Webhook secret غير صالح.",
    });
    return;
  }

  const config = readAdminConfig();
  const settings = readAiModerationSettings();

  try {
    requireServerKey(config);

    if (!settings.enabled) {
      sendJson(response, 200, {
        ok: true,
        skipped: true,
        reason: "AI moderation disabled",
      });
      return;
    }

    const body = readJsonBody(request);
    const postId =
      (typeof body.postId === "string" && body.postId.trim()) ||
      (typeof body.$id === "string" && body.$id.trim()) ||
      (typeof body.id === "string" && body.id.trim()) ||
      "";

    let title = typeof body.title === "string" ? body.title : "";
    let content = typeof body.content === "string" ? body.content : "";

    if (postId && config.databaseId && config.postsCollectionId && (!title && !content)) {
      const databases = new Databases(createServerClient(config));
      try {
        const document = await databases.getDocument(
          config.databaseId,
          config.postsCollectionId,
          postId,
        );
        title = typeof document.title === "string" ? document.title : title;
        content =
          typeof document.content === "string" ? document.content : content;
      } catch {
        // use body only
      }
    }

    if (!postId) {
      sendJson(response, 400, {
        ok: false,
        error: "postId مطلوب في webhook.",
      });
      return;
    }

    const analysis = analyzeTextForModeration(
      `${title}\n${content}`.trim(),
      settings,
    );

    if (!analysis.shouldFlag) {
      sendJson(response, 200, {
        ok: true,
        postId,
        flagged: false,
        score: analysis.score,
        flags: analysis.flags,
      });
      return;
    }

    await flagAdminPostForModeration(config, {
      postId,
      aiScore: analysis.score,
      aiFlags: analysis.flags.join(",") || "ai_webhook",
      moderationStatus: "flagged",
    });

    let autoHidden = false;
    if (analysis.shouldAutoHide) {
      try {
        const databases = new Databases(createServerClient(config));
        const document = await databases.getDocument(
          config.databaseId,
          config.postsCollectionId,
          postId,
        );
        if (!readPostHidden(document as unknown as Record<string, unknown>)) {
          await updatePostVisibility(config, postId, true);
          autoHidden = true;
        }
      } catch {
        // ignore hide failure
      }
    }

    sendJson(response, 200, {
      ok: true,
      postId,
      flagged: true,
      autoHidden,
      score: analysis.score,
      flags: analysis.flags,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    sendJson(response, message === "MISSING_API_KEY" ? 503 : 500, {
      ok: false,
      error: "تعذر معالجة webhook.",
      code: message,
    });
  }
}
