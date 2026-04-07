import nextEnv from "@next/env";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const prismaCliPath = require.resolve("prisma/build/index.js");
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [prismaCliPath, ...args], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
