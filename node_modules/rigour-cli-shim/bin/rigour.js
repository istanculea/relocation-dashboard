#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const command = args[0];

if (command !== "init") {
  console.error("Local rigour shim only supports `npx rigour init`.");
  process.exit(1);
}

const cwd = process.cwd();
const rigourDir = path.join(cwd, ".rigour");
const eventsFile = path.join(rigourDir, "events.jsonl");

fs.mkdirSync(rigourDir, { recursive: true });

if (!fs.existsSync(eventsFile)) {
  fs.writeFileSync(eventsFile, "", "utf8");
}

console.log(`Rigour initialized in ${cwd}`);