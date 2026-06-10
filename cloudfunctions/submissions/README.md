# submissions 云函数

这个目录是 CloudBase 迁移阶段的云函数实现，用于替代本地 `server.mjs` 中的 `/api/submissions`。

## 路由

- `GET /api/submissions`：读取最近 100 条提交记录
- `POST /api/submissions`：校验并新增提交记录
- `POST /api/demo/reset`：重置演示数据

## 环境变量

- `SUBMISSIONS_COLLECTION`：数据库集合名，默认 `survey_submissions`

## 数据库集合

在 CloudBase 数据库中创建集合：

```text
survey_submissions
```

每条记录会包含：

- `id`
- `questionnaireId`
- `createdAt`
- `answers`
- `quality`
- `fieldMap`

## 说明

云函数入口使用本目录下的 `shared/`。部署前运行：

```bash
node scripts/sync-cloudfunction-shared.mjs
```

这样会把项目根目录的共享校验逻辑复制进云函数目录，保证部署包自包含。
