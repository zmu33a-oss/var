require("./load-env.cjs");

const { Client, Databases, Query } = require("node-appwrite");

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const key = process.env.APPWRITE_API_KEY;
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const profilesCollectionId =
  process.env.EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID;

async function main() {
  console.log("profilesCollectionId:", profilesCollectionId || "(missing)");
  console.log("apiKey loaded:", Boolean(key));

  if (!endpoint || !project || !key || !databaseId || !profilesCollectionId) {
    console.log("Missing config — check .env");
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(project)
    .setKey(key);
  const databases = new Databases(client);

  const collection = await databases.getCollection(
    databaseId,
    profilesCollectionId,
  );
  const cardTierAttr = (collection.attributes || []).find(
    (attr) => attr.key === "cardTier",
  );

  console.log(
    "cardTier attribute:",
    cardTierAttr
      ? {
          key: cardTierAttr.key,
          type: cardTierAttr.type,
          array: cardTierAttr.array,
          required: cardTierAttr.required,
          status: cardTierAttr.status,
        }
      : "NOT FOUND",
  );

  const list = await databases.listDocuments(databaseId, profilesCollectionId, [
    Query.limit(1),
  ]);

  if (!list.documents[0]) {
    console.log("No profile documents found.");
    return;
  }

  const doc = list.documents[0];
  console.log("sample document:", doc.$id);
  console.log("current cardTier value:", doc.cardTier);
  console.log("value is array:", Array.isArray(doc.cardTier));

  try {
    const role =
      typeof doc.role === "string" && doc.role.trim() ? doc.role.trim() : "member";
    const admin =
      typeof doc.admin === "string" && doc.admin.trim()
        ? doc.admin.trim()
        : role === "admin"
          ? "VAR"
          : "MEMBER";
    const payload = {
      role,
      admin,
      cardTier: "platinum",
    };

    if (typeof doc.username === "string" && doc.username.trim()) {
      payload.username = doc.username.trim();
    }

    const updated = await databases.updateDocument(
      databaseId,
      profilesCollectionId,
      doc.$id,
      payload,
    );
    console.log("UPDATE OK ->", updated.cardTier, "admin ->", updated.admin);
  } catch (error) {
    console.log("UPDATE FAIL:");
    console.log("  type:", error.type);
    console.log("  code:", error.code);
    console.log("  message:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
