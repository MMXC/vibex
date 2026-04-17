# AGENTS.md — vibex-proposals-20260404 开发约束

**项目**: vibex-proposals-20260404
**日期**: 2026-04-04
**仓库**: /root/.openclaw/vibex

---

## 1. 角色职责总览

| 角色 | 核心职责 | 边界 |
|------|---------|------|
| **Dev** | 写代码、实现功能、commit | 不写 changelog |
| **Reviewer** | Code Review、验收测试 | 补 changelog |
| **Architect** | 架构设计、接口定义 | 不参与具体实现 |
| **Coord** | 任务调度、流程协调 | 不写代码 |

---

## 2. 开发约束

### 2.1 通用约束

- **禁止引入新依赖** — 所有 Epic 利用现有技术栈
- **Python 版本** — Python 3.8+
- **TypeScript 版本** — 现有 tsconfig 配置
- **无破坏性更改** — 所有修改向后兼容
- **必须写测试** — 每个功能必须有对应测试文件

### 2.2 E1: 任务质量门禁

**影响文件**: `~/.openclaw/skills/team-tasks/scripts/task_manager.py`

```python
# 约束：不得修改现有 task_manager.py 核心逻辑
# 只允许：新增 info 字段、新增辅助函数、新增校验逻辑
# 禁止：删除或修改 existing status/agent/createdAt 字段语义

# commit hash 格式：40 字符 SHA-1
assert len(commit) == 40
assert all(c in '0123456789abcdef' for c in commit)
```

### 2.3 E2: Canvas UX 修复

**影响文件**: `vibex-fronted/src/components/canvas/` / `vibex-fronted/src/app/canvas/`

```typescript
// 约束：CSS Modules only，禁止引入新 CSS 方案
// 约束：骨架屏必须使用 data-testid，不使用 className 检测
// 约束：ShortcutHelpPanel 使用 CSS Modules，无状态组件

// 正确
data-testid="canvas-skeleton"

// 错误
className="skeleton"
```

### 2.4 E3: 提案流程优化

**影响文件**: `proposals/TEMPLATE.md` / `proposals/priority_calculator.py`

```python
# 约束：priority_calculator 纯函数，无副作用
# 约束：TEMPLATE.md 不限制具体内容，只检查章节存在性
def calculate_priority(impact: int, urgency: int, effort: int) -> Priority:
    # 不允许：网络调用、文件系统访问、time.time()
    ...
```

### 2.5 E4: 通知体验优化

**影响文件**: `~/.openclaw/skills/team-tasks/scripts/slack_notify_templates.py`

```python
# 约束：去重缓存文件固定路径 /tmp/slack_notify_dedup.json
# 约束：去重窗口固定 300 秒（5 分钟）
# 约束：不得修改 send_slack 的函数签名（向后兼容）

DEDUP_WINDOW = 300  # 5 分钟，禁止修改
DEDUP_CACHE = Path('/tmp/slack_notify_dedup.json')  # 禁止修改路径
```

---

## 3. Git 提交规范

### 3.1 Commit Message 格式

```
<type>(<scope>): <subject>

<type>: feat | fix | docs | test | refactor | chore
<scope>: E1 | E2 | E3 | E4 | infra | proposals
```

### 3.2 示例

```bash
feat(E1): task_manager.py 新增 commit hash 记录
fix(E2): CanvasPage Suspense 边界修复
docs(E3): proposals/TEMPLATE.md 模板定义
test(E4): slack_notify 去重逻辑单元测试
docs(changelog): add vibex-proposals-20260404 Epic entries
```

### 3.3 Changelog 职责边界

| 谁写 | 写什么 | 位置 |
|------|--------|------|
| **Dev** | 功能代码 commit（feat/fix） | 各 epic 代码文件 |
| **Reviewer** | Changelog entry | `CHANGELOG.md` |

**规则**：
- Dev 的 commit message 不写 changelog 内容
- Reviewer 在 approve 时补写 `CHANGELOG.md` entry
- changelog 格式：`docs(changelog): add <project> <Epic> entry`
- Epic 完成后 Reviewer 负责更新 `vibex-proposals-20260404` 相关条目

---

## 4. 测试规范

### 4.1 测试文件命名

```
test_<module_name>.py        # Python 测试
<component>.test.tsx         # React 组件测试
<component>.e2e.spec.ts     # Playwright E2E 测试
```

### 4.2 覆盖率要求

| Epic | 覆盖率门禁 |
|------|-----------|
| E1 | > 80% |
| E2 | > 70%（Vitest）+ Playwright E2E |
| E3 | > 80% |
| E4 | > 80% |

### 4.3 Mock 规范

```python
# E1: mock git 命令
@patch('subprocess.check_output')
def test_commit_recorded(mock_git):
    mock_git.return_value = b'a' * 40
    ...

# E4: mock Slack API
@patch('requests.post')
def test_dedup_skips(mock_post):
    mock_post.assert_not_called()  # 第二次调用跳过
```

---

## 5. 代码审查清单

### 5.1 E1 审查要点
- [ ] `commit` 字段正确写入 task JSON
- [ ] 无新 commit 时警告输出正确
- [ ] Dev 任务检查测试文件逻辑正确
- [ ] git 不可用时静默跳过（不崩溃）

### 5.2 E2 审查要点
- [ ] `CanvasSkeleton` 使用 `data-testid`
- [ ] Suspense 包裹正确层级
- [ ] `?` 键事件监听正确绑定/解绑
- [ ] 骨架屏 CSS 无性能问题

### 5.3 E3 审查要点
- [ ] `priority_calculator.py` 无副作用
- [ ] P0/P1/P2 边界用例测试通过
- [ ] `TEMPLATE.md` 所有强制章节存在
- [ ] AGENTS.md Changelog 章节完整

### 5.4 E4 审查要点
- [ ] 去重窗口为 300 秒
- [ ] 缓存路径固定为 `/tmp/slack_notify_dedup.json`
- [ ] 发送失败时正确处理（不写入缓存）
- [ ] 缓存过期条目正确清理

---

## 6. 环境配置

```bash
# 必需环境变量
GIT_REPO=/root/.openclaw          # E1: git 命令工作目录
SLACK_BOT_TOKEN=xxx               # E4: Slack Bot Token（可选，无则静默跳过）

# 测试环境
PYTHONPATH=/root/.openclaw/vibex
NODE_ENV=test
```

---

*本文档由 Architect Agent 生成于 2026-04-04 18:30 GMT+8*
