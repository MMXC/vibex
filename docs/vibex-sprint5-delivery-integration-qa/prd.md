# PRD — vibex-sprint5-delivery-integration-qa

**项目**: vibex-sprint5-delivery-integration-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: PM（QA 验证）
**上游**: `vibex-sprint5-delivery-integration` (prd.md, specs/, analyst-qa-report.md)

---

## 执行摘要

### 背景
`vibex-sprint5-delivery-integration` 完成了 Delivery Center 与 Sprint1-4 画布的集成。Analyst QA 报告发现 3 个 BLOCKER（E1 数据流断裂、E4 PRD 完全不可用、E5 状态处理不完整），需系统性验证。

### 目标
对 `vibex-sprint5-delivery-integration` 的产出物进行系统性 QA 验证，覆盖：
- **产出物完整性**：代码/测试/文档是否全部到位
- **交互可用性**：数据流、跳转、导出是否可走通
- **设计一致性**：类型系统、组件规范与 specs/ 一致

### 成功指标
- 3 个 BLOCKER 全部修复
- E1~E5 所有缺陷归档入 `defects/`
- QA 验收标准 100% 可写 `expect()` 断言
- 无 P0 遗留进入下一阶段

---

## 1. 功能点总表（QA 视角）

### 1a. 产出物完整性检查矩阵

| Epic | 代码产出 | 测试 | Spec 产出 | 状态 |
|------|---------|------|---------|------|
| E1: 数据层集成 | deliveryStore + toComponent/toSchema/toDDL ✅ | 12 tests ✅ | E1-data-integration.md ✅ | ⚠️ BLOCKER |
| E2: 双向跳转 | DeliveryNav + CanvasBreadcrumb ✅ | 7 tests ✅ | E2-navigation.md ✅ | ✅ 通过 |
| E3: 交付导出器 | DDLGenerator + formatDDL + DDLDrawer ✅ | 16 tests ✅ | E3-exporters.md ✅ | ✅ 通过 |
| E4: PRD融合 | PRDTab UI ✅ (数据硬编码) | 无测试 ❌ | E4-prd-fusion.md ✅ | 🔴 BLOCKER |
| E5: 状态处理 | 部分空状态引导 ✅ | 无测试 ❌ | E5-state-handling.md ✅ | 🔴 BLOCKER |

### 1b. 交互可用性检查矩阵

| ID | 交互路径 | 起点 | 操作 | 终点 | 预期结果 |
|----|---------|------|------|------|---------|
| I1 | E1 真实数据加载 | delivery/page.tsx mount | 初始化 | DeliveryTabs | loadFromStores 被调用，非 loadMockData |
| I2 | E2 导出跳转 | DDSToolbar | 点击导出 | Delivery Center | router.push('/canvas/delivery') |
| I3 | E3 DDL导出 | DDLDrawer | 点击导出DDL | SQL Modal | 语法高亮预览 + 下载 |
| I4 | E4 PRD导出 | PRDTab | 点击导出 | Markdown下载 | 实际生成 .md 文件，非 stub |
| I5 | E5 空状态 | 交付中心无数据 | 进入 | 空状态页 | 引导文案 + 去编辑按钮 |
| I6 | E5 导出失败 | 导出异常 | 触发 | Toast | 错误提示 + 按钮保持可用 |

### 1c. 设计一致性检查矩阵

| ID | 检查项 | 规范来源 | 预期 | 检查方法 |
|----|--------|---------|------|---------|
| C1 | loadFromStores 调用 | E1-data-integration.md | delivery/page.tsx 调用 | 代码搜索 |
| C2 | BoundedContext 接口 | E1-data-integration.md | 无多余 relations 字段 | TypeScript 编译 |
| C3 | 导出函数无重复定义 | E1-data-integration.md | toComponent 等无双重定义 | 代码审查 |
| C4 | DDLGenerator 直接读源Store | E3-exporters.md | DDLDrawer 读 DDSCanvasStore | 代码审查 |
| C5 | 5 Tab 布局 | E3-exporters.md | DeliveryTabs 5 Tab | 测试验证 |
| C6 | DeliveryNav aria-current | E2-navigation.md | 导航按钮无障碍 | 测试验证 |
| C7 | PRD Tab 无 mock 文案 | E4-prd-fusion.md | 无"电商系统"等 mock | 代码搜索 |
| C8 | 导出 stub 实现 | E4-prd-fusion.md | exportItem 替换 TODO | 代码审查 |

---

## 2. Epic 拆分（QA 验证维度）

### E1: 数据层集成产出物完整性

**Epic 目标**: 验证 deliveryStore 从 mock → 真实数据的切换是否完成。

#### 2a. 本质需求穿透

- **验证的核心**: loadFromStores 是否被调用，数据是否真正从 prototypeStore + DDSCanvasStore 来
- **去掉的验证项**: PRD 自动生成（E1-A4 并入 E4）
- **本质问题**: loadFromStores 已实现但从未调用，ContextTab/FlowTab/ComponentTab 消费 mock 数据

#### 2b. 最小可行范围

- **本期必查**: A1（loadFromStores 调用）+ A2（toComponent）+ A3（toBoundedContext）
- **本期不查**: A4（PRD 生成，并入 E4）

#### 2c. 情绪地图（QA 视角）

- **进入 Delivery Center**: 预期看到真实画布数据 → 检查点：I1
- **组件 Tab**: 预期看到 ProtoNode 转换结果 → 检查点：C2

#### E1-QA1: loadFromStores 被调用
- **验证项**: `delivery/page.tsx` mount 时调用 `loadFromStores()`，非 `loadMockData()`
- **验收标准**: `expect(screen.queryByText('Mock Component')).not.toBeInTheDocument()`

#### E1-QA2: toComponent/toSchema/toDDL 函数
- **验证项**: 转换函数存在且可 import
- **验收标准**: `expect(typeof toComponent).toBe('function')`

#### E1-QA3: 类型无漂移
- **验证项**: BoundedContext/BusinessFlow 接口与 deliveryStore.ts 赋值一致
- **验收标准**: `tsc --noEmit` 无类型错误

---

### E2: 双向跳转产出物完整性

**Epic 目标**: 验证导航跳转代码和测试完整性。

#### 2a. 本质需求穿透

- **验证的核心**: DeliveryNav + CanvasBreadcrumb 组件功能 + 测试覆盖率
- **去掉的验证项**: 面包屑分隔符样式（设计细节）

#### E2-QA1: DeliveryNav 测试覆盖
- **验证项**: 7 tests 全部 PASS
- **验收标准**: `expect(screen.getByRole('tab', { name: /交付中心/i })).toBeInTheDocument()`

#### E2-QA2: CanvasBreadcrumb 测试覆盖
- **验证项**: 4 tests 全部 PASS
- **验收标准**: 面包屑显示当前画布名称

---

### E3: 交付导出器产出物完整性

**Epic 目标**: 验证 DDLGenerator + formatDDL 代码和测试完整性。

#### 2a. 本质需求穿透

- **验证的核心**: DDLGenerator 直接从 DDSCanvasStore 拉取 APIEndpointCard，不经过 mock deliveryStore
- **去掉的验证项**: DDLGenerator 内重复 if 语句（代码清理问题）

#### E3-QA1: DDLGenerator 16 tests PASS
- **验证项**: 16/16 tests 通过
- **验收标准**: `pnpm test -- --testPathPattern="DDLGenerator|formatDDL"` → 16 PASS

#### E3-QA2: DDLDrawer 直接读源 Store
- **验证项**: DDLDrawer 读取 `DDSCanvasStore.chapters.api`，绕过 deliveryStore mock
- **验收标准**: 代码审查无 mock 数据依赖

---

### E4: PRD融合产出物完整性

**Epic 目标**: 验证 PRD Tab 从 stub → 真实数据生成的切换是否完成。

#### 2a. 本质需求穿透

- **验证的核心**: PRDGenerator 函数是否存在，exportItem 是否替换了 TODO stub
- **去掉的验证项**: PRD 预览编辑器（F-D.3 暂缓）

#### 2b. 最小可行范围

- **本期必查**: D1（PRD Tab 无硬编码）+ D2（Markdown 导出实际可用）
- **本期不做**: D3（预览编辑器，暂缓）

#### 2c. 情绪地图（QA 视角）

- **进入 PRD Tab**: 预期看到真实画布数据生成的 PRD 大纲 → 检查点：I4
- **点击导出**: 预期下载真实 .md 文件 → 检查点：I4

#### E4-QA1: PRDGenerator 函数存在
- **验证项**: `generatePRD()` 和 `generatePRDMarkdown()` 函数存在
- **验收标准**: `expect(typeof generatePRD).toBe('function')`; `expect(typeof generatePRDMarkdown).toBe('function')`

#### E4-QA2: PRD Tab 无 mock 文案
- **验证项**: PRDTab.tsx 不含 "电商系统" / "Mock PRD Content" 等硬编码
- **验收标准**: `expect(screen.queryByText(/电商系统/i)).not.toBeInTheDocument()`

#### E4-QA3: exportItem 替换 TODO
- **验证项**: deliveryStore.ts 中 `exportItem` 不再有 "// TODO: Replace with actual API call" 注释
- **验收标准**: 代码搜索 "TODO" → 0 处（相关行）

---

### E5: 状态处理产出物完整性

**Epic 目标**: 验证空状态/骨架屏/错误态组件是否正确实现。

#### 2a. 本质需求穿透

- **验证的核心**: 每个 Tab 有空状态引导，导出失败有 toast，加载有骨架屏
- **去掉的验证项**: 离线状态处理（暂缓）

#### 2c. 情绪地图（QA 视角）

- **无数据时**: 预期引导文案 + 去编辑按钮 → 检查点：I5
- **导出失败时**: 预期 toast 提示 → 检查点：I6

#### E5-QA1: 空状态引导组件
- **验证项**: ContextTab/FlowTab/ComponentTab 有空状态组件（非白屏）
- **验收标准**: 空数据 store 渲染后有引导文案

#### E5-QA2: 导出失败 toast
- **验证项**: store exportAll 失败时 toast UI 显示
- **验收标准**: `expect(screen.getByText(/导出失败/i)).toBeInTheDocument()`

#### E5-QA3: 骨架屏组件
- **验证项**: 交付 Tab 切换有骨架屏（非 spinner）
- **验收标准**: `expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()`

#### E5-QA4: E5 测试覆盖
- **验证项**: E5 有单元测试
- **验收标准**: 测试文件存在且 PASS

---

## 3. 优先级矩阵

| 优先级 | Epic | QA 项 | 依据 |
|--------|------|-------|------|
| P0 | E1 | QA1（loadFromStores 未调用） | 数据流断裂，交付中心无真实数据 |
| P0 | E4 | QA1~QA3（PRD Generator 缺失 + 导出 stub） | PRD Tab 完全不可用 |
| P0 | E5 | QA1~QA3（空状态/toast/骨架屏缺项） | 状态处理不完整 |
| P1 | E1 | QA2~QA3（类型漂移） | 类型错误风险 |
| P2 | E3 | 重复 if 语句 | 代码清理 |
| P2 | E4 | QA4（无测试） | 测试覆盖率 |

---

## 4. 验收标准汇总（expect() 条目）

```
// E1-QA1: loadFromStores 被调用
expect(screen.queryByText('Mock Component')).not.toBeInTheDocument()
expect(screen.queryByText('Mock Context')).not.toBeInTheDocument()

// E1-QA2: 转换函数存在
expect(typeof toComponent).toBe('function')
expect(typeof toBoundedContext).toBe('function')
expect(typeof toBusinessFlow).toBe('function')

// E2-QA1: DeliveryNav 7 tests PASS
// 验证 pnpm test 输出: 7 PASS

// E3-QA1: DDLGenerator 16 tests PASS
// 验证 pnpm test 输出: 16 PASS

// E4-QA1: PRD Generator 函数存在
expect(typeof generatePRD).toBe('function')
expect(typeof generatePRDMarkdown).toBe('function')

// E4-QA2: PRD Tab 无 mock 文案
expect(screen.queryByText(/电商系统/i)).not.toBeInTheDocument()
expect(screen.queryByText(/Mock PRD Content/i)).not.toBeInTheDocument()

// E4-QA3: exportItem 替换 TODO
// grep "TODO: Replace" deliveryStore.ts → 0

// E5-QA1: 空状态引导
expect(screen.getByText(/请先创建/i)).toBeInTheDocument()
expect(screen.getByRole('button', { name: /去编辑/i })).toBeInTheDocument()

// E5-QA2: 导出失败 toast
// mock store.exportAll rejected → expect toast shown

// E5-QA3: 无 spinner
expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
```

---

## 5. DoD (Definition of Done)

### QA 完成判断标准

#### 产出物完整性
- [ ] E1~E5 所有代码文件存在（通过路径检查）
- [ ] E1~E3 测试全部 PASS（35 tests）
- [ ] E4/E5 补充测试完成
- [ ] `defects/` 目录包含所有发现缺陷

#### 交互可用性
- [ ] I1~I6 交互路径全部可走通（QA 验证）
- [ ] E4 PRD 导出实际下载文件（不是 stub）

#### 设计一致性
- [ ] C1~C8 全部检查项通过
- [ ] TypeScript 编译无错误
- [ ] 导出 stub TODO 全部清除

#### 报告完整性
- [ ] 产出 `docs/vibex-sprint5-delivery-integration-qa/qa-final-report.md`
- [ ] 所有 Epic 有 PASS/FAIL 判定
- [ ] 3 个 BLOCKER 修复后重新 QA 验证

---

## 6. Specs 索引

| Spec 文件 | 对应 Epic | 用途 |
|-----------|---------|------|
| specs/E1-data-integration.md | E1 | 数据转换规格（QA 参照标准） |
| specs/E2-navigation.md | E2 | 导航规范（QA 参照标准） |
| specs/E3-exporters.md | E3 | 导出器规范（QA 参照标准） |
| specs/E4-prd-fusion.md | E4 | PRD 生成规范（QA 参照标准） |
| specs/E5-state-handling.md | E5 | 状态处理规范（QA 参照标准） |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint5-delivery-integration-qa
- **执行日期**: 2026-04-18
