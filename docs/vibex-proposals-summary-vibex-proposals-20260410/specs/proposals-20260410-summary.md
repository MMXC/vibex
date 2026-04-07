# VibeX 提案汇总 2026-04-10

**日期**: 2026-04-10
**汇总者**: Analyst Agent
**提案总数**: 48条（5/6 agents，reviewer待补充）

---

## 提案总览

| Agent | 提案数 | P0 | P1 | P2 | P3 | 状态 |
|-------|--------|-----|-----|-----|-----|------|
| dev | 10 | 2 | 3 | 3 | 2 | ✅ |
| analyst | 9 | 3 | 4 | 2 | 0 | ✅ |
| architect | 9 | 3 | 3 | 3 | 0 | ✅ |
| pm | 10 | 2 | 4 | 4 | 0 | ✅ |
| tester | 10 | 3 | 2 | 4 | 1 | ✅ |
| reviewer | — | — | — | — | — | ⏳ |
| **合计** | **48** | **13** | **16** | **16** | **3** | — |

---

## P0 提案（13条，全部优先处理）

### P0-1: task_manager.py Slack Token 硬编码 → 全团队 Push 阻塞
- **来源**: analyst (A-P0-1)
- **影响**: 任何修改该文件的 commit 被 GitHub secret scanning 阻断，**全团队阻塞**
- **修复**: 环境变量替代硬编码 token

### P0-2: `createStreamingResponse` 闭包引用未定义变量
- **来源**: dev (D-01)
- **位置**: `services/llm.ts`
- **影响**: Runtime ReferenceError，streaming API 崩溃

### P0-3: PrismaClient 无 Workers 守卫 → 8+ API 路由部署失败
- **来源**: dev (D-02)
- **位置**: `app/api/auth/login/*` 等8+文件
- **影响**: Cloudflare Workers 部署失败

### P0-4: ESLint `no-explicit-any` 未清理 → TypeScript 类型安全倒退
- **来源**: analyst (A-P0-2)
- **影响**: 9个文件含显式any，重构风险不可评估

### P0-5: generate-components flowId 无 E2E 验证
- **来源**: analyst (A-P0-3)
- **影响**: 组件落入 unknown flow，协作数据错乱

### P0-6: Schema Drift — sessionId vs generationId 漂移
- **来源**: architect (A-P0-1)
- **影响**: 前后端契约不一致，连续多轮 bug

### P0-7: SSE Stream 无超时控制
- **来源**: architect (A-P0-2)
- **影响**: AbortController 未传递，Worker setInterval 被禁用

### P0-8: Jest+Vitest 双框架共存 → 维护成本高
- **来源**: architect (A-P0-3)
- **影响**: 两套配置需同步，CI 混乱

### P0-9: 需求模板库缺失
- **来源**: pm (P001)
- **影响**: 新用户不知如何描述需求，输入质量差

### P0-10: 新手引导流程缺失
- **来源**: pm (P002)
- **影响**: 首次使用流失率高

### P0-11: Playwright 双重配置冲突
- **来源**: tester (T-P0-1)
- **位置**: 根配置 vs `tests/e2e/` 配置冲突，CI timeout=10s vs 30s
- **影响**: CI 断言更容易超时

### P0-12: stability.spec.ts 检查不存在路径
- **来源**: tester (T-P0-2)
- **位置**: `./e2e/` 不存在，检查永远 PASS
- **影响**: waitForTimeout 违规被掩盖

### P0-13: `@ci-blocking` grepInvert 跳过35+测试
- **来源**: tester (T-P0-3)
- **影响**: conflict-resolution、undo-redo、a11y 等核心路径无CI保障

---

## Sprint 规划

### Sprint 1：止血 + 测试基础设施（1-2天）
| Epic | 提案 | 工时 | 负责 |
|------|------|------|------|
| E1: 测试基础设施 | T-P0-1 + T-P0-2 + T-P0-3 | 2h | tester |
| E2: 类型安全 | A-P0-2 + A-P0-1 | 1h | dev |
| E3: Workers 修复 | D-02 + D-01 | 1h | dev |

### Sprint 2：Schema + SSE（2天）
| Epic | 提案 | 工时 | 负责 |
|------|------|------|------|
| E4: Schema 统一 | A-P0-1 | 2h | architect |
| E5: SSE 修复 | A-P0-2 | 1h | dev |
| E6: 双框架迁移 | A-P0-3 | 2h | tester |

### Sprint 3：流程治理（0.5天）
| Epic | 提案 | 工时 | 负责 |
|------|------|------|------|
| E7: Slack Token 修复 | A-P0-1 (analyst) | 0.5h | dev |
| E8: E2E flowId 验证 | A-P0-3 (analyst) | 1h | tester |

### Sprint 4：PM Feature（按需）
| Epic | 提案 | 工时 |
|------|------|------|
| E9: 模板库 | P001 | 3h |
| E10: 新手引导 | P002 | 3h |

**总工时**: ~13.5h

---

## 关键风险

| 风险 | 等级 | 缓解 |
|------|------|------|
| task_manager.py token 阻塞团队协作 | 🔴 极高 | 立即修复，PR优先 |
| Schema drift 持续导致类型不一致 | 🟡 中 | Zod统一Schema |
| 双测试框架维护成本 | 🟡 中 | Vitest迁移计划 |
| @ci-blocking 掩盖35+测试 | 🟡 中 | 立即移除grepInvert |

---

*v1.0 | 2026-04-10 | 待补充 reviewer 提案*
