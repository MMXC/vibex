# Implementation Plan: VibeX 架构改进

**项目**: vibex-architect-proposals-20260402_061709
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## 阶段排期

| Phase | 内容 | 工时 | 优先级 |
|-------|------|------|--------|
| Phase 1 | 错误边界增强 | 1天 | P1 |
| Phase 2 | 类型安全清理 | 1天 | P1 |
| Phase 3 | 依赖安全审计 | 0.5天 | P1 |
| Phase 4 | Canvas 性能优化 | 2天 | P1 |
| Phase 5 | renderer.ts 拆分 | 2天 | P0 |
| Phase 6 | 组件目录治理 | 2天 | P2 |

**总计**: 约 8.5 天（渐进式）

---

## Phase 1: 错误边界增强（1天）

### 步骤 1.1: 创建 AppErrorBoundary 组件

**文件**: `src/components/common/AppErrorBoundary.tsx`

```typescript
class AppErrorBoundary extends Component<{}, { hasError: boolean }> {
  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    this.setState({ hasError: true });
  }
  render() {
    if (this.state.hasError) return <ErrorFallback onReset={() => this.setState({hasError: false})} />;
    return this.props.children;
  }
}
```

### 步骤 1.2: 集成 Sentry

**文件**: `src/instrumentation.ts` 或 `src/app/sentry-example-page.tsx`

确认 Sentry SDK 集成已有，添加 componentStack 捕获。

### 步骤 1.3: 创建路由级 error.tsx

```bash
# 创建路由级错误边界
touch src/app/design/error.tsx
touch src/app/canvas/error.tsx
touch src/app/flow/error.tsx
touch src/app/domain/error.tsx
```

每个 error.tsx 实现降级 UI + reset 按钮。

---

## Phase 2: 类型安全清理（1天）

### 步骤 2.1: 统计 as any 使用

```bash
grep -rn "as any" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
```

### 步骤 2.2: 逐文件修复

8 个目标文件（见 PRD F1.2.4）：
1. `preview/page.tsx`
2. `changelog/page.tsx`
3. `CardTreeRenderer.tsx`
4. `CardTreeNode.tsx`
5. `JsonTreeRenderer.tsx`
6. `PageNode.tsx`
7. `PrototypeExporter.tsx`
8. `Tabs.tsx`

### 步骤 2.3: 启用 ESLint 严格规则

```json
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unsafe-assignment": "error"
}
```

### 步骤 2.4: 验证

```bash
npx tsc --noEmit
# 期望: 退出码 0
```

---

## Phase 3: 依赖安全审计（0.5天）

### 步骤 3.1: 配置 npm audit

```bash
npm audit --audit-level=high
```

### 步骤 3.2: 添加 package-overrides

```json
{
  "overrides": {
    "dompurify": "3.3.3"
  }
}
```

### 步骤 3.3: 配置 Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directories: ["vibex-fronted"]
    schedule: { interval: "daily" }
```

---

## Phase 4: Canvas 性能优化（2天）

### 步骤 4.1: React.memo 优化

**文件**: `src/components/canvas/*Card.tsx`

为所有 Card 组件添加 memo：
```typescript
const ContextNodeCard = React.memo(
  function ContextNodeCard({ node, onSelect }: Props) {
    return <div className={styles.nodeCard}>{/* ... */}</div>;
  },
  (prev, next) => prev.node.nodeId === next.node.nodeId &&
    prev.node.status === next.node.status
);
```

### 步骤 4.2: rAF 拖拽节流

**文件**: `src/components/canvas/CanvasPage.tsx`

```typescript
const handleMouseMove = useCallback((e: MouseEvent) => {
  rafId.current = requestAnimationFrame(() => {
    setDragPosition({ x: e.clientX, y: e.clientY });
  });
}, []);
```

### 步骤 4.3: 虚拟化（react-virtual）

```bash
npm install react-virtual
```

仅对节点数 > 50 的树启用虚拟化。

---

## Phase 5: renderer.ts 拆分（2天，最大风险）

### 步骤 5.1: 创建目录结构

```bash
mkdir -p src/lib/prototypes/renderers
mkdir -p src/lib/prototypes/elements
mkdir -p src/lib/prototypes/utils
```

### 步骤 5.2: 提取渲染器基类

```typescript
// renderers/RendererBase.ts
export abstract class RendererBase {
  constructor(protected schema: UISchema) {}
  abstract render(): React.ReactNode;
  protected renderElement(element: UIElement): React.ReactNode { /* ... */ }
}
```

### 步骤 5.3: 实现设备专用渲染器

```typescript
// renderers/DesktopRenderer.ts
export class DesktopRenderer extends RendererBase {
  render() { /* 桌面端布局逻辑 */ }
}
```

### 步骤 5.4: 提取元素类型

```typescript
// elements/ButtonElement.ts
export function ButtonElement({ schema }: { schema: ButtonSchema }) {
  return <button className={schema.className}>{schema.label}</button>;
}
```

### 步骤 5.5: 更新入口文件

将原有逻辑分离后，renderer.ts 仅保留工厂函数（< 200 行）。

---

## Phase 6: 组件目录治理（2天）

### 步骤 6.1: 创建目标目录结构

```bash
mkdir -p src/components/common
mkdir -p src/components/canvas/trees
mkdir -p src/components/page
mkdir -p src/components/feature
mkdir -p src/components/layout
```

### 步骤 6.2: 移动文件（使用 git mv）

```bash
git mv src/components/Button.tsx src/components/common/
git mv src/components/Modal.tsx src/components/common/
# ... 按分类批量移动
```

### 步骤 6.3: 创建索引文件

```typescript
// src/components/common/index.ts
export { Button } from './Button';
export { Modal } from './Modal';
// ...
```

### 步骤 6.4: 全局路径验证

```bash
npm run build 2>&1 | grep "Cannot find module"
# 期望: 无错误
```

---

## 回滚计划

| 变更 | 回滚方式 |
|------|----------|
| renderer.ts 拆分 | `git checkout` 恢复原文件 |
| React.memo | 删除 memo 包装，恢复组件 |
| 组件目录重组 | `git mv` 恢复原目录 |
| ESLint 规则 | 回退 `.eslintrc.js` |

---

## 验收清单

### Phase 1
- [ ] AppErrorBoundary 捕获错误后展示降级 UI
- [ ] Sentry 收到错误上报
- [ ] 路由级 error.tsx 存在且工作

### Phase 2
- [ ] `grep "as any" src/` = 0
- [ ] `npx tsc --noEmit` 退出码 0

### Phase 3
- [ ] `npm audit` 无 high/critical 漏洞
- [ ] Dependabot 配置存在

### Phase 4
- [ ] 50+ 节点场景帧率 ≥ 55fps
- [ ] 拖拽操作流畅，无卡顿

### Phase 5
- [ ] renderer.ts < 200 行
- [ ] DesktopRenderer / MobileRenderer / TabletRenderer 各 < 300 行
- [ ] `npm run build` 通过

### Phase 6
- [ ] 顶级目录数量 ≤ 10
- [ ] 所有 import 路径验证通过
