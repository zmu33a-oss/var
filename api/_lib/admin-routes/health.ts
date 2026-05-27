import {
  handleOptions,
  readAdminConfig,
  sendJson,
} from "../admin-shared";

export async function handler(request: any, response: any) {
  if (handleOptions(request, response)) {
    return;
  }

  if ((request.method ?? "GET") !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const config = readAdminConfig();
  const missing: string[] = [];

  if (!config.projectId) {
    missing.push("projectId");
  }

  if (!config.databaseId) {
    missing.push("databaseId");
  }

  if (!config.profilesCollectionId) {
    missing.push("profilesCollectionId");
  }

  if (!config.apiKey) {
    missing.push("apiKey");
  }

  sendJson(response, 200, {
    ok: true,
    writesEnabled: missing.length === 0,
    missing,
  });
}
