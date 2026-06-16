# GitHub 发布指南

本文档用于把项目整理并发布到 GitHub，适合放在简历、作品集或项目展示页中。

## 1. 发布前检查

确认以下文件不会提交：

```text
cloudbaserc.json
.env
node_modules/
dist/
output/
data/submissions.json
data/questionnaire.json
```

这些文件已经写入 `.gitignore`。其中 `cloudbaserc.json` 可能包含真实 CloudBase 环境 ID 和管理员令牌，不要公开。

## 2. 初始化 Git 仓库

在项目目录执行：

```bash
git init
git add .
git status
```

重点检查 `git status` 输出中不要出现：

```text
cloudbaserc.json
node_modules
dist
output
data/submissions.json
data/questionnaire.json
```

确认无误后提交：

```bash
git commit -m "feat: add smart questionnaire system"
```

## 3. 推送到 GitHub

在 GitHub 新建空仓库，例如：

```text
smart-questionnaire-system
```

然后执行：

```bash
git branch -M main
git remote add origin https://github.com/你的用户名/smart-questionnaire-system.git
git push -u origin main
```

## 4. GitHub Pages 展示方式

本项目可以使用 GitHub Pages 展示静态前端页面，但要注意：

- GitHub 仓库页面用于展示源码和 README
- GitHub Pages 用于展示静态前端效果
- CloudBase 继续承担问卷配置、数据提交和后台接口能力

推荐的展示结构：

```text
GitHub 仓库：源码 + README + 文档
GitHub Pages：静态前端演示页
CloudBase：在线表单接口与管理员后台能力
```

如果希望 GitHub Pages 连接 CloudBase，需要在 Pages 部署版的 `config.js` 中设置：

```js
window.SMART_SURVEY_API_BASE = "https://your-cloudbase-service-domain";
window.SMART_SURVEY_ADMIN_TOKEN = "";
```

不要在公开版 `config.js` 中写入管理员令牌。管理员应通过首页的“管理员登录”入口手动输入。

## 5. 简历写法参考

```text
智能问卷与数据中台系统
- 基于原生 JavaScript + Node.js + CloudBase 实现登录分流、动态问卷、后台配置、在线提交与数据看板
- 设计配置驱动的问卷模型，支持单选、多选、评分、100 分权重分配等题型，并实现前后端双重校验
- 改造访客登录 / 管理员登录双入口，区分填写场景与后台管理场景
- 支持 CloudBase 云函数与静态网站托管部署，形成可在线演示的完整项目闭环
```
