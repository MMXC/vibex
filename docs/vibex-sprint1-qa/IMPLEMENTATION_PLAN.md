# Implementation Plan — vibex-sprint1-qa

**项目**: vibex-sprint1-qa
**版本**: 1.0
**日期**: 2026-04-17
**角色**: Architect
**状态**: Draft

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 环境验证 | U1 ~ U2 | ⬜ 0/2 | U1 |
| E2: 编译与测试 | U3 ~ U4 | ⬜ 0/2 | U3 |
| E3: 缺陷修复 | U5 ~ U7 | ⬜ 0/3 | U5 |
| E4: 交互验证 | U8 ~ U11 | ⬜ 0/4 | 依赖 U5（dev server）|
| E5: 产出验证 | U12 ~ U14 | ⬜ 0/3 | U12 |

---

## E1: 环境验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1 | dev server 启动与健康检查 | ⬜ | — | `curl localhost:3000/prototype/editor` 返回 200 |
| U2 | QA1 文件完整性验证 | ⬜ | — | 12/12 核心文件全部存在 |

---

### U1: dev server 启动与健康检查

**Goal:** 启动 Next.js dev server，验证 Prototype Canvas 可访问（解除 DEF-03）。

**Requirements:** DEF-03 解除

**Dependencies:** —

**Files:**
- Create: `vibex-fronted/scripts/start-dev-server.sh`
- Modify: `.env.local`（如有需要的环境变量）

**Approach:**
```bash
# 检查端口占用
lsof -i :3000 | grep LISTEN && echo "Port 3000 in use" && exit 1

# 启动 dev server（后台）
cd vibex-fronted && pnpm dev &
sleep 10  # 等待启动

# 健康检查
curl -sf http://localhost:3000/prototype/editor > /dev/null && echo "OK" || echo "FAIL"
```

**Test scenarios:**
- Happy path: dev server 在 30s 内启动，/prototype/editor 返回 200
- Edge case: 端口 3000 被占用 → 报错并退出
- Error path: 启动失败 → 日志输出并返回 exit code 1

**Verification:**
- `curl http://localhost:3000/prototype/editor -o /dev/null -w "%{http_code}"` → `200`

---

### U2: QA1 文件完整性验证

**Goal:** 验证 Sprint1 产出的 12 个核心文件全部存在。

**Requirements:** QA1 验收标准

**Dependencies:** U1（可选，静态检查无需 server）

**Files:**
- Modify: `docs/vibex-sprint1-qa/run-qa.sh`

**Approach:**
```bash
# 核心组件文件（7个）
files=(
  "src/components/prototype/ProtoEditor.tsx"
  "src/components/prototype/ProtoFlowCanvas.tsx"
  "src/components/prototype/ProtoNode.tsx"
  "src/components/prototype/ProtoAttrPanel.tsx"
  "src/components/prototype/RoutingDrawer.tsx"
  "src/components/prototype/ComponentPanel.tsx"
  "src/components/prototype/PrototypeExporter.tsx"
)

# Store + Schema（2个）
files+=(
  "src/stores/prototypeStore.ts"
  "src/stores/prototypeStore.test.ts"
  "src/lib/prototypes/ui-schema.ts"
)

# 页面文件（2个）
files+=(
  "src/app/prototype/page.tsx"
  "src/app/prototype/editor/page.tsx"
)

for f in "${files[@]}"; do
  [ -f "$f" ] || echo "MISSING: $f"
done
```

**Test scenarios:**
- Happy path: 12/12 文件全部存在，无 MISSING 输出
- Edge case: 任意文件缺失 → 输出文件名

**Verification:**
- `bash docs/vibex-sprint1-qa/run-qa.sh | grep -c "MISSING"` → `0`

---

## E2: 编译与测试

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U3 | QA2 TypeScript 编译验证 | ⬜ | — | `pnpm tsc --noEmit` exit code 0 |
| U4 | QA3 + QA4 Vitest 测试套件 | ⬜ | — | 64 tests passed，prototypeStore ≥ 17 tests |

---

### U3: QA2 TypeScript 编译验证

**Goal:** 确保 Sprint1 代码 TypeScript 编译零 error（QA2）。

**Requirements:** QA2 验收标准

**Dependencies:** —

**Files:**
- Modify: `vibex-fronted/tsconfig.json`（如有修复）

**Approach:**
```bash
cd vibex-fronted
pnpm tsc --noEmit 2>&1 | tee tsc-output.txt
[ $? -eq 0 ] && echo "PASS: TypeScript 编译通过" || echo "FAIL: 有编译错误"
```

**Test scenarios:**
- Happy path: `pnpm tsc --noEmit` exit code 0
- Error path: 存在 error TS → 输出错误文件和行号

**Verification:**
- `pnpm tsc --noEmit; echo $?` → `0`

---

### U4: QA3 + QA4 Vitest 测试套件

**Goal:** 执行 Vitest 测试套件，确保 64 tests 通过，prototypeStore ≥ 17 tests（QA3 + QA4）。

**Requirements:** QA3, QA4 验收标准

**Dependencies:** U3

**Files:**
- Modify: `vibex-fronted/src/components/prototype/__tests__/ProtoFlowCanvas.test.tsx`（DEF-02 修复）

**Approach:**
```bash
cd vibex-fronted
pnpm vitest run --reporter=verbose 2>&1 | tee vitest-output.txt

# 提取测试数
passed=$(grep -oP '\d+(?= passed)' vitest-output.txt | head -1)
[ "$passed" -ge 64 ] && echo "PASS: $passed tests" || echo "FAIL: $passed < 64"

# prototypeStore 专项
pnpm vitest run src/stores/prototypeStore.test.ts --reporter=verbose
# 期望: 17 tests passed，含 addEdge/removeEdge
```

**Test scenarios:**
- Happy path: 64 tests passed，5 个测试文件全部 green
- Edge case: prototypeStore 失败 → 定位具体 it() 块
- Edge case: 总数不足 64 → 定位缺失的测试文件

**Verification:**
- `pnpm vitest run | grep -oP '\d+ tests'` → `64 tests`

---

## E3: 缺陷修复

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U5 | DEF-03: dev server 启动脚本 | ⬜ | U1 | 脚本可用，server 稳定运行 |
| U6 | DEF-02: ProtoFlowCanvas 覆盖率提升 8→15+ | ⬜ | U4 | 新增 7+ tests，Vitest 通过 |
| U7 | DEF-01: Edge UI 完整性 gstack 验证 | ⬜ | U5 | RoutingDrawer 连线 UI 可用 |

---

### U6: DEF-02: ProtoFlowCanvas 覆盖率提升（8→15+）

**Goal:** 在 `ProtoFlowCanvas.test.tsx` 新增 7 个测试用例，覆盖 edge/selection/deviceMode 场景。

**Requirements:** DEF-02, QA12 验收标准

**Dependencies:** U4（Vitest 环境就绪）

**Files:**
- Modify: `vibex-fronted/src/components/prototype/__tests__/ProtoFlowCanvas.test.tsx`

**Approach:**
在现有 8 个渲染测试之后，新增以下 describe 块：

```typescript
// 新增 describe 块 1: Edge connections
describe('Edge connection behavior', () => {
  it('onConnect handler is defined on canvas', () => {
    // 验证 onConnect 从 store.addEdge 获取
  });

  it('onConnect creates edge with source and target', () => {
    // 模拟 connection 事件
    // 验证 store.addEdge('source-id', 'target-id') 被调用
  });

  it('edge removal via store.removeEdge', () => {
    // 直接调用 store.removeEdge(edgeId)
    // 验证 edges 数组更新
  });
});

// 新增 describe 块 2: Node selection
describe('Node selection state', () => {
  it('single click selects node and updates store', () => {
    // 模拟 click 事件
    // 验证 store.selectNode(id) 被调用
  });

  it('selectedNodeId persists across re-renders', () => {
    // 选中节点 → force re-render → 验证 selectedNodeId 仍为原值
  });
});

// 新增 describe 块 3: Empty state
describe('Empty canvas hints', () => {
  it('empty hint visible when store.nodes is empty', () => {
    // 验证 empty state hint 文本出现
  });

  it('empty hint hidden after addNode', () => {
    // addNode → empty hint 消失
  });
});
```

> **注**: deviceMode 测试需确认所属 slice 后，在对应测试文件中覆盖。

**Test scenarios:**
- Happy path: 新增 7 tests 全部通过
- Edge case: store.addEdge 未定义 → 测试失败 → 确认 store 接口
- Error path: React Flow provider 未包裹 → 添加 wrapper

**Verification:**
- `pnpm vitest run src/components/prototype/__tests__/ProtoFlowCanvas.test.tsx | grep -oP '\d+ tests'` → `15+ tests`

---

### U7: DEF-01: Edge UI 完整性 gstack 验证

**Goal:** 启动 dev server 后，用 gstack browse 验证 RoutingDrawer 中 Edge 连线 UI 的可用性（DEF-01）。

**Requirements:** DEF-01, QA5 验收标准

**Dependencies:** U5（dev server 运行中）

**Files:**
- Modify: `docs/vibex-sprint1-qa/run-qa.sh`（新增 gstack 验证步骤）

**Approach:**
```bash
B="/root/.openclaw/workspace/skills/gstack-browse/bin/browse"
export CI=true
export BROWSE_SERVER_SCRIPT=/root/.openclaw/gstack/browse/src/server.ts
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright

# 启动 gstack
$B goto http://localhost:3000/prototype/editor
$B waitForSelector ".react-flow" --timeout=15000

# 验证 Edge 可视化存在（至少 store 层支持）
$B snapshot -i
# 预期: 有 react-flow 节点存在

# 验证 RoutingDrawer 可打开
$B click text="路由管理"
$B is visible text="添加连线" || $B is visible text="页面"
```

**Test scenarios:**
- Happy path: `/prototype/editor` 页面加载，React Flow 渲染
- Edge case: 页面加载 > 15s → timeout → 重试或标记 blocked
- Error path: `.react-flow` 不存在 → 截图 + 日志

**Verification:**
- gstack browse 无 error，页面截图包含 React Flow canvas

---

## E4: 交互验证（依赖 U5 dev server）

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U8 | QA6: 拖拽节点交互验证 | ⬜ | U5 | ComponentPanel 可拖拽，画布节点增加 |
| U9 | QA7: RoutingDrawer 页面管理验证 | ⬜ | U5 | 页面增/删功能正常 |
| U10 | QA8: ProtoAttrPanel 属性编辑验证 | ⬜ | U5 | 属性面板打开，数据修改生效 |
| U11 | QA5: Edge 连线 UI 端到端验证 | ⬜ | U5 | Edge 连线创建/删除 UI 可用 |

---

### U8: QA6: 拖拽节点交互验证

**Approach:**
```bash
$B goto http://localhost:3000/prototype/editor
$B waitForSelector ".react-flow"
$B waitForSelector ".component-item"

# 记录初始节点数
$B snapshot -i
# 拖拽第一个组件到画布
$B drag "@eX" "@eY"  # ComponentPanel → Canvas

# 验证节点增加
$B waitForSelector ".react-flow__node"
$B snapshot -i
```

**Verification:**
- `.react-flow__node` 在拖拽后出现

---

### U9: QA7: RoutingDrawer 页面管理验证

**Approach:**
```bash
$B goto http://localhost:3000/prototype/editor
$B waitForSelector ".react-flow"

# 打开 RoutingDrawer
$B click text="路由管理" || $B click "[aria-label='路由']"
$B is visible text="页面管理"

# 添加页面
$B click text="添加页面"
# 验证页面数增加
```

**Verification:**
- RoutingDrawer 打开，页面列表可见

---

### U10: QA8: ProtoAttrPanel 属性编辑验证

**Approach:**
```bash
$B goto http://localhost:3000/prototype/editor
$B waitForSelector ".react-flow__node"

# 选中第一个节点
$B click ".react-flow__node"
$B is visible "[class*='attr-panel']" || $B is visible text="属性"

# 切换 MockData Tab
$B click text="Mock 数据" || $B click text="MockData"
```

**Verification:**
- 属性面板打开，有 Tab 切换

---

### U11: QA5: Edge 连线 UI 端到端验证

**Approach:**
```bash
$B goto http://localhost:3000/prototype/editor
$B waitForSelector ".react-flow"

# 确保至少 2 个节点（先添加）
$B drag "@e1" "@e2"  # 添加第一个节点
$B drag "@e3" "@e4"  # 添加第二个节点

# RoutingDrawer 打开
$B click text="路由管理"
$B is visible text="添加连线"

# 点击添加连线 → 选择源页面 → 选择目标页面
$B click text="添加连线"
$B click text="首页"  # 源页面
$B click text="下一页"  # 目标页面

# 验证 edge 出现
$B waitForSelector ".react-flow__edge" --timeout=5000
$B is visible ".react-flow__edge"
```

**Verification:**
- `.react-flow__edge` SVG path 出现

---

## E5: 产出验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U12 | QA9: 构建产物存在性验证 | ⬜ | — | `.next/` + `storybook-static/` 存在 |
| U13 | QA10: 架构重组合理性验证 | ⬜ | — | ProtoAttrPanel 含 MockData，RoutingDrawer 含 page |
| U14 | QA11: ErrorBoundary + Loading 验证 | ⬜ | — | 错误边界和加载状态已实现 |

---

### U12: QA9: 构建产物存在性验证

**Approach:**
```bash
# .next/ 存在
[ -d "vibex-fronted/.next" ] && echo "PASS: .next/" || echo "FAIL: .next/ missing"

# storybook-static/ 存在
[ -d "vibex-fronted/storybook-static" ] && echo "PASS: storybook-static/" || echo "FAIL: storybook-static/ missing"
```

**Verification:**
- 两个目录均存在

---

### U13: QA10: 架构重组合理性验证

**Approach:**
```bash
# ProtoAttrPanel 包含 MockData 功能
grep -q "mock\|Mock\|mockData" vibex-fronted/src/components/prototype/ProtoAttrPanel.tsx && echo "PASS: ProtoAttrPanel has MockData" || echo "FAIL"

# RoutingDrawer 包含 page 管理
grep -q "page\|Page\|routing" vibex-fronted/src/components/prototype/RoutingDrawer.tsx && echo "PASS: RoutingDrawer has page mgmt" || echo "FAIL"
```

**Verification:**
- 两个文件均包含对应功能

---

### U14: QA11: ErrorBoundary + Loading 验证

**Approach:**
```bash
# ErrorBoundary 文件存在
find vibex-fronted/src -name "*ErrorBoundary*" | grep -q "." && echo "PASS: ErrorBoundary found" || echo "FAIL"

# ProtoEditor 引用了 ErrorBoundary 或 Loading
grep -q "ErrorBoundary\|Loading\|Skeleton" vibex-fronted/src/components/prototype/ProtoEditor.tsx && echo "PASS: ProtoEditor has error/loading handling" || echo "WARN: No explicit error boundary"
```

**Verification:**
- ErrorBoundary 文件存在，ProtoEditor 有相关引用

---

## 依赖关系图

```
U1 (dev server 启动)
  └── U5 (启动脚本标准化)
        ├── U8 (QA6 拖拽)
        ├── U9 (QA7 RoutingDrawer)
        ├── U10 (QA8 ProtoAttrPanel)
        └── U11 (QA5 Edge 连线) ←─ 还依赖 DEF-02 U6 覆盖率

U2 (QA1 文件完整性) ← 可与 U1 并行
U3 (QA2 TypeScript) ← 可与 U2 并行
  └── U4 (QA3/QA4 Vitest)
        └── U6 (DEF-02 覆盖率提升)
              └── U11 (DEF-01 Edge UI)

U12, U13, U14 ← 静态验证，可随时并行
```

---

## QA 执行顺序建议

| Step | 命令 | 时长 | 依赖 |
|------|------|------|------|
| 1 | `bash start-dev-server.sh` | ~30s | — |
| 2 | `pnpm tsc --noEmit` | ~20s | — |
| 3 | `pnpm vitest run` | ~30s | — |
| 4 | `bash run-qa.sh` (静态检查) | ~5s | U2 |
| 5 | gstack browse QA5-QA8 | ~15min | U1, U6 |
| 6 | 覆盖率检查 | ~10s | U6 |
