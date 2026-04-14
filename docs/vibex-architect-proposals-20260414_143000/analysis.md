# 需求分析：vibex-architect-proposals-20260414_143000

> **分析方**: Analyst Agent  
> **分析日期**: 2026-04-14  
> **主题**: Architect 提案需求分析（技术架构优化 10项）  
> **关联项目**: vibex-architect-proposals-20260414_143000

---

## 执行决策

- **决策**: 已采纳（部分）
- **执行项目**: vibex-architect-proposals-20260414_143000
- **执行日期**: 2026-04-14

---

## 1. 业务场景分析

### 业务价值

Architect 提案共 10 项，覆盖 VibeX 前端（Next.js）+ 后端（Cloudflare Workers）全栈技术债务。核心问题集中在：
- **设计系统违规**：`/pagelist` 页面视觉完全脱离 VibeX 深色赛博朋克风格
- **代码重复**：MermaidRenderer、TemplateSelector 等组件存在 2-3 份副本
- **路由膨胀**：后端 61 个路由文件，存在严重重叠

业务影响：技术债务不清理，会持续拖慢开发速度，影响 CI 可信度，并让新加入的 Dev 困惑。

### 目标用户

| 用户 | 使用场景 |
|------|---------|
| Dev Agent | 日常开发中引用正确的 canonical 组件，而非旧副本 |
| Architect Agent | 跟进 P0/P1 技术债务清理进度 |
| 终端用户 | 体验统一品牌视觉（不再看到割裂的浅色页面） |

---

## 2. 核心 JTBD（Jobs-To-Be-Done）

1. **When** 用户访问 `/pagelist`，**I want** 看到与 VibeX 深色主题一致的页面，**So that** 品牌信任度不被破坏
2. **When** Dev 需要使用 MermaidRenderer，**I want** 只有一个 canonical 版本，**So that** 不会引用错误副本
3. **When** 新后端功能需要路由，**I want** 有清晰的路由组织规范，**So that** 不再创建功能重叠的路由文件
4. **When** 后端 API 返回错误，**I want** 统一的错误格式，**So that** 前端不需要处理多种错误结构
5. **When** AI 服务调用超时，**I want** 有超时保护机制，**So that** 不触发 Cloudflare Workers 50ms CPU 限制

---

## 3. 技术方案选项

### 方案A：分批清理（推荐）

**描述**: P0 → P1 → P2 分阶段，每周 Sprint 消化 1-2 个 P0 级别任务。  
**优势**:
- 风险可控，每次变更范围小
- 不影响并行进行的产品功能开发
- 每个 Sprint 都有可见清理进度

**劣势**:
- 清理周期长（P0 完成后 P1 可能已积累新债务）

### 方案B：集中重构周

**描述**: 专门安排 1 周"技术债务冲刺"，集中清理所有 P0+P1 问题。  
**优势**:
- 一次性根治，不留尾巴

**劣势**:
- 阻断产品功能交付 1 周
- 变更量大，回滚风险高
- P0-3（路由重组 24h）+ P1-1（服务拆分 32h）= 合计 56h，一周不够

**当前决策**: 方案A，P0 进 Sprint 1，P1/P2 归 Architect 独立 track。

---

## 4. 可行性评估

| 维度 | 评估 | 说明 |
|------|------|------|
| **P0-1 /pagelist 修复** | ✅ 可行 | 样式重写，4h 内完成 |
| **P0-2 组件去重** | ⚠️ 有条件 | 需 diff 分析确认哪个版本为 canonical，16h |
| **P0-3 路由重组** | 🔴 高风险 | 61 个路由，24h 估算可能不足，涉及 API 契约变更 |
| **P1-1 服务拆分** | 🔴 高风险 | 32h，依赖 P0-3 完成，不宜进 Sprint 1 |
| **A-P1-3 错误格式统一** | ✅ 可行 | 8h，独立性强，可并行 |

---

## 5. 初步风险识别

### 技术风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| P0-3 路由重组影响外部 API 调用者 | 🔴 高 | 先做 API 版本化（A-P1-4），再做路由重组 |
| 组件去重选错 canonical 版本 | 🟠 中 | diff 分析 + code review，不得绕过 |
| Cloudflare Workers CPU 限制触发 | 🟠 中 | 添加超时保护，监控 P95 响应时间 |

### 业务风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| /pagelist 删除影响外部链接 | 🔴 高 | **已决策保留修复**（不删除） |
| 重构期间影响用户访问 | 🟠 中 | 变更在非峰值时段部署 |

### 依赖风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| A-P1-1 依赖 A-P0-3 | 🟠 中 | P0-3 未完成前 P1-1 不开始 |
| A-P1-4 API 版本化依赖 P0-3 | 🟠 中 | 串行执行 |

---

## 6. 验收标准

- [ ] 访问 `/pagelist` 页面，背景色为 `var(--color-bg-primary)`（深色），无浅灰白背景
- [ ] 代码库中 MermaidRenderer 实例数量从 3 降至 1（验证方式：`find . -name "MermaidRenderer*" | wc -l`）
- [ ] 后端 tsconfig.json 不包含 `"name": "next"` 插件引用
- [ ] API 错误响应统一格式：`{ error: { code, message, details } }`
- [ ] 所有 P0 修复通过 CI `tsc --noEmit` + `vitest` 无新增失败
- [ ] P0-1、P0-2 在 Sprint 1 内完成，P0-3 进入独立 track 并设置里程碑

---

## 7. Git History 分析记录

| 提交 | 关联度 | 说明 |
|------|--------|------|
| `7b586ddb` feat(canvas): Phase2 P1 — ActionProvider handlers | 🟢 中 | 组件重构参考：Canvas 组件独立化模式 |
| `497f4e76` feat(canvas): Phase1 P0 — catalog slots | 🟢 中 | P0 修复模式：catalog → 组件归一 |
| `15446fcd` feat(design): Phase2 P1 — 规模化批量生成 | 🟡 低 | 批量化重构参考 |
| `09aabcd1` feat(design): integrate design-parser into generate-catalog | 🟡 低 | 组件整合模式参考 |

**结论**: 历史提交显示团队有 P0 快速修复 + 组件整合经验，P0-1 和 A-P1-3 可信度高。P0-3 路由重组历史无先例，风险较高。

---

*分析完成 | Analyst Agent | 2026-04-14*
