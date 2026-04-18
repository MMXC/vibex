<<<<<<< Updated upstream
# VibeX TabBar 无障碍化 — 开发约束

**项目**: vibex
**阶段**: development
**日期**: 2026-04-13
=======
# AGENTS.md — wow-harness OpenClaw 实装项目编码规范

> **项目**: vibex
> **版本**: 1.0
> **日期**: 2026-04-13
>>>>>>> Stashed changes

---

## 1. 变更范围

### ✅ 允许修改的文件

<<<<<<< Updated upstream
| 文件 | 改动范围 |
|------|----------|
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 删除 isLocked/disabled/aria-disabled/phase guard |
| `vibex-fronted/src/components/canvas/CanvasPage.tsx` | 移动端内联 TabBar 添加 prototype tab，与 desktop 保持一致 |
| `vibex-fronted/src/components/canvas/TreePanel.tsx` | 空状态文案替换（第157-159行区域） |
| `vibex-fronted/tests/unit/components/canvas/TabBar.unittest.tsx` | 新建单元测试 |
| `vibex-fronted/tests/e2e/tab-switching.spec.ts` | 新建 E2E 测试 |
=======
本次迭代 **仅限** 以下文件/目录：

| 文件/目录 | 允许操作 |
|-----------|----------|
| `~/.openclaw/openclaw.json` | 修改 `tools.subagents.tools.deny` |
| `~/.openclaw/skills/team-tasks/scripts/task_manager.py` | 扩展 D8 检查、loop detection 集成 |
| `~/.openclaw/agent-governance/`（新建） | 全部新建文件 |
| `~/.openclaw/progress.json` | D8 通过后自动写入 |
| `~/.openclaw/failure-patterns.jsonl` | Pattern DB 初始化 |
| `~/.openclaw/agent-governance/tests/` | 新建测试文件 |
>>>>>>> Stashed changes

### ❌ 禁止修改的文件

<<<<<<< Updated upstream
| 文件 | 禁止原因 |
|------|----------|
| `vibex-fronted/src/lib/canvas/stores/*.ts` | Zustand store 不需要改动 |
| `vibex-fronted/src/components/canvas/PhaseIndicator.tsx` | PhaseIndicator 职责不变，不改动 |
| `vibex-fronted/src/components/canvas/ContextTreePanel.tsx` | 复用 TreePanel，空状态在 TreePanel 统一处理 |
| `vibex-fronted/src/components/canvas/FlowTreePanel.tsx` | 同上 |
| `vibex-fronted/src/components/canvas/ComponentTreePanel.tsx` | 同上 |
=======
以下文件/目录 **不得修改**（本次迭代锁死）：

- `~/.openclaw/skills/team-tasks/scripts/config.py`（现有配置结构）
- `~/.openclaw/skills/team-tasks/scripts/__init__.py`（包结构）
- `~/.openclaw/openclaw.json` 的 `agents` 和 `channels` 配置段
- OpenClaw 核心代码（`/usr/lib/node_modules/openclaw/`）

### 1.3 技术栈锁定

| 技术 | 版本要求 | 约束理由 |
|------|----------|----------|
| Python | 3.10+ | task_manager.py 现有依赖 |
| pytest | latest | 现有测试框架 |
| JSON5 / JSON | — | 配置文件格式 |
| JSONL | — | metrics 和 pattern DB 格式 |
>>>>>>> Stashed changes

---

## 2. 代码规范

<<<<<<< Updated upstream
### 2.1 TabBar.tsx — 删除项清单

**以下代码必须删除（精确位置）**:

```typescript
// ❌ 删除：第37-42行区域
const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
const isLocked = tab.id !== 'prototype' && tabIdx > phaseIdx;

// ❌ 删除：button 元素中的 disabled 属性
disabled={isLocked}

// ❌ 删除：button 元素中的 aria-disabled 属性
aria-disabled={isLocked}

// ❌ 删除：className 中的 isLocked 条件
${isLocked ? styles.tabLocked : ''}

// ❌ 删除：handleTabClick 中的 phase 守卫
const tabIdx = PHASE_ORDER.indexOf(tabId as Phase);
if (tabIdx > phaseIdx) {
  return;
}

// ❌ 删除：title 中的 isLocked 三元表达式
title={isLocked ? `需先完成上一阶段` : `切换到 ${tab.label} 树`}
```

**保留项（不要删除）**:

```typescript
// ✅ 保留：isActive 判断逻辑（phase === 'prototype' 分支）
const isActive =
  tab.id === 'prototype'
    ? phase === 'prototype'
    : activeTree === tab.id || (activeTree === null && tab.id === 'context');

// ✅ 保留：badge 渲染
if (tab.id !== 'prototype' && counts[tab.id as TreeType] > 0) {
  badge = <span className={styles.tabCount}>{counts[tab.id as TreeType]}</span>;
}

// ✅ 保留：role="tab" / role="tablist"
role="tab"
role="tablist"
aria-label="三树切换"

// ✅ 保留：onTabChange callback
onTabChange?.(tabId as TreeType);
```

**修改后的 button 结构**:

```typescript
<button
  key={tab.id}
  role="tab"
  aria-selected={isActive}
  className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
  onClick={() => handleTabClick(tab.id)}
  title={`切换到 ${tab.label} 树`}
>
  <span className={styles.tabEmoji}>{tab.emoji}</span>
  <span className={styles.tabLabel}>{tab.label}</span>
  {badge}
</button>
=======
### 2.1 task_manager.py 扩展规范

```python
# ✅ 正确：在现有 validate_task_completion 函数中增加 D8 钩子
def validate_task_completion(project, stage_id, stage_info, old_status=None, repo=DEFAULT_WORK_DIR):
    # ... 现有逻辑（commit 检查）...
    
    # E2: D8 机械化检查（新增）
    d8 = run_d8_check(repo=repo)
    write_progress_json("pass" if d8["passed"] else "fail", f"{project}/{stage_id}", d8["errors"])
    if not d8["passed"]:
        warnings.append(f"D8 CHECK FAILED: {'; '.join(d8['errors'])}")
        return {"valid": False, "warnings": warnings, "commit": current_commit}
    
    return {"valid": True, "warnings": warnings, "commit": current_commit}

# ❌ 错误：修改现有函数签名（参数个数和类型不能变）
def validate_task_completion(project, stage_id, stage_info, old_status=None, repo=DEFAULT_WORK_DIR, new_param=None):
```

### 2.2 D8 检查规范

```python
# ✅ 正确：检查命令存在性，graceful 降级
def run_d8_check(repo, commands=None, timeout=300):
    if commands is None:
        commands = ["pnpm build", "pnpm test"]
    for cmd in commands:
        try:
            r = subprocess.run(cmd, shell=True, cwd=repo, ...)
        except FileNotFoundError:
            results["errors"].append(f"command not found: {cmd.split()[0]}")
            results[label] = -2
        except subprocess.TimeoutExpired:
            results["errors"].append(f"{cmd} timeout")
            results[label] = -1

# ❌ 错误：不做错误处理，命令不存在时直接崩溃
r = subprocess.run(cmd, shell=True, cwd=repo)  # 无 try/except
```

### 2.3 Loop Detector 规范

```python
# ✅ 正确：按文件路径隔离计数，不同文件互不影响
class LoopDetector:
    def record_edit(self, file_path: str, tool: str = "edit") -> Optional[str]:
        counts = self._state["edit_counts"]
        counts[file_path] = counts.get(file_path, 0) + 1
        threshold = self._state["config"].get("loop_threshold", 5)
        if counts[file_path] == threshold:
            return f"⚠️ Loop Detection: '{file_path}' ..."

# ❌ 错误：全局计数器（不区分文件）
self._state["edit_count"] += 1  # 不区分文件！
```

### 2.4 Pattern DB 规范

```python
# ✅ 正确：追加写入 JSONL
def add_pattern(entry: dict):
    with open(PATTERN_DB, "a") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

# ❌ 错误：覆盖写入（会丢失已有 pattern）
with open(PATTERN_DB, "w") as f:  # ❌
    f.write(json.dumps(entry) + "\n")
```

### 2.5 Metrics 规范

```python
# ✅ 正确：session 结束时写入
class MetricsCollector:
    def write(self):
        self.finalize()
        with open(self._path, "a") as f:
            f.write(json.dumps(self.data, ensure_ascii=False) + "\n")

# ❌ 错误：每次 record_tool 都写（性能问题）
def record_tool(self, tool: str):
    self.data["toolCalls"][tool] += 1
    self.write()  # ❌ 每次都写！
>>>>>>> Stashed changes
```

### 2.2 TreePanel.tsx — 空状态文案规范

**文案必须精确匹配以下字符串**:

| 树类型 | 文案 | 对应 tree 值 |
|--------|------|--------------|
| 上下文 | `请先在需求录入阶段输入需求` | `tree === 'context'` |
| 流程 | `请先确认上下文节点，流程将自动生成` | `tree === 'flow'` |
| 组件 | `请先完成流程树，组件将自动生成` | `tree === 'component'` |

**空状态组件结构不变**:
```typescript
{safeNodes.length === 0 && (
  <div className={styles.treePanelEmpty}>
    <span style={{ color: treeColor }}>{treeIcon}</span>
    <p>暂无节点</p>
    <p className={styles.treePanelEmptyHint}>
      {/* 仅修改此处文案 */}
    </p>
  </div>
)}
```

### 2.3 CanvasPage.tsx — 移动端 TabBar

**移动端内联 tab bar 必须包含 4 个 tab，与 desktop TabBar 的 TABS 数组一致**:

```typescript
{/* 必须包含：context / flow / component / prototype */}
{[
  { id: 'context', emoji: '◇', label: '上下文' },
  { id: 'flow', emoji: '→', label: '流程' },
  { id: 'component', emoji: '▣', label: '组件' },
  { id: 'prototype', emoji: '🚀', label: '原型' },
].map((t) => (
  <button
    key={t.id}
    role="tab"
    aria-selected={...}
    // ❌ 禁止添加 disabled 属性
    onClick={() => handleMobileTabClick(t.id)}
  >
    {`${t.emoji} ${t.label}`}
  </button>
))}
```

**禁止事项**:
- ❌ 禁止在移动端 tab button 上添加 `disabled` 属性
- ❌ 禁止在移动端 tab button 上添加 phase 检查
- ❌ 禁止移除 prototype tab

---

## 3. 安全红线

<<<<<<< Updated upstream
| 红线 | 描述 | 违规后果 |
|------|------|----------|
| **不要改动 PhaseIndicator** | PhaseIndicator 承担阶段告知职责，不允许删除或隐藏 | 破坏 UX 引导 |
| **不要改动 Zustand store** | 三树 store 的数据不因 TabBar 改动而变化 | 数据丢失风险 |
| **不要改动 PHASE_ORDER** | `['input', 'context', 'flow', 'component', 'prototype']` 常量不改动 | 影响 phase 顺序推进 |
| **不要改动 API 层** | TabBar 移除 disabled 是纯前端 UX 改动，不改变后端权限校验 | 安全风险 |
| **不要引入新依赖** | 禁止 `npm install` / `pnpm add` 任何新包 | 构建污染 |
| **不要删除 `role="tab"` / `aria-selected`** | 无障碍属性必须保留 | a11y 退化 |
=======
### 🚨 红线 1: 禁止修改 task_manager.py 函数签名

```
现有函数的参数个数、类型、默认值不能改变
```

- ❌ 在 `validate_task_completion` 中添加必需参数
- ❌ 修改参数顺序
- ✅ 新增可选参数带默认值：`def f(..., new_opt=None)`

### 🚨 红线 2: 禁止删除现有 validate_task_completion 逻辑

```
commit 检查逻辑是已有功能，必须保留
```

- ❌ 删除整个函数重写
- ❌ 删除 commit 检查分支
- ✅ 在函数末尾增加 D8 检查

### 🚨 红线 3: 禁止修改 openclaw.json 的 agents/channels 配置

```
工具策略配置仅通过 agents.list[].tools.sandbox.tools.allow 增加 reviewer agent 白名单
```

- ❌ 修改 `agents.list` 中非 reviewer 的 agent 配置
- ❌ 删除现有 agent 配置
- ❌ 修改 `channels` 配置段
- ✅ 仅在 reviewer agent 的 `tools.sandbox.tools.allow` 中增加读操作工具

### 🚨 红线 4: 禁止 Metrics 实时写入

```
Metrics 必须在 session 结束时一次性写入
```

- ❌ `record_tool()` 中调用 `write()`
- ❌ `record_guard_hit()` 中调用 `write()`
- ✅ `write()` 仅在 session 结束时调用（`finalize()` 后）
>>>>>>> Stashed changes

---

## 4. Git 提交规范

### 4.1 提交信息格式

```
<type>(<scope>): <subject>

<<<<<<< Updated upstream
[body]

[footer]
=======
# 示例
feat(agent-governance): add run_d8_check function
feat(agent-governance): add LoopDetector class
feat(agent-governance): add MetricsCollector class
feat(agent-governance): add Pattern DB with 12 initial patterns
feat(agent-governance): integrate D8 check into task_manager
feat(agent-governance): integrate loop detector into task_manager
config(openclaw): add reviewer agent tools deny list
test(agent-governance): add D8 check unit tests
test(agent-governance): add LoopDetector tests
>>>>>>> Stashed changes
```

### 4.2 推荐 commit 结构

<<<<<<< Updated upstream
**Epic 1 完成后**:
```bash
git add src/components/canvas/TabBar.tsx src/components/canvas/CanvasPage.tsx
git commit -m "feat(canvas): remove disabled/lock logic from TabBar for a11y

- Remove isLocked, disabled, aria-disabled from TabBar button
- Remove phase guard from handleTabClick
- Add prototype tab to mobile inline TabBar (CanvasPage.tsx)
- Preserve isActive, badge, and ARIA role attributes

AC-1, AC-5, AC-6 satisfied
refs: vibex/tab-bar-unified"
```

**Epic 2 完成后**:
```bash
git add src/components/canvas/TreePanel.tsx
git commit -m "feat(canvas): add guidance text for empty tree panels

- context: '请先在需求录入阶段输入需求'
- flow: '请先确认上下文节点，流程将自动生成'
- component: '请先完成流程树，组件将自动生成'

AC-3 satisfied
refs: vibex/tab-bar-unified"
```

**Epic 3 完成后**:
```bash
git add tests/
git commit -m "test: add tab-switching.spec.ts covering AC-1~AC-8

- TabBar.unittest.tsx: unit tests for disabled removal
- tab-switching.spec.ts: Playwright E2E full coverage
refs: vibex/tab-bar-unified"
```

### 4.3 禁止行为

- ❌ 禁止 `git commit -m "fix"` / `"update"` / `"WIP"`
- ❌ 禁止在一个 commit 中混合 Epic 1 和 Epic 2 的改动
- ❌ 禁止 force push 到 main 分支

=======
```
feature/wow-harness-agent-governance
fix/wow-harness-xxx
test/wow-harness-metrics
```

>>>>>>> Stashed changes
---

## 5. Code Review 清单

### 5.1 TabBar.tsx 审查要点

<<<<<<< Updated upstream
- [ ] `isLocked` 变量已完全删除（全局搜索 `isLocked` 无结果）
- [ ] `disabled={isLocked}` 已删除（搜索 `disabled=` 在 TabBar.tsx 内无结果）
- [ ] `aria-disabled` 已删除
- [ ] `handleTabClick` 中无 `if (tabIdx > phaseIdx)` 守卫
- [ ] `isActive` 判断逻辑未改动
- [ ] `role="tab"` 和 `aria-selected` 属性仍存在
- [ ] `title` 已简化为 `切换到 ${tab.label} 树`
- [ ] `className` 中无 `styles.tabLocked` 引用

### 5.2 CanvasPage.tsx 审查要点

- [ ] 移动端内联 TabBar 包含 4 个 tab
- [ ] 移动端 tab button 无 `disabled` 属性
- [ ] prototype tab 点击行为与 desktop TabBar 一致（`setPhase('prototype')` + `setActiveTree(null)`）

### 5.3 TreePanel.tsx 审查要点

- [ ] 三处空状态文案与 PRD 精确匹配
- [ ] `{safeNodes.length === 0 && ...}` 逻辑未改动
- [ ] `styles.treePanelEmpty` 样式未改动

### 5.4 测试审查要点

- [ ] `TabBar.unittest.tsx` 覆盖 AC-1, AC-6, AC-7
- [ ] `tab-switching.spec.ts` 覆盖 AC-1 ~ AC-8 全部 8 条
- [ ] 所有 `expect()` 断言有清晰的错误信息
- [ ] E2E 测试在 CI 环境可运行（无硬编码 localhost 之外的域名）

### 5.5 构建审查要点

- [ ] `pnpm build` 成功，无 TypeScript 错误
- [ ] `pnpm lint` 无警告
- [ ] `pnpm test:unit` 全部通过
- [ ] `pnpm test:e2e:ci` 全部通过
=======
- [ ] `task_manager.py` 的 `validate_task_completion` 函数签名未被修改
- [ ] 现有 commit 检查逻辑仍然存在
- [ ] D8 检查在函数末尾，不在函数开头
- [ ] `run_d8_check` 有超时保护（timeout 参数）
- [ ] `run_d8_check` 有 FileNotFoundError 处理
- [ ] `progress.json` 写入后 status 字段正确（"pass" 或 "fail"）
- [ ] LoopDetector 按文件路径隔离计数
- [ ] LoopDetector 的阈值从 config.json 读取
- [ ] MetricsCollector 仅在 `write()` 时写入文件
- [ ] Pattern DB 使用追加写入（"a" 模式）
- [ ] `openclaw.json` 的 reviewer agent `tools.sandbox.tools.allow` 包含 `read`、`grep`、`sessions_history`，不包含 `write`、`edit`、`exec`、`apply_patch`
- [ ] `failure-patterns.jsonl` 至少有 12 条记录
- [ ] pytest 测试全绿

### 5.2 专项检查

- [ ] D8 检查失败时 task status 保持 pending
- [ ] D8 检查通过后 progress.json status = "pass"
- [ ] Loop Detection 超阈值时输出警告（print 到 stdout）
- [ ] Metrics JSONL 格式正确（每行一个完整 JSON）
- [ ] 新增代码无 `except: pass`（必须有具体异常类型或处理逻辑）
>>>>>>> Stashed changes

---

## 6. 依赖关系约束

```
TabBar.tsx (S1.1)
  ↓ 仅修改组件逻辑，不依赖新依赖

CanvasPage.tsx (S1.2)
  ↓ 依赖 TabBar.tsx 改动后验证行为一致

TreePanel.tsx (Epic 2)
  ↓ 独立改动，不依赖 Epic 1

Epic 3 测试
  ↓ 依赖 Epic 1 + Epic 2 完成后编写
```

**执行顺序**: S1.1 → S1.2 → Epic 2（三 Story 可并行）→ Epic 3
