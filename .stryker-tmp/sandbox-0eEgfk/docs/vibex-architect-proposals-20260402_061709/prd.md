# VibeX 架构改进 PRD

**项目名称**: VibeX 架构改进（技术债务清理）
**文档版本**: v1.0
**编写角色**: PM
**分析依据**: `docs/vibex-architect-proposals-20260402_061709/analysis.md`
**采用方案**: 方案 B（渐进改良）
**总工时估算**: 约 13.5 天（1 人）
**编写日期**: 2026-04-02

---

## 1. 执行摘要

### 1.1 背景

VibeX 是 AI 驱动的原型设计工具，核心链路为：

```
需求输入 → 限界上下文 → 领域模型 → 业务流程 → 组件树
```

当前存在严重技术债务，直接影响系统的**可维护性**、**Canvas 操作流畅性**、**错误处理能力**和**类型安全**：

| 风险维度 | 现状 | 影响 |
|---------|------|------|
| 超长文件 | 7 个文件 > 800 行（renderer.ts 2175 行） | 可维护性极低，代码审查困难 |
| 类型安全 | 8 个文件使用 `as any` | 运行时错误风险 |
| 组件目录 | 70 个组件目录混乱 | 新人上手困难，AI 生成重复代码 |
| 三树状态 | 三个树各自维护状态，碎片化 | Canvas 性能瓶颈（50+ 节点卡顿） |
| 错误边界 | 缺失 | 任意组件报错导致整页崩溃 |

### 1.2 目标

通过渐进式架构改进，在 13.5 天内实现：

1. **P0**: 消除 7 个超长文件，单文件行数控制在 300 行以内
2. **P1**: Canvas 操作达到 60fps，50+ 节点无卡顿
3. **P1**: 任意组件报错时页面局部降级，不影响其他功能
4. **P2**: 彻底清除 `as any`，100% 类型安全
5. **P2**: 组件目录从 70 个精简到 ≤10 个顶级分类

### 1.3 成功指标

| 指标 | 当前值 | 目标值 | 验证方式 |
|------|--------|--------|---------|
| 最大单文件行数 | 2175 行（renderer.ts） | ≤ 300 行 | `wc -l` 自动检测 |
| `as any` 出现次数 | 8 个文件 | 0 | `grep -r "as any" src/` |
| Canvas 拖拽帧率 | < 30fps（50+ 节点） | ≥ 55fps | Chrome DevTools Performance |
| 组件目录顶级分类 | 70+ 混乱目录 | ≤ 10 个 | `find components -maxdepth 1` |
| 错误边界覆盖率 | 0 | 100%（按路由） | Playwright 错误注入测试 |
| 高危安全漏洞 | 未知 | 0 | `npm audit` CI 检查 |

---

## 2. Epic/Story 拆分与工时估算

### Epic 1: 基础稳定性保障（Phase 1）

**目标**: 零风险、立即提升系统稳定性和代码质量，总投入 2.5 天。

---

#### Story 1.1: 错误边界增强

| 属性 | 值 |
|------|-----|
| **Story ID** | EP1-ST1 |
| **标题** | 按路由添加 React 错误边界 |
| **描述** | 在 `/design`、`/canvas` 等核心路由添加 error.tsx，捕获组件树中的运行时错误并展示降级 UI，防止单组件崩溃导致整页白屏 |
| **工时估算** | **1 天（8h）** |
| **优先级** | P1 |
| **依赖方** | — |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|---------|---------|
| F1.1.1 | Error Boundary 组件 | 创建 `<AppErrorBoundary>` 组件，捕获 React 组件树错误 | `expect(errorBoundary.didCatch).toBe(true)` 当子组件 throw 时 | ✅ 全局 Layout 集成 |
| F1.1.2 | 路由级 error.tsx | 在 `/design` 路由创建 `app/design/error.tsx` | `expect(navigation.isAccessible()).toBe(true)` 当组件报错时 | ✅ design 路由集成 |
| F1.1.3 | 降级错误 UI | 错误时展示友好提示（组件名 + 重试按钮），不展示原始堆栈 | `expect(screen.queryByText("组件渲染失败")).toBeTruthy()` | ✅ 随 error.tsx 交付 |
| F1.1.4 | Sentry 错误上报 | 将捕获的错误上报至 Sentry，包含组件栈和用户上下文 | `expect(sentry.events.length).toBeGreaterThan(0)` 在测试注入错误后 | ✅ Sentry SDK 已配置 |

---

#### Story 1.2: 类型安全清理

| 属性 | 值 |
|------|-----|
| **Story ID** | EP1-ST2 |
| **标题** | 清除 8 个文件中的 `as any` 类型断言 |
| **描述** | 逐一审查并修复 8 个使用 `as any` 的文件，补充正确的类型定义或泛型约束，使 TypeScript 严格模式下 `tsc --noEmit` 零错误 |
| **工时估算** | **1 天（8h）** |
| **优先级** | P1 |
| **依赖方** | EP1-ST1（错误边界可并行，不强制依赖） |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|---------|---------|
| F1.2.1 | 类型断言清除 | 逐个文件修复 `as any`，补充正确类型定义 | `expect(grep "as any" src/).toHaveLength(0)` | ❌ 后端类型文件 |
| F1.2.2 | 严格模式验证 | `tsc --noEmit` 无任何 Error | `expect(exec("npx tsc --noEmit").exitCode).toBe(0)` | ❌ 纯类型检查 |
| F1.2.3 | ESLint 规则加固 | 启用 `@typescript-eslint/no-explicit-any: error`，禁止未来引入 `as any` | `expect(eslintConfig.includes("no-explicit-any: error")).toBe(true)` | ❌ 配置层 |
| F1.2.4 | 8 个文件逐一审查 | 优先处理 runtime-critical 文件（canvasStore.ts、renderer.ts 涉及文件） | 每个文件 `// TODO:` 注释移除，类型自文档化 | ❌ 类型审查 |

---

#### Story 1.3: 依赖安全审计

| 属性 | 值 |
|------|-----|
| **Story ID** | EP1-ST3 |
| **标题** | 集成依赖安全审计 CI 流程 |
| **描述** | 配置 npm audit + Dependabot，在 GitHub Actions 中集成安全扫描，自动创建依赖升级 PR，消除 High/Critical 漏洞 |
| **工时估算** | **0.5 天（4h）** |
| **优先级** | P1 |
| **依赖方** | — |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|---------|---------|
| F1.3.1 | npm audit CI 集成 | 在 `ci.yml` 中添加 `npm audit --audit-level=high` 步骤 | `expect(ciJob.didFailIfVulnerabilitiesExist()).toBe(true)` | ✅ CI/CD pipeline |
| F1.3.2 | Dependabot 配置 | 启用 GitHub Dependabot，针对 npm 包每日检查 | `expect(dependabot.schedule).toBe("daily")` | ✅ GitHub Settings |
| F1.3.3 | TruffleHog secrets 扫描 | 添加 secrets 扫描步骤，防止硬编码密钥泄露 | `expect(pipeline.includes("trufflehog")).toBe(true)` | ✅ CI pipeline |

---

### Epic 2: Canvas 性能优化（Phase 2）

**目标**: 将 Canvas 操作帧率提升至 60fps，消除 50+ 节点场景卡顿，总投入 4.5-5.5 天。

---

#### Story 2.1: Canvas 性能优化

| 属性 | 值 |
|------|-----|
| **Story ID** | EP2-ST1 |
| **标题** | Canvas 拖拽性能达到 60fps |
| **描述** | 通过 React.memo、requestAnimationFrame 批量更新、虚拟化列表三项措施，解决 50+ 节点时的卡顿问题 |
| **工时估算** | **3-4 天（24-32h）** |
| **优先级** | P1 |
| **依赖方** | EP1-ST2（类型安全完成后，canvasStore 类型更清晰） |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|---------|---------|
| F2.1.1 | React.memo 优化 | 对 CanvasNode、CanvasToolbar、Viewport 等高频重渲染组件添加 `React.memo` + 稳定引用 | `expect(rerenderCount).toBeLessThan(2)` 父组件状态变化时 | ✅ CanvasPage.tsx |
| F2.1.2 | rAF 批量更新 | 将节点拖拽的位置更新从同步 setState 改为 `requestAnimationFrame` 批量批量提交 | `expect(frameCount).toBeLessThanOrEqual(1)` 一次拖动操作 | ✅ CanvasNode drag 事件 |
| F2.1.3 | 虚拟化列表 | 对节点列表（50+ 节点）应用虚拟化，仅渲染视口内节点 | `expect(renderedNodeCount).toBeLessThan(20)` 当总节点数 = 100 时 | ✅ CanvasNodeList |
| F2.1.4 | 性能基准测试 | 编写 Playwright 性能测试脚本，记录拖拽帧率（≥ 55fps） | `expect(fps).toBeGreaterThanOrEqual(55)` | ✅ /tests/performance/ |

---

#### Story 2.2: canvasStore 拆分

| 属性 | 值 |
|------|-----|
| **Story ID** | EP2-ST2 |
| **标题** | 将 canvasStore 拆分为显式 Zustand slices |
| **描述** | 将单个巨大的 canvasStore.ts 拆分为 nodesSlice、viewportSlice、selectionSlice、historySlice 四个 slice，消除三树状态碎片化问题 |
| **工时估算** | **1.5 天（12h）** |
| **优先级** | P1 |
| **依赖方** | EP2-ST1（可并行，但 ST1 先行更安全） |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|---------|---------|
| F2.2.1 | nodesSlice 拆分 | 提取节点树相关状态和 actions（addNode、updateNode、deleteNode） | `expect(Object.keys(store.getState()).includes("nodes")).toBe(true)` | ✅ 全局 store |
| F2.2.2 | viewportSlice 拆分 | 提取视口状态（zoom、panOffset） | `expect(typeof store.getState().viewport).toBe("object")` | ✅ CanvasViewport |
| F2.2.3 | selectionSlice 拆分 | 提取选中状态（selectedNodeIds、selectedEdgeIds） | `expect(Array.isArray(store.getState().selectedIds)).toBe(true)` | ✅ SelectionToolbar |
| F2.2.4 | historySlice 拆分 | 提取撤销/重做历史栈 | `expect(typeof store.getState().history).toBe("object")` | ✅ UndoRedoControls |
| F2.2.5 | 三树状态同步 | 确保 nodesTree、elementsTree、componentsTree 切换时 selectedNodeId 同步延迟 < 16ms | `expect(syncDelay).toBeLessThan(16)` ms | ✅ 三树切换逻辑 |

---

### Epic 3: 巨型文件拆分与目录治理（Phase 3）

**目标**: 彻底消除超长文件，建立清晰的组件目录结构，总投入 5-7 天。

---

#### Story 3.1: renderer.ts 拆分

| 属性 | 值 |
|------|-----|
| **Story ID** | EP3-ST1 |
| **标题** | 将 2175 行 renderer.ts 拆分为多个职责单一的文件 |
| **描述** | 按入口+工厂 → 按端拆分 → 按元素类型拆分的顺序，逐步将 renderer.ts 拆分为 renderer/ 目录下的多个文件，单文件 ≤ 200 行 |
| **工时估算** | **3-4 天（24-32h）** |
| **优先级** | P2 |
| **依赖方** | EP1-ST2（类型安全清理完成后再动 renderer.ts） |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|---------|---------|
| F3.1.1 | 入口文件拆分 | 将 renderer.ts 入口逻辑拆出为 `renderer/index.ts`，作为统一导出入口 | `expect(rendererIndex.exports.length).toBeGreaterThan(0)` | ✅ CanvasPage.tsx |
| F3.1.2 | 工厂函数提取 | 将 `createRenderer()` 工厂函数提取为 `renderer/factory.ts` | `expect(typeof createRenderer).toBe("function")` | ✅ renderer/index.ts |
| F3.1.3 | 按端拆分 | 将 desktop/mobile/preview 三端渲染逻辑拆分到 `renderer/platform/` 子目录 | `expect(fs.existsSync("src/renderer/platform/")).toBe(true)` | ✅ renderer/ |
| F3.1.4 | 按元素类型拆分 | 将 node/edge/group 等元素类型渲染器拆分到 `renderer/elements/` | `expect(fs.existsSync("src/renderer/elements/")).toBe(true)` | ✅ renderer/ |
| F3.1.5 | 原文件删除 | 删除原始 `renderer.ts`，验证功能完全一致 | `expect(fs.existsSync("src/renderer.ts")).toBe(false)` | ✅ CI 验证 |
| F3.1.6 | 单文件行数验证 | 每个拆分后文件行数 ≤ 200 行 | `expect(maxLineCount).toBeLessThanOrEqual(200)` | ✅ CI 自动化 |

---

#### Story 3.2: 组件目录治理

| 属性 | 值 |
|------|-----|
| **Story ID** | EP3-ST2 |
| **标题** | 重组 70 个组件目录为 ≤10 个顶级分类 |
| **描述** | 将 components/ 下的 70+ 混乱目录按功能归类为 canvas/、design/、ui/、layout/、shared/ 等顶级分类，建立 index.ts 导出规范 |
| **工时估算** | **2-3 天（16-24h）** |
| **优先级** | P2 |
| **依赖方** | EP3-ST1（可并行，但建议 renderer 拆分后再做目录重组） |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|---------|---------|
| F3.2.1 | 目录结构重组 | 将 components/ 重组为 ≤10 个顶级目录（canvas、design、ui、layout、shared 等） | `expect(topLevelDirCount).toBeLessThanOrEqual(10)` | ✅ components/ |
| F3.2.2 | index.ts 统一导出 | 每个组件目录添加 `index.ts`，统一导出公共 API | `expect(fs.existsSync("src/components/canvas/index.ts")).toBe(true)` | ✅ 所有组件目录 |
| F3.2.3 | 路径别名配置 | 配置 `@/components/*` 路径别名，更新所有 import 路径 | `expect(importsWorkAfterAliasUpdate).toBe(true)` | ✅ tsconfig.json |
| F3.2.4 | 全局搜索验证 | 确保所有 import 路径在重组后仍然有效 | `expect(tscResult.exitCode).toBe(0)` after `git mv` | ✅ CI 验证 |
| F3.2.5 | README 组件索引 | 创建 `components/README.md`，列出所有组件及用途 | `expect(readmeComponentCount).toBeGreaterThan(50)` | ✅ components/ |

---

## 3. 工时汇总

| Epic | Story | 工时 | 累计 |
|------|-------|------|------|
| EP1-ST1 | 错误边界增强 | 1 天 | 1 天 |
| EP1-ST2 | 类型安全清理 | 1 天 | 2 天 |
| EP1-ST3 | 依赖安全审计 | 0.5 天 | 2.5 天 |
| EP2-ST1 | Canvas 性能优化 | 3-4 天 | 5.5-6.5 天 |
| EP2-ST2 | canvasStore 拆分 | 1.5 天 | 7-8 天 |
| EP3-ST1 | renderer.ts 拆分 | 3-4 天 | 10-12 天 |
| EP3-ST2 | 组件目录治理 | 2-3 天 | 12-15 天 |

> **注**: 风险调整后总工时约 **13.5 天**（取中间值），单次重构影响范围小，风险可控。

---

## 4. 验收标准

### 4.1 质量门禁（Gate Criteria）

以下所有检查必须在 CI pipeline 中通过，PR 才能合并：

| Gate | 检查项 | 验证命令 |
|------|--------|---------|
| G1 | `tsc --noEmit` 无错误 | `npx tsc --noEmit` |
| G2 | `as any` 零出现 | `grep -r "as any" src/` → exit code 1 |
| G3 | `npm audit` 无 High/Critical 漏洞 | `npm audit --audit-level=high` |
| G4 | 单文件最大行数 ≤ 300 | `wc -l src/**/*.ts` |
| G5 | E2E 测试套件 100% 通过 | `npm run test:e2e` |
| G6 | 类型覆盖率 ≥ 80% | `vitest --coverage` |

### 4.2 阶段验收

#### Phase 1 验收（2.5 天）

| 验收项 | 验证条件 | 测试断言 |
|--------|---------|---------|
| 错误边界 | `/design` 路由下组件 throw 时，页面局部展示错误，导航正常 | `expect(page.locator("nav").isVisible()).toBe(true)` |
| 类型安全 | 项目中 `as any` 出现次数 = 0 | `expect(count).toBe(0)` |
| 安全审计 | CI 包含 `npm audit` 步骤且通过 | `expect(ciSteps.includes("audit")).toBe(true)` |

#### Phase 2 验收（4.5-5.5 天）

| 验收项 | 验证条件 | 测试断言 |
|--------|---------|---------|
| 拖拽帧率 | 50 节点拖拽帧率 ≥ 55fps | `expect(fps).toBeGreaterThanOrEqual(55)` |
| store 拆分 | Zustand store 有独立 slice 导出 | `expect(Object.keys(store).sort()).toEqual(["history", "nodes", "selection", "viewport"])` |
| 状态同步 | 三树切换同步延迟 < 16ms | `expect(syncTime).toBeLessThan(16)` |

#### Phase 3 验收（5-7 天）

| 验收项 | 验证条件 | 测试断言 |
|--------|---------|---------|
| renderer.ts 删除 | 原始文件不存在 | `expect(fs.existsSync(...)).toBe(false)` |
| 目录数量 | 顶级组件目录 ≤ 10 个 | `expect(dirCount).toBeLessThanOrEqual(10)` |
| 功能一致 | 拆分前后 Canvas 页面功能完全一致 | E2E 100% 通过 |

---

## 5. 验收功能点总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|---------|---------|
| F1.1.1 | Error Boundary 组件 | `<AppErrorBoundary>` 捕获子组件错误 | `expect(didCatch).toBe(true)` | ✅ Layout |
| F1.1.2 | 路由级 error.tsx | `/design` 路由错误隔离 | `expect(nav.isAccessible()).toBe(true)` | ✅ design 路由 |
| F1.1.3 | 降级错误 UI | 友好错误提示，不展示原始堆栈 | `expect(getByText("组件渲染失败")).toBeTruthy()` | ✅ error.tsx |
| F1.1.4 | Sentry 错误上报 | 捕获错误上报至 Sentry | `expect(sentry.events.length).toBeGreaterThan(0)` | ✅ Sentry SDK |
| F1.2.1 | 类型断言清除 | 8 个文件 `as any` → 正确类型 | `expect(count).toBe(0)` | ❌ |
| F1.2.2 | 严格模式验证 | `tsc --noEmit` 零错误 | `expect(exitCode).toBe(0)` | ❌ |
| F1.2.3 | ESLint 规则加固 | `no-explicit-any: error` 启用 | `expect(config.ok).toBe(true)` | ❌ |
| F1.2.4 | 逐一类型审查 | 8 个文件逐个审查并修复 | `expect(file.hasCorrectTypes).toBe(true)` × 8 | ❌ |
| F1.3.1 | npm audit CI | CI 中集成 `npm audit --audit-level=high` | `expect(failsOnVulns).toBe(true)` | ✅ CI |
| F1.3.2 | Dependabot 配置 | 每日检查 npm 包依赖 | `expect(schedule).toBe("daily")` | ✅ GitHub |
| F1.3.3 | TruffleHog 扫描 | CI 中集成 secrets 扫描 | `expect(inPipeline).toBe(true)` | ✅ CI |
| F2.1.1 | React.memo 优化 | 高频组件 memo + 稳定引用 | `expect(rerenders).toBeLessThan(2)` | ✅ Canvas |
| F2.1.2 | rAF 批量更新 | 拖拽位置 rAF 批量提交 | `expect(frames).toBeLessThanOrEqual(1)` | ✅ drag 事件 |
| F2.1.3 | 虚拟化列表 | 100 节点仅渲染视口内节点 | `expect(rendered).toBeLessThan(20)` | ✅ CanvasNodeList |
| F2.1.4 | 性能基准测试 | Playwright 帧率测试脚本 | `expect(fps).toBeGreaterThanOrEqual(55)` | ✅ /tests/ |
| F2.2.1 | nodesSlice | 节点树 slice 独立 | `expect(hasSlice).toBe(true)` | ✅ store |
| F2.2.2 | viewportSlice | 视口 slice 独立 | `expect(hasSlice).toBe(true)` | ✅ store |
| F2.2.3 | selectionSlice | 选中状态 slice 独立 | `expect(hasSlice).toBe(true)` | ✅ store |
| F2.2.4 | historySlice | 历史栈 slice 独立 | `expect(hasSlice).toBe(true)` | ✅ store |
| F2.2.5 | 三树状态同步 | 同步延迟 < 16ms | `expect(syncDelay).toBeLessThan(16)` | ✅ 三树逻辑 |
| F3.1.1 | 入口文件拆分 | renderer/index.ts 统一导出 | `expect(hasExports).toBe(true)` | ✅ CanvasPage |
| F3.1.2 | 工厂函数提取 | renderer/factory.ts | `expect(typeof fn).toBe("function")` | ✅ index |
| F3.1.3 | 按端拆分 | renderer/platform/ 三端 | `expect(fs.existsSync(...)).toBe(true)` | ✅ renderer |
| F3.1.4 | 按元素类型拆分 | renderer/elements/ | `expect(fs.existsSync(...)).toBe(true)` | ✅ renderer |
| F3.1.5 | 原文件删除 | renderer.ts 不存在 | `expect(!fs.existsSync("renderer.ts")).toBe(true)` | ✅ CI |
| F3.1.6 | 单文件行数验证 | 每文件 ≤ 200 行 | `expect(maxLines).toBeLessThanOrEqual(200)` | ✅ CI |
| F3.2.1 | 目录结构重组 | 顶级目录 ≤ 10 | `expect(dirCount).toBeLessThanOrEqual(10)` | ✅ components |
| F3.2.2 | index.ts 导出 | 每个组件目录有 index.ts | `expect(hasIndex).toBe(true)` × N | ✅ 所有目录 |
| F3.2.3 | 路径别名 | `@/components/*` 配置生效 | `expect(importsWork).toBe(true)` | ✅ tsconfig |
| F3.2.4 | 全局路径验证 | `tsc` 编译通过 | `expect(exitCode).toBe(0)` | ✅ CI |
| F3.2.5 | 组件索引 README | components/README.md 完整 | `expect(count).toBeGreaterThan(50)` | ✅ components |

---

## 6. Definition of Done（DoD）

### 6.1 单个 Story 的 DoD

一个 Story 视为完成当且仅当：

1. **代码实现**: 所有功能点代码已提交到 feature 分支
2. **类型检查**: `npx tsc --noEmit` 通过，零 Error
3. **ESLint 检查**: `npx eslint src/` 无 Error
4. **单元/集成测试**: 核心逻辑有测试覆盖，关键路径覆盖
5. **E2E 测试**: 涉及 UI 变更的功能有 Playwright 测试保护
6. **PR Review**: 经过至少 1 名 reviewer 审核并approved
7. **文档更新**: 架构决策写入 `docs/adr/`（如适用）
8. **CI Green**: 所有 CI 检查通过（lint、test、audit、type）

### 6.2 单个 Epic 的 DoD

1. 所有下属 Story 满足 DoD
2. 阶段验收标准全部达成
3. 阶段演示通过（demo to team）
4. Epic 总结写入 `docs/adr/`

### 6.3 整个项目的 DoD

1. 所有 Epic 完成且验收通过
2. 总工时在风险调整范围内（12-15 天）
3. 所有质量门禁（Gate G1-G6）通过
4. 技术债务消除指标全部达成
5. 更新 `CHANGELOG.md` 和 `ARCHITECTURE.md`
6. reviewer 最终审核通过

---

## 7. 实施计划

| 阶段 | Story | 顺序 | 预计时长 | 累计 |
|------|-------|------|---------|------|
| **Phase 1** | EP1-ST1 错误边界 | Day 1 | 1 天 | 1 天 |
| **Phase 1** | EP1-ST2 类型安全 | Day 2 | 1 天 | 2 天 |
| **Phase 1** | EP1-ST3 依赖审计 | Day 2.5 | 0.5 天 | 2.5 天 |
| **Phase 2** | EP2-ST1 Canvas 性能 | Day 3-6 | 3-4 天 | 5.5-6.5 天 |
| **Phase 2** | EP2-ST2 store 拆分 | Day 5-6 | 1.5 天 | 7-8 天 |
| **Phase 3** | EP3-ST1 renderer 拆分 | Day 7-11 | 3-4 天 | 10-12 天 |
| **Phase 3** | EP3-ST2 目录治理 | Day 9-12 | 2-3 天 | 12-15 天 |

> **里程碑**: Phase 1 结束后（2.5 天）系统稳定性和类型安全立即提升，建议在第 3 天做阶段演示。

---

## 8. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| renderer.ts 拆分引入回归 bug | 高 | 高 | 每拆分一个文件立即运行 E2E 测试；Playwright 全面回归 |
| Zustand store 重构状态丢失 | 中 | 高 | 先写集成测试再改 store；保留备份路径 |
| 路径更新遗漏 import | 高 | 中 | 使用 `git mv`；`tsc --noEmit` 验证；全局搜索替换脚本 |
| Phase 间 PR 冲突 | 高 | 中 | 设置重构冻结窗口；所有变更在单一 PR 内 |
| 三树状态统一循环依赖 | 低 | 高 | 先画依赖图再动手；ESLint `import/no-cycle` 规则 |

---

*本文档由 PM Agent 基于 Architect 提案分析报告生成 - 2026-04-02*
*产物路径: `docs/vibex-architect-proposals-20260402_061709/prd.md`*
