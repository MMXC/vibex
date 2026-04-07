# Epic 1 Spec: 强制测试同步机制（DoD 约束）

**文件版本**: v1.0  
**日期**: 2026-04-02  
**Epic**: 测试流程改进 / Epic 1  
**负责人**: dev + tester

---

## 1. 功能规格

### S1.1 更新 AGENTS.md — 测试准备为 DoD 必选项

**输入**: 当前 AGENTS.md 文件  
**处理**:
1. 读取 AGENTS.md
2. 找到"Definition of Done"章节（或创建）
3. 在 DoD 列表中添加：`测试文件必须同步更新：每条 Epic 完成时，`__tests__/` 下的测试文件必须与实现代码同步更新，`npx jest <file> --no-coverage` 必须通过`
4. 提交 PR

**输出**: AGENTS.md PR 已创建并合入

**验收测试**:
```bash
# 验证 AGENTS.md 包含 DoD 测试要求
grep -A5 "Definition of Done" /root/.openclaw/vibex/AGENTS.md
# 期望: 包含"测试文件必须同步更新"
```

---

### S1.2 tester review 前快速验证

**输入**: tester 收到的新 Epic 任务  
**处理**:
1. tester 收到任务通知后，先执行 `npx jest <file> --no-coverage`
2. 如有失败，直接在 Slack 标注驳回原因（测试文件未更新），不进行完整测试流程
3. 如通过，进行完整测试

**输出**: 快速验证 SOP 文档（在 tester 的 AGENTS.md 章节中）

**验收测试**:
```bash
# 模拟 canvas-checkbox-style-unify E1 场景
npx jest canvas-checkbox-style --no-coverage
# 期望: 所有测试通过（dev 已同步更新测试文件）
```

---

## 2. 验收标准清单

| ID | 标准 | 验证方式 |
|----|-----|---------|
| E1 | AGENTS.md DoD 章节包含测试准备要求 | `grep "测试文件" AGENTS.md` 有输出 |
| E2 | 新 Epic 测试文件与实现文件同时提交 | git log 检查 |
| E3 | tester 快速验证 SOP 文档存在 | 文件存在检查 |
