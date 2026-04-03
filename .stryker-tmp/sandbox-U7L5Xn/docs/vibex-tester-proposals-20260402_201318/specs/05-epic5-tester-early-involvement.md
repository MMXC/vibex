# Epic 5 Spec: tester 早期介入机制

**文件版本**: v1.0  
**日期**: 2026-04-02  
**Epic**: 测试流程改进 / Epic 5  
**负责人**: tester + analyst + pm

---

## 1. 功能规格

### S5.1 P2+ 功能 tester 早期介入

**输入**: P2 及以上功能的设计文档（plan-eng-review 阶段）  
**处理**:
1. analyst 在完成 `analyze-requirements` 后，将分析文档同步发给 tester
2. tester 阅读分析文档后，在 design review 阶段提出测试用例设计建议
3. tester 提供初步测试用例列表（哪些场景需要覆盖、哪些是边界条件）
4. dev 实现前参考 tester 的测试建议

**输出**: tester 参与记录（Slack thread 或 doc 批注）

---

### S5.2 tester 介入触发机制

**输入**: coord 派发 P2+ 功能任务  
**处理**:
1. coord 识别任务优先级为 P2+
2. coord 在派发消息中 CC tester agent
3. tester 被唤醒后，先参与 design review，再参与 implementation review
4. tester 在 `create-test-plan` 阶段输出测试用例设计文档

**输出**: tester 介入的标准流程文档（AGENTS.md 更新）

---

## 2. 验收标准清单

| ID | 标准 | 验证方式 |
|----|-----|---------|
| E1 | P2+ 功能的 design review 有 tester 参与记录 | Slack thread 有 tester 消息 |
| E2 | tester 介入流程文档化 | AGENTS.md 包含 tester 介入 SOP |
| E3 | tester 早期介入已执行 ≥1 次 | 有 P2+ 项目完成记录 |
