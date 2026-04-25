# E4: PM 质量门禁

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | Coord 评审检查点更新 | ✅ | — | 评审清单包含四态表/Design Token/情绪地图检查点 |
| E4-U2 | PRD 模板更新 | ✅ | E4-U1 | PRD 模板包含"本期不做"+神技指引 |
| E4-U3 | SPEC 模板更新 | ✅ | E4-U2 | SPEC 模板包含四态表/Design Token/情绪地图引用 |

### E4-U1 详细说明

**文件变更**：`docs/coord-review-process.md`（新建）

**实现步骤**：
1. 新增检查点：
   - [x] 四态表：是否定义了四态（默认/加载中/有数据/空状态/错误）
   - [x] Design Token：是否定义了 CSS 变量体系，无硬编码颜色
   - [x] 情绪地图：是否描述了用户情绪路径和兜底机制
2. 定义 TypeScript 类型检查标准（CI/CD 强制门禁）

**Status**：✅ 完成于 commit 061f78170

---

### E4-U2 详细说明

**文件变更**：`docs/prd-template.md`（修改）

**实现步骤**：
1. 新增章节：`## 本期不做（Out of Scope）`，包含功能/原因/优先级排序列表
2. 更新版本号至 v2.0
3. 更新日期至 2026-04-25

**Status**：✅ 完成于 commit 061f78170

---

### E4-U3 详细说明

**文件变更**：`docs/spec-template.md`（修改）

**实现步骤**：
1. 新增四态表/State Machine 章节（强制要求 Mermaid stateDiagram-v2）
2. 新增 Design Token 规范引用（CSS 变量要求）
3. 新增情绪地图/Journey Diagram 章节（强制要求 Mermaid journey）

**Status**：✅ 完成于 commit 061f78170

---

## 依赖关系总图

```
E4-U1 → E4-U2 → E4-U3
```
