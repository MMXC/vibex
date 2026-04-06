# Tester 每日提案 — 2026-04-11

**Agent**: analyst
**日期**: 2026-04-11
**产出**: proposals/20260411/tester.md

---

## T-P0-1: Canvas Export E2E 测试覆盖缺失

**Summary**: export/page.tsx 的 PNG/SVG/WebP/ZIP 导出功能无 E2E 测试。

**Problem**: 导出功能改动频繁（最近 5e8450e3/f03bea27），但无自动化测试验证。

**Solution**: 添加 Playwright E2E 测试：
```typescript
test('PNG export downloads file', async ({ page }) => {
  await page.goto('/export');
  await page.click('[data-testid="format-card-png"]');
  await page.click('button:has-text("开始导出")');
  // 验证下载或 alert
});
```

**Impact**: 导出功能测试覆盖率 +40%，2h
**Effort**: 2h

---

## T-P0-2: Auth E4 端到端登录流程测试

**Summary**: auth E4 重构后（8da86a80, c1bb5e17）无 E2E 测试验证登录/登出。

**Problem**: 登录流程是核心路径，但只有手动测试，regression 风险高。

**Solution**: 添加认证流程 E2E：
- 注册 → 登录 → 登出 → 重新登录
- JWT token 刷新
- 跨页面会话保持

**Impact**: 认证回归风险 -80%，2h
**Effort**: 2h

---

## T-P1-1: Web Vitals 指标上报集成测试

**Summary**: web-vitals.ts 的 sendBeacon 被注释，无测试验证指标上报。

**Problem**: Sentry/自定义端点配置后无法验证数据是否正确上报。

**Solution**: 
1. Mock navigator.sendBeacon
2. 验证 onReport callback 被调用
3. 验证 WebVitalsMetric 格式正确

**Impact**: 监控可观测性，1h
**Effort**: 1h

---

## T-P1-2: WebSocket 协作 E2E 测试

**Summary**: ConnectionPool 集成（04d2ebc2）后无协作并发编辑测试。

**Problem**: 多用户同时编辑时冲突解决逻辑无自动化验证。

**Solution**: 
1. 启动两个浏览器实例
2. 模拟并发编辑同一节点
3. 验证最终状态一致性

**Impact**: 协作稳定性，3h
**Effort**: 3h

---

## T-P2-1: MCP /health 端点集成测试

**Summary**: 0c63fff2 添加的 /health 端点无测试。

**Problem**: 健康检查端点上线后无法验证各依赖状态检测逻辑。

**Solution**: 添加健康检查测试：
- 正常状态返回 200
- DB 断开时返回 503
- 超时场景验证

**Impact**: 监控测试覆盖，1h
**Effort**: 1h
