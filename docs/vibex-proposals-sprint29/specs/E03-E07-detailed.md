# E03: AI 辅助需求解析 — 详细规格

## 1. 背景

Sprint 28 E03 实现 AI 辅助需求解析功能，ClarifyStep 文本输入后由 AI 解析为结构化 JSON，Sprint 29 基于 S28 交付物补充本规格文档。

## 2. 范围

- /api/ai/clarify endpoint（S28 已实现）
- ClarifyAI.tsx 组件（S28 已实现）
- 降级路径（S28 已实现）
- 本规格补全 API schema 定义和降级路径详细逻辑

## 3. API 规格

### 3.1 POST /api/ai/clarify

**Request**
```json
{
  "rawText": "我想做一个登录功能，包括用户名密码和手机验证码",
  "projectId": "proj_xxx"
}
```

**Response 200**
```json
{
  "structured": {
    "featureName": "登录功能",
    "scenarios": [
      {
        "id": "s1",
        "title": "用户名密码登录",
        "steps": ["输入用户名", "输入密码", "点击登录"]
      },
      {
        "id": "s2",
        "title": "手机验证码登录",
        "steps": ["输入手机号", "获取验证码", "输入验证码", "点击登录"]
      }
    ],
    "priority": "P1",
    "tags": ["auth", "login"]
  },
  "raw": "我想做一个登录功能，包括用户名密码和手机验证码"
}
```

**Response 500 (timeout/fallback)**
```json
{
  "structured": null,
  "raw": "我想做一个登录功能，包括用户名密码和手机验证码",
  "fallback": true,
  "reason": "AI_TIMEOUT | AI_UNAVAILABLE | NO_API_KEY"
}
```

### 3.2 降级路径

| 场景 | 行为 | 用户体验 |
|------|------|---------|
| 无 API Key | 返回 `{ structured: null, fallback: true }` | 显示引导提示"请配置 AI"，不阻断 |
| 超时 30s | 降级为规则引擎解析 | 显示"AI 繁忙，使用默认模板"，不阻断 |
| AI 返回异常 | 返回 `{ structured: null, fallback: true }` | 显示"解析失败"，不阻断 |
| 正常返回 | `{ structured: {...} }` | 显示结构化预览，正常流转 |

## 4. DoD

- [ ] /api/ai/clarify 单元测试覆盖 happy path + 3 种降级路径
- [ ] ClarifyAI.tsx 在 ClarifyStep 正确渲染（gstack 验证）
- [ ] 无 API Key 时不阻断 Onboarding
- [ ] 超时 30s 降级路径可触发
- [ ] TS 编译 0 errors

---

## E04: 模板 API 完整 CRUD — 详细规格

## 1. 背景

Sprint 28 E04 实现模板 API 完整 CRUD，POST/PUT/DELETE 已添加到 /api/v1/templates，Sprint 29 基于 S28 交付物补充本规格文档。

## 2. 范围

- S04.1: CRUD API 端点（S28 已实现）
- S04.2: /dashboard/templates 页面（S28 已实现）
- S04.3: JSON 导入导出（S28 已实现）
- 本规格补全 API schema 定义和 Dashboard UI 布局

## 3. API 规格

### 3.1 POST /api/v1/templates

**Request**
```json
{
  "name": "登录模板",
  "description": "标准登录流程模板",
  "nodes": [...],
  "tags": ["auth", "template"]
}
```

**Response 201**
```json
{
  "id": "tpl_xxx",
  "name": "登录模板",
  "description": "标准登录流程模板",
  "nodes": [...],
  "tags": ["auth", "template"],
  "createdAt": "2026-05-07T00:00:00Z",
  "updatedAt": "2026-05-07T00:00:00Z"
}
```

### 3.2 PUT /api/v1/templates/:id

**Request**
```json
{
  "name": "登录模板 v2",
  "description": "更新后的描述"
}
```

**Response 200**
```json
{
  "id": "tpl_xxx",
  "name": "登录模板 v2",
  "description": "更新后的描述",
  "updatedAt": "2026-05-07T00:01:00Z"
}
```

### 3.3 DELETE /api/v1/templates/:id

**Response 200**
```json
{
  "deleted": true,
  "id": "tpl_xxx"
}
```

**后续 GET /api/v1/templates/:id → 404**

### 3.4 Dashboard UI 布局

```
/dashboard/templates
├── Header: "模板库" + "新建模板" 按钮
├── SearchBar: 搜索模板名称/标签
├── TemplateGrid: 模板卡片列表
│   ├── 每个卡片: 名称 + 描述 + 标签 + 操作按钮
│   ├── 操作: 编辑 / 导出 / 删除
│   └── 导入按钮: "导入 JSON"
└── Modal: 新建/编辑模板表单
```

## 4. DoD

- [ ] POST/PUT/DELETE API 端点测试覆盖 201/200/404 响应
- [ ] /dashboard/templates 页面在 localhost 可访问
- [ ] 新建/编辑/删除全链路测试通过
- [ ] JSON 导入导出测试覆盖 valid + invalid JSON
- [ ] TS 编译 0 errors

---

## E06: Canvas 错误边界完善 — 详细规格

## 1. 背景

Sprint 28 E06 实现 DDSCanvasPage ErrorBoundary，DDSCanvasPage（Design Output 第三栏）无 ErrorBoundary 会导致崩溃白屏，Sprint 29 基于 S28 交付物补充本规格文档。

## 2. 范围

- DDSCanvasPage ErrorBoundary 包裹（S28 已实现）
- Fallback UI 设计（已在 S28 E06 完成）
- 本规格补全边界条件和 Fallback 设计详情

## 3. ErrorBoundary 设计

### 3.1 DDSCanvasPage 包裹位置

```tsx
// app/canvas/[id]/components/DDSCanvasPage.tsx
import { TreeErrorBoundary } from '@/components/canvas/ErrorBoundary/TreeErrorBoundary'

export default function DDSCanvasPage() {
  return (
    <TreeErrorBoundary
      fallbackComponent={<DDSFallbackUI />}
    >
      <DDSContent />
    </TreeErrorBoundary>
  )
}
```

### 3.2 Fallback UI 设计

```tsx
// DDSFallbackUI.tsx
const DDSFallbackUI = () => (
  <div className="dds-fallback">
    <div className="fallback-icon">⚠️</div>
    <div className="fallback-title">渲染失败</div>
    <div className="fallback-desc">Design Output 组件出错，请尝试重试</div>
    <button
      className="fallback-retry-btn"
      onClick={() => window.location.reload()}
    >
      重试
    </button>
  </div>
)
```

### 3.3 样式
```css
.dds-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
  background: #fafafa;
  border: 1px dashed #ccc;
  border-radius: 8px;
}
.fallback-icon { font-size: 48px; }
.fallback-title { font-size: 18px; font-weight: bold; color: #333; }
.fallback-desc { font-size: 14px; color: #666; margin: 8px 0; }
.fallback-retry-btn {
  padding: 8px 24px;
  background: #0070f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
```

### 3.4 边界条件

| 场景 | 行为 |
|------|------|
| DDSCanvasPage render throw | 显示 Fallback UI，不整页白屏 |
| Fallback 内 throw | 抛出错误，上层 ErrorBoundary 捕获 |
| 点击"重试" | `window.location.reload()` 全页刷新 |
| 无网络时崩溃 | Fallback + 离线 banner（可叠加） |

## 4. DoD

- [ ] DDSCanvasPage 渲染时模拟 `throw new Error()` 能触发 Fallback
- [ ] Fallback 包含"渲染失败"文本 + "重试"按钮
- [ ] 点击"重试"后组件恢复（当前全页刷新，后续优化为局部刷新）
- [ ] TS 编译 0 errors
- [ ] gstack 验证 DDSCanvasPage 崩溃后不白屏

---

## E07: MCP Server 集成完善 — 详细规格

## 1. 背景

Sprint 28 E07 实现 MCP Server 集成完善，GET /api/mcp/health endpoint 和集成测试在 S28 中已实现部分，Sprint 29 补全本规格文档。

## 2. 范围

- GET /api/mcp/health endpoint（S28 已实现）
- MCP 集成测试套件（S28 已实现）
- Claude Desktop 配置文档（S28 已更新）
- 本规格补全健康检查协议和集成测试用例详情

## 3. 健康检查协议

### 3.1 GET /api/mcp/health

**Request**
```
GET /api/mcp/health
```

**Response 200**
```json
{
  "status": "ok",
  "timestamp": "2026-05-07T06:00:00.000Z",
  "version": "1.0.0"
}
```

**Response 503**
```json
{
  "status": "error",
  "timestamp": "2026-05-07T06:00:00.000Z",
  "error": "MCP_SERVER_UNAVAILABLE"
}
```

### 3.2 健康检查触发条件

| 触发条件 | 行为 |
|---------|------|
| 服务正常运行 | 返回 200 `{ status: "ok" }` |
| 服务启动中 | 返回 503 `{ status: "error" }` |
| 依赖服务异常 | 返回 503 `{ status: "error" }` |

## 4. MCP 集成测试用例

### 4.1 mcp-integration.spec.ts 测试用例

```ts
// tests/e2e/mcp-integration.spec.ts

test('MCP health check returns ok', async ({ page }) => {
  const res = await page.request.get('/api/mcp/health')
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.status).toBe('ok')
  expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
})

test('MCP server tools are callable', async ({ page }) => {
  // 模拟 MCP 协议调用 VibeX tools
  const res = await page.request.post('/api/mcp/tools', {
    data: { tool: 'list_projects', params: {} }
  })
  expect(res.status()).toBe(200)
  expect(res.ok()).toBe(true)
})

test('Claude Desktop connection via MCP', async ({ page }) => {
  // 验证 MCP 配置文档中的连接步骤可用
  await page.goto('/docs/mcp-claude-desktop-setup')
  await expect(page.locator('h1')).toContainText('Claude Desktop')
})
```

## 5. DoD

- [ ] GET /api/mcp/health 返回 200，body.status === "ok"
- [ ] mcp-integration.spec.ts E2E 测试 100% 通过
- [ ] docs/mcp-claude-desktop-setup.md 更新并可读
- [ ] TS 编译 0 errors
