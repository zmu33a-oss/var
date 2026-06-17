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
const postsCollectionId =
  process.env.APPWRITE_POSTS_COLLECTION_ID?.trim() ||
  process.env.EXPO_PUBLIC_APPWRITE_POSTS_COLLECTION_ID?.trim() ||
  "posts";
const apiKey = process.env.APPWRITE_API_KEY?.trim() || "";

function mergePermissions(existing, required) {
  const seen = new Set(existing);
  const merged = [...existing];

  for (const permission of required) {
    if (!seen.has(permission)) {
      seen.add(permission);
      merged.push(permission);
    }
  }

  return merged;
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

  const collection = await databases.getCollection(databaseId, postsCollectionId);
  const requiredDelete = Permission.delete(Role.users());
  const nextPermissions = mergePermissions(collection.$permissions || [], [
    requiredDelete,
  ]);

  if (nextPermissions.length === (collection.$permissions || []).length) {
    console.log(`Collection "${postsCollectionId}" already allows user delete.`);
    return;
  }

  await databases.updateCollection(
    databaseId,
    postsCollectionId,
    collection.name,
    nextPermissions,
    collection.documentSecurity,
    collection.enabled,
  );

  console.log(
    `Updated "${postsCollectionId}" permissions: authenticated users can delete posts.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
