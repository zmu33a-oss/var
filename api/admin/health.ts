import {
  handleOptions,
  readAdminConfig,
  sendJson,
} from "../_lib/admin-shared";

export default async function handler(request: any, response: any) {
  if (handleOptions(request, response)) {
    return;
  }

  const config = readAdminConfig();
  const missing: string[] = [];

  if (!config.projectId) missing.push("APPWRITE_PROJECT_ID");
  if (!config.databaseId) missing.push("APPWRITE_DATABASE_ID");
  if (!config.apiKey) missing.push("APPWRITE_API_KEY");

  sendJson(response, 200, {
    ok: missing.length === 0,
    phase: "connected",
    missing,
    projectId: config.projectId || null,
    databaseId: config.databaseId || null,
    profilesCollectionId: config.profilesCollectionId,
    postsCollectionId: config.postsCollectionId,
    auditCollectionId: config.auditCollectionId,
    adminEmailConfigured: Boolean(config.adminEmail),
    writesEnabled: Boolean(config.apiKey),
  });
}
