const { spawn } = require("node:child_process");
const path = require("node:path");

require("./sync-preview.cjs");

const previewDir =
  process.env.VAR_PREVIEW_DIR?.trim() || path.join("/tmp", "var-preview");
const rawArgs = process.argv.slice(2);
const normalizedArgs = [];
let hasHost = false;

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];
  const nextArg = rawArgs[index + 1];

  if (arg === "--host") {
    hasHost = true;

    if (!nextArg || nextArg.startsWith("-")) {
      normalizedArgs.push("--host", "localhost");
      continue;
    }
  }

  normalizedArgs.push(arg);
}

if (!hasHost) {
  normalizedArgs.push("--host", "localhost");
}

const expoCliPath = require.resolve("expo/bin/cli", {
  paths: [path.join(previewDir, "node_modules")],
});
const child = spawn(
  process.execPath,
  [expoCliPath, "start", "--web", "--clear", ...normalizedArgs],
  {
    stdio: "inherit",
    cwd: previewDir,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
