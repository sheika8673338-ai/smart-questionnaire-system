const { questionnaire: defaultQuestionnaire } = require("./questionnaire.cjs");

function createSubmission(payload, activeQuestionnaire = defaultQuestionnaire) {
  if (!payload || payload.questionnaireId !== activeQuestionnaire.id) {
    throw httpError(400, "Invalid questionnaireId");
  }

  const answers = payload.answers || {};
  const errors = validateAnswers(answers, activeQuestionnaire);
  if (errors.length > 0) {
    throw httpError(422, errors.join("; "));
  }

  return {
    id: makeSubmissionId(),
    questionnaireId: activeQuestionnaire.id,
    createdAt: new Date().toISOString(),
    answers,
    quality: buildQualityScore(answers, activeQuestionnaire),
    fieldMap: mapToTableFields(answers, activeQuestionnaire),
  };
}

function validateAnswers(answers, activeQuestionnaire = defaultQuestionnaire) {
  return allQuestions(activeQuestionnaire).flatMap((question) => {
    const answer = answers[question.id];
    const errors = [];

    if (question.required && isEmptyAnswer(answer, question.type)) {
      errors.push(`${question.tableField} is required`);
    }

    if (question.type === "rating" && !isEmptyAnswer(answer, question.type)) {
      const score = Number(answer);
      if (!Number.isFinite(score) || score < question.min || score > question.max) {
        errors.push(`${question.tableField} must be between ${question.min} and ${question.max}`);
      }
    }

    if (question.type === "weight100" && !isEmptyAnswer(answer, question.type)) {
      const total = sumWeight(answer);
      if (total !== 100) {
        errors.push(`${question.tableField} total must equal 100, got ${total}`);
      }
      const hasInvalid = Object.values(answer).some((value) => Number(value) < 0 || Number(value) > 100);
      if (hasInvalid) {
        errors.push(`${question.tableField} values must be between 0 and 100`);
      }
    }

    return errors;
  });
}

function buildQualityScore(answers, activeQuestionnaire = defaultQuestionnaire) {
  const questions = allQuestions(activeQuestionnaire);
  const completion = Math.round(
    (questions.filter((question) => !isEmptyAnswer(answers[question.id], question.type)).length / questions.length) * 100,
  );
  const painPoint = answers.painPoint || "";
  const fastPatternRisk = painPoint.length > 0 && painPoint.length < 8 ? 1 : 0;
  const lowSatisfaction = Number(answers.satisfaction) <= 2 ? 1 : 0;
  return {
    completion,
    risk: fastPatternRisk + lowSatisfaction,
  };
}

function mapToTableFields(answers, activeQuestionnaire = defaultQuestionnaire) {
  return Object.fromEntries(
    allQuestions(activeQuestionnaire).map((question) => [question.tableField, formatAnswer(question, answers[question.id])]),
  );
}

function allQuestions(activeQuestionnaire = defaultQuestionnaire) {
  return (activeQuestionnaire.pages || []).flatMap((page) => page.questions || []);
}

function formatAnswer(question, answer) {
  if (isEmptyAnswer(answer, question.type)) return "";
  if (question.type === "multi") return answer.join("、");
  if (question.type === "weight100") {
    return Object.entries(answer)
      .map(([key, value]) => `${key} ${value}分`)
      .join("；");
  }
  if (question.type === "rating") return `${answer} 分`;
  return String(answer);
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

function makeSubmissionId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SUB-${stamp}-${suffix}`;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

module.exports = {
  createSubmission,
  validateAnswers,
  buildQualityScore,
  mapToTableFields,
  formatAnswer,
  isEmptyAnswer,
  sumWeight,
  httpError,
};
