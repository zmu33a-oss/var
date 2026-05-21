const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const adminDistDir = path.join(rootDir, "admin-web", "dist");
const appDistDir = path.join(rootDir, "dist");
const adminTargetDir = path.join(appDistDir, "admin");

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

console.log("Building WEBPLUS web app...");
execSync("npx expo export --platform web", {
  cwd: rootDir,
  stdio: "inherit",
});

console.log("Building VAR admin web app...");
execSync("npm run build", {
  cwd: path.join(rootDir, "admin-web"),
  stdio: "inherit",
});

if (!fs.existsSync(adminDistDir)) {
  throw new Error("admin-web build output was not found.");
}

console.log("Copying admin bundle into dist/admin...");
if (fs.existsSync(adminTargetDir)) {
  fs.rmSync(adminTargetDir, { recursive: true, force: true });
}

copyDirectory(adminDistDir, adminTargetDir);
console.log("Vercel build completed.");
