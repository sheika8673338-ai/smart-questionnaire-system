# CloudBase 部署说明

## 需要你准备

- 腾讯云账号已登录
- 已创建 CloudBase 环境
- 环境 ID，例如 `xxx-123456`
- 一个管理令牌，例如随机字符串 `survey-admin-2026-xxxx`

## 方式 A：用 CloudBase CLI 登录

```bash
npx cloudbase login
```

如果当前终端无法弹出登录，请在本机 PowerShell 里手动执行。

## 方式 B：用密钥登录

在腾讯云控制台创建 SecretId / SecretKey 后执行：

```bash
npx cloudbase login --apiKeyId 你的SecretId --apiKey 你的SecretKey
```

## 部署

```powershell
.\scripts\deploy-cloudbase.ps1 -EnvId 你的环境ID -AdminToken 你的管理令牌
```

如果自动推断的云函数 HTTP 地址不对，可以手动指定：

```powershell
.\scripts\deploy-cloudbase.ps1 -EnvId 你的环境ID -AdminToken 你的管理令牌 -ApiBase "https://你的HTTP访问域名"
```

## 部署后访问

对外填写链接：

```text
https://你的静态网站域名/
```

管理后台：

```text
https://你的静态网站域名/?admin=1
```

首次进入后台会提示输入管理令牌。

## 常见问题

- 如果 `GET /api/submissions` 返回 401：说明管理令牌未输入或输入错误。
- 如果提交失败：检查 `frontend/config.js` 中的 `SMART_SURVEY_API_BASE` 是否为云函数 HTTP 地址。
- 如果静态网站没有域名：需要在 CloudBase 控制台开启静态网站托管。
- 如果数据库写入失败：在 CloudBase 数据库中创建集合 `survey_submissions`。
- 如果问卷编辑保存失败：在 CloudBase 数据库中创建集合 `survey_questionnaires`。
