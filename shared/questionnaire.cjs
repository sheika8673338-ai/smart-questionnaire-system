const questionnaire = {
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

function allQuestions() {
  return questionnaire.pages.flatMap((page) => page.questions);
}

module.exports = {
  questionnaire,
  allQuestions,
};
