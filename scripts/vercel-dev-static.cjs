const { spawn, execSync } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

execSync("node scripts/ensure-dist-placeholder.cjs", {
  cwd: rootDir,
  stdio: "inherit",
});
execSync("node scripts/admin-build.cjs", {
  cwd: rootDir,
  stdio: "inherit",
});
const port = String(process.env.PORT || "3000").trim();

const child = spawn(
  "npx",
  ["serve", "dist", "-l", port, "--no-clipboard"],
  {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
  },
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
