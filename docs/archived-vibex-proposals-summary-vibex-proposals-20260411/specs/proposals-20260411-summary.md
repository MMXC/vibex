# VibeX 提案汇总 2026-04-11

**日期**: 2026-04-11
**汇总者**: Analyst Agent
**提案总数**: 58条（6 agents）

---

## 提案总览

| Agent | 提案数 | P0 | P1 | P2 | 状态 |
|-------|--------|-----|-----|-----|------|
| dev | 7+ | 2 | 3 | 2+ | ✅ |
| analyst | 11 | 4 | 5 | 2 | ✅ |
| architect | 7 | 2 | 2 | 3 | ✅ |
| pm | 10 | 3 | 3 | 4 | ✅ |
| tester | 9 | 4 | 3 | 2 | ✅ |
| reviewer | 14 | 3 | 5 | 6 | ✅ |
| **合计** | **58+** | **18** | **21** | **19+** | ✅ |

---

## 🔴 P0 提案（18条，全部优先处理）

### 阻断级 P0（4个历史遗留，连续2+轮未执行）

| # | 问题 | 来源 | 工时 | 遗留轮次 |
|---|------|------|------|----------|
| 1 | task_manager.py Slack token 硬编码 → push 阻断 | analyst | 0.5h | **3轮** |
| 2 | ESLint `no-explicit-any` 9文件未清理 | analyst | 1h | **2轮** |
| 3 | `@ci-blocking` 跳过35+测试 | tester | 1h | **3轮** |
| 4 | Playwright CI timeout=10s（非30s） | tester | 0.5h | **3轮** |

### 新增 P0（14条）

| # | 问题 | 来源 | 工时 |
|---|------|------|------|
| 5 | WebSocket ConnectionPool 无连接数限制 → OOM | architect | 1.5h |
| 6 | API v0/v1 双路由50+文件重复维护 | architect | 4h |
| 7 | PrismaClient Workers守卫缺失（8+路由） | analyst | 1h |
| 8 | `connectionPool.ts` 4处console.log泄露生产信息 | dev | 0.5h |
| 9 | `project-snapshot.ts` 5个TODO返回假数据 | dev | 1h |
| 10 | `stability.spec.ts` 检查路径不存在（形同虚设） | tester | 0.5h |
| 11 | generate-components flowId 无E2E验证 | tester | 1h |
| 12 | 需求智能补全（AI主动澄清追问） | pm | 4h |
| 13 | 项目搜索过滤 | pm | 2h |
| 14 | `as any` 滥用（5个文件）| reviewer | 2h |
| 15 | 空catch块吞噬异常（2处高风险）| reviewer | 1h |
| 16 | 裸`e: any`异常参数（6处）| reviewer | 0.5h |
| 17 | `waitForTimeout` 87处残留（比上轮增加67处）| tester | 3h |
| 18 | `ai-service.ts` JSON解析边界无测试 | tester | 1h |

---

## Sprint 规划

### Sprint 0：紧急止血（1天）
| 提案 | 工时 | 负责 |
|------|------|------|
| Slack token 迁移 | 0.5h | dev |
| console.log → logger | 0.5h | dev |
| @ci-blocking 移除 | 1h | tester |
| Playwright timeout 统一 | 0.5h | tester |
| stability.spec.ts 路径 | 0.5h | tester |

### Sprint 1：测试基础设施（1天）
| 提案 | 工时 | 负责 |
|------|------|------|
| waitForTimeout 87处清理 | 3h | tester |
| flowId E2E 验证 | 1h | tester |
| project-snapshot TODO 修复 | 1h | dev |

### Sprint 2：类型安全（1天）
| 提案 | 工时 | 负责 |
|------|------|------|
| as any 5文件清理 | 2h | reviewer |
| 空catch块修复 | 1h | reviewer |
| 裸 e: any 修复 | 0.5h | reviewer |
| ESLint no-explicit-any | 1h | dev |

### Sprint 3：架构（2天）
| 提案 | 工时 | 负责 |
|------|------|------|
| API v0/v1 路由统一 | 4h | architect |
| WebSocket 连接数限制 | 1.5h | dev |
| PrismaClient Workers守卫 | 1h | dev |

### Sprint 4：PM Feature（按需）
| 提案 | 工时 |
|------|------|
| 智能补全 | 4h |
| 项目搜索 | 2h |

**总工时**: ~22h

---

## 关键风险

| 风险 | 等级 | 缓解 |
|------|------|------|
| 4个P0连续3轮未执行（执行率0%） | 🔴 极高 | Sprint 0必须全完成，coord盯死 |
| waitForTimeout 87处（比上轮+67处） | 🟡 中 | 禁止新测试引入waitForTimeout |
| API双路由持续分裂 | 🟡 中 | Sprint 3优先处理 |

---

*v1.0 | 2026-04-11*
