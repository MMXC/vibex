# IMPLEMENTATION_PLAN: VibeX Reviewer Proposals System

> **项目**: vibex-reviewer-proposals-vibex-proposals-20260406  
> **作者**: architect agent  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 1. 概述

本文档定义 Reviewer 自检与质量门禁系统的完整实施计划，包含 4 个 Sprint，总工时 14h。

**目标受众**: Dev、Reviewer、Coord Agent  
**前置条件**: `task_manager.py` 可用、vibex 项目代码可访问  
**成功标准**: Reviewer 无效阻塞处理时间归零，虚假 completed 项目数为零

---

## 2. Sprint 总览

| Sprint | 周期 | 优先级 | 工时 | 主要交付 |
|--------|------|--------|------|----------|
| Sprint 1 | Day 1 | P0 | 4h | AGENTS.md 规则 + task_manager 增强 |
| Sprint 2 | Day 2 | P1 | 4h | 自动化脚本 + CI 质量门禁 |
| Sprint 3 | Day 3 | P2 | 4.5h | msw 集成 + Playwright E2E |
| Sprint 4 | Day 4 | P3 | 1.5h | 工具优化 |

---

## 3. Sprint 1: P0 修复（4h）

### 3.1 T1.1: AGENTS.md 规则明确（1h）

**文件**: `/root/.openclaw/workspace-coord/AGENTS.md`（或各 agent 的 AGENTS.md）

**改动内容**:

1. 在 Reviewer Agent 章节增加：
   ```markdown
   ### P0-1: 项目 Status 管理规则
   
   **强制规则**: reviewer-push-eN 任务 done 后，**不自动变更项目 status**。
   项目 status=completed 只能由 Coord Agent 在 coord-completed 任务完成时手动标记。
   
   **Coord 验证点**: 每次 coord-completed 提交前，必须执行：
   ```bash
   task list --project <project_name>
   ```
   确认所有 reviewer-push-eN 任务均为 done 状态。
   ```

2. 在 Reviewer Agent 章节增加：
   ```markdown
   ### P0-2: 驳回后修复提交识别
   
   当代码被驳回（Reviewer 返回 Blocker）后：
   1. 自动触发 `task_manager.py update <project> reviewer-push-eN blocked`
   2. 记录被驳回的 commit hash
   3. 正确修复提交后，重新触发 reviewer-push 验证
   4. **禁止**在原 reviewer-push 已 done 的情况下跳过验证
   ```

**验收标准**:
- [ ] AGENTS.md 包含上述两条规则
- [ ] Coord Agent 已知晓并在下次项目中执行
- [ ] 模拟一个虚假 completed 场景，验证 Coord 会拦截

**执行人**: architect + coord

---

### 3.2 T1.2: task_manager.py 增加 verify-commit 命令（2h）

**文件**: `/root/.openclaw/skills/team-tasks/scripts/task_manager.py`

**新增命令**:

```bash
# 验证 commit 是否属于指定 Epic
python3 task_manager.py verify-commit <project> <epic_id> <commit_hash>
# 返回: project/epic_id | commit_hash | matched (true/false)
```

**实现逻辑**:
1. 读取 `<project>/IMPLEMENTATION_PLAN.md`，解析 Epic 列表
2. 执行 `git log --oneline -100` 在项目目录
3. grep 搜索包含 `<project>-<epic>` 的 commit message
4. 比对 commit hash，返回匹配结果

**代码片段**:

```python
def cmd_verify_commit(args):
    """验证 commit 是否属于指定 Epic"""
    epic_pattern = f"{args.project}-{args.epic_id}"
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", "-100"],
            cwd=PROJECT_ROOT,
            capture_output=True, text=True
        )
        for line in result.stdout.strip().split('\n'):
            if args.commit_hash[:8] in line and epic_pattern in line:
                print(f"MATCH: {args.commit_hash} belongs to {args.epic_id}")
                return True
        print(f"NO_MATCH: {args.commit_hash} not found for {args.epic_id}")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False
```

**验收标准**:
- [ ] `verify-commit vibex-backend E1 abc1234` 返回正确匹配/不匹配
- [ ] commit hash 前 8 位匹配即认为有效
- [ ] 帮助文档 `task_manager.py --help` 包含 verify-commit

**执行人**: dev

---

### 3.3 T1.3: 驳回自动 blocked 回滚（1h）

**改动点**: reviewer-push 任务执行脚本

**逻辑**:

```python
def on_reviewer_reject(project, epic_id, reason, commit_hash):
    """当 Reviewer 驳回代码时，自动回滚 reviewer-push 状态"""
    task_manager.update(
        project=project,
        stage=f"reviewer-push-{epic_id}",
        status="blocked",
        blocked_reason=reason
    )
    print(f"[GATE] reviewer-push-{epic_id} blocked due to rejection")
    print(f"[GATE] Rejected commit: {commit_hash}")
    print(f"[GATE] Correct fix must be submitted and re-verified")
```

**验收标准**:
- [ ] 驳回后 1s 内，task list 显示 `reviewer-push-eN: blocked`
- [ ] 修复提交重新 push 后，reviewer-push 重新触发
- [ ] 原 done 状态被正确覆盖

**执行人**: dev

---

## 4. Sprint 2: P1 改进（4h）

### 4.1 T2.1: 测试覆盖率红线（1h）

**文件**: `/root/.openclaw/workspace-reviewer/AGENTS.md`

**新增规则**:

```markdown
### 审查红线：测试覆盖

**强制规则**: 当 PR 包含新增 API endpoint、新增字段、新增组件时，必须包含专项测试。

**驳回条件**（满足任一即驳回）:
1. 新增 `/health` 端点但无针对该端点的单元测试
2. 新增字段（如 `prismaHealth`）但无针对该字段的断言
3. 新增组件交互但无针对该交互的集成测试

**验收格式**:
```typescript
// 针对 E3.1 的专项测试（必须在同一 commit 中）
describe('E3.1: Health endpoint /health', () => {
  it('returns { ok: true, prismaHealth: true }', async () => {
    const res = await fetch('/health');
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.prismaHealth).toBe(true); // 新增字段必须被测试
  });
});
```
```

**验收标准**:
- [ ] AGENTS.md 包含上述测试覆盖红线
- [ ] 在下次 PR 审查中验证该规则生效
- [ ] Reviewer Agent 已知晓并执行

**执行人**: architect + reviewer

---

### 4.2 T2.2: Commit-Epic 映射脚本（1h）

**文件**: `~/.openclaw/skills/reviewer/scripts/commit_epic_map.py`

**功能**: 从 IMPLEMENTATION_PLAN.md 解析 Epic-commit 关系，生成 CHANGELOG 条目

**实现**:

```python
#!/usr/bin/env python3
"""Commit-Epic Mapping Generator
从 IMPLEMENTATION_PLAN.md 和 git log 生成 CHANGELOG 条目
"""
import re
import subprocess
import sys
from pathlib import Path

def parse_epics(plan_path: str) -> dict:
    """解析 IMPLEMENTATION_PLAN.md 中的 Epic 列表"""
    content = Path(plan_path).read_text()
    epic_pattern = re.compile(r'^\| E(\d+) \| (.+?) \|', re.MULTILINE)
    epics = {}
    for match in epic_pattern.finditer(content):
        epic_id = f"E{match.group(1)}"
        epics[epic_id] = {
            "name": match.group(2).strip(),
            "commits": []
        }
    return epics

def find_commits_for_epic(project_root: str, project_name: str, epic_id: str):
    """在 git log 中查找属于指定 Epic 的 commits"""
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", "-100"],
            cwd=project_root,
            capture_output=True, text=True
        )
        pattern = f"{project_name}-{epic_id}"
        commits = []
        for line in result.stdout.strip().split('\n'):
            if pattern in line or epic_id in line:
                commits.append(line)
        return commits
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return []

def generate_changelog(project_root: str, project_name: str, epics: dict) -> str:
    """生成 CHANGELOG 条目"""
    lines = [f"## {project_name}", ""]
    for epic_id, epic_data in sorted(epics.items()):
        lines.append(f"### {epic_id}: {epic_data['name']}")
        commits = find_commits_for_epic(project_root, project_name, epic_id)
        if commits:
            for commit in commits:
                lines.append(f"- {commit}")
        else:
            lines.append("- (no commits found)")
        lines.append("")
    return "\n".join(lines)

if __name__ == "__main__":
    project_root = sys.argv[1] if len(sys.argv) > 1 else "."
    project_name = sys.argv[2] if len(sys.argv) > 2 else "project"
    plan_path = sys.argv[3] if len(sys.argv) > 3 else "IMPLEMENTATION_PLAN.md"
    
    epics = parse_epics(plan_path)
    changelog = generate_changelog(project_root, project_name, epics)
    print(changelog)
```

**使用方式**:

```bash
# 在 vibex 项目根目录执行
python3 commit_epic_map.py /root/.openclaw/vibex vibex-backend \
  /root/.openclaw/vibex/docs/vibex-backend/IMPLEMENTATION_PLAN.md
```

**验收标准**:
- [ ] 脚本执行后输出 Epic-commit 映射
- [ ] commit hash 前 8 位正确匹配
- [ ] 无遗漏（对比手动 grep 结果验证）

**执行人**: reviewer

---

### 4.3 T2.3: 虚假完成检测自动化（2h）

**文件**: `~/.openclaw/skills/reviewer/scripts/detect_fake_complete.py`

**功能**: 在 coord-completed 任务触发时，自动验证所有 reviewer-push-eN 是否全部 done

**实现**:

```python
#!/usr/bin/env python3
"""虚假完成检测器
在项目标记 completed 前，验证所有 Epic 是否真正完成
"""
import subprocess
import sys
import re

def detect_fake_complete(project_name: str) -> dict:
    """检测项目中是否存在虚假 completed"""
    result = subprocess.run(
        ["python3", "task_manager.py", "list", "--project", project_name],
        capture_output=True, text=True
    )
    
    lines = result.stdout.strip().split('\n')
    reviewer_tasks = [l for l in lines if 'reviewer-push' in l]
    
    fake_complete = False
    not_done = []
    
    for task in reviewer_tasks:
        # 解析 task 行: "reviewer-push-E1 | in-progress | ..."
        parts = task.split('|')
        if len(parts) < 2:
            continue
        task_name = parts[0].strip()
        status = parts[1].strip()
        if status != 'done' and status != 'completed':
            not_done.append((task_name, status))
            fake_complete = True
    
    return {
        "fake_complete": fake_complete,
        "not_done": not_done,
        "total": len(reviewer_tasks),
        "done": len(reviewer_tasks) - len(not_done)
    }

if __name__ == "__main__":
    project = sys.argv[1] if len(sys.argv) > 1 else "project"
    result = detect_fake_complete(project)
    
    if result["fake_complete"]:
        print(f"⚠️ FAKE COMPLETE DETECTED: {result['done']}/{result['total']} done")
        for task, status in result["not_done"]:
            print(f"  - {task}: {status} (NOT DONE)")
        print(f"\n❌ BLOCKED: Cannot mark {project} as completed")
        print(f"   Reason: {len(result['not_done'])} reviewer-push tasks not done")
        sys.exit(1)
    else:
        print(f"✅ All {result['total']} reviewer-push tasks done")
        print(f"   Project can be marked as completed")
        sys.exit(0)
```

**集成点**: 在 `task_manager.py update <project> coord-completed done` 之前调用

**验收标准**:
- [ ] 对 `vibex-backend-p0-20260405` 执行脚本，检测出虚假 completed
- [ ] 对正常项目执行脚本，返回通过
- [ ] 检测时间 < 2s

**执行人**: dev（集成到 task_manager.py）

---

## 5. Sprint 3: P2 优化（4.5h）

### 5.1 T3.1: msw 替代手动 Mock（2h）

**目标文件**: `/root/.openclaw/vibex/apps/api/src/__tests__/gateway-cors.test.ts`

**改动**:
1. 安装 msw: `npm install msw@^2.3 --save-dev`
2. 初始化 msw: `npx msw init /public --save`
3. 替换手动 mock 代码

**Before（手动 mock）**:
```typescript
// 153 行手动 mock，测试可读性差
const mockAuthMiddleware = jest.fn().mockImplementation((req, res, next) => {
  req.user = { id: 'test-user' };
  next();
});
jest.mock('@/middleware/auth', () => ({ authMiddleware: mockAuthMiddleware }));
```

**After（msw）**:
```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.options('/v1/projects', () => {
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      }
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('OPTIONS preflight returns 204 with CORS headers', async () => {
  const res = await fetch('/v1/projects', { method: 'OPTIONS' });
  expect(res.status).toBe(204);
  expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
});
```

**验收标准**:
- [ ] gateway-cors.test.ts 行数从 153 行减少到 < 80 行
- [ ] 所有原有测试用例仍然通过
- [ ] msw mock 可读性明显提升

**执行人**: dev

---

### 5.2 T3.2: Playwright E2E 测试 OPTIONS/CORS（2h）

**目标文件**: `/root/.openclaw/vibex/apps/e2e/src/cors.spec.ts`（新建）

**内容**:

```typescript
// apps/e2e/src/cors.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8787';

test.describe('OPTIONS/CORS E2E', () => {
  test('OPTIONS preflight returns CORS headers', async ({ request }) => {
    const res = await request.fetch(`${BASE_URL}/api/v1/projects`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type',
      }
    });
    expect(res.status()).toBe(204);
    expect(res.headers()['access-control-allow-origin']).toBe('*');
    expect(res.headers()['access-control-allow-methods']).toContain('GET');
    expect(res.headers()['access-control-allow-methods']).toContain('POST');
  });

  test('GET request not blocked by CORS', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/v1/projects`, {
      headers: { 'Origin': 'http://localhost:3000' }
    });
    // 204（空列表）或 401（未认证）均可接受
    expect([200, 204, 401]).toContain(res.status());
  });

  test('POST request with CORS headers succeeds', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/projects`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({ name: 'Test Project', description: 'E2E test' })
    });
    expect([200, 201, 401]).toContain(res.status());
  });
});
```

**配置**: `playwright.config.ts` 需包含 API base URL

**验收标准**:
- [ ] 三个 E2E 测试在本地 Wrangler 环境下全部通过
- [ ] CI 中作为质量门禁运行
- [ ] 覆盖浏览器 preflight 场景

**执行人**: dev + tester

---

### 5.3 T3.3: process.env optional chaining 统一修复（0.5h）

**目标文件**: `/root/.openclaw/vibex/apps/api/src/.../environment.ts`（或相关文件）

**Before**:
```typescript
const isProduction = process.env?.NODE_ENV === 'production'
```

**After**:
```typescript
const isWorkers = typeof globalThis.caches !== 'undefined'
const isProduction = !isWorkers && process.env.NODE_ENV === 'production'
```

**验收标准**:
- [ ] Workers 环境和 Node 环境行为一致
- [ ] 不引入新依赖
- [ ] 测试覆盖两种环境

**执行人**: dev

---

## 6. Sprint 4: P3 收尾（1.5h）

### 6.1 T4.1: reviewer-push 验证方式分类（0.5h）

**文件**: `/root/.openclaw/workspace-reviewer/AGENTS.md`

**新增规则**:

```markdown
### P3-1: reviewer-push 验证方式分类

根据 PR 改动类型，区分验证方式：

| 改动类型 | 验证方式 | 示例 |
|----------|----------|------|
| 前端 UI 改动 | gstack 截图 | 按钮样式、页面布局 |
| 后端 API 改动 | curl/API 测试 | OPTIONS、CORS、限流 |
| 文档/测试类 | 跳过 gstack | CHANGELOG、测试用例 |
| 混合改动 | 主要改动决定 | 以主要改动类型为准 |

**自动检测规则**（reviewer CLI 集成）:
- 文件路径包含 `frontend/`/`components/`/`pages/` → 前端
- 文件路径包含 `apps/api/`/`gateway.ts/`/`middleware/` → 后端
- 文件路径包含 `CHANGELOG`/`*.test.ts`/`*.spec.ts` → 文档/测试
```

**验收标准**:
- [ ] AGENTS.md 包含上述分类规则
- [ ] Reviewer Agent 在下次审查中区分验证方式
- [ ] 后端 API 改动不再强制要求 gstack 截图

**执行人**: architect + reviewer

---

### 6.2 T4.2: HEARTBEAT 跟踪表自动清理（1h）

**文件**: `task_manager.py` 增加 `archive-old` 命令

**功能**: 自动归档超过 48h 的 completed 项目

```python
def cmd_archive_old(args):
    """归档超过 48h 的 completed 项目"""
    cutoff = datetime.now() - timedelta(hours=48)
    projects = load_projects()
    archived = []
    for project, data in projects.items():
        if data.get('status') == 'completed':
            completed_at = data.get('completed_at')
            if completed_at:
                t = datetime.fromisoformat(completed_at)
                if t < cutoff:
                    data['archived'] = True
                    archived.append(project)
    save_projects(projects)
    print(f"Archived {len(archived)} projects: {', '.join(archived)}")
```

**使用方式**:
```bash
python3 task_manager.py archive-old
```

**验收标准**:
- [ ] `archive-old` 命令可正常执行
- [ ] 48h+ completed 项目被标记 archived
- [ ] 活跃项目（in-progress）不受影响

**执行人**: dev

---

## 7. 依赖关系图

```
T1.1 (AGENTS.md规则)
    ↓
T1.2 (verify-commit命令) → T2.2 (Commit-Epic映射)
    ↓                           ↓
T1.3 (驳回回滚) ──────────→ T2.1 (测试覆盖红线)
    ↓
T2.3 (虚假完成检测) ← T3.1 (msw集成)
    ↓
T3.2 (Playwright E2E) ← (独立)
    ↓
T3.3 (process.env修复) ← (独立)
    ↓
T4.1 (gstack分类) → T4.2 (HEARTBEAT清理)
```

---

## 8. 验收标准总表

| Task | 验收标准 | 测试方法 |
|------|----------|----------|
| T1.1 | AGENTS.md 包含 status 管理规则 | 人工审查 |
| T1.2 | verify-commit 返回正确匹配 | 命令行测试 |
| T1.3 | 驳回后 reviewer-push 立即 blocked | 模拟驳回 |
| T2.1 | 无专项测试的新功能被驳回 | 模拟 PR 审查 |
| T2.2 | commit_epic_map.py 输出正确映射 | 对比 git grep |
| T2.3 | 虚假 completed 被脚本拦截 | 对真实项目执行 |
| T3.1 | gateway-cors.test.ts < 80 行 | wc -l |
| T3.2 | 三个 E2E 测试全部通过 | npx playwright test |
| T3.3 | 两种环境行为一致 | 手动测试 |
| T4.1 | 后端 API 不强制截图 | 模拟后端 PR |
| T4.2 | archive-old 正确归档 | 命令行测试 |

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
