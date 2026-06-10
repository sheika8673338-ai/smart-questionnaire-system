import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceDir = path.join(root, "shared");
const targetDir = path.join(root, "cloudfunctions", "submissions", "shared");

await mkdir(targetDir, { recursive: true });

const files = await readdir(sourceDir);
await Promise.all(
  files
    .filter((file) => file.endsWith(".cjs"))
    .map((file) => copyFile(path.join(sourceDir, file), path.join(targetDir, file))),
);

console.log(`Synced ${files.length} shared files to ${targetDir}`);
