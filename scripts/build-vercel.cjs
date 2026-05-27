const { execSync } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

console.log("Building WEBPLUS web app...");
execSync("npx expo export --platform web", {
  cwd: rootDir,
  stdio: "inherit",
});

console.log("Copying static admin page...");
execSync("node scripts/admin-build.cjs", {
  cwd: rootDir,
  stdio: "inherit",
});

console.log("Vercel build completed.");
