# AGENTS.md — canvas-api-500-fix 开发约束

**项目**: canvas-api-500-fix
**日期**: 2026-04-04
**仓库**: /root/.openclaw/vibex

---

## 1. 开发约束

### 1.1 API Route 黄金法则

```typescript
// ✅ 正确：所有路径返回 NextResponse.json()
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (invalid) return NextResponse.json({ ... }, { status: 400 });
    if (missingKey) return NextResponse.json({ ... }, { status: 500 });
    // ...
    return NextResponse.json({ success: true, ... });
  } catch (err) {
    // ✅ 正确：catch 块返回 JSON，不抛出
    return NextResponse.json({ success: false, ... }, { status: 500 });
  }
}

// ❌ 错误：抛出异常
throw new Error('something');  // ← 禁止
```

### 1.2 输入验证顺序

```
1. body 解析（null check）
2. requirementText 非空验证
3. API Key 存在性检查
4. AI 服务调用
5. 结果处理
```

### 1.3 AI 服务调用约束

```typescript
// ✅ 正确：添加 .catch()
const result = await aiService.generateJSON(...).catch(err => ({
  success: false, error: err.message, data: null,
}));

// ❌ 错误：无防御性 .catch()
const result = await aiService.generateJSON(...);  // ← 可能抛未捕获异常
```

### 1.4 响应格式约束

```typescript
// ✅ 正确：所有响应包含统一字段
{ success: boolean, contexts?: T[], generationId?: string, confidence?: number, error?: string }

// ❌ 错误：部分响应缺少字段
{ success: true }  // ← 必须包含 contexts
```

---

## 2. Git 提交规范

```bash
fix(api): generate-contexts 添加输入验证 + API Key 检查
fix(api): generate-contexts 添加 .catch() 防止 500 崩溃
feat(api): 新增 /api/v1/canvas/health 健康检查端点
test(api): generate-contexts 单元测试
test(api): health 端点单元测试
```

---

## 3. 代码审查清单

### E1-F1 输入验证
- [ ] 空字符串 `''` 返回 400
- [ ] 纯空白 `'   '` 返回 400
- [ ] 缺少字段返回 400
- [ ] 错误信息包含 'requirementText'

### E1-F2 API Key 检查
- [ ] 无 API Key 时返回 500
- [ ] 错误信息明确说明是配置问题

### E1-F3 AI 服务 .catch()
- [ ] `.catch()` 存在
- [ ] catch 中返回 `{ success: false, ... }`
- [ ] 不再抛出未捕获异常

### E2-S1 健康检查
- [ ] 返回 `status` / `hasApiKey` / `timestamp`
- [ ] 无 API Key 时 503 状态码

---

## 4. 测试规范

```typescript
// __tests__/generate-contexts.test.ts
describe('E1-F1: 输入验证', () => {
  it('空字符串 → 400', async () => { ... });
  it('空白字符串 → 400', async () => { ... });
  it('缺少字段 → 400', async () => { ... });
});

describe('E1-F2: API Key', () => {
  it('无 API Key → 500 + error', async () => { ... });
});

describe('E1-F3: AI 服务', () => {
  it('.catch() 防御 → 不崩溃', async () => { ... });
  it('成功时 → 200 + success', async () => { ... });
});
```

---

## 5. 回滚条件

| 触发条件 | 回滚操作 |
|---------|---------|
| API 返回 500 崩溃 | `git checkout HEAD -- generate-contexts/route.ts` |
| 健康检查端点返回错误 | `git checkout HEAD -- health/route.ts` |

---

*本文档由 Architect Agent 生成于 2026-04-05 00:03 GMT+8*
