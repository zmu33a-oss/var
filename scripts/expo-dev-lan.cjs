const { spawn } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");

const VIRTUAL_INTERFACE_PATTERN =
  /(vEthernet|WSL|Hyper-V|VirtualBox|VMware|Loopback|Teredo|isatap|Npcap)/i;

function isPrivateLanAddress(address) {
  return (
    address.startsWith("192.168.") ||
    address.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(address)
  );
}

function isVirtualLanAddress(address) {
  return address.startsWith("172.23.") || address.startsWith("169.254.");
}

function isIpv4(entry) {
  return entry.family === "IPv4" || entry.family === 4;
}

function resolveLanIp() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const [interfaceName, entries] of Object.entries(nets)) {
    if (VIRTUAL_INTERFACE_PATTERN.test(interfaceName)) {
      continue;
    }

    for (const entry of entries || []) {
      if (!isIpv4(entry) || entry.internal || !isPrivateLanAddress(entry.address)) {
        continue;
      }

      if (isVirtualLanAddress(entry.address)) {
        continue;
      }

      candidates.push({
        interfaceName,
        address: entry.address,
        score:
          (interfaceName.toLowerCase().includes("wi-fi") ? 100 : 0) +
          (interfaceName.toLowerCase().includes("wlan") ? 100 : 0) +
          (entry.address.startsWith("192.168.") ? 50 : 0) +
          (entry.address.startsWith("10.") ? 20 : 0),
      });
    }
  }

  candidates.sort((left, right) => right.score - left.score);

  return candidates[0]?.address || "";
}

const rootDir = path.resolve(__dirname, "..");
const lanIp = resolveLanIp();
const port = String(process.env.EXPO_WEB_PORT || "8081").trim();

if (!lanIp) {
  console.error("Could not detect a LAN IPv4 address.");
  process.exit(1);
}

console.log("");
console.log("Expo web (LAN)");
console.log(`  PC:     http://localhost:${port}`);
console.log(`  Mobile: http://${lanIp}:${port}`);
console.log("  Admin:  http://localhost:3000/admin/  (run npm run admin:dev in another terminal)");
console.log("  Both:   npm run dev:stack");
console.log("  Same Wi-Fi required on phone and PC.");
console.log("");

const child = spawn(
  process.execPath,
  [
    require.resolve("expo/bin/cli"),
    "start",
    "--web",
    "--port",
    port,
    "--host",
    "lan",
  ],
  {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...process.env,
      REACT_NATIVE_PACKAGER_HOSTNAME: lanIp,
      EXPO_DEV_SERVER_LISTEN_ADDRESS: "0.0.0.0",
    },
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
