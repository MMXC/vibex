# AGENTS.md: VibeX 架构改进

**项目**: vibex-architect-proposals-20260402_061709
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### Phase 5: renderer.ts 拆分

1. **文件命名**
   - ✅ `renderers/` 目录存放设备专用渲染器
   - ✅ `elements/` 目录存放元素组件
   - ✅ `utils/` 存放辅助函数

2. **入口文件**
   - ✅ renderer.ts 保留工厂函数，< 200 行
   - ❌ 禁止在 renderer.ts 中直接实现渲染逻辑

3. **类型安全**
   - ✅ 所有渲染器继承 RendererBase
   - ❌ 禁止使用 `as any` 在渲染器中

4. **迁移策略**
   - ✅ 每次拆分一个子文件，立即验证编译和测试
   - ❌ 禁止一次性大量拆分，导致难以回滚

### Phase 4: Canvas 性能优化

1. **React.memo**
   - ✅ 为所有 `*Card` 组件添加 memo
   - ✅ 比较函数必须包含 `node.nodeId`
   - ❌ 禁止对不需要 memo 的组件过度优化

2. **虚拟化**
   - ✅ 仅对节点数 > 50 的场景启用
   - ❌ 禁止对短列表使用虚拟化（破坏拖拽交互）

3. **rAF**
   - ✅ 拖拽事件使用 `requestAnimationFrame` 节流
   - ❌ 禁止在 rAF 回调中进行状态更新之外的操作

### Phase 6: 组件目录治理

1. **移动文件**
   - ✅ 使用 `git mv` 保留 Git 历史
   - ❌ 禁止直接删除再创建（丢失历史）

2. **索引文件**
   - ✅ 每个目录必须有 `index.ts` 导出
   - ❌ 禁止跨目录直接引用子文件（通过 index.ts）

3. **导入路径**
   - ✅ 更新所有 import 路径
   - ✅ 使用 `npm run build` 验证无路径错误

### Phase 2: 类型安全

1. **as any 清理**
   - ✅ 优先修复 runtime-critical 文件
   - ✅ 使用正确的类型定义替代
   - ❌ 禁止新增 `as any`（ESLint 已启用 error）

### Phase 1: 错误边界

1. **Sentry 集成**
   - ✅ componentDidCatch 中调用 Sentry.captureException
   - ❌ 禁止在 error boundary 中进行状态修改以外的操作

---

## Reviewer 约束

### 审查重点

1. **renderer.ts 拆分**
   - [ ] renderer.ts < 200 行
   - [ ] 各子渲染器 < 300 行
   - [ ] 工厂函数正确路由到对应渲染器

2. **Canvas 性能**
   - [ ] Card 组件有 memo 包装
   - [ ] 虚拟化仅在长列表启用
   - [ ] rAF 用于拖拽节流

3. **组件目录**
   - [ ] 顶级目录 ≤ 10 个
   - [ ] 无 circular import
   - [ ] 所有 import 路径验证通过

4. **类型安全**
   - [ ] `grep "as any" src/` = 0
   - [ ] `npx tsc --noEmit` 通过

### 驳回条件

- ❌ renderer.ts > 200 行
- ❌ 新增 `as any` 用法
- ❌ 组件目录重组后出现 circular import
- ❌ 编译或测试失败

---

## Tester 约束

### 性能测试

| ID | 测试 | 目标 |
|----|------|------|
| P1 | 50 节点渲染时间 | < 16ms（60fps） |
| P2 | 拖拽帧率 | ≥ 55fps |
| P3 | 100 节点渲染时间 | < 50ms |

### 错误边界测试

| ID | 测试 | 预期 |
|----|------|------|
| E1 | 注入组件错误 | 错误边界捕获，展示降级 UI |
| E2 | Sentry 收到上报 | events.length > 0 |
| E3 | reset 按钮 | 点击后恢复正常渲染 |

---

## 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/lib/prototypes/renderers/*.ts` | 设备专用渲染器 |
| `src/lib/prototypes/elements/*.ts` | 元素组件 |
| `src/lib/prototypes/utils/*.ts` | 辅助函数 |
| `src/app/*/error.tsx` | 路由级错误边界 |
| `src/components/common/AppErrorBoundary.tsx` | 全局错误边界 |
| `src/styles/canvas-tokens.css` | CSS token 定义 |

### 修改文件

| 文件 | 说明 |
|------|------|
| `src/lib/prototypes/renderer.ts` | 降为入口文件 |
| `src/app/layout.tsx` | 集成 AppErrorBoundary |
| `.eslintrc.js` | 启用 no-explicit-any: error |
| `.github/dependabot.yml` | 安全依赖配置 |
