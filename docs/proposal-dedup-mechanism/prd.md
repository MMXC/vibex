# PRD: proposal-dedup-mechanism

**项目**: proposal-dedup-mechanism  
**PM**: pm agent  
**创建时间**: 2026-03-23  
**目标**: 建立提案重复检测机制，在 analyst 阶段自动比对现有项目，避免重复任务创建

---

## 1. 业务背景

当前提案系统存在重复创建问题：
- 项目目标重复（如 `vibex-homepage-final-review` vs `homepage-redesign`）
- 分析阶段重复（如 `reviewer-epic2-fix` vs `reviewer-epic2-proposalcollection-fix`）
- 产出物路径不一致

**影响**：浪费 analyst 资源、阻塞协调决策、项目状态不一致。

---

## 2. 推荐技术方案

**方案 A：关键词 + 规则匹配**（选定）

| 维度 | 评估 |
|------|------|
| 实现复杂度 | 低（仅 Python 标准库） |
| 开发周期 | < 1 天 |
| 可解释性 | 高 |
| 扩展性 | 可逐步升级至 TF-IDF 或 Embedding |

**阈值策略**：

| 相似度 | 动作 |
|--------|------|
| >0.7 | 🚨 阻止创建，提示检查现有项目 |
| 0.4-0.7 | ⚠️ 警告，建议确认 |
| <0.4 | ✅ 放行 |

---

## 3. 功能点

### F1: 关键词提取

| 字段 | 内容 |
|------|------|
| 功能ID | F1.1 |
| 功能点 | 关键词提取 |
| 描述 | 从项目名和目标文本中提取关键词集合，移除停用词和短词 |
| 验收标准 | `expect(extract_keywords("建立提案重复检测机制")).toEqual({"提案", "重复", "检测", "机制"})` |
| 页面集成 | ❌ |

### F2: 相似度计算

| 字段 | 内容 |
|------|------|
| 功能ID | F2.1 |
| 功能点 | 关键词重叠度相似度计算 |
| 描述 | 基于两个项目的关键词集合，计算 Jaccard 相似度（交集/并集） |
| 验收标准 | `expect(similarity_score(proj_a, proj_b)).toBeGreaterThan(0.5)` 当目标高度相似时 |
| 页面集成 | ❌ |

### F3: 重复检测 API

| 字段 | 内容 |
|------|------|
| 功能ID | F3.1 |
| 功能点 | 重复项目检测 |
| 描述 | 给定新项目名+目标，从所有现有项目中找出相似项目，返回相似度列表 |
| 验收标准 | `expect(detect_duplicates({"name": "test", "goal": "修复Bug"}).__len__()).toBeDefined()` |
| 页面集成 | ❌ |

### F4: 告警与放行机制

| 字段 | 内容 |
|------|------|
| 功能ID | F4.1 |
| 功能点 | 阈值触发告警/放行 |
| 描述 | 根据相似度阈值返回对应动作：block / warn / pass |
| 验收标准 | `expect(alert_level(0.8)).toBe("block"); expect(alert_level(0.5)).toBe("warn"); expect(alert_level(0.2)).toBe("pass")` |
| 页面集成 | ❌ |

### F5: 集成到 task_manager.py

| 字段 | 内容 |
|------|------|
| 功能ID | F5.1 |
| 功能点 | task_manager.py 集成 |
| 描述 | 在 coord 创建新项目前调用重复检测，阻止或警告重复提案 |
| 验收标准 | `expect(check_duplicate_projects("new-test", "修复某Bug")).toBeDefined()` 调用成功 |
| 页面集成 | ❌ |

### F6: 规则过滤器

| 字段 | 内容 |
|------|------|
| 功能ID | F6.1 |
| 功能点 | 规则过滤增强 |
| 描述 | 增强检测：完全相同项目名直接报警；相同前缀+日期相近标记重复嫌疑 |
| 验收标准 | `expect(rule_filter({"name": "same-name"}, existing)).toContain("duplicate-name")` |
| 页面集成 | ❌ |

---

## 4. Epic 拆分

### Epic 1: 核心算法（关键词+相似度）

- F1.1 关键词提取
- F2.1 相似度计算
- F3.1 重复检测 API
- F4.1 告警机制

**DoD**: 所有单元测试通过，覆盖率 ≥ 80%

### Epic 2: 集成与增强

- F5.1 task_manager.py 集成
- F6.1 规则过滤器增强
- 端到端集成测试

**DoD**: `task_manager.py check-dup` 命令正常工作，benchmark < 100ms

---

## 5. 优先级矩阵（MoSCoW）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| F1.1 关键词提取 | Must | 基础能力 |
| F2.1 相似度计算 | Must | 核心逻辑 |
| F3.1 重复检测 | Must | 核心逻辑 |
| F4.1 告警机制 | Must | 核心逻辑 |
| F5.1 task_manager 集成 | Must | 落地关键 |
| F6.1 规则过滤器 | Should | 增强能力 |

---

## 6. 非功能需求

| 维度 | 要求 |
|------|------|
| 性能 | 重复检测 < 100ms（50个现有项目） |
| 可用性 | 提供 `--force` override 选项避免误报阻塞 |
| 可配置 | 阈值通过环境变量或配置文件调节 |
| 测试覆盖 | ≥ 80% 行覆盖率 |

---

## 7. 验收标准汇总

| # | 标准 | 测试方法 |
|---|------|---------|
| V1 | 相同项目名检测准确率 100% | `expect(detect_duplicates(name, goal)).toContain(high_similarity)` |
| V2 | 相似目标（>0.5）检测率 ≥ 80% | 人工标注数据集测试 |
| V3 | 误报率（不相似被标记）< 10% | 人工标注数据集测试 |
| V4 | 集成后性能 < 100ms | benchmark 测试 |
| V5 | 单元测试覆盖率 ≥ 80% | coverage report |

---

## 8. 工作量估算

| Epic | 估算 |
|------|------|
| Epic 1: 核心算法 | 2h |
| Epic 2: 集成与增强 | 1h |
| 测试与验证 | 1h |
| **总计** | **4h** |

---

## 9. 依赖

- Python 3 标准库（`re`, `json`, `pathlib`）
- 无需新增 pip 依赖

---

## 10. 驳回条件

- 核心算法无法达到 V2/V3 验收标准
- 集成后性能超过 100ms 且无法优化
- 无法提供 override 机制导致误报阻塞正常提案
