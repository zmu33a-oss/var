const { spawn } = require("node:child_process");

const rawArgs = process.argv.slice(2);
const normalizedArgs = [];

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];
  const nextArg = rawArgs[index + 1];

  if (arg === "--host" && (!nextArg || nextArg.startsWith("-"))) {
    normalizedArgs.push("--host", "lan");
    continue;
  }

  normalizedArgs.push(arg);
}

const expoCliPath = require.resolve("expo/bin/cli");
const child = spawn(
  process.execPath,
  [expoCliPath, "start", "--web", ...normalizedArgs],
  {
    stdio: "inherit",
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
