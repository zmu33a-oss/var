import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const app = require("../src/server.cjs");

export default app;
