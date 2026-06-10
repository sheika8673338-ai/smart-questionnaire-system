const { questionnaire } = require("./questionnaire.cjs");

function demoSubmissions() {
  return [
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
}

module.exports = {
  demoSubmissions,
};
