# Knowledge Base — 索引

> 知识库目录，包含问题模式、分析模板和决策记录。

---

## 📁 patterns/ — 问题模式

| 文件 | 描述 |
|------|------|
| `test-isolation.md` | 测试隔离失效：全局状态污染、Mock 未清理、Timer 泄漏 |
| `async-state-race.md` | 异步状态竞态：组件卸载后更新、useEffect 依赖错误 |
| `api-version-drift.md` | API 版本漂移：前后端契约不同步、数据结构变更 |
| `config-drift.md` | 配置漂移：环境变量不一致、Jest 配置分裂 |

**模式匹配**: 当发现新 bug 时，参照 patterns/ 中的模式进行根因归类。

---

## 📁 templates/ — 分析模板

| 文件 | 描述 |
|------|------|
| `problem-analysis.md` | 问题分析：结构化 bug 分析，包含复现步骤、根因、修复方案 |
| `competitive-analysis.md` | 竞品分析：评估外部工具引入的可行性 |
| `solution-evaluation.md` | 方案评估：多方案对比矩阵与决策建议 |

**使用指南**: 
- 新 bug → `templates/problem-analysis.md`
- 引入工具 → `templates/competitive-analysis.md`
- 技术选型 → `templates/solution-evaluation.md`

---

## 📁 problems/ — 问题记录

> 存放已分析的具体问题（`prob-YYYYMMDD-NNN.md`）

当前无记录。

---

## 📁 evaluations/ — 竞品评估

> 存放竞品分析结果（`tool-name-YYYYMMDD.md`）

当前无记录。

---

## 📁 decisions/ — 决策记录

> 存放技术决策（`YYYYMMDD-solution-name.md`）

当前无记录。

---

## 维护规则

1. **Patterns**: 发现新 bug 时，若无匹配模式，创建新 pattern
2. **Templates**: 模板更新需 review
3. **索引**: 每次添加文件后更新 `_index.md`
4. **命名**: 
   - Pattern: `kebab-case.md`
   - Template: `kebab-case.md`
   - Problem: `prob-YYYYMMDD-NNN.md`
   - Evaluation: `tool-name-YYYYMMDD.md`
   - Decision: `YYYYMMDD-description.md`
