# AGENTS: VibeX Proposals 2026-04-06

> **项目**: vibex-pm-proposals-vibex-proposals-20260406
> **作者**: architect agent
> **日期**: 2026-04-06
> **版本**: v1.0

---

## 角色与职责

| 角色 | 职责范围 | 核心任务 |
|------|----------|----------|
| **dev** | 代码实现 | Sprint 1 + Sprint 2 全部 Epic 实现 |
| **tester** | 测试覆盖 | E2E 修复、单元测试、覆盖率验证 |
| **reviewer** | 代码审查 | PR 审查、回归验证 |
| **pm** | 进度追踪 | Sprint 管理、障碍移除 |
| **architect** | 架构决策 | 方案评审、风险评估 |
| **analyst** | 需求分析 | 验收标准澄清 |

---

## 协作流程

### 任务领取

每个 Sprint 开始前，dev 从 team-tasks 领取对应 Epic 的任务：

```bash
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py update vibex-proposals-20260406 sprint1-done done
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py update vibex-proposals-20260406 sprint2-done done
```

### 开发流程

```
dev 领取任务
  ↓
Sprint 1 开始
  ↓
E1 → E2 → E3 (各 0.3-0.5h)
  ↓
提交 PR → reviewer 审查
  ↓
测试通过 → 合并
  ↓
Sprint 2 开始
  ↓
E4 → E5 → E6 (各 1-1.5h)
  ↓
提交 PR → reviewer 审查
  ↓
测试通过 → 合并 → 部署
```

---

## Sprint 1: P0 优先

### Epic 1: OPTIONS 预检路由修复

| 属性 | 值 |
|------|-----|
| **负责人** | dev |
| **预计工时** | 0.5h |
| **文件变更** | `gateway.ts` |
| **验收标准** | OPTIONS 返回 204 + CORS headers |

**dev 任务清单**:
- [ ] 确认 `protected_.options` 和 `authMiddleware` 注册位置
- [ ] 调整顺序：`options` 注册在 `authMiddleware` 之前
- [ ] 验证所有受保护路由的 OPTIONS 处理
- [ ] 提交 PR

**reviewer 审查要点**:
- [ ] OPTIONS 路由在其他中间件之前注册
- [ ] 不影响 GET/POST/PUT/DELETE 认证流程
- [ ] curl 测试通过

---

### Epic 2: Canvas Context 多选修复

| 属性 | 值 |
|------|-----|
| **负责人** | dev |
| **预计工时** | 0.3h |
| **文件变更** | `src/components/BoundedContextTree.tsx` |
| **验收标准** | checkbox onChange 调用 onToggleSelect |

**dev 任务清单**:
- [ ] 定位 checkbox 的 `onChange={toggleContextNode}` 错误绑定
- [ ] 修改为 `onChange={() => onToggleSelect(node.id)}`
- [ ] 确认 `toggleContextNode` 不受影响
- [ ] 提交 PR

**reviewer 审查要点**:
- [ ] `onChange` 绑定到 `onToggleSelect` 而非 `toggleContextNode`
- [ ] toggleContextNode 在右键菜单中正常工作
- [ ] 单元测试覆盖

---

### Epic 3: generate-components flowId

| 属性 | 值 |
|------|-----|
| **负责人** | dev |
| **预计工时** | 0.3h |
| **文件变更** | schema 相关文件 + prompt 模板 |
| **验收标准** | flowId 不是 "unknown" |

**dev 任务清单**:
- [ ] schema 添加 `flowId: string` 字段定义
- [ ] prompt 明确要求输出 flowId
- [ ] 后端添加兜底：`flowId = \`flow-${crypto.randomUUID()}\``
- [ ] 测试验证输出正确
- [ ] 提交 PR

**reviewer 审查要点**:
- [ ] schema 类型定义包含 flowId
- [ ] prompt 明确提及 flowId
- [ ] 后端兜底逻辑存在
- [ ] API 响应测试通过

---

## Sprint 2: P1 改进

### Epic 4: SSE 超时 + 连接清理

| 属性 | 值 |
|------|-----|
| **负责人** | dev |
| **预计工时** | 1.5h |
| **文件变更** | `src/services/aiService.ts`, `src/routes/v1/chat.ts` |
| **验收标准** | 10s 超时，cancel() 清理 timers |

**dev 任务清单**:
- [ ] `aiService.chat()` 添加 `AbortController.timeout(10000)`
- [ ] ReadableStream.cancel() 中清理所有 setTimeout
- [ ] 异常时 clearTimeout 兜底
- [ ] jest 测试覆盖超时和 cancel 场景
- [ ] 提交 PR

**tester 配合**:
- [ ] 编写 SSE 超时测试用例
- [ ] Mock OpenAI 延迟响应
- [ ] 验证 cancel() 调用 clearTimeout

**reviewer 审查要点**:
- [ ] AbortController 超时配置正确（10000ms）
- [ ] cancel() 中所有 timer 都被清理
- [ ] jest 测试覆盖率 > 80%

---

### Epic 5: 分布式限流

| 属性 | 值 |
|------|-----|
| **负责人** | dev |
| **预计工时** | 1.5h |
| **文件变更** | `src/middleware/rateLimit.ts`, `wrangler.toml` |
| **验收标准** | Cache API 限流，跨 Worker 一致 |

**dev 任务清单**:
- [ ] 将内存 Map 替换为 `caches.default`
- [ ] 保留原有 `checkRateLimit()` 接口不变
- [ ] wrangler.toml 确认 Cache API 配置
- [ ] 100 并发测试验证限流一致性
- [ ] 提交 PR

**tester 配合**:
- [ ] 编写并发限流测试
- [ ] 验证多 Worker 限流计数一致

**reviewer 审查要点**:
- [ ] `caches.default` 使用正确
- [ ] 接口返回值不变（allowed, remaining, resetAt）
- [ ] 100 并发测试通过

---

### Epic 6: test-notify 去重

| 属性 | 值 |
|------|-----|
| **负责人** | dev |
| **预计工时** | 1h |
| **文件变更** | `src/utils/dedup.js`, `src/routes/v1/test-notify.ts` |
| **验收标准** | 5 分钟去重窗口 |

**dev 任务清单**:
- [ ] 实现 `dedup.js`：`checkDedup()` 和 `recordSend()`
- [ ] `.dedup-cache.json` 持久化
- [ ] 启动时清理过期记录
- [ ] 集成到 `test-notify.ts` 路由
- [ ] jest 测试覆盖
- [ ] 提交 PR

**tester 配合**:
- [ ] 编写去重测试用例
- [ ] 验证 5 分钟时间窗口逻辑

**reviewer 审查要点**:
- [ ] 去重逻辑正确：5 分钟内跳过
- [ ] 文件持久化正常
- [ ] jest 测试通过

---

## 沟通约定

### Slack 频道

| 频道 | 用途 |
|------|------|
| `#vibex-dev` | 日常开发沟通 |
| `#vibex-review` | PR 审查通知 |
| `#vibex-alerts` | 部署/监控告警 |

### 进度更新

dev 在完成每个 Epic 后发送简短进度更新：

```
🔄 Epic E{n}: {Epic 名称} ✅ 完成
📊 状态: {x}/6
📝 说明: {修改的文件} | {测试结果}
⏰ 下一步: {下一个 Epic}
```

### 阻塞上报

遇到阻塞时，立即通知 pm：

```
⚠️ Epic E{n} 阻塞
🔒 原因: {阻塞原因}
📋 缺失项: {缺失的资源/信息}
❓ 需要: {需要的帮助}
```

---

## PR 审查清单

每个 PR 必须通过以下检查：

### dev 自查
- [ ] `npm test` 全量通过
- [ ] `npm run lint` 无警告
- [ ] 代码格式化（prettier）通过
- [ ] 变更范围与 Epic 一致（无 YAGNI）
- [ ] 提交信息清晰：`feat: E{n} {变化}`

### reviewer 审查
- [ ] 架构符合本项目规范
- [ ] 无安全隐患（输入验证、认证绕过）
- [ ] 测试覆盖充分
- [ ] 不引入不必要的复杂度

---

## 风险与依赖

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| E1 修改破坏其他中间件 | P0 | 仅调整顺序，充分测试 |
| E4 SSE 超时影响事件顺序 | P1 | 外层 try-catch，不修改内部流 |
| E5 Cache API wrangler 未启用 | P1 | 部署前确认配置 |
| E6 去重文件损坏 | P1 | 启动时验证 JSON 有效性 |

---

## 依赖关系图

```
Sprint 1
├── E1 (OPTIONS 修复) ──────────────────────────┐
│   依赖: 无                                    │  独立
└───────────────────────────────────────────────┤
├── E2 (Canvas 多选)                           │  独立
│   依赖: 无                                    │
└───────────────────────────────────────────────┤
└── E3 (flowId 修复)                           │  独立
    依赖: 无                                    │

Sprint 2
├── E4 (SSE 超时) ──────────────────────────────┐
│   依赖: 无                                    │  独立
└───────────────────────────────────────────────┤
├── E5 (分布式限流)                             │  独立
│   依赖: E4 无依赖                            │
└───────────────────────────────────────────────┤
└── E6 (去重)                                  │  独立
    依赖: 无                                    │
```

---

## 里程碑

| 里程碑 | 目标时间 | 状态 |
|--------|----------|------|
| Sprint 1 完成 | Sprint 开始后 1.1h | 待开始 |
| Sprint 2 完成 | Sprint 1 后 4h | 待开始 |
| CI 门禁建立 | Sprint 2 后 1h | 待开始 |
| 生产部署 | CI 通过后 0.5h | 待开始 |

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
