# P2-001: E1 测试数量数据错误

**严重性**: P2（数据准确性）
**Epic**: E1
**Spec 引用**: analyst-qa-report.md

## 问题描述
- **analyst-qa-report.md**: 声称 `image-ai-import.test.ts` 有 10 tests
- **实际**: `image-ai-import.test.ts` 仅 **6** tests

## 代码证据

```bash
$ grep -c "it(" /root/.openclaw/vibex/vibex-fronted/src/lib/figma/image-ai-import.test.ts
6
```

## 修复建议

修正 analyst-qa-report.md 中的测试数量数据：10 → 6。

## 影响范围
- 数据一致性（不影响功能）
