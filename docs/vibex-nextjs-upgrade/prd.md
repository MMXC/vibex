# PRD: vibex-nextjs-upgrade

> **状态**: 已完成 | **优先级**: P1 | **分析师**: Analyst Agent | **PM**: PM Agent
> **结论**: Next.js 16.1.6 → 16.2.0 升级已完成

---

## 1. 执行摘要

Next.js 安全升级（16.1.6 → 16.2.0，P0: DoS + HTTP 请求走私）已由 Dev 完成。构建成功，35个页面全部正常。遗留项：@sentry/nextjs 版本兼容性警告（建议后续升级）。

---

## 2. Epic 拆分

### Epic 1: 升级完成确认

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S1.1 | 升级确认 | package.json 声明 next@16.2.0，commit 已合并 |
| S1.2 | 构建验证 | npm run build 成功，35个页面 |
| S1.3 | Sentry 验证 | @sentry/nextjs 功能正常（生产环境） |
| S1.4 | API/Middleware | API routes 和 Middleware 功能正常 |

---

## 3. 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 版本锁定 | next@16.2.0 已声明 | expect(nextVersion).toMatch(/16\.2\.0/) | - |
| F1.2 | 构建成功 | npm run build 0 exit code | expect(build.status).toBe(0) | - |
| F1.3 | Sentry 兼容 | @sentry/nextjs 功能正常 | 生产环境 Sentry 收到错误报告 | - |
| F1.4 | API/Middleware | 功能正常 | 手动测试通过 | - |

---

## 4. 技术约束

1. **无需代码修改**：升级已完成，仅需验证
2. **Sentry 兼容性**：@sentry/nextjs@10.44.0 声明 peer dependency 为 next@14.2.35，但实际运行正常

---

## 5. 实施步骤（验证）

```
1. 确认 package.json next@16.2.0
2. npm run build 验证
3. 生产环境 Sentry 验证
4. API routes 手动测试
```

**预估工时**: 10 分钟（验证）

---

## 6. 验收标准汇总

- [ ] F1.1: next@16.2.0 已锁定
- [ ] F1.2: 构建成功
- [ ] F1.3: Sentry 功能验证
- [ ] F1.4: API/Middleware 验证
- [ ] 所有验收通过后，项目标记为 completed

---

## 7. 遗留项

| 遗留项 | 描述 | 优先级 |
|--------|------|--------|
| @sentry/nextjs 升级 | 升级到兼容 next@16.x 的版本 | P2 |

---

*PM Agent | 2026-03-20*
