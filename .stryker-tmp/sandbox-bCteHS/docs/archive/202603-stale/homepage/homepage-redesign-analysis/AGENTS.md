# 开发约束: VibeX 首页重构 (homepage-redesign-analysis)

> **项目**: homepage-redesign-analysis  
> **版本**: v1.0  
> **架构师**: Architect Agent  
> **日期**: 2026-03-21

---

## 1. 开发规范

### 1.1 代码规范

| 规则 | 说明 |
|------|------|
| **TypeScript 严格模式** | 所有组件必须有 Props 接口和 State 类型 |
| **CSS Modules** | 所有样式使用 CSS Modules，禁止使用内联 style |
| **CSS 变量** | 颜色/间距/阴影必须使用 `variables.css` 中定义的变量 |
| **组件命名** | PascalCase，如 `StepNavigator`、`MermaidRenderer` |
| **Hooks 命名** | camelCase，use 前缀，如 `useSSEStream`、`useFloatingMode` |
| **Store 命名** | `use{Feature}Store`，如 `useHomePageStore` |

### 1.2 文件结构规范

```
# 正确
src/components/home/
  HomePage.tsx
  HomePage.module.css  ← 同名 CSS Module

# 错误
src/components/home/
  HomePage.tsx
  home-page-styles.css  ← 名字不一致
  HomePageStyles.tsx     ← 不是 CSS 文件
```

### 1.3 状态管理规范

```typescript
// ✅ 正确：使用选择器避免重渲染
const currentStep = useHomePageStore(s => s.currentStep);

// ❌ 错误：订阅整个 store
const store = useHomePageStore();

// ✅ 正确：Actions 放在 store 内部，不在组件中直接修改状态
const { setCurrentStep } = useHomePageStore();

// ❌ 错误：在组件中直接 setState
const [step, setStep] = useState('step1');
```

### 1.4 Mermaid 渲染规范

```typescript
// ✅ 正确：动态导入
const MermaidRenderer = dynamic(
  () => import('@/components/preview/MermaidRenderer'),
  { ssr: false, loading: () => <Skeleton /> }
);

// ❌ 错误：直接 import
import { MermaidRenderer } from '@/components/preview/MermaidRenderer';
```

### 1.5 SSE 规范

```typescript
// ✅ 正确：组件挂载时连接，卸载时断开
useEffect(() => {
  const eventSource = createAnalyzeStream(requirement);
  eventSource.onmessage = (e) => { /* ... */ };
  eventSource.onerror = () => { /* 重连逻辑 */ };
  return () => eventSource.close();
}, [requirement]);

// ❌ 错误：在组件外部创建 EventSource
const eventSource = createAnalyzeStream(requirement); // 全局副作用
```

### 1.6 测试规范

```typescript
// ✅ 正确：组件测试使用 data-testid
<div data-testid="step-navigator">
  <div data-testid="step-step1" className={active ? 'active' : ''}>
    需求录入
  </div>
</div>

// ❌ 错误：使用实现细节选择器
screen.getByText('需求录入')  // 允许但不推荐
screen.getByClassName('step-item')  // ❌ 禁止
```

---

## 2. 驳回红线

以下情况 **必须驳回**，不允许合并：

### 2.1 功能验收

| 规则 | 说明 |
|------|------|
| ❌ 无法通过 `expect()` 断言 | 每个 Story 必须有可测试的验收标准 |
| ❌ 缺少 data-testid | E2E 测试依赖 data-testid 选择器 |
| ❌ 步骤切换 > 500ms | 性能红线，使用 Performance API 验证 |
| ❌ localStorage 持久化失败 | 刷新后状态必须恢复 |

### 2.2 代码质量

| 规则 | 说明 |
|------|------|
| ❌ TypeScript 错误 | `pnpm type-check` 必须通过 |
| ❌ ESLint 错误 | `pnpm lint` 必须通过 |
| ❌ 测试失败 | `pnpm test` 必须全部通过 |
| ❌ 新增 `any` 类型 | 严格模式禁止 any |
| ❌ 破坏已有功能 | 回归测试必须通过 |

### 2.3 CSS 规范

| 规则 | 说明 |
|------|------|
| ❌ 硬编码颜色 | 必须使用 CSS 变量 |
| ❌ 硬编码尺寸 | 响应式必须使用相对单位 |
| ❌ 内联 style | 必须使用 CSS Modules |
| ❌ 全局样式污染 | 禁止修改全局 CSS |

---

## 3. PR 审查清单

开发者在提交 PR 前必须自检：

### 3.1 功能自检

- [ ] 每个 Story ID 对应的验收标准都有对应测试
- [ ] `data-testid` 已添加到关键交互元素
- [ ] 步骤切换延迟已用 Performance API 测量（< 500ms）
- [ ] localStorage 持久化已测试（刷新后恢复）

### 3.2 代码自检

- [ ] `pnpm type-check` 通过
- [ ] `pnpm lint` 通过
- [ ] `pnpm test` 全部通过
- [ ] 新增代码有类型注解
- [ ] 没有新增 `any` 类型
- [ ] 组件使用 CSS Modules

### 3.3 性能自检

- [ ] 非关键组件使用 `dynamic()` 懒加载
- [ ] SSE 连接在 useEffect cleanup 中正确关闭
- [ ] Store 使用选择器避免不必要的重渲染

### 3.4 文档自检

- [ ] 新增组件已在 `architecture.md` 组件表中登记
- [ ] 新增 API 接口已在 `architecture.md` 接口定义中登记
- [ ] 测试文件已创建

---

## 4. Reviewer 审查要点

### 4.1 功能审查

1. **Story 验收标准覆盖**：每个 Story ID 是否有对应测试？
2. **数据流正确性**：状态是否正确地从 Store 流向组件？
3. **SSE 重连逻辑**：断开后是否正确重试（最多 3 次）？
4. **快照功能**：是否限制最多 5 个快照？
5. **持久化配置**：partialize 是否仅持久化必要字段？

### 4.2 性能审查

1. **懒加载**：非关键组件是否使用 dynamic import？
2. **首屏体积**：Mermaid.js 是否动态加载？
3. **重渲染**：Store 选择器是否精确？
4. **内存泄漏**：SSE 连接是否正确清理？

### 4.3 代码质量审查

1. **类型安全**：所有 Props 和 State 是否有类型？
2. **样式隔离**：是否使用 CSS Modules，无全局污染？
3. **可测试性**：组件是否通过 props 注入逻辑，易于测试？
4. **错误处理**：SSE 错误是否有降级体验？

---

## 5. Epic → Story → 组件映射

| Story ID | 组件 | 文件 | 审查重点 |
|----------|------|------|----------|
| **Epic 1: 布局框架** | | | |
| ST-1.1 | GridContainer | `GridContainer.tsx` | 1400px 居中 |
| ST-1.2 | GridContainer | `GridContainer.module.css` | 3×3 Grid |
| ST-1.3 | GridContainer | `GridContainer.module.css` | 响应式断点 |
| ST-1.4 | GridContainer + Drawer | `GridContainer.module.css` | z-index 层叠 |
| ST-1.5 | variables.css | 全局 CSS 变量 | 无硬编码颜色 |
| **Epic 2: Header** | | | |
| ST-2.1 | Header | `Header.tsx` | Logo 显示 |
| ST-2.2 | Header | `Header.tsx` | 导航链接 |
| ST-2.3 | Header | `Header.tsx` | 登录按钮 |
| ST-2.4 | Header | `Header.tsx` | 头像显示 |
| **Epic 3: 左侧抽屉** | | | |
| ST-3.1 | StepNavigator | `StepNavigator.tsx` | 4 步渲染 |
| ST-3.2 | StepNavigator | `StepNavigator.tsx` | 切换 < 500ms |
| ST-3.3 | StepNavigator | `StepNavigator.module.css` | 状态样式 |
| **Epic 4: 预览区** | | | |
| ST-4.1 | PreviewArea | `PreviewArea.tsx` | 空状态 |
| ST-4.2 | PreviewArea | `PreviewArea.tsx` | 骨架屏 |
| ST-4.3 | MermaidRenderer | `MermaidRenderer.tsx` | 4种类型 |
| ST-4.4 | ScaleControls | `ScaleControls.tsx` | 缩放 |
| ST-4.5 | MermaidRenderer | `MermaidRenderer.tsx` | 拖拽 |
| ST-4.6 | ExportControls | `ExportControls.tsx` | PNG/SVG |
| **Epic 5: 右侧抽屉** | | | |
| ST-5.1 | useSSEStream | `useSSEStream.ts` | SSE 连接 |
| ST-5.2 | StreamingText | `StreamingText.tsx` | 流式显示 |
| ST-5.3 | useSSEStream | `useSSEStream.ts` | 重连 |
| **Epic 6: 底部面板** | | | |
| ST-6.1 | BottomPanelHandle | `BottomPanelHandle.tsx` | 30px 手柄 |
| ST-6.2 | RequirementTextarea | `RequirementTextarea.tsx` | 5000字 |
| ST-6.3 | SendButton | `BottomPanel.tsx` | 禁用态 |
| ST-6.4 | QuickAskButtons | `QuickAskButtons.tsx` | 5 个预设 |
| ST-6.5 | DiagnosisButtons | `DiagnosisButtons.tsx` | 诊断/优化 |
| ST-6.6 | ChatHistory | `ChatHistory.tsx` | 10 条 |
| ST-6.7 | useDraft | `useDraft.ts` | 草稿保存 |
| ST-6.8 | CreateProjectButton | `BottomPanel.tsx` | 重新生成 |
| ST-6.9 | CreateProjectButton | `BottomPanel.tsx` | 项目创建 |
| ST-6.10 | RequirementTextarea | `RequirementTextarea.tsx` | Ctrl+Enter |
| **Epic 7: AI展示区** | | | |
| ST-7.1 | AIResultCards | `AIResultCards.module.css` | 三列布局 |
| ST-7.2 | AICard | `AICard.tsx` | 内容填充 |
| ST-7.3 | AICard | `AICard.tsx` | 展开详情 |
| **Epic 8: 悬浮模式** | | | |
| ST-8.1 | FloatingMode | `FloatingMode.tsx` | 滚动触发 |
| ST-8.2 | FloatingMode | `FloatingMode.tsx` | 悬浮恢复 |
| **Epic 9: 状态管理** | | | |
| ST-9.1 | HomePageStore | `homePageStore.ts` | localStorage |
| ST-9.2 | HomePageStore | `homePageStore.ts` | 快照 |
| ST-9.3 | useSSEStream | `useSSEStream.ts` | 连接管理 |
| ST-9.4 | useSSEStream | `useSSEStream.ts` | 指数退避 |

---

## 6. 环境配置

```bash
# 开发环境
pnpm dev

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 单元测试 + 覆盖率
pnpm test -- --coverage

# E2E 测试
pnpm playwright test e2e/homepage-redesign-analysis.spec.ts

# 完整测试
pnpm test && pnpm playwright test
```
