import { promises as fs } from "fs";

const sourceDir = "node_modules/@novorender/api/public";
const destDir = "static/novorender/api";

await fs.cp(sourceDir, destDir, { recursive: true });