import { promises as fs } from "fs";

const sourceDir = "node_modules/@novorender/api/public";
const destDir = "public/";

await fs.cp(sourceDir, destDir, { recursive: true });