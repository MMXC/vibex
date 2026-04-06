# Requirements Analysis: vibex-backend 开发改进提案
**项目**: vibex-dev-proposals-vibex-proposals-20260411  
**分析日期**: 2026-04-11  
**分析人**: Analyst Agent

---

## 一、业务场景分析

### 背景
vibex 是一个 AI 驱动的应用原型生成平台，backend（vibex-backend）负责：
- **AI 服务编排** — LLM 调用、JSON 解析、需求分析
- **实时协作** — WebSocket 连接池管理、多用户同步
- **数据持久化** — D1 SQLite 数据库读写
- **原型预览** — 实时预览和组件生成

### 当前问题分类

| 问题类型 | 影响范围 | 用户影响 |
|---------|---------|---------|
| 日志污染 | 生产可观测性 | 无法定位问题、污染日志系统 |
| 技术债务 | 项目长期维护 | 代码质量下降，新增功能风险 |
| 健壮性缺陷 | AI 生成流程 | JSON 解析失败导致用户任务丢失 |
| 假数据接口 | 核心快照功能 | 数据不准确，协作场景下用户看到错误信息 |

### 关键利益相关者
- **开发者** — 维护日志清洁度，提高调试效率
- **DevOps/SRE** — 依赖结构化日志做告警和监控
- **最终用户** — AI 生成结果可靠性、实时协作稳定性

---

## 二、技术方案选项

### 【Option A】渐进式修复 — 按优先级分阶段执行

**思路**: 不做大范围重构，按 P0→P3 优先级逐文件修复，每阶段可独立上线。

| 阶段 | 内容 | 工时 | 风险 |
|------|------|------|------|
| Phase 1 | connectionPool.ts console.log → logger | 1h | 低 |
| Phase 2 | project-snapshot.ts 5个TODO真实化 | 3h | 中（涉及DB schema确认） |
| Phase 3 | ai-service.ts JSON解析增强 | 2h | 中（需回归测试） |
| Phase 4 | devDebug 统一为 logger.debug | 2h | 低 |
| Phase 5 | live-preview/prototype-preview console.error 结构化 | 2h | 低 |
| Phase 6 | 异常处理增强（connectionPool） | 2h | 中 |
| Phase 7 | 遗留文件清理 + TODO收尾 | 1h | 低 |

**优点**: 小步快跑，每步可独立 review 和回滚
**缺点**: 需要多次 review 周期，总工时较长

---

### 【Option B】日志基础设施重构 + 批量修复

**思路**: 先重构 `src/lib/logger.ts`，增加 `LOG_LEVEL`、`devDebug` 统一管理，再批量替换所有 `console.*` 调用。

| 阶段 | 内容 | 工时 | 风险 |
|------|------|------|------|
| Phase 1 | logger.ts 增强（devDebug 统一、context 字段标准化） | 3h | 中（需确认向后兼容） |
| Phase 2 | 批量替换所有 console.log/error → logger | 2h | 中（正则替换需人工 review） |
| Phase 3 | project-snapshot.ts 真实数据查询 | 3h | 中 |
| Phase 4 | ai-service.ts JSON 解析增强 | 2h | 中 |
| Phase 5 | 异常处理 + 告警增强 | 2h | 中 |

**优点**: 基础设施一次性到位，后续新代码直接使用标准化日志
**缺点**: Phase 1 改动面大，可能影响多个服务；需要完整回归测试

---

### 【Option C】最小化可行修复 — 只修 P0

**思路**: 只修复 P0（console.log 污染 + project-snapshot 假数据），其余纳入后续迭代。

| 阶段 | 内容 | 工时 | 风险 |
|------|------|------|------|
| Phase 1 | connectionPool.ts console.log → logger | 1h | 低 |
| Phase 2 | project-snapshot.ts 真实数据 | 3h | 中 |

**优点**: 最小暴露风险，快速止血
**缺点**: 技术债务持续积累，后续修复成本更高

---

## 三、推荐方案

**推荐: Option A（渐进式修复）**

理由：
1. 项目处于活跃开发期，大范围重构（Option B Phase 1）风险高
2. P0 问题（console.log、假数据）确实需要立即处理
3. 渐进式每步可独立验证，不阻塞其他功能开发
4. Option C 太保守，遗留问题会继续膨胀

---

## 四、风险评估

| 风险 | 级别 | 缓解措施 |
|------|------|---------|
| logger.ts API 变更影响其他模块 | 中 | 不改变导出签名，新增可选参数 |
| project-snapshot.ts 涉及 DB schema | 中 | 先确认 D1 schema，不确定则加 TODO 并标注 |
| ai-service.ts JSON 解析改动影响 AI 生成 | 中 | 添加自动化测试用例覆盖 markdown JSON |
| 批量替换 console.* 遗漏 | 低 | 使用脚本生成 diff，人工逐文件 review |

---

## 五、验收标准

### 通用标准
- [ ] 所有 `console.log` 从生产代码中移除（或在 `NODE_ENV=production` 时禁用）
- [ ] 所有 `console.error` 改为结构化 `logger.error` 并带 context
- [ ] 所有 `devDebug` 调用在 `LOG_LEVEL=info` 时不输出
- [ ] 无未完成的 TODO 标记（除非有正当理由说明并标注 `// TODO[YYYY-MM-DD]: ...`）

### 专项标准
- [ ] `connectionPool.ts` — 连接添加/移除/超时事件有结构化日志
- [ ] `project-snapshot.ts` — 快照接口返回真实数据库数据（单元测试验证）
- [ ] `ai-service.ts` — markdown 包裹的 JSON 能正确解析（回归测试覆盖）
- [ ] `websocket/` — 连续 5 次消息处理失败触发 health check
- [ ] `llm-provider.ts.backup-*` 文件已删除

---

## 六、工时估算

| 阶段 | 内容 | 预估工时 | 说明 |
|------|------|---------|------|
| Phase 1 | connectionPool.ts 日志修复 | 1h | 4个console.log替换 |
| Phase 2 | project-snapshot.ts 真实化 | 3h | 5个TODO，涉及DB查询 |
| Phase 3 | ai-service.ts JSON解析 | 2h | markdown提取+截断 |
| Phase 4 | devDebug统一 | 2h | ~20处替换 |
| Phase 5 | 路由console.error结构化 | 2h | 9处+上下文 |
| Phase 6 | 异常处理增强 | 2h | connectionPool |
| Phase 7 | 清理+收尾 | 1h | 备份文件+TODO |
| **总计** | | **13h** | 约2个工作日 |

---

## 七、依赖项

- `src/lib/logger.ts` — 需确认现有 logger API 是否满足需求（可能需小幅增强）
- D1 Database schema — `project-snapshot.ts` 真实化需确认表结构
- 测试框架 — `ai-service.ts` 需补充回归测试用例
- 环境变量 — `LOG_LEVEL` 需在 deployment config 中配置

---

## 八、备注

- 所有修改需经过 code review，建议每个 phase 作为独立 PR
- 优先处理 Phase 1+2（P0 问题），其余可与功能开发并行
- 本分析基于 2026-04-11 的代码快照，后续新增代码需遵循新的日志规范
