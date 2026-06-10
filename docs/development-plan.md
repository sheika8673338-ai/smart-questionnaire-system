# 开发路线

## 阶段 1：本地 MVP

已完成：

- 配置驱动渲染问卷
- 分页填写和必填校验
- 100 分权重分配校验
- 提交前整页核对
- 本地数据台账和 CSV 导出
- 自动洞察模拟

## 阶段 2：本地 Serverless API

已完成：

```text
前端 submitSurvey()
  -> POST /api/submissions
  -> server.mjs 服务端校验
  -> 字段映射 fieldMap
  -> data/submissions.json
  -> 数据中台读取 GET /api/submissions
```

这个阶段模拟的是 CloudBase 云函数中转层，重点是把“浏览器本地状态”升级成“前端 - API - 数据底座”的全链路。

## 阶段 3：CloudBase 迁移

已完成：

- 新增 `cloudfunctions/submissions` 云函数入口
- 新增 `shared/` 共享业务逻辑
- 本地 `server.mjs` 和云函数共用同一套校验、评分、字段映射
- 新增 `config.js`，支持把前端 API 切到 CloudBase HTTP 地址
- 新增 `scripts/sync-cloudfunction-shared.mjs`，让云函数部署包自包含

建议部署顺序：

1. 创建 CloudBase 环境和云函数 `submissions`。
2. 创建数据库集合 `survey_submissions`。
3. 运行 `node scripts/sync-cloudfunction-shared.mjs`。
4. 在 `cloudfunctions/submissions` 中运行 `npm install`。
5. 部署云函数并开启 HTTP 访问。
6. 将 `config.js` 中的 `SMART_SURVEY_API_BASE` 改成 CloudBase HTTP 访问地址。
7. 配置 CORS 白名单，并保留服务端校验。

## 阶段 4：腾讯文档 adapter

当前服务端已经生成 `fieldMap`，后续可以直接作为腾讯文档写入层的输入：

```json
{
  "姓名": "张三",
  "身份": "学生",
  "所属单位": "管理学院",
  "触达渠道": "导师推荐",
  "满意度": "4 分",
  "效率痛点": "过程材料分散，后续查找成本较高",
  "能力建设权重": "项目发布与报名 30分；过程材料归档 35分",
  "优先上线能力": "更方便的数据统计"
}
```

推荐结构：

```text
CloudBase 云函数
  -> validateAnswers()
  -> mapToTableFields()
  -> tableAdapter.writeRow(fieldMap)
  -> 返回 submissionId
```

## 阶段 5：AI 能力

优先做三个小而完整的能力：

1. 题目质量检查：识别重复题、诱导性题目、选项不互斥。
2. 问卷生成：输入调研目标，生成 `questionnaire.pages` 配置。
3. 开放题归因：对 `painPoint` 做主题聚类和摘要。
