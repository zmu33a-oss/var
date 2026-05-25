const { execSync } = require("node:child_process");
const path = require("node:path");

require("./load-env.cjs");

const rootDir = path.resolve(__dirname, "..");

console.log("Preparing local admin files...");
execSync("node scripts/admin-build.cjs", {
  cwd: rootDir,
  stdio: "inherit",
});
require("./ensure-dist-placeholder.cjs");

console.log(
  "APPWRITE_API_KEY:",
  process.env.APPWRITE_API_KEY ? "loaded" : "missing",
);

execSync("npx vercel dev --listen 3000 --yes", {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env,
});
