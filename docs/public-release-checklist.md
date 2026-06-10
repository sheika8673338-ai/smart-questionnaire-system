# 对外发布检查清单

## 推荐分享方式

对外填写链接：

```text
https://your-domain/
```

管理端链接：

```text
https://your-domain/?admin=1
```

默认页面只展示填写问卷；只有本地环境或带 `?admin=1` 的链接才显示“数据中台、问卷配置、重置演示数据”。

## 部署前必须处理

1. 不要把 `data/submissions.json` 作为生产数据提交到仓库。
2. 生产环境设置 `ADMIN_TOKEN`，保护 `GET /api/submissions` 和 `POST /api/demo/reset`。
3. 在 `config.js` 中配置云函数 HTTP 地址。
4. 如果配置了 `ADMIN_TOKEN`，管理端本地 `config.js` 也要填写 `SMART_SURVEY_ADMIN_TOKEN`。
5. CloudBase 数据库创建集合 `survey_submissions`。
6. CloudBase 数据库创建集合 `survey_questionnaires`。
7. 部署前运行 `node scripts/sync-cloudfunction-shared.mjs`。

## 推荐部署结构

```text
CloudBase 静态网站托管
  -> index.html / styles.css / app.js / config.js

CloudBase 云函数 submissions
  -> GET /api/submissions
  -> POST /api/submissions
  -> POST /api/demo/reset

CloudBase 数据库
  -> survey_submissions
```

## 体验优化建议

- 对外链接只发普通地址，不带 `?admin=1`。
- 管理链接只自己使用，并配合 `ADMIN_TOKEN`。
- 后台修改问卷后，用普通链接打开一次，确认用户看到的是新题目。
- 第一次发布前清空演示数据，避免别人看到测试记录。
- 用真实项目名称、调研说明和联系人替换当前示例文案。
- 移动端打开测试一次，确认每道题都能顺利填写。
