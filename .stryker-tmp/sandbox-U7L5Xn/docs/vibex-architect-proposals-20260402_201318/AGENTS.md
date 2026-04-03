# VibeX 开发约束文档

**项目**: vibex-architect-proposals-20260402_201318  
**版本**: 1.0  
**日期**: 2026-04-02  
**角色**: Architect  

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-architect-proposals-20260402_201318
- **执行日期**: 2026-04-02

---

## 1. Dev Agent 约束

### 1.1 代码规范

#### 1.1.1 Zustand Store 规范

```
✅ 允许:
  - 创建新的单一职责 store (如 contextStore, flowStore)
  - 在 store 中使用 persist middleware
  - 按 ADR-002 分层存储（L1 内存/L2 localStorage/L3 后端）

❌ 禁止:
  - 在 Zustand store 外直接操作 localStorage
  - 绕过 Zod safeParse 直接解析外部输入
  - 跨 store 循环依赖（madge 验证必须通过）
  - 将业务数据存入 L1 内存层（刷新丢失）
```

**示例 — 正确写法**:
```typescript
// stores/uiStore.ts
export const useUIStore = create(
  persist(
    (set) => ({
      sidebarWidth: 280, // L2: localStorage
    }),
    {
      name: 'vibex-ui-preferences',
      partialize: (state) => ({ sidebarWidth: state.sidebarWidth }),
    }
  )
);

// utils/sanitize.ts
export const safeParseNode = (input: unknown) => {
  const result = NodeSchema.safeParse(input);
  return result.success ? result.data : null;
};
```

#### 1.1.2 CSS 规范

```
✅ 允许:
  - 使用 CSS Modules（{component}-{element}-{state} 命名）
  - 使用 CSS 变量 (var(--color-*))
  - 在组件内定义 CSS Modules

❌ 禁止:
  - 新增 .nodeTypeBadge, .confirmedBadge, .selectionCheckbox 等废弃样式
  - 使用行内 style 处理状态样式（除动态值外）
  - 全局 CSS 污染（除 globals.css + CSS 变量外）
```

**示例 — 正确写法**:
```css
/* BoundedContextCard.module.css */
.boundedContext-nodeCard {
  border: 2px solid transparent;
}

.boundedContext-nodeCard--unconfirmed {
  border-color: var(--color-warning);
}

.boundedContext-nodeCard--confirmed {
  border-color: var(--color-success);
}
```

#### 1.1.3 安全规范

```
✅ 允许:
  - 使用 DOMPurify 3.1.6 (via package.json overrides)
  - 使用 Zod safeParse 验证外部输入
  - 覆盖依赖版本 via package.json overrides

❌ 禁止:
  - 直接使用 DOMPurify (绕过 Zod safeParse)
  - 使用 `eval()` 或 `new Function()` 处理用户输入
  - 拼接用户输入到 SQL/HTML/CSS/JS 字符串
  - 修改 package.json overrides 降低版本（仅允许升高）
```

#### 1.1.4 E2E 测试规范

```
✅ 允许:
  - 在 tests/e2e/ 下创建 .spec.ts 文件
  - 使用 data-testid 属性标记测试元素
  - Playwright 配置 retries 和 timeout

❌ 禁止:
  - 使用不稳定的 selector（如 XPath ordinal）
  - 硬编码睡眠（page.waitForTimeout）
  - 移除 Playwright screenshotOnFailure 配置
```

**data-testid 命名规范**:
```
{data-testid="create-context-btn"}
{data-testid="context-node-{name}"}
{data-testid="checkbox"}
{data-testid="export-btn"}
{data-testid="flow-node-{name}"}
{data-testid="batch-delete-btn"}
```

### 1.2 PR 规范

| 规则 | 说明 |
|------|------|
| **PR 大小** | 单个 PR < 400 行变更（鼓励小 PR） |
| **分支命名** | `{type}/{issue-id}-{short-description}` |
| **Commit 规范** | `type(scope): description` (conventional commits) |
| **PR 描述** | 必须包含：测试验证、截图（如有 UI 变更）、相关 ADR |
| **必须包含测试** | 新功能必须有对应的单元测试或 E2E 测试 |
| **必须通过 CI** | CI 红不得合并 |

### 1.3 canvasStore 拆分专项约束

```
✅ 拆分时必须遵守:
  1. 新 store 文件放在 stores/ 目录
  2. 导出 use{StoreName} hook（如 useContextStore）
  3. 保持 canvasStore re-export 向后兼容（过渡期）
  4. 迁移消费者前更新所有 import 路径
  5. 每次拆分后运行 tsc --noEmit

❌ 拆分时禁止:
  1. 在 store 间创建循环依赖
  2. 将多个职责塞入同一个 store
  3. 直接修改消费者代码而不更新 import
  4. 跳过 tsc --noEmit 直接提交
```

### 1.4 Dev Agent 自检清单

每次提交前必须自检：

- [ ] `tsc --noEmit` 通过
- [ ] `npm run lint` 通过
- [ ] `npm run build` 通过
- [ ] 无废弃样式引用（grep 确认）
- [ ] Zod safeParse 覆盖所有外部输入
- [ ] localStorage 操作通过 Zustand persist
- [ ] CSS 命名符合 `{component}-{element}-{state}`
- [ ] 新功能有对应测试

---

## 2. Reviewer Agent 约束

### 2.1 审查维度

#### 2.1.1 架构合规性审查

```
必须检查:
  ☐ ADR-001: canvasStore 拆分符合 5 store 结构，无循环依赖
  ☐ ADR-002: 状态存储层级正确（L1/L2/L3）
  ☐ ADR-003: CSS 命名符合 {component}-{element}-{state} 规范
  ☐ ADR-004: 外部输入使用 Zod safeParse，DOMPurify 版本正确
  ☐ ADR-005: E2E 测试有 3 个核心旅程覆盖
```

#### 2.1.2 代码质量审查

```
必须检查:
  ☐ 无 TypeScript 类型错误（tsc --noEmit）
  ☐ 无 ESLint 错误
  ☐ 无安全漏洞（XSS、注入等）
  ☐ 无循环依赖（madge 验证）
  ☐ Zustand store 单一职责，无超过 350 行
  ☐ canvasStore 入口文件 < 150 行
```

#### 2.1.3 测试覆盖审查

```
必须检查:
  ☐ 新功能有单元测试或 E2E 测试
  ☐ E2E 测试使用 data-testid（稳定 selector）
  ☐ E2E 测试无硬编码 sleep
  ☐ 测试覆盖率报告存在（≥ 60% 目标）
  ☐ Playwright 配置包含 screenshotOnFailure
```

#### 2.1.4 CSS 审查

```
必须检查:
  ☐ 无新增 .nodeTypeBadge, .confirmedBadge, .selectionCheckbox
  ☐ CSS 命名符合规范（grep 验证）
  ☐ CSS Modules 在组件目录内
  ☐ 无行内 style 处理状态样式（除动态值外）
  ☐ 状态样式使用 CSS class 切换
```

#### 2.1.5 安全审查

```
必须检查:
  ☐ DOMPurify 版本为 3.1.6（package.json overrides）
  ☐ 所有外部输入有 Zod safeParse
  ☐ 解析失败有 fallback 策略
  ☐ 无 eval() 或 new Function() 处理用户输入
  ☐ 无 innerHTML 拼接用户输入
```

### 2.2 审查动作

| 动作 | 触发条件 | 说明 |
|------|---------|------|
| **Approve** | 所有检查项通过 | 可合并 |
| **Request Changes** | 任意检查项未通过 | 列出具体问题 |
| **Comment** | 建议性意见 | 不阻断合并 |
| **Reject** | 安全漏洞或严重架构违规 | 说明拒绝理由 |

### 2.3 审查时间约束

- **响应时间**: Reviewer 需在 4h 内响应 PR
- **审查时长**: 单个 PR 审查不超过 30min
- **超时升级**: 超过 4h 未响应，Dev Agent 可 ping

### 2.4 特定提案审查要点

| 提案 | 审查重点 |
|------|---------|
| D-003 canvasStore 拆分 | madge 验证无循环、每个 store 职责单一、canvasStore < 150行 |
| D-E1/E2 checkbox/级联 | 父子节点状态正确、CSS 规范、交互流畅 |
| D-002 DOMPurify | overrides 版本正确、npm audit 通过 |
| D-005 防御性解析 | safeParse 覆盖所有外部输入、fallback 策略完整 |
| D-006 E2E | 3 个旅程存在且通过、CI 配置正确、覆盖率 ≥ 60% |
| P-002 面板持久化 | localStorage 键名规范、sessionStorage 降级、刷新恢复测试 |
| P-003 导出向导 | API 调用正确、进度状态、E2E 覆盖 |

---

## 3. Tester Agent 约束

### 3.1 测试分层

```
┌─────────────────────────────────────┐
│  L3: E2E (Playwright)               │  ← 3 核心旅程
├─────────────────────────────────────┤
│  L2: Integration (Jest + RTL)        │  ← 组件交互
├─────────────────────────────────────┤
│  L1: Unit (Jest)                    │  ← store/utility
└─────────────────────────────────────┘
```

### 3.2 E2E 测试约束

#### 3.2.1 三核心旅程必须覆盖

| 旅程 | 测试文件 | 核心步骤 |
|------|---------|---------|
| **创建→勾选→导出** | `journey-create-context.spec.ts` | 创建节点→checkbox→导出 |
| **创建→多选→生成** | `journey-generate-flow.spec.ts` | 创建→Ctrl+Click多选→生成 |
| **Ctrl+Click→级联→批量** | `journey-multi-select.spec.ts` | 多选→indeterminate→批量删除 |

#### 3.2.2 Playwright 配置要求

```typescript
// playwright.config.ts 必须包含:
{
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
}
```

#### 3.2.3 selector 优先级

```
✅ 优先使用:
  1. data-testid（最稳定）
  2. role + text（如 getByRole('button', { name: 'Create' })）
  3. CSS class（需配合测试稳定）

❌ 避免使用:
  - XPath ordinal（如 /div[3]/span）
  - 索引选择器（如 :nth-child）
  - 动态生成的 class 名
```

#### 3.2.4 等待策略

```
✅ 正确写法:
  - await page.waitForSelector('[data-testid="..."]', { state: 'visible' })
  - await expect(locator).toBeVisible()
  - await page.waitForResponse('**/api/**')

❌ 禁止写法:
  - page.waitForTimeout(5000) // 硬编码等待
  - page.waitForSelector('.dynamic-class') // 不稳定 selector
```

### 3.3 单元测试约束

```
✅ 覆盖要求:
  - Zustand store actions: 每个 action 至少一个测试
  - safeParse: 正常/异常/fallback 各一个测试
  - CSS 变量: 验证正确值（可选）
  - API retry: 成功/重试/失败各一个测试

❌ 禁止:
  - 测试中直接 mock localStorage（使用 Zustand persist）
  - 测试间共享状态（each test 独立）
  - 跳过异步操作等待
```

### 3.4 回归测试约束

```
✅ 每次 PR 必须回归:
  - Sprint 0: build + lint + DOMPurify 版本
  - Sprint 1: 3 个 E2E 核心旅程
  - Sprint 2: 面板持久化 + 导出向导

❌ 禁止:
  - 部分通过即视为通过（必须全量回归）
  - 跳过失败用例（需记录并创建 issue）
```

### 3.5 测试报告要求

每个 Sprint 结束必须产出：

| 报告 | 内容 | 格式 |
|------|------|------|
| **覆盖率报告** | 行覆盖率、路径覆盖率 | HTML + JSON |
| **E2E 报告** | 3 旅程通过/失败数、截图 | Playwright HTML |
| **缺陷报告** | 缺陷列表、严重度、重现步骤 | Markdown |
| **健康度评分** | 构建 20% + 测试 40% + 质量 40% | 0-100 分 |

### 3.6 缺陷严重度定义

| 级别 | 定义 | 处理要求 |
|------|------|---------|
| **P0** | CI 阻断、构建失败、安全漏洞 | 立即修复，当日合并 |
| **P1** | 功能缺失、E2E 核心旅程失败 | 24h 内修复 |
| **P2** | 功能异常、偶发 bug | Sprint 内修复 |
| **P3** | 视觉不一致、UX 体验问题 | Sprint 2 内修复 |

---

## 4. 跨角色协作约束

### 4.1 Dev → Reviewer

```
PR 描述必须包含:
  1. 变更摘要（< 5 句）
  2. 测试验证结果（截图 + 测试输出）
  3. 相关 ADR 引用
  4. 是否需要 designer review（如有 UI 变更）
  5. 自检清单完成状态

PR 前置检查:
  - [x] tsc --noEmit 通过
  - [x] npm run lint 通过
  - [x] npm run build 通过
  - [x] 相关测试通过
```

### 4.2 Reviewer → Dev

```
Review 反馈格式:
  ## 架构合规性
  - [✓/✗] ADR-001 canvasStore 拆分
  - [✓/✗] ADR-002 状态存储层级
  
  ## 代码质量
  - [✓/✗] TypeScript 类型正确
  - [✓/✗] 无安全漏洞
  
  ## 具体问题
  - ❌ L45: 循环依赖（flowStore → contextStore → flowStore）
    → 建议: 将 contextStore 引用移至 flowStore 内部
  
  ## 总体评价
  - [Approve / Request Changes / Reject]
```

### 4.3 Tester → Dev

```
缺陷报告格式:
  ## 缺陷标题
  [P1] 父子节点级联状态不正确
  
  ## 环境
  - 浏览器: Chromium 120
  - 操作系统: macOS 14
  - 分支: feat/cascade-confirmation
  
  ## 重现步骤
  1. 创建父节点 A
  2. 创建子节点 B
  3. 勾选父节点 A
  4. 预期: 子节点 B 也被勾选
  5. 实际: 子节点 B 未被勾选
  
  ## 预期行为
  父节点勾选 → 自动勾选所有子节点
  
  ## 截图/日志
  [attach screenshot or console log]
  
  ## 建议修复
  在 flowStore.cascadeSelect 中添加子节点遍历逻辑
```

### 4.4 Dev → Tester

```
移交格式:
  ## 移交内容
  PR #42: D-E2 级联确认交互
  
  ## 验收标准
  1. 父节点勾选 → 自动勾选所有子节点
  2. 父节点 indeterminate（部分子节点选中）
  3. 子节点全选 → 父节点自动勾选
  4. 批量删除父子节点
  
  ## 相关文件
  - stores/flowStore.ts
  - components/BoundedContextCard/
  
  ## 测试建议
  - 覆盖 3 层嵌套父子关系
  - 覆盖部分勾选场景
  - 覆盖撤销场景
```

---

## 5. 工具链约束

| 工具 | 命令 | 用途 | 必须使用 |
|------|------|------|---------|
| TypeScript | `tsc --noEmit` | 类型检查 | ✅ |
| ESLint | `npm run lint` | 代码风格 | ✅ |
| Jest | `npm test` | 单元测试 | ✅ |
| Playwright | `npm run test:e2e` | E2E 测试 | ✅ Sprint 1+ |
| madge | `npx madge --circular` | 循环依赖检查 | ✅ Sprint 1+ |
| npm audit | `npm audit` | 安全漏洞 | ✅ |

---

## 6. CI/CD 约束

### 6.1 CI 必须包含

```
✅ GitHub Actions 必须包含:
  1. tsc --noEmit
  2. npm run lint
  3. npm run build
  4. npm test
  5. npm run test:e2e (Sprint 1+)
  
❌ 禁止:
  - 跳过任何步骤
  - 降低覆盖率要求
  - 移除 E2E pre-deploy gate
```

### 6.2 部署门槛

| Sprint | 构建 | Lint | 单元测试 | E2E |
|--------|------|------|---------|-----|
| Sprint 0 | ✅ | ✅ | ✅ | — |
| Sprint 1 | ✅ | ✅ | ✅ | ✅ (≥ 60%) |
| Sprint 2 | ✅ | ✅ | ✅ | ✅ (≥ 60%) |
