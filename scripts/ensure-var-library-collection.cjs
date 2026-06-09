const { Client, Databases, Permission, Role } = require("node-appwrite");
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
const collectionId =
  process.env.APPWRITE_VAR_LIBRARY_COLLECTION_ID?.trim() ||
  process.env.EXPO_PUBLIC_APPWRITE_VAR_LIBRARY_COLLECTION_ID?.trim() ||
  "var_library";
const apiKey = process.env.APPWRITE_API_KEY?.trim() || "";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAttributes(databases, keys, attempts = 24) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const collection = await databases.getCollection(databaseId, collectionId);
    const ready = keys.every((key) =>
      collection.attributes.some(
        (attribute) => attribute.key === key && attribute.status === "available",
      ),
    );

    if (ready) {
      return;
    }

    await sleep(750);
  }

  throw new Error("Attributes did not become available in time.");
}

async function ensureStringAttribute(databases, key, size, required = false) {
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

async function ensureBooleanAttribute(databases, key, required = false) {
  try {
    await databases.createBooleanAttribute(
      databaseId,
      collectionId,
      key,
      required,
      true,
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

async function main() {
  if (!projectId || !databaseId || !apiKey) {
    throw new Error(
      "Missing APPWRITE_API_KEY, EXPO_PUBLIC_APPWRITE_PROJECT_ID, or EXPO_PUBLIC_APPWRITE_DATABASE_ID.",
    );
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  const databases = new Databases(client);

  let exists = true;

  try {
    await databases.getCollection(databaseId, collectionId);
    console.log(`Collection "${collectionId}" already exists.`);
  } catch {
    exists = false;
  }

  if (!exists) {
    console.log(`Creating collection "${collectionId}"...`);
    await databases.createCollection(
      databaseId,
      collectionId,
      "VAR Library",
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false,
      true,
    );
  }

  await ensureStringAttribute(databases, "name", 128, true);
  await ensureStringAttribute(databases, "club", 64, true);
  await ensureStringAttribute(databases, "position", 64, false);
  await ensureStringAttribute(databases, "imageUri", 2048, true);
  await ensureStringAttribute(databases, "createdByVarId", 64, false);
  await ensureBooleanAttribute(databases, "active", false);

  await waitForAttributes(databases, [
    "name",
    "club",
    "position",
    "imageUri",
    "createdByVarId",
    "active",
  ]);

  console.log(
    `var_library is ready. Add to .env.local:\nEXPO_PUBLIC_APPWRITE_VAR_LIBRARY_COLLECTION_ID=${collectionId}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
