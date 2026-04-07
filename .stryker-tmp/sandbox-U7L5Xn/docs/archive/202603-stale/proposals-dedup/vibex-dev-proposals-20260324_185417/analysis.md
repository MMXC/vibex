# 需求分析报告：Dev 提案（20260324_185417）

**项目**: vibex-dev-proposals-20260324_185417  
**分析日期**: 2026-03-24  
**分析师**: analyst agent  
**来源文档**: `/root/.openclaw/vibex/proposals/20260324/dev-proposals.md`  
**提案时间**: 2026-03-24 09:56 (Asia/Shanghai)

---

## 一、需求概述

本次 Dev Agent 提案共提出 **3 项改进**，聚焦于 CardTreeNode 组件测试、proposal-dedup 机制生产验证和前端错误处理模式统一三个方向。提案基于 homepage-cardtree-debug Epic1-4 和 proposal-dedup-mechanism Epic1-2 的工作总结提炼而出，侧重前端质量保障和工具链生产验证。

---

## 二、提案清单与分类

### 2.1 问题分类

| 类别 | 数量 | 占比 |
|------|------|------|
| ✅ 测试质量 | 1 | 33% |
| 🔧 工具链验证 | 1 | 33% |
| 🏗️ 架构模式 | 1 | 33% |

### 2.2 详细提案列表

| ID | 提案名称 | 优先级 | 工时 | 类型 |
|----|---------|--------|------|------|
| D-001 | CardTreeNode 组件单元测试补全 | P1 | 4h | 测试质量 |
| D-002 | proposal-dedup 机制生产验证 | P1 | 2d | 工具链验证 |
| D-003 | 前端错误处理模式统一 | P2 | 2d | 架构模式 |

---

## 三、可行性分析

### 3.1 P1 提案

#### D-001: CardTreeNode 组件单元测试补全

**技术可行性**: ✅ 高
- CardTree Epic1-4 已完成，组件接口稳定
- 已有 Epic3 集成测试可参考测试场景
- 转换函数 `boundedContextsToCardTree` 纯函数特性适合单元测试

**资源可行性**: ✅ 合理
- 工时 4h，dev 独立完成

**风险**: 🟢 低
- 组件测试覆盖场景清晰（正常渲染/空 children/多层级/stepType 分支/选中态）
- 无外部依赖，Mock 成本低

#### D-002: proposal-dedup 机制生产验证

**技术可行性**: ✅ 高
- Epic1-2 核心机制已完成，57 个 E2E 测试通过
- 真实数据目录存在（`proposals/20260323_*/`）

**资源可行性**: ⚠️ 需关注
- 工时 2d（最大单项投入）
- 需要 tester 配合验证关键词提取正确性

**风险**: 🟡 中
- **Chinese bigram 边界未验证**：自然语言切分可能产生歧义
  - 例："中央区域画布展示" → ["中央", "区域", "画布", "展示"] 还是 ["中央区域", "画布展示"]？
- 需人工标注对比验证

---

### 3.2 P2 提案

#### D-003: 前端错误处理模式统一

**技术可行性**: ✅ 高
- CardTree Epic4 已实现组件级错误处理，可作为统一模式的参考
- React error boundary 生态成熟

**资源可行性**: ⚠️ 需规划
- 工时 2d，涉及多个组件重构
- ErrorType 枚举定义需团队共识

**风险**: 🟡 中
- 多个组件的现有错误处理需要迁移，可能引入回归
- 统一 hook 需处理所有边界情况（网络/解析/超时/未知）
- **建议**：先定义 ErrorType 枚举和 hook API，再逐步迁移现有组件

---

## 四、技术风险汇总

| 风险 | 影响 | 概率 | 等级 | 缓解措施 |
|------|------|------|------|----------|
| Chinese bigram 关键词误判 | 中 | 中 | 🟡 Medium | 人工标注验证 + 可配置阈值 |
| 错误处理 hook 覆盖不全 | 高 | 低 | 🟡 Medium | 先行试点组件，再全面推广 |
| CardTreeNode 单元测试 mock 过多 | 低 | 中 | 🟢 Low | 优先测试转换函数，组件测试聚焦渲染 |
| 迁移期间现有功能退化 | 高 | 低 | 🟡 Medium | 保持原有处理逻辑作为 fallback |

---

## 五、优先级建议

| 顺序 | 提案 | 理由 |
|------|------|------|
| 1 | D-002 dedup 生产验证 | P1 且高风险，2d 投入生产保障，必须做 |
| 2 | D-001 CardTreeNode 单元测试 | 4h 快速见效，测试质量立竿见影 |
| 3 | D-003 错误处理模式统一 | P2 架构改进，依赖 D-002 完成后再推进 |

**优先级对比**:
- D-001 和 D-002 可并行执行（无依赖关系）
- D-003 可在 D-002 完成后启动（D-002 验证了 dedup 关键词提取，可复用验证经验）

---

## 六、实现方案概述

### D-001: CardTreeNode 组件单元测试补全

**实现路径**:
1. 创建 `vibex-fronted/src/components/CardTree/__tests__/CardTreeNode.test.tsx`
2. 为 `boundedContextsToCardTree` 创建独立单元测试文件
3. 覆盖场景：
   - 正常渲染（单层、多层 CardTree）
   - `children` 为空/null/undefined
   - 多层级嵌套（3 层以上）
   - `stepType` 分支覆盖（diagnostic/pre-diagnostic/manual）
   - 选中态切换（选中/取消选中）
   - 边界：超长文本截断

**验收标准**:
- `npm run test CardTreeNode` 通过率 100%
- 测试覆盖率报告：分支覆盖率 ≥ 85%

### D-002: proposal-dedup 机制生产验证

**实现路径**（分三阶段）:

**阶段一：Staging 环境搭建（1d）**
- 导入 `proposals/20260323_*/` 真实提案数据
- 在 staging 环境运行 dedup 扫描
- 验证去重结果是否合理（手动 review）

**阶段二：Chinese Bigram 提取验证（0.5d）**
- 准备人工标注样本（至少 20 条提案）
- 对比机器提取结果与人工标注
- 计算 Precision/Recall，调整切分参数

**阶段三：修复与回归（0.5d）**
- 根据验证结果修复发现的问题
- 更新 E2E 测试覆盖新增边界情况
- 编写生产验证报告

**验收标准**:
- 关键词提取 Precision ≥ 80%，Recall ≥ 70%
- staging 验证报告通过 Coord 审批

### D-003: 前端错误处理模式统一

**实现路径**:
1. **定义 ErrorType 枚举**：`NETWORK_ERROR | TIMEOUT | PARSE_ERROR | UNKNOWN`
2. **创建 useErrorHandler hook**：
   - 统一错误捕获（try-catch + error boundary）
   - 可配置重试策略（次数、间隔、backoff）
   - 错误上报接口（可选）
3. **迁移现有组件**：
   - CardTree → useErrorHandler（试点）
   - useJsonTreeVisualization → useErrorHandler
   - ErrorState → 标准化降级 UI
4. **文档化**：错误恢复策略（哪些可重试、重试几次）

**验收标准**:
- ErrorType 枚举通过 Architect 审批
- CardTree、useJsonTreeVisualization 迁移后功能不变
- 错误处理代码减少 ≥ 30%（行数统计）

---

## 七、工时汇总

| 优先级 | 提案数 | 总工时 |
|--------|--------|--------|
| P1 | 2 | 2d+4h（≈ 2.5d）|
| P2 | 1 | 2d |
| **合计** | **3** | **~4.5d** |

---

## 八、质量评分（INVEST）

| 维度 | 得分 | 说明 |
|------|------|------|
| 独立性 | 5/5 | 各提案独立，无跨依赖 |
| 可协商性 | 4/5 | 方案有替代空间（如 D-003 可仅做 ErrorType 枚举）|
| 价值明确 | 5/5 | 每项有清晰的问题-收益描述 |
| 可估算性 | 4/5 | 工时估算合理，bigra m 验证存在不确定性 |
| 粒度适中 | 5/5 | 均为 4h-2d 规模，可单次完成 |
| 可测试性 | 5/5 | 每项均可定义量化验收标准 |
| **总分** | **28/30** | **通过（≥21）** |

---

## 九、关联分析

| 关联项目 | 关联内容 |
|----------|---------|
| homepage-cardtree-debug | D-001 依赖 CardTree Epic4 完成的组件接口 |
| proposal-dedup-mechanism | D-002 是该项目的生产验证阶段 |
| proposal-dedup-reviewer1-fix | D-002 需等待 reviewer1-fix 完成（修复路径/字段 Bug） |

**关键依赖链**:
```
proposal-dedup-reviewer1-fix（修复中）
  ↓ (完成后)
D-002 dedup 生产验证
  ↓ (验证通过)
P2-1 JSON Schema 验证（来自另一份提案）
```

---

## 十、下一步建议

- [ ] **PM**: 为 D-002 细化验收标准（特别是 Chinese bigram 人工标注样本标准）
- [ ] **Architect**: 审查 D-003 ErrorType 枚举定义和 hook API 设计
- [ ] **Test**: 为 D-002 bigram 验证准备人工标注工具
- [ ] **Dev**: D-001 和 D-002 可并行启动，D-003 等 review 后再执行
