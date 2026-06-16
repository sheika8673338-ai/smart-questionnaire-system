# 对外发布检查清单

## 推荐分享方式

对外填写链接：

```text
https://your-domain/
```

管理员进入方式：

- 打开首页
- 选择“管理员登录”
- 输入管理员密码 / 管理员令牌

默认公开页面应展示登录分流与问卷填写入口，不应再依赖 `?admin=1` 这类旧入口参数。

## 部署前必须处理

1. 不要把 `data/submissions.json` 作为生产数据提交到仓库
2. 生产环境设置 `ADMIN_TOKEN`，保护 `GET /api/submissions` 和 `POST /api/demo/reset`
3. 在 `config.js` 中配置云函数 HTTP 地址
4. 不要在公开版 `config.js` 中写入 `SMART_SURVEY_ADMIN_TOKEN`
5. CloudBase 数据库创建集合 `survey_submissions`
6. CloudBase 数据库创建集合 `survey_questionnaires`
7. 部署前运行 `node scripts/sync-cloudfunction-shared.mjs`

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
  -> survey_questionnaires
```

## 体验优化建议

- 对外链接只发普通首页地址
- 管理员通过首页登录进入后台，不再传播旧的参数化后台地址
- 后台修改问卷后，用访客入口实际检查一次填写流程
- 正式发布前清空演示数据，避免别人看到测试记录
- 用真实项目名称、调研说明和联系人替换示例文案
- 用移动端打开测试一次，确认每道题都能顺利填写
