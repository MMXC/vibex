# Spec: E03 — ShareBadge + ShareToTeamModal E2E 测试规格

**Epic**: E03 E2E 测试补全
**Stories**: S06, S07
**Agent**: pm
**日期**: 2026-05-07

---

## 1. 概述

定义 ShareBadge 和 ShareToTeamModal 端到端测试规格，覆盖用户分享触发 → badge 更新 → CI 卡口全链路。测试文件：`tests/e2e/share-notification.spec.ts`。

---

## 2. 测试文件结构

```typescript
// tests/e2e/share-notification.spec.ts
import { test, expect } from '@playwright/test';

test.describe('ShareNotification', () => {
  // S06: ShareBadge E2E
  test('ShareBadge shows correct unread count after notification', { ... });
  test('ShareBadge hidden when no unread notifications', { ... });
  test('ShareBadge shows 99+ when unread >= 100', { ... });

  // S07: ShareToTeamModal + CI
  test('ShareToTeamModal shows toast after successful share', { ... });
  test('ShareToTeamModal handles empty team gracefully', { ... });
  test('ShareToTeamModal shows error when share fails', { ... });

  // S07: CI 卡口
  test('CI e2e:ci failure blocks PR', { ... });  // 条件跳过（仅 CI 环境）
});
```

---

## 3. S06: ShareBadge 测试用例

### TC-S06-01: 分享后 badge 数字 +N

```
Pre-condition: 用户已登录，badge 当前计数 = B

Steps:
1. navigate to /dashboard
2. click share button on a project
3. fill email: 'alice@example.com'
4. click send/confirm
5. wait for API response (200/201)

Expected:
- GET /api/notifications returns unreadCount = B + 1
- ShareBadge textContent = 'B+1' or (B+1).toString()
- ShareBadge is visible
```

### TC-S06-02: 无未读时 badge 隐藏

```
Steps:
1. navigate to /dashboard
2. mark all notifications as read (call PATCH /api/notifications/read-all)

Expected:
- ShareBadge is not visible (display: none)
- GET /api/notifications returns unreadCount = 0
```

### TC-S06-03: 未读数 ≥100 显示 99+

```
Steps:
1. seed 105 unread notifications via test API
2. navigate to /dashboard

Expected:
- ShareBadge textContent = '99+'
- ShareBadge is visible
```

### TC-S06-04: 多人分享 badge 累计

```
Steps:
1. share to 3 team members in sequence
2. check badge after each

Expected:
- After 1st share: badge = '1'
- After 2nd share: badge = '2'
- After 3rd share: badge = '3'
```

---

## 4. S07: ShareToTeamModal + CI 测试用例

### TC-S07-01: 分享成功 toast

```
Steps:
1. navigate to /dashboard
2. click 'Share to Team' button
3. select team 'TestTeam'
4. click confirm
5. wait for toast (role='status')

Expected:
- toast text matches /已通知 \d 人/
- toast disappears after 3s
- notification created for each team member
```

### TC-S07-02: 空团队处理

```
Steps:
1. navigate to /dashboard
2. share to team with 0 members

Expected:
- toast: '团队无成员'
- no notification records created
- API: POST /api/projects/:id/share-team → 200 with { notified: 0 }
```

### TC-S07-03: 分享失败错误提示

```
Steps:
1. mock API to return 500 for share endpoint
2. click share to team button
3. select team
4. click confirm

Expected:
- error toast appears: '分享失败，请稍后重试'
- no notifications created
```

### TC-S07-04: CI e2e 卡口（仅 CI 环境）

```
Steps:
1. run: npm run test:e2e:ci
2. inspect exit code

Expected:
- exit code === 0 → all tests passed
- exit code !== 0 → GitHub Actions PR status check fails

Note: In local dev, this test is skipped via:
  test.skip(process.env.CI === undefined, 'Skip in local dev');
```

---

## 5. CI 配置要求

```yaml
# .github/workflows/ci.yml 或 e2e.yml

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e:ci
        # 注意: 必须 capture exit code，不做 || true 跳过
```

**验收标准**:
- `test:e2e:ci` exit non-zero → `workflow_run.conclusion = 'failure'`
- GitHub PR Status Check 名称: `e2e tests (ci)` → state: `failure`

---

## 6. Playwright 配置

```typescript
// playwright.config.ts

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [
    ['html'],
    ['list'],  // 终端输出
  ],
  retries: process.env.CI ? 2 : 0,  // CI 环境 retry flaky tests
  workers: process.env.CI ? 2 : undefined,  // CI 并行度限制
});
```

---

## 7. DoD

- [ ] `tests/e2e/share-notification.spec.ts` 存在且包含 TC-S06-01 ~ TC-S06-04
- [ ] `tests/e2e/share-notification.spec.ts` 存在且包含 TC-S07-01 ~ TC-S07-04
- [ ] `npm run test:e2e` exit 0（本地）
- [ ] `npm run test:e2e:ci` exit 0（CI）
- [ ] `playwright.config.ts` 配置 `retries: 2` for CI
- [ ] GitHub workflow 不含 `|| true` 跳过 e2e 失败
