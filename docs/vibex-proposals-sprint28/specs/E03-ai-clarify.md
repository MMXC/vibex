# E03: AI 辅助需求解析 — 详细规格

## 1. 背景

Sprint 28 E03 实现 AI 辅助需求解析功能，ClarifyStep 文本输入后由 AI 解析为结构化 JSON，提供角色/目标/约束提取能力。

## 2. API 规格

### 2.1 POST /api/ai/clarify

**Request Body**
```json
{
  "requirement": "我想做一个登录功能，包括用户名密码和手机验证码"
}
```

**Response 200**（成功）
```json
{
  "role": "用户",
  "goal": "登录功能",
  "constraints": ["用户名密码登录", "手机验证码"],
  "raw": "我想做一个登录功能，包括用户名密码和手机验证码",
  "parsed": {
    "role": "用户",
    "goal": "登录功能",
    "constraints": ["用户名密码登录", "手机验证码"]
  }
}
```

**Response 200**（无 API Key / 降级）
```json
{
  "role": null,
  "goal": "我想做一个登录功能，包括用户名密码和手机验证码",
  "constraints": [],
  "raw": "我想做一个登录功能，包括用户名密码和手机验证码",
  "parsed": null,
  "guidance": "请配置 OPENAI_API_KEY 以启用 AI 辅助功能"
}
```

**Response 200**（超时降级）
```json
{
  "role": null,
  "goal": "我想做一个登录功能，包括用户名密码和手机验证码",
  "constraints": [],
  "raw": "...",
  "parsed": null,
  "guidance": "AI 响应超时，已降级为手动输入模式"
}
```

**Response 400**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "requirement is required"
}
```

## 3. 降级路径详细逻辑

| 场景 | 触发条件 | 响应 | guidance |
|------|----------|------|----------|
| 无 API Key | `process.env.OPENAI_API_KEY` 为空 | `parsed: null` | "请配置 OPENAI_API_KEY..." |
| AI 超时 | 30s 内未响应 | `parsed: null` | "AI 响应超时..." |
| JSON 解析失败 | AI 返回非 JSON | `parsed: null` | 无（静默降级） |
| API 返回错误 | OpenAI 返回非 200 | `parsed: null` | 无（静默降级） |
| 网络异常 | fetch 抛出异常 | `parsed: null` | 无（静默降级） |

## 4. 实现约束

- 模型: `gpt-3.5-turbo`
- Temperature: 0.3
- Max tokens: 500
- 超时: 30,000ms
- 不暴露 API Key 在前端

## 5. 验收门控

- [ ] POST /api/ai/clarify 返回 `{ role, goal, constraints, raw, parsed }`
- [ ] 无 API Key 返回 guidance 提示
- [ ] 超时返回 `parsed: null` + guidance
- [ ] requirement 为空返回 400
- [ ] `tsc --noEmit` exits 0