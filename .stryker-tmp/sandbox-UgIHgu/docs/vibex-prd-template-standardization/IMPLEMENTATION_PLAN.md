# IMPLEMENTATION_PLAN: vibex-prd-template-standardization

## 实施步骤

### Epic 1: PRD 模板标准化
1. 在 `task_manager.py` phase1 模板中嵌入 PRD 格式检查
2. 不符合模板则提示补全后再推进
3. 验证：新建提案使用模板

## 验收
所有新建提案使用统一 PRD 模板

## 实现记录

### Epic 1: PRD 模板标准化 ✅
- [x] task_manager.py phase1 create-prd 模板：增加 PRD 格式规范章节
- [x] task_manager.py phase2 pm-review 模板：增加 PRD 格式校验清单
- [x] 格式规范要求：执行摘要 + Epic拆分 + 验收标准 + DoD
- [x] 自检清单：4项格式检查，缺少任一章节驳回
- 验收：所有新建提案使用统一 PRD 模板
