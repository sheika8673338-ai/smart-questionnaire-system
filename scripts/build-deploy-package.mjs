import { copyFile, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distRoot = path.join(root, "dist", "deploy");
const frontendDir = path.join(distRoot, "frontend");
const functionDir = path.join(distRoot, "cloudfunctions", "submissions");

await rm(distRoot, { recursive: true, force: true });
await mkdir(frontendDir, { recursive: true });
await mkdir(functionDir, { recursive: true });

await runSyncShared();
await copyFrontend();
await copyCloudFunction();
await copyDocs();
await writePackageReadme();

console.log(`Deploy package ready: ${distRoot}`);

async function runSyncShared() {
  const sourceDir = path.join(root, "shared");
  const targetDir = path.join(root, "cloudfunctions", "submissions", "shared");
  await mkdir(targetDir, { recursive: true });
  const files = await readdir(sourceDir);
  await Promise.all(
    files
      .filter((file) => file.endsWith(".cjs"))
      .map((file) => copyFile(path.join(sourceDir, file), path.join(targetDir, file))),
  );
}

async function copyFrontend() {
  const files = ["index.html", "styles.css", "app.js", "config.example.js"];
  await Promise.all(files.map((file) => copyFile(path.join(root, file), path.join(frontendDir, file))));
  await writeFile(
    path.join(frontendDir, "config.js"),
    [
      "// Set this to your CloudBase HTTP function origin before uploading.",
      "// Example: window.SMART_SURVEY_API_BASE = \"https://example.service.tcloudbase.com\";",
      "window.SMART_SURVEY_API_BASE = \"\";",
      "",
      "// Do not hardcode the admin token in public hosting.",
      "// Open /?admin=1 and enter the token when prompted.",
      "window.SMART_SURVEY_ADMIN_TOKEN = \"\";",
      "",
    ].join("\n"),
    "utf8",
  );
}

async function copyCloudFunction() {
  await copyDirectory(path.join(root, "cloudfunctions", "submissions"), functionDir, {
    ignore: new Set(["node_modules"]),
  });
}

async function copyDocs() {
  await copyFile(path.join(root, "cloudbaserc.example.json"), path.join(distRoot, "cloudbaserc.example.json"));
  await copyFile(path.join(root, "docs", "public-release-checklist.md"), path.join(distRoot, "public-release-checklist.md"));
}

async function writePackageReadme() {
  await writeFile(
    path.join(distRoot, "README.md"),
    [
      "# 智能问卷系统部署包",
      "",
      "## 目录",
      "",
      "- `frontend/`：上传到静态网站托管的前端文件。",
      "- `cloudfunctions/submissions/`：部署到 CloudBase 的云函数。",
      "- `cloudbaserc.example.json`：CloudBase 配置参考。",
      "- `public-release-checklist.md`：对外发布前检查清单。",
      "",
      "## 部署顺序",
      "",
      "1. 在 CloudBase 创建数据库集合 `survey_submissions`。",
      "2. 在 `cloudfunctions/submissions` 中运行 `npm install`。",
      "3. 部署 `cloudfunctions/submissions` 云函数，并配置 HTTP 访问。",
      "4. 设置云函数环境变量：`SUBMISSIONS_COLLECTION=survey_submissions`，`ADMIN_TOKEN=你的管理令牌`。",
      "5. 修改 `frontend/config.js` 中的 `SMART_SURVEY_API_BASE`。",
      "6. 上传 `frontend/` 到静态网站托管。",
      "",
      "对外分享普通链接，自己管理数据时访问 `/?admin=1`。",
      "",
    ].join("\n"),
    "utf8",
  );
}

async function copyDirectory(source, target, options = {}) {
  await mkdir(target, { recursive: true });
  const entries = await readdir(source);
  await Promise.all(
    entries.map(async (entry) => {
      if (options.ignore?.has(entry)) return;
      const sourcePath = path.join(source, entry);
      const targetPath = path.join(target, entry);
      const entryStat = await stat(sourcePath);
      if (entryStat.isDirectory()) {
        await copyDirectory(sourcePath, targetPath, options);
        return;
      }
      if (entryStat.isFile()) {
        await copyFile(sourcePath, targetPath);
      }
    }),
  );
}
