const defaultQuestionnaire = {
  id: "cumt-smart-survey-2026",
  title: "产学研基地协同服务体验调研",
  description: "用于验证动态问卷、整页核对、字段映射和数据中台能力。",
  pages: [
    {
      id: "basic",
      title: "基础信息",
      questions: [
        {
          id: "name",
          title: "您的姓名",
          type: "text",
          required: true,
          placeholder: "请输入姓名",
          tableField: "姓名",
        },
        {
          id: "role",
          title: "您的身份",
          type: "single",
          required: true,
          options: ["学生", "教师", "企业导师", "基地运营人员"],
          tableField: "身份",
        },
        {
          id: "department",
          title: "所属学院或单位",
          type: "text",
          required: true,
          placeholder: "例如：管理学院",
          tableField: "所属单位",
        },
      ],
    },
    {
      id: "experience",
      title: "服务体验",
      questions: [
        {
          id: "channels",
          title: "您主要通过哪些渠道获取基地项目信息",
          type: "multi",
          required: true,
          options: ["学院通知", "导师推荐", "企业宣讲", "微信群", "官网/公众号"],
          tableField: "触达渠道",
        },
        {
          id: "satisfaction",
          title: "您对基地当前服务流程的满意度",
          type: "rating",
          required: true,
          min: 1,
          max: 5,
          tableField: "满意度",
        },
        {
          id: "painPoint",
          title: "当前协同过程中最影响效率的问题是什么",
          type: "textarea",
          required: true,
          placeholder: "请描述一个具体场景",
          tableField: "效率痛点",
        },
      ],
    },
    {
      id: "allocation",
      title: "需求权重分配",
      questions: [
        {
          id: "priority",
          title: "请将 100 分分配给以下能力建设方向",
          type: "weight100",
          required: true,
          options: ["项目发布与报名", "导师企业双向匹配", "过程材料归档", "成果展示与评估"],
          tableField: "能力建设权重",
        },
        {
          id: "expectation",
          title: "如果系统只优先上线一个能力，您希望是什么",
          type: "single",
          required: true,
          options: ["更顺畅的填写体验", "更方便的数据统计", "更智能的结果分析", "更稳定的权限与集成"],
          tableField: "优先上线能力",
        },
      ],
    },
  ],
};
let questionnaire = structuredClone(defaultQuestionnaire);

const storageKey = "smart-questionnaire-submissions";
const adminSessionKey = "smart-survey-admin-token";
const configuredApiBase = (window.SMART_SURVEY_API_BASE || "").replace(/\/$/, "");
const apiBase = configuredApiBase || (window.location.protocol === "file:" ? null : "");
let isAdminMode = false;
const state = {
  accessMode: getAdminToken() ? "admin" : null,
  view: "login",
  pageIndex: 0,
  answers: {},
  submissions: loadLocalSubmissions(),
  apiMode: apiBase ? "api" : "local",
  apiError: null,
};

const elements = {
  viewTitle: document.querySelector("#viewTitle"),
  navTabs: [...document.querySelectorAll(".nav-tab")],
  views: {
    login: document.querySelector("#loginView"),
    survey: document.querySelector("#surveyView"),
    review: document.querySelector("#reviewView"),
    success: document.querySelector("#successView"),
    admin: document.querySelector("#adminView"),
    config: document.querySelector("#configView"),
  },
  accessBadge: document.querySelector("#accessBadge"),
  logoutButton: document.querySelector("#logoutButton"),
  guestEnter: document.querySelector("#guestEnter"),
  loginTabs: [...document.querySelectorAll("[data-login-tab]")],
  loginPanes: [...document.querySelectorAll("[data-login-pane]")],
  adminAccount: document.querySelector("#adminAccount"),
  adminLoginForm: document.querySelector("#adminLoginForm"),
  adminPassword: document.querySelector("#adminPassword"),
  guestLoginForm: document.querySelector("#guestLoginForm"),
  guestIdentity: document.querySelector("#guestIdentity"),
  loginAgreement: document.querySelector("#loginAgreement"),
  loginError: document.querySelector("#loginError"),
  pageTitle: document.querySelector("#pageTitle"),
  surveyStage: document.querySelector("#surveyStage"),
  questionContainer: document.querySelector("#questionContainer"),
  validationSummary: document.querySelector("#validationSummary"),
  progressText: document.querySelector("#progressText"),
  progressBar: document.querySelector("#progressBar"),
  prevPage: document.querySelector("#prevPage"),
  nextPage: document.querySelector("#nextPage"),
  qualityHints: document.querySelector("#qualityHints"),
  answeredCount: document.querySelector("#answeredCount"),
  riskCount: document.querySelector("#riskCount"),
  reviewList: document.querySelector("#reviewList"),
  backToSurvey: document.querySelector("#backToSurvey"),
  submitSurvey: document.querySelector("#submitSurvey"),
  newSubmission: document.querySelector("#newSubmission"),
  resetDemo: document.querySelector("#resetDemo"),
  totalSubmissions: document.querySelector("#totalSubmissions"),
  avgCompletion: document.querySelector("#avgCompletion"),
  qualityRisk: document.querySelector("#qualityRisk"),
  submissionHead: document.querySelector("#submissionHead"),
  submissionBody: document.querySelector("#submissionBody"),
  exportCsv: document.querySelector("#exportCsv"),
  insightList: document.querySelector("#insightList"),
  configJson: document.querySelector("#configJson"),
  copyConfig: document.querySelector("#copyConfig"),
  editorTitle: document.querySelector("#editorTitle"),
  editorDescription: document.querySelector("#editorDescription"),
  editorPages: document.querySelector("#editorPages"),
  addPage: document.querySelector("#addPage"),
  saveQuestionnaire: document.querySelector("#saveQuestionnaire"),
  editorStatus: document.querySelector("#editorStatus"),
  aiGoal: document.querySelector("#aiGoal"),
  generateQuestionnaire: document.querySelector("#generateQuestionnaire"),
  checkQuestionnaire: document.querySelector("#checkQuestionnaire"),
  aiFindings: document.querySelector("#aiFindings"),
  adminOnly: [...document.querySelectorAll("[data-admin-only]")],
};

function loadLocalSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function saveLocalSubmissions() {
  localStorage.setItem(storageKey, JSON.stringify(state.submissions));
}

function isAdminLoggedIn() {
  return state.accessMode === "admin";
}

function setAdminSession(token) {
  if (token) {
    sessionStorage.setItem(adminSessionKey, token);
    state.accessMode = "admin";
    isAdminMode = true;
    return;
  }
  sessionStorage.removeItem(adminSessionKey);
  state.accessMode = null;
  isAdminMode = false;
}

function clearLoginError() {
  if (!elements.loginError) return;
  elements.loginError.hidden = true;
  elements.loginError.textContent = "";
}

function showLoginError(message) {
  if (!elements.loginError) return;
  elements.loginError.hidden = false;
  elements.loginError.textContent = message;
}

function updateLoginTabUi(activeTab = "admin") {
  elements.loginTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.loginTab === activeTab);
  });

  elements.loginPanes.forEach((pane) => {
    pane.classList.toggle("active", pane.dataset.loginPane === activeTab);
  });
}

async function apiRequest(path, options = {}) {
  if (!apiBase) {
    throw new Error("API is unavailable when opening index.html directly.");
  }

  const response = await fetch(`${apiBase}${path}`, buildRequestOptions(options));
  if (response.status === 401 && isAdminMode && !getAdminToken()) {
    const token = window.prompt("请输入管理令牌");
    if (token) {
      sessionStorage.setItem("smart-survey-admin-token", token);
      const retry = await fetch(`${apiBase}${path}`, buildRequestOptions(options));
      return parseApiResponse(retry);
    }
  }
  return parseApiResponse(response);
}

function buildRequestOptions(options) {
  const token = getAdminToken();
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Admin-Token": token } : {}),
      ...(options.headers || {}),
    },
    ...options,
  };
}

async function parseApiResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || `Request failed with ${response.status}`);
  }
  return payload;
}

function getAdminToken() {
  return window.SMART_SURVEY_ADMIN_TOKEN || sessionStorage.getItem("smart-survey-admin-token") || "";
}

async function refreshSubmissions() {
  if (!apiBase) {
    state.apiMode = "local";
    state.submissions = loadLocalSubmissions();
    if (state.submissions.length === 0) {
      seedDemoData();
    }
    return;
  }

  try {
    if (!isAdminMode) {
      return;
    }
    const payload = await apiRequest("/api/submissions");
    state.apiMode = "api";
    state.apiError = null;
    state.submissions = payload.submissions || [];
  } catch (error) {
    state.apiMode = "local";
    state.apiError = error.message;
    state.submissions = loadLocalSubmissions();
    if (state.submissions.length === 0) {
      seedDemoData();
    }
  }
}

async function refreshQuestionnaire() {
  if (!apiBase) {
    questionnaire = loadLocalQuestionnaire();
    return;
  }

  try {
    const payload = await apiRequest("/api/questionnaire");
    questionnaire = payload.questionnaire || structuredClone(defaultQuestionnaire);
  } catch {
    questionnaire = loadLocalQuestionnaire();
  }
}

function loadLocalQuestionnaire() {
  try {
    return JSON.parse(localStorage.getItem("smart-questionnaire-config")) || structuredClone(defaultQuestionnaire);
  } catch {
    return structuredClone(defaultQuestionnaire);
  }
}

function saveLocalQuestionnaire() {
  localStorage.setItem("smart-questionnaire-config", JSON.stringify(questionnaire));
}

function allQuestions() {
  return questionnaire.pages.flatMap((page) => page.questions);
}

function currentPage() {
  return questionnaire.pages[state.pageIndex];
}

function getAnswer(questionId) {
  return state.answers[questionId];
}

function setAnswer(questionId, value) {
  state.answers[questionId] = value;
  renderAssistPanel();
}

function showView(view) {
  if (!isAdminMode && ["admin", "config"].includes(view)) {
    view = "survey";
  }
  state.view = view;
  Object.entries(elements.views).forEach(([key, element]) => {
    element.classList.toggle("active", key === view);
  });
  elements.navTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });

  const titles = {
    survey: "调研问卷填写",
    review: "提交前核对",
    success: "提交结果",
    admin: "数据中台",
    config: "问卷配置",
  };
  elements.viewTitle.textContent = titles[view];
}

function renderSurvey() {
  state.pageIndex = Math.min(state.pageIndex, Math.max(questionnaire.pages.length - 1, 0));
  const page = currentPage();
  elements.pageTitle.textContent = page.title;
  elements.surveyStage.textContent = `第 ${state.pageIndex + 1} 页 / 共 ${questionnaire.pages.length} 页`;
  elements.questionContainer.innerHTML = "";
  elements.validationSummary.hidden = true;
  elements.validationSummary.textContent = "";

  page.questions.forEach((question, index) => {
    elements.questionContainer.appendChild(renderQuestion(question, index));
  });

  const progress = Math.round(((state.pageIndex + 1) / questionnaire.pages.length) * 100);
  elements.progressText.textContent = `${progress}%`;
  elements.progressBar.style.width = `${progress}%`;
  elements.prevPage.disabled = state.pageIndex === 0;
  elements.nextPage.textContent = state.pageIndex === questionnaire.pages.length - 1 ? "进入核对" : "下一步";
  renderAssistPanel();
}

function renderQuestion(question, index) {
  const block = document.createElement("article");
  block.className = "question-block";
  block.dataset.questionId = question.id;

  const title = document.createElement("div");
  title.className = "question-title";
  title.innerHTML = `<span>${state.pageIndex + 1}.${index + 1}</span><span>${question.title}${question.required ? ' <span class="required">*</span>' : ""}</span>`;
  block.appendChild(title);

  const field = document.createElement("div");
  field.className = "field-row";

  if (question.type === "text") {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = question.placeholder || "";
    input.value = getAnswer(question.id) || "";
    input.addEventListener("input", () => setAnswer(question.id, input.value.trim()));
    field.appendChild(input);
  }

  if (question.type === "textarea") {
    const textarea = document.createElement("textarea");
    textarea.placeholder = question.placeholder || "";
    textarea.value = getAnswer(question.id) || "";
    textarea.addEventListener("input", () => setAnswer(question.id, textarea.value.trim()));
    field.appendChild(textarea);
  }

  if (question.type === "single") {
    field.className = "option-list";
    question.options.forEach((option) => {
      const label = document.createElement("label");
      label.className = "option-item";
      label.innerHTML = `<input type="radio" name="${question.id}" value="${escapeHtml(option)}" ${getAnswer(question.id) === option ? "checked" : ""}> ${option}`;
      label.querySelector("input").addEventListener("change", () => setAnswer(question.id, option));
      field.appendChild(label);
    });
  }

  if (question.type === "multi") {
    field.className = "option-list";
    const selected = new Set(getAnswer(question.id) || []);
    question.options.forEach((option) => {
      const label = document.createElement("label");
      label.className = "option-item";
      label.innerHTML = `<input type="checkbox" value="${escapeHtml(option)}" ${selected.has(option) ? "checked" : ""}> ${option}`;
      label.querySelector("input").addEventListener("change", (event) => {
        const next = new Set(getAnswer(question.id) || []);
        if (event.target.checked) {
          next.add(option);
        } else {
          next.delete(option);
        }
        setAnswer(question.id, [...next]);
      });
      field.appendChild(label);
    });
  }

  if (question.type === "rating") {
    field.className = "rating-row";
    for (let score = question.min; score <= question.max; score += 1) {
      const label = document.createElement("label");
      label.innerHTML = `<input type="radio" name="${question.id}" value="${score}" ${Number(getAnswer(question.id)) === score ? "checked" : ""}> ${score}`;
      label.querySelector("input").addEventListener("change", () => setAnswer(question.id, score));
      field.appendChild(label);
    }
  }

  if (question.type === "weight100") {
    field.className = "weight-list";
    const values = getAnswer(question.id) || {};
    let totalNode;
    question.options.forEach((option) => {
      const row = document.createElement("div");
      row.className = "weight-item";
      row.innerHTML = `<label>${option}</label><input type="number" min="0" max="100" step="1" value="${values[option] ?? ""}" aria-label="${option} 权重">`;
      row.querySelector("input").addEventListener("input", (event) => {
        const next = { ...(getAnswer(question.id) || {}) };
        const value = Number(event.target.value);
        if (event.target.value === "") {
          delete next[option];
        } else {
          next[option] = Number.isFinite(value) ? value : 0;
        }
        setAnswer(question.id, next);
        updateWeightTotal(totalNode, next);
      });
      field.appendChild(row);
    });
    totalNode = document.createElement("span");
    updateWeightTotal(totalNode, values);
    field.appendChild(totalNode);
  }

  block.appendChild(field);
  return block;
}

function validatePage(page = currentPage()) {
  return page.questions.flatMap(validateQuestion);
}

function validateAll() {
  return questionnaire.pages.flatMap((page) => validatePage(page));
}

function validateQuestion(question) {
  const answer = getAnswer(question.id);
  const errors = [];

  if (question.required && isEmptyAnswer(answer, question.type)) {
    errors.push(`${question.title}：请完成必填项`);
  }

  if (question.type === "weight100" && !isEmptyAnswer(answer, question.type)) {
    const total = sumWeight(answer);
    if (total !== 100) {
      errors.push(`${question.title}：当前合计为 ${total}，需要等于 100`);
    }
    const hasInvalid = Object.values(answer).some((value) => value < 0 || value > 100);
    if (hasInvalid) {
      errors.push(`${question.title}：每个方向的分值需要在 0 到 100 之间`);
    }
  }

  return errors;
}

function isEmptyAnswer(answer, type) {
  if (answer == null) return true;
  if (type === "multi") return !Array.isArray(answer) || answer.length === 0;
  if (type === "weight100") return Object.keys(answer || {}).length === 0;
  return String(answer).trim() === "";
}

function sumWeight(answer = {}) {
  return Object.values(answer).reduce((sum, value) => sum + Number(value || 0), 0);
}

function updateWeightTotal(node, answer) {
  const total = sumWeight(answer);
  node.className = `weight-total ${total === 100 ? "" : "invalid"}`;
  node.textContent = `当前合计：${total} / 100`;
}

function showErrors(errors) {
  elements.validationSummary.hidden = errors.length === 0;
  elements.validationSummary.innerHTML = errors.map((error) => `<div>${escapeHtml(error)}</div>`).join("");
}

function renderAssistPanel() {
  const questions = allQuestions();
  const answered = questions.filter((question) => !isEmptyAnswer(getAnswer(question.id), question.type));
  const pageErrors = validatePage();
  const hints = buildQualityHints(pageErrors);

  elements.answeredCount.textContent = answered.length;
  elements.riskCount.textContent = pageErrors.length;
  elements.qualityHints.innerHTML = hints
    .map((hint) => `<div class="hint"><strong>${hint.title}</strong><p>${hint.body}</p></div>`)
    .join("");
}

function buildQualityHints(pageErrors) {
  if (pageErrors.length > 0) {
    return pageErrors.slice(0, 3).map((error) => ({
      title: "待处理校验",
      body: error,
    }));
  }

  const painPoint = getAnswer("painPoint") || "";
  if (painPoint && painPoint.length < 12) {
    return [
      {
        title: "开放题质量提醒",
        body: "痛点描述偏短，建议补充具体场景，后续 AI 归因会更稳定。",
      },
    ];
  }

  const priority = getAnswer("priority");
  if (priority && sumWeight(priority) === 100) {
    return [
      {
        title: "权重分配通过",
        body: "能力建设方向已形成可量化优先级，可直接映射到表格字段。",
      },
    ];
  }

  return [
    {
      title: "结构化采集中",
      body: "系统会在每一页进行必填、格式和权重规则检查。",
    },
  ];
}

function renderReview() {
  const rows = allQuestions().map((question) => {
    const answer = formatAnswer(question, getAnswer(question.id));
    return `<div class="review-item"><strong>${question.tableField}</strong><p>${escapeHtml(answer)}</p></div>`;
  });
  elements.reviewList.innerHTML = rows.join("");
}

async function submitSurvey() {
  const errors = validateAll();
  if (errors.length > 0) {
    state.pageIndex = findFirstErrorPage();
    showView("survey");
    renderSurvey();
    showErrors(errors.slice(0, 5));
    return;
  }

  elements.submitSurvey.disabled = true;
  elements.submitSurvey.textContent = "提交中...";

  try {
    if (apiBase) {
      const payload = await apiRequest("/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          questionnaireId: questionnaire.id,
          answers: structuredClone(state.answers),
        }),
      });
      state.apiMode = "api";
      state.apiError = null;
      state.submissions = [payload.submission, ...state.submissions.filter((item) => item.id !== payload.submission.id)];
      if (isAdminMode) {
        await refreshSubmissions();
      }
    } else {
      saveLocalSubmission();
    }
    renderAdmin();
    showView("success");
  } catch (error) {
    state.apiMode = "local";
    state.apiError = error.message;
    saveLocalSubmission();
    renderAdmin();
    showView("success");
  } finally {
    elements.submitSurvey.disabled = false;
    elements.submitSurvey.textContent = "提交到数据中台";
  }
}

function saveLocalSubmission() {
  const submission = {
    id: `SUB-${Date.now()}`,
    questionnaireId: questionnaire.id,
    createdAt: new Date().toISOString(),
    answers: structuredClone(state.answers),
    quality: buildQualityScore(state.answers),
  };

  state.submissions.unshift(submission);
  saveLocalSubmissions();
}

function findFirstErrorPage() {
  return questionnaire.pages.findIndex((page) => validatePage(page).length > 0);
}

function buildQualityScore(answers) {
  const completion = Math.round(
    (allQuestions().filter((question) => !isEmptyAnswer(answers[question.id], question.type)).length / allQuestions().length) * 100,
  );
  const painPoint = answers.painPoint || "";
  const fastPatternRisk = painPoint.length > 0 && painPoint.length < 8 ? 1 : 0;
  const lowSatisfaction = Number(answers.satisfaction) <= 2 ? 1 : 0;
  return {
    completion,
    risk: fastPatternRisk + lowSatisfaction,
  };
}

function renderAdmin() {
  const submissions = state.submissions;
  elements.totalSubmissions.textContent = submissions.length;
  elements.avgCompletion.textContent = `${average(submissions.map((item) => item.quality.completion))}%`;
  elements.qualityRisk.textContent = submissions.reduce((sum, item) => sum + item.quality.risk, 0);
  renderSubmissionTable();
  renderInsights();
}

function renderSubmissionTable() {
  const fields = ["提交时间", ...allQuestions().map((question) => question.tableField), "完成度", "风险"];
  elements.submissionHead.innerHTML = `<tr>${fields.map((field) => `<th>${field}</th>`).join("")}</tr>`;

  if (state.submissions.length === 0) {
    elements.submissionBody.innerHTML = `<tr><td colspan="${fields.length}" class="empty-state">暂无提交记录</td></tr>`;
    return;
  }

  elements.submissionBody.innerHTML = state.submissions
    .map((submission) => {
      const cells = [
        new Date(submission.createdAt).toLocaleString("zh-CN"),
        ...allQuestions().map((question) => formatAnswer(question, submission.answers[question.id])),
        `${submission.quality.completion}%`,
        submission.quality.risk,
      ];
      return `<tr>${cells.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`;
    })
    .join("");
}

function renderInsights() {
  if (state.submissions.length === 0) {
    elements.insightList.innerHTML = `<div class="insight"><strong>等待数据</strong><p>提交问卷后会自动生成体验痛点、优先级和质量风险摘要。</p></div>`;
    return;
  }

  const satisfactionAvg = average(
    state.submissions.map((item) => Number(item.answers.satisfaction)).filter((value) => Number.isFinite(value)),
  );
  const priorityTotals = {};
  state.submissions.forEach((item) => {
    Object.entries(item.answers.priority || {}).forEach(([key, value]) => {
      priorityTotals[key] = (priorityTotals[key] || 0) + Number(value || 0);
    });
  });
  const topPriority = Object.entries(priorityTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "暂无";
  const painWords = extractPainKeywords(state.submissions.map((item) => item.answers.painPoint || ""));

  const insights = [
    {
      title: "满意度均值",
      body: `当前样本平均满意度为 ${satisfactionAvg} / 5，可作为服务流程优化基线。`,
    },
    {
      title: "能力建设优先级",
      body: `累计权重最高的是“${topPriority}”，适合作为下一轮产品迭代入口。`,
    },
    {
      title: "开放题高频线索",
      body: painWords.length ? `高频词包括：${painWords.join("、")}。` : "开放题样本还不足，暂未形成稳定主题。",
    },
  ];

  elements.insightList.innerHTML = insights
    .map((item) => `<div class="insight"><strong>${item.title}</strong><p>${item.body}</p></div>`)
    .join("");
}

function extractPainKeywords(texts) {
  const stopWords = new Set(["一个", "现在", "当前", "比较", "希望", "可以", "需要", "过程", "问题"]);
  const tokens = texts
    .join(" ")
    .replace(/[，。！？、,.!?]/g, " ")
    .split(/\s+/)
    .flatMap((part) => (part.length > 8 ? part.match(/.{2,4}/g) || [] : [part]))
    .filter((word) => word.length >= 2 && !stopWords.has(word));

  const count = new Map();
  tokens.forEach((word) => count.set(word, (count.get(word) || 0) + 1));
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function formatAnswer(question, answer) {
  if (isEmptyAnswer(answer, question.type)) return "未填写";
  if (question.type === "multi") return answer.join("、");
  if (question.type === "weight100") {
    return Object.entries(answer)
      .map(([key, value]) => `${key} ${value}分`)
      .join("；");
  }
  if (question.type === "rating") return `${answer} 分`;
  return String(answer);
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length === 0) return 0;
  return Math.round((clean.reduce((sum, value) => sum + value, 0) / clean.length) * 10) / 10;
}

function exportCsv() {
  const fields = ["提交ID", "提交时间", ...allQuestions().map((question) => question.tableField), "完成度", "风险"];
  const rows = state.submissions.map((submission) => [
    submission.id,
    submission.createdAt,
    ...allQuestions().map((question) => formatAnswer(question, submission.answers[question.id])),
    `${submission.quality.completion}%`,
    submission.quality.risk,
  ]);
  const csv = [fields, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "smart-questionnaire-submissions.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetForm() {
  state.answers = {};
  state.pageIndex = 0;
  showView("survey");
  renderSurvey();
}

function makeSafeId(text, fallback) {
  const source = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const pinyinMap = {
    项目报名: "project_signup",
    导师匹配: "mentor_match",
    过程材料归档: "archive",
    成果评价: "outcome_review",
    数据统计: "analytics",
    权限集成: "permission",
    沟通协同: "collaboration",
    系统体验: "experience",
  };
  return pinyinMap[text] || source || fallback;
}

function inferFocusOptions(goal) {
  const focusRules = [
    { label: "项目报名", keys: ["报名", "申报", "项目发布", "项目申请"] },
    { label: "导师匹配", keys: ["导师", "匹配", "双选", "企业导师"] },
    { label: "过程材料归档", keys: ["材料", "归档", "过程", "文档", "台账"] },
    { label: "成果评价", keys: ["成果", "评价", "验收", "展示", "转化"] },
    { label: "数据统计", keys: ["统计", "看板", "数据", "报表", "分析"] },
    { label: "权限集成", keys: ["权限", "登录", "集成", "账号", "认证"] },
    { label: "沟通协同", keys: ["沟通", "协同", "通知", "消息", "反馈"] },
  ];
  const matches = focusRules
    .filter((rule) => rule.keys.some((key) => goal.includes(key)))
    .map((rule) => rule.label);
  const defaults = ["项目报名", "导师匹配", "过程材料归档", "成果评价"];
  return [...new Set([...matches, ...defaults])].slice(0, 5);
}

function buildRuleQuestionnaire(goalText) {
  const goal = goalText.trim() || "调研产学研基地不同角色对协同服务、流程效率和系统能力建设的需求";
  const focusOptions = inferFocusOptions(goal);
  const timestamp = Date.now().toString(36);
  const goalLabel = goal.length > 24 ? `${goal.slice(0, 24)}...` : goal;
  const focusQuestions = focusOptions.map((option, index) => ({
    id: `focus_${makeSafeId(option, `item_${index}`)}`,
    title: `您对“${option}”当前体验的满意度`,
    type: "rating",
    required: true,
    min: 1,
    max: 5,
    tableField: `${option}满意度`,
  }));

  return {
    id: `rule-ai-survey-${timestamp}`,
    title: `${goalLabel}调研问卷`,
    description: `由规则版智能问卷助手根据调研目标生成，覆盖对象识别、体验评价、优先级分配和开放反馈。调研目标：${goal}`,
    pages: [
      {
        id: "basic",
        title: "基础信息",
        questions: [
          {
            id: "role",
            title: "您的身份",
            type: "single",
            required: true,
            options: ["学生", "教师", "企业导师", "基地运营人员", "其他"],
            tableField: "身份",
          },
          {
            id: "department",
            title: "所属学院、企业或单位",
            type: "text",
            required: true,
            placeholder: "例如：管理学院 / 某合作企业",
            tableField: "所属单位",
          },
          {
            id: "participation",
            title: "您参与产学研基地相关项目的频率",
            type: "single",
            required: true,
            options: ["首次参与", "偶尔参与", "每学期多次参与", "长期负责相关工作"],
            tableField: "参与频率",
          },
        ],
      },
      {
        id: "experience",
        title: "体验评价",
        questions: [
          {
            id: "channels",
            title: "您主要通过哪些渠道获取相关信息",
            type: "multi",
            required: true,
            options: ["学院通知", "导师推荐", "企业宣讲", "微信群/QQ群", "官网/公众号", "其他"],
            tableField: "触达渠道",
          },
          ...focusQuestions,
          {
            id: "pain_point",
            title: "当前最影响效率或体验的问题是什么",
            type: "textarea",
            required: true,
            placeholder: "请描述一个具体场景，便于后续归类分析",
            tableField: "核心痛点",
          },
        ],
      },
      {
        id: "priority",
        title: "改进优先级",
        questions: [
          {
            id: "priority_weight",
            title: "请将 100 分分配给您认为最需要优先建设的方向",
            type: "weight100",
            required: true,
            options: focusOptions,
            tableField: "建设优先级",
          },
          {
            id: "first_launch",
            title: "如果只能优先上线一个能力，您希望是什么",
            type: "single",
            required: true,
            options: [...focusOptions, "其他"],
            tableField: "首要上线能力",
          },
          {
            id: "suggestion",
            title: "您对系统建设还有哪些建议",
            type: "textarea",
            required: false,
            placeholder: "可填写功能建议、流程建议或数据分析需求",
            tableField: "补充建议",
          },
        ],
      },
    ],
  };
}

function flattenQuestions(config) {
  return (config.pages || []).flatMap((page) => page.questions || []);
}

function addFinding(findings, severity, title, body, penalty = 0) {
  findings.push({ severity, title, body, penalty });
}

function checkQuestionnaireQuality(config) {
  const findings = [];
  const pages = config.pages || [];
  const questions = flattenQuestions(config);
  const requiredCount = questions.filter((question) => question.required).length;
  const requiredRatio = questions.length ? requiredCount / questions.length : 0;
  const types = new Set(questions.map((question) => question.type));
  const ids = questions.map((question) => question.id).filter(Boolean);
  const fields = questions.map((question) => question.tableField).filter(Boolean);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const duplicateFields = fields.filter((field, index) => fields.indexOf(field) !== index);

  if (!config.title || config.title.length < 8) {
    addFinding(findings, "error", "标题信息不足", "问卷标题过短，建议体现调研对象和调研主题。", 12);
  }
  if (!config.description || config.description.length < 20) {
    addFinding(findings, "warning", "缺少调研说明", "建议补充调研目的、数据用途和填写预期，提升受访者信任。", 6);
  }
  if (pages.length < 2) {
    addFinding(findings, "error", "问卷结构过薄", "至少拆分为基础信息、体验评价、改进建议等分页。", 10);
  }
  if (questions.length < 6) {
    addFinding(findings, "warning", "题量偏少", "当前题量难以支撑画像、体验和优先级分析，建议保持 8-15 题。", 8);
  }
  if (questions.length > 18) {
    addFinding(findings, "warning", "题量偏多", "题量过多会影响完成率，建议删减重复或低价值题目。", 5);
  }
  if (duplicateIds.length) {
    addFinding(findings, "error", "题目 ID 重复", `重复 ID：${[...new Set(duplicateIds)].join("、")}，会影响答案保存。`, 14);
  }
  if (duplicateFields.length) {
    addFinding(findings, "warning", "表格字段重复", `重复字段：${[...new Set(duplicateFields)].join("、")}，导出 CSV 时不便分析。`, 6);
  }
  if (requiredRatio > 0.85) {
    addFinding(findings, "warning", "必填比例过高", "建议保留 1-2 个非必填开放题，降低填写压力。", 4);
  }
  if (!questions.some((question) => /身份|角色|对象/.test(question.title))) {
    addFinding(findings, "error", "缺少对象分层", "建议加入身份或角色题，后续才能做分群分析。", 10);
  }
  if (!types.has("rating")) {
    addFinding(findings, "warning", "缺少量化评分", "建议加入满意度或重要性评分题，方便生成均值和趋势分析。", 8);
  }
  if (!types.has("textarea")) {
    addFinding(findings, "warning", "缺少开放反馈", "建议加入开放题收集具体场景，便于提炼痛点关键词。", 6);
  }
  if (!types.has("weight100")) {
    addFinding(findings, "info", "可增加优先级分配", "100 分权重题能直接支撑产品路线图排序。", 3);
  }

  questions.forEach((question) => {
    if (!question.id) addFinding(findings, "error", "题目缺少 ID", `“${question.title || "未命名题目"}”缺少 ID，会影响保存。`, 10);
    if (!question.tableField) addFinding(findings, "warning", "缺少导出字段", `“${question.title || question.id}”没有表格字段。`, 4);
    if (["single", "multi", "weight100"].includes(question.type)) {
      const options = question.options || [];
      const duplicateOptions = options.filter((option, index) => options.indexOf(option) !== index);
      if (options.length < 2) {
        addFinding(findings, "error", "选项不足", `“${question.title}”至少需要 2 个选项。`, 10);
      }
      if (duplicateOptions.length) {
        addFinding(findings, "warning", "选项重复", `“${question.title}”存在重复选项：${[...new Set(duplicateOptions)].join("、")}。`, 4);
      }
      if (["single", "multi"].includes(question.type) && !options.some((option) => /其他|不确定|无/.test(option))) {
        addFinding(findings, "info", "可补充兜底选项", `“${question.title}”可加入“其他”或“不确定”，减少被迫选择。`, 2);
      }
      if (question.type === "weight100" && (options.length < 3 || options.length > 6)) {
        addFinding(findings, "warning", "权重项数量不佳", `“${question.title}”建议保留 3-6 个权重方向，便于受访者分配。`, 5);
      }
    }
    if (question.type === "rating" && (Number(question.min) !== 1 || Number(question.max) !== 5)) {
      addFinding(findings, "info", "评分刻度不标准", `“${question.title}”建议使用 1-5 分，方便横向比较。`, 2);
    }
    if (/和|及|与|以及/.test(question.title) && question.title.length > 18) {
      addFinding(findings, "info", "题干可能包含复合问题", `“${question.title}”可拆成更单一的问题，降低理解偏差。`, 2);
    }
  });

  if (!findings.length) {
    addFinding(findings, "success", "质量良好", "当前问卷结构完整，题型覆盖较均衡，可以直接保存并发布。", 0);
  }

  const score = Math.max(0, Math.min(100, 100 - findings.reduce((total, item) => total + item.penalty, 0)));
  return { score, findings };
}

function renderAiFindings(result) {
  if (!elements.aiFindings) return;
  const severityText = {
    success: "通过",
    error: "需修复",
    warning: "建议优化",
    info: "提示",
  };
  elements.aiFindings.innerHTML = `
    <div class="ai-score">
      <strong>${result.score}</strong>
      <span>问卷质量分</span>
    </div>
    <div class="finding-list">
      ${result.findings.map((item) => `
        <article class="finding ${item.severity}">
          <span>${severityText[item.severity] || "提示"}</span>
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.body)}</p>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function generateQuestionnaireDraft() {
  const goal = elements.aiGoal.value;
  questionnaire = buildRuleQuestionnaire(goal);
  state.answers = {};
  state.pageIndex = 0;
  renderConfigEditor();
  renderSurvey();
  renderAiFindings(checkQuestionnaireQuality(questionnaire));
  elements.editorStatus.textContent = "已生成规则版问卷草案，确认后点击“保存问卷”同步到云端。";
}

function checkCurrentQuestionnaire() {
  syncConfigJson();
  renderAiFindings(checkQuestionnaireQuality(questionnaire));
  elements.editorStatus.textContent = "已完成规则版质量检查。";
}

function renderConfigEditor() {
  elements.editorTitle.value = questionnaire.title || "";
  elements.editorDescription.value = questionnaire.description || "";
  elements.editorPages.innerHTML = "";
  syncConfigJson();

  questionnaire.pages.forEach((page, pageIndex) => {
    const pageNode = document.createElement("section");
    pageNode.className = "editor-block";
    pageNode.innerHTML = `
      <div class="editor-block-head">
        <strong>分页 ${pageIndex + 1}</strong>
        <button class="secondary-button" type="button" data-action="remove-page">删除分页</button>
      </div>
      <label>分页标题<input type="text" value="${escapeHtml(page.title || "")}" data-field="page-title"></label>
      <div class="editor-questions"></div>
      <button class="secondary-button" type="button" data-action="add-question">新增题目</button>
    `;

    pageNode.querySelector("[data-field='page-title']").addEventListener("input", (event) => {
      page.title = event.target.value;
      syncConfigJson();
    });
    pageNode.querySelector("[data-action='remove-page']").addEventListener("click", () => {
      if (questionnaire.pages.length <= 1) return;
      questionnaire.pages.splice(pageIndex, 1);
      renderConfigEditor();
    });
    pageNode.querySelector("[data-action='add-question']").addEventListener("click", () => {
      page.questions.push(createQuestion());
      renderConfigEditor();
    });

    const questionsNode = pageNode.querySelector(".editor-questions");
    page.questions.forEach((question, questionIndex) => {
      questionsNode.appendChild(renderQuestionEditor(question, page, questionIndex));
    });

    elements.editorPages.appendChild(pageNode);
  });
}

function renderQuestionEditor(question, page, questionIndex) {
  const node = document.createElement("article");
  node.className = "editor-question";
  node.innerHTML = `
    <div class="editor-block-head">
      <strong>题目 ${questionIndex + 1}</strong>
      <button class="secondary-button" type="button" data-action="remove-question">删除题目</button>
    </div>
    <label>题目标题<input type="text" value="${escapeHtml(question.title || "")}" data-field="title"></label>
    <div class="editor-row">
      <label>题目类型
        <select data-field="type">
          ${["text", "textarea", "single", "multi", "rating", "weight100"].map((type) => `<option value="${type}" ${question.type === type ? "selected" : ""}>${type}</option>`).join("")}
        </select>
      </label>
      <label>表格字段<input type="text" value="${escapeHtml(question.tableField || "")}" data-field="tableField"></label>
      <label class="checkbox-label"><input type="checkbox" data-field="required" ${question.required ? "checked" : ""}> 必填</label>
    </div>
    <label>占位提示<input type="text" value="${escapeHtml(question.placeholder || "")}" data-field="placeholder"></label>
    <div class="option-editor"></div>
  `;

  node.querySelector("[data-action='remove-question']").addEventListener("click", () => {
    if (page.questions.length <= 1) return;
    page.questions.splice(questionIndex, 1);
    renderConfigEditor();
  });

  node.querySelectorAll("[data-field]").forEach((field) => {
    field.addEventListener("input", () => updateQuestionField(question, field));
    field.addEventListener("change", () => {
      updateQuestionField(question, field);
      if (field.dataset.field === "type") renderConfigEditor();
    });
  });

  renderOptionEditor(node.querySelector(".option-editor"), question);
  return node;
}

function updateQuestionField(question, field) {
  const key = field.dataset.field;
  if (key === "required") {
    question.required = field.checked;
  } else {
    question[key] = field.value;
  }
  if (key === "type") {
    normalizeQuestionByType(question);
  }
  syncConfigJson();
}

function renderOptionEditor(container, question) {
  if (!["single", "multi", "weight100"].includes(question.type)) return;

  const options = question.options || [];
  container.innerHTML = `<strong>选项</strong><div class="option-editor-list"></div><button class="secondary-button" type="button" data-action="add-option">新增选项</button>`;
  const list = container.querySelector(".option-editor-list");
  options.forEach((option, index) => {
    const row = document.createElement("div");
    row.className = "option-editor-row";
    row.innerHTML = `<input type="text" value="${escapeHtml(option)}"><button class="secondary-button" type="button">删除</button>`;
    row.querySelector("input").addEventListener("input", (event) => {
      question.options[index] = event.target.value;
      syncConfigJson();
    });
    row.querySelector("button").addEventListener("click", () => {
      question.options.splice(index, 1);
      renderConfigEditor();
    });
    list.appendChild(row);
  });
  container.querySelector("[data-action='add-option']").addEventListener("click", () => {
    question.options = question.options || [];
    question.options.push("新选项");
    renderConfigEditor();
  });
}

function createPage() {
  return {
    id: `page_${Date.now().toString(36)}`,
    title: "新分页",
    questions: [createQuestion()],
  };
}

function createQuestion() {
  return {
    id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    title: "新题目",
    type: "text",
    required: true,
    tableField: "新字段",
    placeholder: "",
  };
}

function normalizeQuestionByType(question) {
  if (["single", "multi", "weight100"].includes(question.type)) {
    question.options = question.options?.length ? question.options : ["选项一", "选项二"];
  } else {
    delete question.options;
  }
  if (question.type === "rating") {
    question.min = 1;
    question.max = 5;
  } else {
    delete question.min;
    delete question.max;
  }
}

function syncConfigJson() {
  questionnaire.title = elements.editorTitle.value || questionnaire.title;
  questionnaire.description = elements.editorDescription.value || "";
  elements.configJson.textContent = JSON.stringify(questionnaire, null, 2);
}

async function saveQuestionnaireConfig() {
  syncConfigJson();
  elements.editorStatus.textContent = "保存中...";
  try {
    if (apiBase) {
      const payload = await apiRequest("/api/questionnaire", {
        method: "PUT",
        body: JSON.stringify({ questionnaire }),
      });
      questionnaire = payload.questionnaire;
    } else {
      saveLocalQuestionnaire();
    }
    state.answers = {};
    state.pageIndex = 0;
    renderSurvey();
    renderConfigEditor();
    elements.editorStatus.textContent = "已保存，填写页已更新。";
  } catch (error) {
    elements.editorStatus.textContent = `保存失败：${error.message}`;
  }
}

function seedDemoData() {
  if (state.submissions.length > 0) return;
  state.submissions = [
    {
      id: "SUB-DEMO-1",
      questionnaireId: questionnaire.id,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      answers: {
        name: "王同学",
        role: "学生",
        department: "管理学院",
        channels: ["导师推荐", "微信群"],
        satisfaction: 4,
        painPoint: "项目报名后材料分散在群文件和文档里，后期查找比较慢",
        priority: {
          项目发布与报名: 30,
          导师企业双向匹配: 25,
          过程材料归档: 35,
          成果展示与评估: 10,
        },
        expectation: "更方便的数据统计",
      },
      quality: { completion: 100, risk: 0 },
    },
    {
      id: "SUB-DEMO-2",
      questionnaireId: questionnaire.id,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      answers: {
        name: "李老师",
        role: "教师",
        department: "经济管理学院",
        channels: ["学院通知", "官网/公众号"],
        satisfaction: 3,
        painPoint: "企业需求、学生能力和导师意见缺少统一台账，过程追踪成本较高",
        priority: {
          项目发布与报名: 20,
          导师企业双向匹配: 40,
          过程材料归档: 25,
          成果展示与评估: 15,
        },
        expectation: "更稳定的权限与集成",
      },
      quality: { completion: 100, risk: 0 },
    },
  ];
  saveLocalSubmissions();
}

function bindEvents() {
  elements.adminOnly.forEach((element) => {
    element.hidden = !isAdminMode;
  });

  elements.navTabs.forEach((tab) => {
    tab.addEventListener("click", async () => {
      const view = tab.dataset.view;
      showView(view);
      if (view === "survey") renderSurvey();
      if (view === "admin") {
        await refreshSubmissions();
        renderAdmin();
      }
      if (view === "config") {
        renderConfigEditor();
      }
    });
  });

  elements.prevPage.addEventListener("click", () => {
    state.pageIndex = Math.max(0, state.pageIndex - 1);
    renderSurvey();
  });

  elements.nextPage.addEventListener("click", () => {
    const errors = validatePage();
    showErrors(errors);
    if (errors.length > 0) return;

    if (state.pageIndex === questionnaire.pages.length - 1) {
      renderReview();
      showView("review");
      return;
    }
    state.pageIndex += 1;
    renderSurvey();
  });

  elements.backToSurvey.addEventListener("click", () => {
    showView("survey");
    renderSurvey();
  });
  elements.submitSurvey.addEventListener("click", submitSurvey);
  elements.newSubmission.addEventListener("click", resetForm);
  document.querySelector("[data-jump-admin]")?.addEventListener("click", () => {
    showView("admin");
    renderAdmin();
  });
  elements.exportCsv.addEventListener("click", exportCsv);
  elements.resetDemo.addEventListener("click", async () => {
    if (apiBase) {
      try {
        const payload = await apiRequest("/api/demo/reset", { method: "POST" });
        state.apiMode = "api";
        state.apiError = null;
        state.submissions = payload.submissions || [];
      } catch (error) {
        state.apiMode = "local";
        state.apiError = error.message;
        localStorage.removeItem(storageKey);
        state.submissions = [];
        seedDemoData();
      }
    } else {
      localStorage.removeItem(storageKey);
      state.submissions = [];
      seedDemoData();
    }
    renderAdmin();
    resetForm();
  });
  elements.editorTitle.addEventListener("input", syncConfigJson);
  elements.editorDescription.addEventListener("input", syncConfigJson);
  elements.addPage.addEventListener("click", () => {
    questionnaire.pages.push(createPage());
    renderConfigEditor();
  });
  elements.saveQuestionnaire.addEventListener("click", saveQuestionnaireConfig);
  elements.generateQuestionnaire.addEventListener("click", generateQuestionnaireDraft);
  elements.checkQuestionnaire.addEventListener("click", checkCurrentQuestionnaire);
  elements.copyConfig.addEventListener("click", async () => {
    const configText = JSON.stringify(questionnaire, null, 2);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(configText);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = configText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    elements.copyConfig.textContent = "已复制";
    setTimeout(() => {
      elements.copyConfig.textContent = "复制配置";
    }, 1200);
  });
}

getAdminToken = function getAdminTokenOverride() {
  return sessionStorage.getItem(adminSessionKey) || window.SMART_SURVEY_ADMIN_TOKEN || "";
};

apiRequest = async function apiRequestOverride(path, options = {}) {
  if (!apiBase) {
    throw new Error("API is unavailable when opening index.html directly.");
  }
  const response = await fetch(`${apiBase}${path}`, buildRequestOptions(options));
  return parseApiResponse(response);
};

refreshSubmissions = async function refreshSubmissionsOverride() {
  if (!apiBase) {
    state.apiMode = "local";
    state.submissions = loadLocalSubmissions();
    if (state.submissions.length === 0) {
      seedDemoData();
    }
    return;
  }

  try {
    if (!isAdminLoggedIn()) {
      return;
    }
    const payload = await apiRequest("/api/submissions");
    state.apiMode = "api";
    state.apiError = null;
    state.submissions = payload.submissions || [];
  } catch (error) {
    state.apiMode = "local";
    state.apiError = error.message;
    state.submissions = loadLocalSubmissions();
    if (state.submissions.length === 0) {
      seedDemoData();
    }
  }
};

updateAccessUi = function updateAccessUi() {
  const isAdmin = isAdminLoggedIn();
  const isLoggedIn = Boolean(state.accessMode);
  const isLoginView = state.view === "login";

  document.body.classList.toggle("login-state", isLoginView && !isLoggedIn);

  elements.adminOnly.forEach((element) => {
    element.hidden = !isAdmin;
  });

  elements.navTabs.forEach((tab) => {
    const adminOnly = tab.hasAttribute("data-admin-only");
    tab.hidden = adminOnly && !isAdmin;
    tab.classList.toggle("active", tab.dataset.view === state.view);
  });

  if (elements.accessBadge) {
    elements.accessBadge.hidden = !isLoggedIn;
    elements.accessBadge.textContent = isAdmin ? "管理员已登录" : "访客模式";
  }

  if (elements.logoutButton) {
    elements.logoutButton.hidden = !isLoggedIn;
  }
};

showView = function showViewOverride(view) {
  if (!state.accessMode && view !== "login") {
    view = "login";
  }
  if (!isAdminLoggedIn() && ["admin", "config"].includes(view)) {
    view = "survey";
  }

  state.view = view;
  Object.entries(elements.views).forEach(([key, element]) => {
    element.classList.toggle("active", key === view);
  });

  const titles = {
    login: "选择登录方式",
    survey: "调研问卷填写",
    review: "提交前核对",
    success: "提交结果",
    admin: "数据中台",
    config: "问卷配置",
  };
  elements.viewTitle.textContent = titles[view];
  updateAccessUi();
};

const originalBindEvents = bindEvents;
bindEvents = function bindEventsOverride() {
  originalBindEvents();

  updateLoginTabUi("admin");

  elements.loginTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.dataset.loginTab;
      updateLoginTabUi(mode);
      clearLoginError();
    });
  });

  elements.adminPassword?.addEventListener("input", clearLoginError);
  elements.guestIdentity?.addEventListener("input", clearLoginError);
  elements.loginAgreement?.addEventListener("change", clearLoginError);

  elements.guestLoginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    clearLoginError();
    updateLoginTabUi("guest");

    if (!elements.loginAgreement?.checked) {
      showLoginError("请先勾选用户协议与隐私条款。");
      return;
    }

    setAdminSession("");
    state.accessMode = "guest";
    showView("survey");
    renderSurvey();
  });

  elements.adminLoginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearLoginError();
    updateLoginTabUi("admin");

    if (!elements.loginAgreement?.checked) {
      showLoginError("请先勾选用户协议与隐私条款。");
      return;
    }

    const password = elements.adminPassword.value.trim();
    if (!password) {
      showLoginError("请输入管理员密码。");
      return;
    }

    setAdminSession(password);
    try {
      if (apiBase) {
        await apiRequest("/api/submissions");
      } else {
        await refreshSubmissions();
      }
      elements.adminPassword.value = "";
      if (elements.adminAccount) {
        elements.adminAccount.value = "admin";
      }
      clearLoginError();
      await refreshSubmissions();
      renderAdmin();
      showView("admin");
    } catch (error) {
      setAdminSession("");
      showLoginError(error.message || "管理员登录失败。");
    }
  });

  elements.logoutButton?.addEventListener("click", () => {
    setAdminSession("");
    clearLoginError();
    updateLoginTabUi("admin");
    state.answers = {};
    state.pageIndex = 0;
    if (elements.guestIdentity) {
      elements.guestIdentity.value = "";
    }
    showView("login");
  });

  document.querySelector("[data-jump-admin]")?.addEventListener("click", async () => {
    if (!isAdminLoggedIn()) return;
    await refreshSubmissions();
    renderAdmin();
    showView("admin");
  });
};

const originalSubmitSurvey = submitSurvey;
submitSurvey = async function submitSurveyOverride() {
  await originalSubmitSurvey();
  updateAccessUi();
};

async function init() {
  bindEvents();
  await refreshQuestionnaire();
  if (!apiBase || isAdminLoggedIn()) {
    await refreshSubmissions();
  }
  renderConfigEditor();
  renderSurvey();
  renderAdmin();
  updateLoginTabUi("admin");
  showView(state.accessMode ? (isAdminLoggedIn() ? "admin" : "survey") : "login");
}

init();
