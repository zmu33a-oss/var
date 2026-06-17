const { Client, Databases } = require("node-appwrite");
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAttribute(databases, collectionId, key, attempts = 24) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const collection = await databases.getCollection(databaseId, collectionId);
    const attribute = collection.attributes.find((item) => item.key === key);

    if (attribute?.status === "available") {
      return;
    }

    await sleep(750);
  }

  throw new Error(`Attribute "${key}" did not become available in time.`);
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

  console.log(
    `Ensuring mediaUri on "${postsCollectionId}" in database ${databaseId}...`,
  );

  try {
    await databases.createStringAttribute(
      databaseId,
      postsCollectionId,
      "mediaUri",
      2048,
      false,
    );
    console.log("Created attribute mediaUri (String, 2048).");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.toLowerCase().includes("already exists")) {
      console.log("Attribute mediaUri already exists.");
    } else {
      throw error;
    }
  }

  try {
    await databases.createBooleanAttribute(
      databaseId,
      postsCollectionId,
      "fromVarLibrary",
      false,
      false,
    );
    console.log("Created attribute fromVarLibrary (Boolean).");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.toLowerCase().includes("already exists")) {
      console.log("Attribute fromVarLibrary already exists.");
    } else {
      throw error;
    }
  }

  await waitForAttribute(databases, postsCollectionId, "mediaUri");
  await waitForAttribute(databases, postsCollectionId, "fromVarLibrary");

  try {
    await databases.createStringAttribute(
      databaseId,
      postsCollectionId,
      "feedScope",
      16,
      false,
      "x",
    );
    console.log("Created attribute feedScope (String).");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.toLowerCase().includes("already exists")) {
      console.log("Attribute feedScope already exists.");
    } else {
      throw error;
    }
  }

  await waitForAttribute(databases, postsCollectionId, "feedScope");
  console.log("Post library fields are ready.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
