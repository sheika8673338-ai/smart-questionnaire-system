# 智能问卷与数据中台系统

面向产学研基地协同场景的智能问卷系统复现项目，覆盖动态问卷配置、在线填写、数据提交、后台管理、CSV 导出、规则版 AI 问卷生成与质量检查等能力。

该项目用于复现简历中的“产学研基地-智能问卷与数据中台系统”，重点展示从问卷配置、数据采集到云端存储和分析看板的一体化能力。

## 在线体验

- 问卷填写页：<https://dev-cli-d2gckev9h4548a1a5-1314995236.tcloudbaseapp.com>
- 后台管理页：<https://dev-cli-d2gckev9h4548a1a5-1314995236.tcloudbaseapp.com/?admin=1>

说明：后台管理接口需要管理员令牌。公开仓库不会提交管理员令牌、云账号密钥或本地数据文件。

## 功能亮点

- 配置驱动问卷：通过 JSON 配置动态渲染分页、题目、题型和选项。
- 多题型支持：文本、长文本、单选、多选、评分、100 分权重分配。
- 填写质量控制：必填校验、权重合计校验、整页核对和提交前检查。
- 后台问卷编辑器：支持编辑标题、说明、分页、题目、题型、选项，并保存到云端。
- 规则版智能生成：根据调研目标自动生成问卷草案，覆盖基础信息、体验评价和改进优先级。
- 规则版质量检查：从标题、题量、题型覆盖、选项质量、重复字段、必填比例等维度给出评分和建议。
- 数据中台视图：展示提交数量、平均完成度、风险提示、提交明细和自动洞察。
- CSV 导出：将问卷提交记录按字段映射导出，便于后续统计分析。
- 云端部署：前端静态托管 + CloudBase 云函数 + 云数据库集合。
- 离线演示：直接打开页面或本地启动服务时可使用 `localStorage`/JSON 文件 fallback。

## 技术架构

```text
浏览器前端
  ├─ 动态问卷渲染
  ├─ 后台问卷编辑器
  ├─ 规则版 AI 生成与质检
  └─ 数据看板与 CSV 导出

CloudBase
  ├─ 静态网站托管
  ├─ 云函数 submissions
  └─ 云数据库集合
      ├─ survey_submissions
      └─ survey_questionnaires

本地开发
  ├─ Node.js server.mjs
  ├─ data/submissions.json
  └─ data/questionnaire.json
```

## 项目结构

```text
.
├── app.js                         # 前端交互、问卷渲染、后台编辑器、规则版智能逻辑
├── index.html                     # 页面结构
├── styles.css                     # 页面样式
├── server.mjs                     # 本地 API 服务
├── config.js                      # 前端 API 地址配置，公开版本不写敏感信息
├── config.example.js              # 配置示例
├── cloudbaserc.example.json       # CloudBase 配置示例
├── cloudfunctions/submissions     # CloudBase 云函数
├── shared                         # 前后端共享问卷与校验逻辑
├── scripts                        # 打包、同步、部署脚本
└── docs                           # 开发计划与部署说明
```

## 本地运行

安装依赖：

```bash
npm install
```

启动本地服务：

```bash
npm run dev
```

默认访问：

```text
http://localhost:4173
```

如果端口被占用，可以指定端口：

```powershell
$env:PORT=5173
npm run dev
```

## 常用命令

```bash
npm run check
npm run build:deploy
npm run sync:cloudfunction
```

## API 概览

```http
GET  /api/questionnaire
PUT  /api/questionnaire
GET  /api/submissions
POST /api/submissions
POST /api/demo/reset
```

其中 `PUT /api/questionnaire`、`GET /api/submissions`、`POST /api/demo/reset` 属于后台能力，需要管理员令牌。

## CloudBase 部署

1. 复制配置示例：

```bash
copy cloudbaserc.example.json cloudbaserc.json
```

2. 修改 `cloudbaserc.json`：

```json
{
  "envId": "your-cloudbase-env-id",
  "functions": [
    {
      "name": "submissions",
      "envVariables": {
        "SUBMISSIONS_COLLECTION": "survey_submissions",
        "QUESTIONNAIRE_COLLECTION": "survey_questionnaires",
        "ADMIN_TOKEN": "replace-with-a-random-admin-token"
      }
    }
  ]
}
```

3. 修改生产环境前端配置：

```js
window.SMART_SURVEY_API_BASE = "https://your-cloudbase-service-domain";
window.SMART_SURVEY_ADMIN_TOKEN = "";
```

4. 打包部署：

```bash
npm run build:deploy
npm run deploy:cloudbase
```

更多细节见 [docs/cloudbase-deploy.md](docs/cloudbase-deploy.md)。

## GitHub 展示建议

公开 GitHub 仓库建议提交：

- 源码文件：`index.html`、`app.js`、`styles.css`、`server.mjs`
- 云函数源码：`cloudfunctions/submissions`
- 共享逻辑：`shared`
- 文档和脚本：`docs`、`scripts`
- 示例配置：`config.example.js`、`cloudbaserc.example.json`

不要提交：

- `cloudbaserc.json`
- `.env` / `.env.*`
- `node_modules`
- `dist`
- `output`
- `data/submissions.json`
- `data/questionnaire.json`

## 后续优化方向

- 接入真实大模型 API，实现自然语言生成问卷、题目去重和开放题归因。
- 增加登录与角色权限，区分管理员、运营人员和普通填写者。
- 增加问卷版本管理，支持历史版本回滚和 A/B 问卷。
- 接入腾讯文档或 BI 看板，实现更完整的数据分析链路。
