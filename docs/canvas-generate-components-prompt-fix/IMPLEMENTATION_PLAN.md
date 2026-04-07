# 实施计划: Canvas Generate Components Prompt Fix

> **项目**: canvas-generate-components-prompt-fix  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 详细步骤

### Phase 1: E1 flowId 修复 (0.3h)

**目标文件**: `vibex-backend/src/routes/v1/canvas/index.ts`

**步骤 1.1** — 修改 prompt (10min)
```
1. 找到第 272-284 行 componentPrompt 字符串
2. 在每个组件要求中添加:
   - flowId: 所属流程ID（从上述流程中选择，如 ${flows.map(f => f.id).join('|')})
3. 在 prompt 末尾添加:
   重要：每个组件必须标注正确的 flowId，不能留空或使用 unknown。
```

**步骤 1.2** — 修改 AI schema (5min)
```
1. 找到第 291 行 generateJSON<> 类型参数
2. 在 name, type 后添加: flowId: string
```

**步骤 1.3** — 验证 (8min)
```
1. 运行 vitest generate-components.test.ts
2. Playwright 端到端测试: 生成组件 → 检查 flowId 不是 unknown
```

---

## 2. 回滚方案

| 场景 | 回滚操作 |
|------|---------|
| AI 输出异常 | 删除 prompt 中的 flowId 要求，恢复原 schema |

---

## 3. 成功标准

- [ ] vitest generate-components.test.ts 全部通过
- [ ] mock AI 返回的 flowId 被正确读取
- [ ] 组件 flowId 不再是 'unknown'

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
