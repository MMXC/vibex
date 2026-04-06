# Epic 1 Spec: P0 Tech Debt 紧急修复

**Epic ID**: EP-01
**Epic 名称**: P0 Tech Debt 紧急修复
**优先级**: P0
**工时**: 3.5h
**Sprint**: Sprint 1
**状态**: Ready

---

## 1. Overview

紧急修复 4 个上轮遗留 P0 问题，消除对团队协作和生产部署的阻塞性影响。

## 2. Stories

### S1.1: Slack Token 环境变量迁移
**工时**: 0.5h | **负责人**: dev

#### 背景
`scripts/task_manager.py` 硬编码 Slack User Token（`xoxp-...`），导致所有涉及该文件的 commit 被 GitHub secret scanning 阻断。全团队通过 git cherry-pick 临时绕过。

#### 实现方案
```python
# scripts/task_manager.py
import os

# 替换硬编码 token
SLACK_TOKEN = os.environ.get('SLACK_TOKEN') or os.environ.get('SLACK_BOT_TOKEN') or ''

# 替换所有 xoxp-xxx 引用为 SLACK_TOKEN
```

#### 文件变更
1. `scripts/task_manager.py` — 移除所有 `xoxp-` 字符串，改为 `os.environ.get()`
2. `.env.example` — 新增 `SLACK_TOKEN=` 示例行
3. `.gitignore` — 确认 `.env` 已被排除

#### 验收标准
- [ ] `grep "xoxp-" scripts/task_manager.py` 返回空
- [ ] `grep "os.environ" scripts/task_manager.py` 至少出现 1 次
- [ ] `.env.example` 包含 `SLACK_TOKEN=` 行
- [ ] 本地 `git push` 包含 task_manager.py 的 commit 不被阻断

#### 测试
```python
def test_no_hardcoded_token():
    content = open("scripts/task_manager.py").read()
    assert "xoxp-" not in content
    assert "os.environ" in content
```

---

### S1.2: ESLint no-explicit-any 清理
**工时**: 1h | **负责人**: dev

#### 背景
9 个 TypeScript 文件含显式 `any`，TypeScript 严格模式被绕过，隐性类型错误风险不可评估。

#### 实现方案
**Step 1**: 识别所有 `any` 用法
```bash
grep -rn " : any\|: any" packages/ services/ --include="*.ts" --include="*.tsx" -B1 -A1
```

**Step 2**: 分类修复
- **简单 any** → 明确类型（`string`, `number`, `boolean`）
- **对象 any** → `Record<string, unknown>` 或 `interface`
- **函数 any** → `(arg: Type) => ReturnType`
- **泛型 any** → `<T>` 或约束泛型

**Step 3**: 验证
```bash
tsc --noEmit
```

#### 文件清单（初步识别）
```
packages/...
services/...
（共 9 个文件，具体以 grep 结果为准）
```

#### 验收标准
- [ ] `tsc --noEmit` 退出码为 0，无 any 相关错误
- [ ] `eslint --rule 'typescript/no-explicit-any: error'` 通过（0 warnings）

#### 测试
```bash
# CI 门禁
npm run type-check
npm run lint
```

---

### S1.3: PrismaClient Workers 守卫
**工时**: 1h | **负责人**: dev

#### 背景
`PrismaClient` 在 Cloudflare Workers 环境中被直接使用，CF Workers 不支持 `require()` 同步加载，导致 8+ API 路由无法部署。

#### 实现方案
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare const self: ServiceWorkerGlobalScope | undefined;

if (typeof self !== 'undefined') {
  // Cloudflare Workers 环境：延迟初始化，使用 env 注入的 DATABASE_URL
  prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
} else {
  // Node.js 环境：标准初始化
  prisma = new PrismaClient();
}

export { prisma };

// 或使用延迟初始化函数
export const getPrisma = () => prisma ?? new PrismaClient();
```

#### 受影响路由
```
api/routes/generate-components.ts
api/routes/canvas-state.ts
...（共 8+ 个路由，具体以扫描结果为准）
```

#### 验收标准
- [ ] `wrangler deploy` 成功，无 PrismaClient 加载错误
- [ ] 部署后 API 路由正常响应（200/201）
- [ ] Prisma 连接延迟 < 50ms（连接复用）

#### 测试
```bash
# 本地 CF Workers 模拟器
npx wrangler dev --local
curl http://localhost:8787/api/generate-components

# 生产部署验证
curl -s https://api.vibex.example/api/generate-components -w "%{http_code}"
```

---

### S1.4: @ci-blocking 批量移除
**工时**: 1h | **负责人**: tester

#### 背景
35+ 测试用例被 `@ci-blocking` 跳过，CI 测试门禁形同虚设，无法有效保障代码质量。

#### 实现方案
**Step 1**: 列出所有跳过测试
```bash
grep -rn "@ci-blocking" --include="*.test.ts" --include="*.spec.ts" -B2 -A2
```

**Step 2**: 分批移除（每批 10 个）
```
Batch 1: @ci-blocking 注释移除 + 失败用例修复
Batch 2: @ci-blocking 注释移除 + 失败用例修复
Batch 3: @ci-blocking 注释移除 + 失败用例修复（剩余全部）
```

**Step 3**: 每批修复后立即运行测试
```bash
npm run test -- --run
# 确保全部通过后再移除下一批
```

#### 常见失败场景及处理
| 失败类型 | 处理方式 |
|----------|----------|
| 异步超时 | 增加 timeout 配置 |
| Mock 缺失 | 补充 jest.mock() |
| 依赖环境变量 | 使用 TEST_* 环境变量 |
| 功能本身 bug | 修复 bug 而非跳过测试 |

#### 验收标准
- [ ] `grep -rn "@ci-blocking"` 返回空（所有注释已移除）
- [ ] `npm run test` 100% 通过
- [ ] 回归测试覆盖率 ≥ 80%（`jest --coverage`）

#### 测试
```bash
npm run test -- --coverage
# 验证覆盖率报告
```

---

## 3. Epic Acceptance Criteria

- [ ] S1.1: task_manager.py 无硬编码 token，git push 成功
- [ ] S1.2: `tsc --noEmit` + ESLint 全部通过
- [ ] S1.3: wrangler deploy 成功，8+ API 路由响应正常
- [ ] S1.4: 所有 @ci-blocking 移除，CI 100% 通过
- [ ] 所有变更经过 code review
- [ ] 无 P0 遗留项

## 4. Rollback Plan

若 Sprint 内任何 P0 修复导致生产问题：
1. 立即回滚对应 commit：`git revert <commit>`
2. 在 TRACKING.md 记录回滚原因
3. 通知 PM 和团队
4. 在下一 Sprint 重新修复
