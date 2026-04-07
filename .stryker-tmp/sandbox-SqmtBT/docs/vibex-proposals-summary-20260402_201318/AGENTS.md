# AGENTS.md: VibeX 提案汇总

**项目**: vibex-proposals-summary-20260402_201318
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### Sprint 0
- ✅ npm run build 退出码 0
- ✅ DOMPurify overrides 生效

### Sprint 1
- ✅ BoundedContextTree 1 个 checkbox
- ✅ confirmFlowNode 级联 steps
- ✅ 未确认=黄色边框 / 已确认=绿色边框
- ✅ Migration confirmed → status: 'confirmed'
- ✅ localStorage 面板状态

### Sprint 2
- ✅ contextStore < 200 行
- ✅ canvasStore 向后兼容 re-export
- ✅ 每 Phase 回归测试

### Sprint 3
- ✅ E2E 3 核心旅程通过
- ✅ Markdown 导出格式

### Sprint 4
- ✅ 移动端友好提示

---

## Reviewer 约束

- [ ] 每个 Sprint 完成后回归测试
- [ ] E3 canvasStore 拆分是关键路径
- ❌ 任何 Sprint 失败 → 驳回

---

## Tester 约束

| Sprint | 关键测试 |
|--------|---------|
| Sprint 0 | TS 编译 + DOMPurify |
| Sprint 1 | checkbox toggle + 级联 + 边框颜色 + Migration |
| Sprint 2 | store 拆分回归 + 导出向导 + ZodError |
| Sprint 3 | E2E journey × 3 + Markdown |
| Sprint 4 | 移动端检测 |
