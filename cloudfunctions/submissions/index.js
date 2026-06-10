const cloudbase = require("@cloudbase/node-sdk");
const { createSubmission } = require("./shared/submission-service.cjs");
const { demoSubmissions } = require("./shared/demo-data.cjs");
const { questionnaire: defaultQuestionnaire } = require("./shared/questionnaire.cjs");

const collectionName = process.env.SUBMISSIONS_COLLECTION || "survey_submissions";
const questionnaireCollectionName = process.env.QUESTIONNAIRE_COLLECTION || "survey_questionnaires";

let app;

exports.main = async (event) => {
  const request = normalizeRequest(event);

  if (request.method === "OPTIONS") {
    return response(204, {});
  }

  try {
    const db = getDatabase();

    if (request.path.endsWith("/api/submissions") && request.method === "GET") {
      assertAdmin(request);
      const result = await db.collection(collectionName).orderBy("createdAt", "desc").limit(100).get();
      const submissions = (result.data || [])
        .map(normalizeSubmissionRecord)
        .filter((item) => item && !item.system);
      return response(200, { ok: true, submissions });
    }

    if (request.path.endsWith("/api/submissions") && request.method === "POST") {
      const questionnaire = await readQuestionnaire(db);
      const submission = createSubmission(request.body, questionnaire);
      await db.collection(collectionName).add(submission);
      return response(201, { ok: true, submission });
    }

    if (request.path.endsWith("/api/demo/reset") && request.method === "POST") {
      assertAdmin(request);
      const submissions = demoSubmissions();
      await resetDemoData(db, submissions);
      return response(200, { ok: true, submissions });
    }

    if (request.path.endsWith("/api/questionnaire") && request.method === "GET") {
      const questionnaire = await readQuestionnaire(db);
      return response(200, { ok: true, questionnaire });
    }

    if (request.path.endsWith("/api/questionnaire") && request.method === "PUT") {
      assertAdmin(request);
      validateQuestionnaire(request.body.questionnaire);
      await writeQuestionnaire(db, request.body.questionnaire);
      return response(200, { ok: true, questionnaire: request.body.questionnaire });
    }

    return response(404, { ok: false, message: "Not found" });
  } catch (error) {
    const status = error.status || 500;
    return response(status, {
      ok: false,
      message: status === 500 ? "Server error" : error.message,
      detail: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

function getDatabase() {
  if (!app) {
    app = cloudbase.init({
      env: cloudbase.SYMBOL_CURRENT_ENV,
    });
  }
  return app.database();
}

function normalizeRequest(event = {}) {
  const method = (event.httpMethod || event.requestContext?.http?.method || event.method || "GET").toUpperCase();
  const path = event.path || event.rawPath || event.requestContext?.path || "/api/submissions";
  const headers = event.headers || {};
  const body = parseBody(event.body);
  return { method, path, headers, body };
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === "object") return body;
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Invalid JSON body");
    error.status = 400;
    throw error;
  }
}

async function resetDemoData(db, submissions) {
  const collection = db.collection(collectionName);
  const current = await collection.limit(1000).get();
  await Promise.all((current.data || []).map((item) => collection.doc(item._id).remove()));
  await Promise.all(submissions.map((submission) => collection.add(submission)));
}

async function readQuestionnaire(db) {
  try {
    const result = await db
      .collection(questionnaireCollectionName)
      .where({ configId: "active" })
      .orderBy("updatedAt", "desc")
      .limit(1)
      .get();
    return result.data?.[0]?.questionnaire || defaultQuestionnaire;
  } catch {
    return defaultQuestionnaire;
  }
}

async function writeQuestionnaire(db, questionnaire) {
  await db.collection(questionnaireCollectionName).add({
    configId: "active",
    updatedAt: new Date().toISOString(),
    questionnaire,
  });
}

function validateQuestionnaire(questionnaire) {
  if (!questionnaire || typeof questionnaire !== "object") {
    const error = new Error("Questionnaire is required");
    error.status = 400;
    throw error;
  }
  if (!questionnaire.id || !Array.isArray(questionnaire.pages) || questionnaire.pages.length === 0) {
    const error = new Error("Questionnaire must include id and pages");
    error.status = 422;
    throw error;
  }
  for (const page of questionnaire.pages) {
    if (!page.id || !page.title || !Array.isArray(page.questions)) {
      const error = new Error("Each page must include id, title and questions");
      error.status = 422;
      throw error;
    }
    for (const question of page.questions) {
      if (!question.id || !question.title || !question.type || !question.tableField) {
        const error = new Error("Each question must include id, title, type and tableField");
        error.status = 422;
        throw error;
      }
    }
  }
}

function normalizeSubmissionRecord(record) {
  if (!record) return null;
  if (record.data && typeof record.data === "object") {
    return { ...record.data, _id: record._id };
  }
  return record;
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,X-Admin-Token",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}

function assertAdmin(request) {
  const token = process.env.ADMIN_TOKEN || "";
  if (!token) return;
  const headers = normalizeHeaderKeys(request.headers || {});
  if (headers["x-admin-token"] === token) return;
  const error = new Error("Admin token is required");
  error.status = 401;
  throw error;
}

function normalizeHeaderKeys(headers) {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}
