const { execSync } = require("node:child_process");
const path = require("node:path");

require("./load-env.cjs");
require("./ensure-dist-placeholder.cjs");

const rootDir = path.resolve(__dirname, "..");

console.log("Building admin static files...");
execSync("node scripts/admin-build.cjs", {
  cwd: rootDir,
  stdio: "inherit",
});

console.log("");
console.log("Admin local preview:");
console.log("  UI:  http://localhost:3000/admin/");
console.log("  API: http://localhost:3000/api/admin/*");
console.log(
  "  APPWRITE_API_KEY:",
  process.env.APPWRITE_API_KEY ? "loaded" : "missing",
);
console.log("");

execSync("npx vercel dev --listen 0.0.0.0:3000 --yes", {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env,
});
