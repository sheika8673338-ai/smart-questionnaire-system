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

本项目可以用 GitHub Pages 展示前端页面，但 GitHub Pages 只能托管静态文件，不能运行 Node 服务或云函数。

推荐展示方式：

```text
GitHub 仓库：展示源码和 README
GitHub Pages：展示静态前端
CloudBase：继续提供问卷配置、提交数据和后台接口
```

如果要让 GitHub Pages 页面连接 CloudBase，需要在 Pages 发布版本的 `config.js` 中设置：

```js
window.SMART_SURVEY_API_BASE = "https://your-cloudbase-service-domain";
window.SMART_SURVEY_ADMIN_TOKEN = "";
```

不要在 `config.js` 中写入管理员令牌。后台打开 `/?admin=1` 时手动输入即可。

## 5. 简历写法参考

```text
智能问卷与数据中台系统
- 基于原生 JavaScript + Node.js + CloudBase 实现动态问卷、后台配置、云端提交和数据看板。
- 设计配置驱动问卷模型，支持单选、多选、评分、100 分权重分配等题型，并实现前后端双重校验。
- 实现规则版智能问卷助手，可根据调研目标生成问卷草案，并从题量、题型覆盖、选项质量、字段重复等维度进行质量评分。
- 支持 CloudBase 云函数与云数据库部署，形成可公开访问的在线演示版本。
```
