import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { createSubmission, httpError } = require("./shared/submission-service.cjs");
const { demoSubmissions } = require("./shared/demo-data.cjs");
const { questionnaire: defaultQuestionnaire } = require("./shared/questionnaire.cjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "submissions.json");
const questionnaireFile = path.join(dataDir, "questionnaire.json");

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
]);

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === "/api/submissions" && request.method === "GET") {
      assertAdmin(request);
      const submissions = await readSubmissions();
      sendJson(response, 200, { ok: true, submissions });
      return;
    }

    if (url.pathname === "/api/submissions" && request.method === "POST") {
      const payload = await readJsonBody(request);
      const questionnaire = await readQuestionnaire();
      const submission = createSubmission(payload, questionnaire);
      const submissions = await readSubmissions();
      submissions.unshift(submission);
      await writeSubmissions(submissions);
      sendJson(response, 201, { ok: true, submission });
      return;
    }

    if (url.pathname === "/api/demo/reset" && request.method === "POST") {
      assertAdmin(request);
      const submissions = demoSubmissions();
      await writeSubmissions(submissions);
      sendJson(response, 200, { ok: true, submissions });
      return;
    }

    if (url.pathname === "/api/questionnaire" && request.method === "GET") {
      const questionnaire = await readQuestionnaire();
      sendJson(response, 200, { ok: true, questionnaire });
      return;
    }

    if (url.pathname === "/api/questionnaire" && request.method === "PUT") {
      assertAdmin(request);
      const payload = await readJsonBody(request);
      validateQuestionnaire(payload.questionnaire);
      await writeQuestionnaire(payload.questionnaire);
      sendJson(response, 200, { ok: true, questionnaire: payload.questionnaire });
      return;
    }

    await serveStatic(url.pathname, response);
  } catch (error) {
    const status = error.status || 500;
    sendJson(response, status, {
      ok: false,
      message: status === 500 ? "Server error" : error.message,
      detail: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
});

server.listen(port, () => {
  console.log(`Smart questionnaire system running at http://localhost:${port}`);
});

async function serveStatic(urlPath, response) {
  const normalizedPath = decodeURIComponent(urlPath === "/" ? "/index.html" : urlPath);
  const filePath = path.normalize(path.join(__dirname, normalizedPath));

  if (!filePath.startsWith(__dirname)) {
    throw httpError(403, "Forbidden");
  }

  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    throw httpError(404, "Not found");
  }

  if (!fileStat.isFile()) {
    throw httpError(404, "Not found");
  }

  const contentType = mimeTypes.get(path.extname(filePath)) || "application/octet-stream";
  response.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(response);
}

async function readSubmissions() {
  await ensureDataFile();
  const content = await readFile(dataFile, "utf8");
  return JSON.parse(content);
}

async function writeSubmissions(submissions) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(submissions, null, 2)}\n`, "utf8");
}

async function readQuestionnaire() {
  await mkdir(dataDir, { recursive: true });
  try {
    const content = await readFile(questionnaireFile, "utf8");
    return JSON.parse(content);
  } catch {
    await writeQuestionnaire(defaultQuestionnaire);
    return defaultQuestionnaire;
  }
}

async function writeQuestionnaire(questionnaire) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(questionnaireFile, `${JSON.stringify(questionnaire, null, 2)}\n`, "utf8");
}

function validateQuestionnaire(questionnaire) {
  if (!questionnaire || typeof questionnaire !== "object") {
    throw httpError(400, "Questionnaire is required");
  }
  if (!questionnaire.id || !Array.isArray(questionnaire.pages) || questionnaire.pages.length === 0) {
    throw httpError(422, "Questionnaire must include id and pages");
  }
  for (const page of questionnaire.pages) {
    if (!page.id || !page.title || !Array.isArray(page.questions)) {
      throw httpError(422, "Each page must include id, title and questions");
    }
    for (const question of page.questions) {
      if (!question.id || !question.title || !question.type || !question.tableField) {
        throw httpError(422, "Each question must include id, title, type and tableField");
      }
    }
  }
}

async function ensureDataFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await stat(dataFile);
  } catch {
    await writeSubmissions(demoSubmissions());
  }
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      throw httpError(413, "Request body too large");
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw httpError(400, "Invalid JSON body");
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Admin-Token");
}

function assertAdmin(request) {
  const token = process.env.ADMIN_TOKEN || "";
  if (!token) return;
  if (request.headers["x-admin-token"] === token) return;
  throw httpError(401, "Admin token is required");
}
