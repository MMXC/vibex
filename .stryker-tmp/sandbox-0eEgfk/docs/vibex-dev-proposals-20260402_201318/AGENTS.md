# AGENTS.md: VibeX Dev 提案 Sprint 路线图

**项目**: vibex-dev-proposals-20260402_201318
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### Sprint 0: E1 + E2
- ✅ TS 错误修复后 npm run build 退出码 0
- ✅ 删除 selectionCheckbox，保留 1 个 inline checkbox
- ✅ confirmFlowNode 级联 steps

### Sprint 1: E3 canvasStore 拆分
- ✅ contextStore < 200 行
- ✅ canvasStore re-export 向后兼容
- ✅ 每个 Phase 后运行回归测试

### Sprint 2: E4 + E5 + E7
- ✅ Migration confirmed → status: 'confirmed'
- ✅ parseComponentResponse 防御性解析
- ❌ 禁止直接写入 raw API 响应

### Sprint 3: E6 E2E
- ✅ Playwright journey 测试通过
- ✅ E2E 覆盖率 > 60%

---

## Reviewer 约束

### Sprint 0
- [ ] npm run build 无 TS 错误
- [ ] BoundedContextTree 1 个 checkbox
- [ ] FlowCard 级联确认

### Sprint 1
- [ ] contextStore < 200 行
- [ ] 所有测试通过

### Sprint 2
- [ ] Migration 测试通过
- [ ] ZodError = 0

### Sprint 3
- [ ] 3 个 E2E journey 通过
- ❌ 任何 Sprint 失败 → 驳回

---

## Tester 约束

| Sprint | 关键测试 |
|--------|---------|
| Sprint 0 | TS 编译 + checkbox toggle + 级联确认 |
| Sprint 1 | canvasStore 拆分回归 |
| Sprint 2 | Migration + ZodError + test time < 60s |
| Sprint 3 | E2E journey × 3 |
