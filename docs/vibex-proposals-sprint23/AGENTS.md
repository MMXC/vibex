# VibeX Sprint 23 开发约束

**项目**: vibex-proposals-sprint23
**架构师**: Architect Agent
**日期**: 2026-05-03

---

## 1. 开发约束总览

| Epic | 约束类型 | 约束内容 |
|------|---------|---------|
| E1 | 代码位置 | `.github/workflows/test.yml` + `scripts/e2e-summary-slack.ts` |
| E2 | 组件命名 | `data-testid="re-review-btn"`, `data-testid="diff-view"` |
| E3 | 文件位置 | `src/components/presence/RemoteCursor.tsx` |
| E4 | 导出格式 | `.puml`, `.svg`, `.schema.json` |
| E5 | 存储限制 | localStorage key `template:${id}:history`, 最多 10 个 snapshot |

---

## 2. Epic E1: E2E CI 闭环落地

### 2.1 约束清单

```yaml
文件位置:
  workflow: .github/workflows/test.yml
  script: scripts/e2e-summary-slack.ts

必须环境变量:
  SLACK_WEBHOOK_URL: Slack Webhook URL

CI 配置:
  e2e job 末尾步骤: pnpm exec ts-node scripts/e2e-summary-slack.ts
  超时: 30s
  报告路径: test-results/*.json

Slack 消息格式:
  Block Kit: section + context
  内容: pass/fail 摘要 + 失败用例列表
  目标频道: #analyst-channel

禁止:
  - 报告脚本失败导致 CI exit code 非零（脚本错误不影响 job 状态）
  - 在非 e2e job 中调用报告脚本
```

### 2.2 代码规范

```typescript
// scripts/e2e-summary-slack.ts
interface E2EReportPayload {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  artifacts: string;
  runUrl: string;
  timestamp: string;
}

// 必须: parse test-results/*.json
// 必须: generate Block Kit payload
// 必须: POST to $SLACK_WEBHOOK_URL
// 禁止: throw 导致 CI 失败（catch 并 log error）
```

---

## 3. Epic E2: Design Review 反馈闭环

### 3.1 约束清单

```yaml
组件位置:
  ReviewReportPanel: src/components/confirm/ReviewReportPanel.tsx
  useDesignReview: src/hooks/useDesignReview.ts
  DiffView: src/components/confirm/DiffView.tsx

API 端点:
  review_design: POST /design/review
  review_diff: POST /design/review-diff

测试 ID:
  re-review-btn: 重新评审按钮
  diff-view: diff 视图容器
  diff-item-added: added 项目（红色）
  diff-item-removed: removed 项目（绿色）

样式规范:
  added: text-red-500 (CSS class)
  removed: text-green-500 (CSS class)
  使用 CSS Modules，不允许内联 style

禁止:
  - diff 计算在前端处理超过 100ms
  - 不支持 previousReportId 参数时渲染 diff 视图
```

### 3.2 Diff 算法约束

```typescript
// src/lib/reviewDiff.ts
interface ReviewDiff {
  added: ReviewItem[];
  removed: ReviewItem[];
  unchanged: ReviewItem[];
}

// 约束:
// - 基于 reviewItem.id 比对
// - 相同 id 不同 score 视为 changed（归入 added + removed）
// - 评分变化显示 scoreDelta
// - 新报告有旧报告无 → added
// - 新报告无旧报告有 → removed
// - 新旧都有且相同 → unchanged
```

---

## 4. Epic E3: Firebase Cursor Sync 基础

### 4.1 约束清单

```yaml
文件位置:
  presence.ts: src/lib/firebase/presence.ts
  RemoteCursor: src/components/presence/RemoteCursor.tsx
  useCursorSync: src/hooks/useCursorSync.ts

Firebase 类型:
  cursor: {
    x: number;
    y: number;
    nodeId: string | null;
    timestamp: number;
  }

Throttle 约束:
  鼠标移动: 100ms debounce write
  使用 lodash.debounce 或手写实现

Mock 模式:
  isMockMode prop 控制
  mock 模式下 RemoteCursor 不渲染
  firebaseMock.ts 已实现，不需要新建 mock

禁止:
  - cursor 写入不 throttle
  - mock 模式下渲染 RemoteCursor
  - 使用非 Firebase 的实时同步方案
```

### 4.2 RemoteCursor 组件规范

```tsx
// src/components/presence/RemoteCursor.tsx
interface RemoteCursorProps {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  nodeId?: string | null;
  isMockMode?: boolean;
}

// 必须:
// - 渲染 cursor icon（可使用 SVG 或 emoji）
// - 渲染 username label
// - 跟随 position 实时移动

// 禁止:
// - 渲染超出 canvas 边界
// - 未设置 isMockMode 时在 mock 环境渲染
```

---

## 5. Epic E4: Canvas 导出格式扩展

### 5.1 约束清单

```yaml
导出器位置:
  exporters: src/lib/exporters/
  PlantUML: src/lib/exporters/plantuml.ts
  JSONSchema: src/lib/exporters/json-schema.ts
  SVG: src/lib/exporters/svg.ts

ExportModal:
  组件: src/components/dds/DDSToolbar.tsx
  测试 ID: plantuml-option, svg-option, schema-option

文件格式:
  PlantUML: .puml
  SVG: .svg
  JSON Schema: .schema.json

降级策略:
  SVG 导出失败: 显示 "当前视图不支持 SVG 导出"
  使用 try-catch 包裹 SVG 序列化

禁止:
  - 修改现有导出格式（PNG/JPEG）
  - 导出器直接访问后端 API
  - SVG 导出失败导致画布崩溃
```

### 5.2 PlantUML 导出规范

```typescript
// src/lib/exporters/plantuml.ts
interface PlantUMLOptions {
  diagramType: 'class' | 'sequence' | 'usecase' | 'component';
  title?: string;
}

// 约束:
// - 生成 @startuml / @enduml 包裹
// - 类图使用 class 关键字
// - 支持 StarUML 导入
// - 语法错误率 < 1%（必须有验证测试）
```

### 5.3 SVG 导出规范

```typescript
// src/lib/exporters/svg.ts
interface SVGExportResult {
  success: boolean;
  svg?: string;
  error?: string;
  fallbackMessage?: string;
}

// 约束:
// - 成功时返回 SVG 字符串
// - 失败时返回 error + fallbackMessage
// - 前端显示降级文案，不崩溃
// - 导出文件可被 Figma 导入
```

---

## 6. Epic E5: 需求模板库深耕

### 6.1 约束清单

```yaml
组件位置:
  TemplateManager: src/hooks/useTemplateManager.ts
  TemplateGallery: src/components/templates/TemplateGallery.tsx
  TemplateHistoryPanel: 新建

存储:
  localStorage key: template:${templateId}:history
  格式: TemplateSnapshot[]（JSON）

限制:
  最多 10 个 snapshot
  超出时删除最旧
  单个 snapshot 大小 < 1MB

测试 ID:
  template-export-btn: 导出按钮
  template-import-btn: 导入按钮
  template-history-btn: 历史按钮
  history-item: 历史项目（用于 length 检查）

禁止:
  - 存储超过 10MB 的模板历史
  - 导入不验证 JSON 格式
  - 导出不触发 download
```

### 6.2 TemplateManager Hook 规范

```typescript
// src/hooks/useTemplateManager.ts
interface TemplateManagerAPI {
  exportTemplate(templateId: string): void;
  importTemplate(file: File): Promise<TemplateData>;
  getHistory(templateId: string): TemplateSnapshot[];
  createSnapshot(templateId: string, label?: string): void;
  deleteSnapshot(templateId: string, snapshotId: string): void;
}

// 约束:
// - exportTemplate: 触发 Blob download
// - importTemplate: 验证 JSON schema，错误抛异常
// - createSnapshot: 超过 10 个时删除最旧
// - getHistory: 返回快照列表，按时间倒序
```

---

## 7. 通用约束

### 7.1 代码质量

```yaml
TypeScript:
  - strict 模式
  - 禁止 any 类型（除非外部库无类型）
  - 新组件必须有 Props interface

CSS:
  - 使用 CSS Modules
  - 禁止内联 style={{}}
  - 复用 design-tokens.css 中的变量

测试:
  - 新功能必须有对应测试
  - E2E 覆盖全部 5 Epic
  - 单元测试覆盖率 > 80%
```

### 7.2 禁止事项

```yaml
全局禁止:
  - 引入新的外部依赖（需 Architect 审批）
  - 修改 Cloudflare Workers 后端路由（除 E2.4 API）
  - 破坏现有功能（回归测试必过）
  - 硬编码任何配置（使用环境变量或 config 文件）
```

### 7.3 验收命令

```bash
# 全部通过才算 Sprint 完成
pnpm run build        # 0 errors
pnpm run lint         # 0 errors
pnpm test             # all pass
pnpm test:e2e         # all pass

# 特定验收
# E4.1: PlantUML 语法
node -e "const p = require('./src/lib/exporters/plantuml'); console.log(p.validate('...'))"
# E4.3: SVG fallback
# 查看 SVG 导出失败时是否显示降级文案
```

---

## 8. 审查清单

### 开发前检查

- [ ] 理解 Epic 约束清单
- [ ] 确认文件位置正确
- [ ] 确认测试 ID 命名规范
- [ ] 检查是否有禁止事项冲突

### 开发后检查

- [ ] `pnpm run build` → 0 errors
- [ ] `pnpm run lint` → 0 warnings
- [ ] 相关测试通过
- [ ] E2E 测试覆盖
- [ ] 文档更新（如有必要）

---

*文档版本: 1.0*
*创建时间: 2026-05-03*
*作者: Architect Agent*