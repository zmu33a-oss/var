const { Client, Databases, Permission, Role, IndexType } = require("node-appwrite");
const { loadEnvFile } = require("./load-env.cjs");

const rootDir = require("node:path").resolve(__dirname, "..");
loadEnvFile(require("node:path").join(rootDir, ".env"));
loadEnvFile(require("node:path").join(rootDir, ".env.local"));

const endpoint =
  process.env.APPWRITE_ENDPOINT?.trim() ||
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT?.trim() ||
  "https://fra.cloud.appwrite.io/v1";
const projectId =
  process.env.APPWRITE_PROJECT_ID?.trim() ||
  process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID?.trim() ||
  "";
const databaseId =
  process.env.APPWRITE_DATABASE_ID?.trim() ||
  process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID?.trim() ||
  "";
const apiKey = process.env.APPWRITE_API_KEY?.trim() || "";
const reportsCollectionId =
  process.env.APPWRITE_REPORTS_COLLECTION_ID?.trim() ||
  process.env.EXPO_PUBLIC_APPWRITE_REPORTS_COLLECTION_ID?.trim() ||
  "reports";
const auditCollectionId =
  process.env.APPWRITE_AUDIT_COLLECTION_ID?.trim() ||
  process.env.EXPO_PUBLIC_APPWRITE_AUDIT_COLLECTION_ID?.trim() ||
  "admin_audit";
const adminKeysCollectionId =
  process.env.APPWRITE_ADMIN_KEYS_COLLECTION_ID?.trim() ||
  process.env.EXPO_PUBLIC_APPWRITE_ADMIN_KEYS_COLLECTION_ID?.trim() ||
  "admin_keys";
const appSettingsCollectionId =
  process.env.APPWRITE_APP_SETTINGS_COLLECTION_ID?.trim() ||
  process.env.EXPO_PUBLIC_APPWRITE_APP_SETTINGS_COLLECTION_ID?.trim() ||
  "app_settings";
const APP_SETTINGS_DOCUMENT_ID = "global";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAttributes(databases, collectionId, keys, attempts = 20) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const collection = await databases.getCollection(databaseId, collectionId);
      const ready = keys.every((key) =>
        collection.attributes.some(
          (attribute) => attribute.key === key && attribute.status === "available",
        ),
      );
      if (ready) return;
    } catch {
      // keep polling
    }
    await sleep(750);
  }
}

async function collectionExists(databases, collectionId) {
  try {
    await databases.getCollection(databaseId, collectionId);
    return true;
  } catch {
    return false;
  }
}

async function ensureStringAttribute(
  databases,
  collectionId,
  key,
  size,
  required = false,
) {
  try {
    await databases.createStringAttribute(
      databaseId,
      collectionId,
      key,
      size,
      required,
    );
    console.log(`  + attribute ${key}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("already exists")) {
      console.log(`  = attribute ${key} (exists)`);
      return;
    }
    throw error;
  }
}

async function ensureReportsCollection(databases) {
  const collectionId = reportsCollectionId;
  const exists = await collectionExists(databases, collectionId);

  if (!exists) {
    console.log(`Creating collection "${collectionId}"...`);
    await databases.createCollection(
      databaseId,
      collectionId,
      "Reports",
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false,
      true,
    );
  } else {
    console.log(`Collection "${collectionId}" already exists.`);
  }

  const attributeKeys = [
    "postId",
    "postVarId",
    "reporterVarId",
    "contentPreview",
    "reason",
    "status",
    "source",
    "aiScore",
    "aiFlags",
  ];

  await ensureStringAttribute(databases, collectionId, "postId", 128, true);
  await ensureStringAttribute(databases, collectionId, "postVarId", 64, false);
  await ensureStringAttribute(databases, collectionId, "reporterVarId", 64, false);
  await ensureStringAttribute(databases, collectionId, "contentPreview", 500, false);
  await ensureStringAttribute(databases, collectionId, "reason", 128, false);
  await ensureStringAttribute(databases, collectionId, "status", 32, false);
  await ensureStringAttribute(databases, collectionId, "source", 32, false);
  await ensureStringAttribute(databases, collectionId, "aiScore", 16, false);
  await ensureStringAttribute(databases, collectionId, "aiFlags", 256, false);

  await waitForAttributes(databases, collectionId, attributeKeys);

  try {
    await databases.createIndex(
      databaseId,
      collectionId,
      "status_created",
      IndexType.Key,
      ["status"],
      ["ASC"],
    );
    console.log("  + index status");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("already exists")) {
      console.log(`  ! index status skipped: ${message}`);
    }
  }
}

async function ensureAuditCollection(databases) {
  const collectionId = auditCollectionId;
  const exists = await collectionExists(databases, collectionId);

  if (!exists) {
    console.log(`Creating collection "${collectionId}"...`);
    await databases.createCollection(
      databaseId,
      collectionId,
      "Admin Audit",
      [Permission.read(Role.any())],
      false,
      true,
    );
  } else {
    console.log(`Collection "${collectionId}" already exists.`);
  }

  const attributeKeys = [
    "action",
    "targetId",
    "adminId",
    "adminEmail",
    "details",
  ];

  await ensureStringAttribute(databases, collectionId, "action", 64, true);
  await ensureStringAttribute(databases, collectionId, "targetId", 128, false);
  await ensureStringAttribute(databases, collectionId, "adminId", 64, false);
  await ensureStringAttribute(databases, collectionId, "adminEmail", 128, false);
  await ensureStringAttribute(databases, collectionId, "details", 512, false);

  await waitForAttributes(databases, collectionId, attributeKeys);
}

async function ensureAdminKeysCollection(databases) {
  const collectionId = adminKeysCollectionId;
  const exists = await collectionExists(databases, collectionId);

  if (!exists) {
    console.log(`Creating collection "${collectionId}"...`);
    await databases.createCollection(
      databaseId,
      collectionId,
      "Admin Keys",
      [],
      false,
      true,
    );
  } else {
    console.log(`Collection "${collectionId}" already exists.`);
  }

  const attributeKeys = [
    "label",
    "role",
    "keyHash",
    "keyPreview",
    "status",
    "expiresAt",
    "expiryLabel",
    "createdByAdminId",
    "createdByEmail",
  ];

  await ensureStringAttribute(databases, collectionId, "label", 128, true);
  await ensureStringAttribute(databases, collectionId, "role", 32, true);
  await ensureStringAttribute(databases, collectionId, "keyHash", 64, true);
  await ensureStringAttribute(databases, collectionId, "keyPreview", 32, true);
  await ensureStringAttribute(databases, collectionId, "status", 16, true);
  await ensureStringAttribute(databases, collectionId, "expiresAt", 40, false);
  await ensureStringAttribute(databases, collectionId, "expiryLabel", 64, false);
  await ensureStringAttribute(databases, collectionId, "createdByAdminId", 64, false);
  await ensureStringAttribute(databases, collectionId, "createdByEmail", 128, false);

  await waitForAttributes(databases, collectionId, attributeKeys);

  try {
    await databases.createIndex(
      databaseId,
      collectionId,
      "key_hash_unique",
      IndexType.Unique,
      ["keyHash"],
      ["ASC"],
    );
    console.log("  + index keyHash");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("already exists")) {
      console.log(`  ! index keyHash skipped: ${message}`);
    }
  }
}

async function ensureAppSettingsCollection(databases) {
  const collectionId = appSettingsCollectionId;
  const exists = await collectionExists(databases, collectionId);

  if (!exists) {
    console.log(`Creating collection "${collectionId}"...`);
    await databases.createCollection(
      databaseId,
      collectionId,
      "App Settings",
      [],
      false,
      true,
    );
  } else {
    console.log(`Collection "${collectionId}" already exists.`);
  }

  const attributeKeys = [
    "uiMode",
    "richIconsEnabled",
    "gpuAccelerationEnabled",
    "updatedAt",
    "updatedByAdminId",
    "updatedByEmail",
  ];

  await ensureStringAttribute(databases, collectionId, "uiMode", 16, true);
  await ensureStringAttribute(
    databases,
    collectionId,
    "richIconsEnabled",
    8,
    false,
  );
  await ensureStringAttribute(
    databases,
    collectionId,
    "gpuAccelerationEnabled",
    8,
    false,
  );
  await ensureStringAttribute(databases, collectionId, "updatedAt", 40, false);
  await ensureStringAttribute(
    databases,
    collectionId,
    "updatedByAdminId",
    64,
    false,
  );
  await ensureStringAttribute(
    databases,
    collectionId,
    "updatedByEmail",
    128,
    false,
  );

  await waitForAttributes(databases, collectionId, attributeKeys);

  try {
    await databases.getDocument(
      databaseId,
      collectionId,
      APP_SETTINGS_DOCUMENT_ID,
    );
    console.log(`  = document ${APP_SETTINGS_DOCUMENT_ID} (exists)`);
  } catch {
    await databases.createDocument(
      databaseId,
      collectionId,
      APP_SETTINGS_DOCUMENT_ID,
      {
        uiMode: "tiktok",
        richIconsEnabled: "true",
        gpuAccelerationEnabled: "true",
        updatedAt: new Date().toISOString(),
        updatedByAdminId: "",
        updatedByEmail: "",
      },
    );
    console.log(`  + document ${APP_SETTINGS_DOCUMENT_ID}`);
  }
}

async function verifyCollection(databases, collectionId) {
  const response = await databases.listDocuments(databaseId, collectionId, []);
  console.log(`OK ${collectionId}: ${response.total} documents`);
}

async function main() {
  if (!projectId || !databaseId || !apiKey) {
    throw new Error(
      "Missing APPWRITE_API_KEY, project ID, or database ID in .env.local",
    );
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  const databases = new Databases(client);

  console.log("Setting up admin collections...");
  await ensureReportsCollection(databases);
  await ensureAuditCollection(databases);
  await ensureAdminKeysCollection(databases);
  await ensureAppSettingsCollection(databases);

  console.log("Verifying access...");
  await verifyCollection(databases, reportsCollectionId);
  await verifyCollection(databases, auditCollectionId);
  await verifyCollection(databases, adminKeysCollectionId);
  await verifyCollection(databases, appSettingsCollectionId);

  console.log("Done. Refresh the admin dashboard health card.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
