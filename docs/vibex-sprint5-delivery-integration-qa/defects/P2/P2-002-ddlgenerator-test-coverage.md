# P2-002: DDLGenerator 测试覆盖率不足

**严重性**: P2（体验/建议）
**Epic**: E3
**Spec 引用**: specs/E3-exporters.md

## 问题描述
- **Spec E3**: DDLGenerator 应有 16 tests
- **实际**: `DDLGenerator.test.ts` 仅 10 tests
- **formatDDL 测试**: 83 行测试文件，需确认测试数量

## 代码证据

```bash
$ grep -c "it(" /root/.openclaw/vibex/vibex-fronted/src/lib/delivery/__tests__/DDLGenerator.test.ts
10
```

## 修复建议

补充 6 个测试用例：
```typescript
// DDLGenerator.test.ts 补充
it('E3-U7: 带 prefix 选项的表名生成', () => { ... });
it('E3-U8: PostgreSQL 方言类型映射', () => { ... });
it('E3-U9: 空参数列表生成简化列', () => { ... });
it('E3-U10: 主键推断 (_id 后缀)', () => { ... });

// formatDDL.test.ts 补充
it('E3-U11: formatDDL 缩进正确', () => { ... });
it('E3-U12: formatDDL 处理空输入', () => { ... });
```

## 影响范围
- `src/lib/delivery/__tests__/DDLGenerator.test.ts`
- `src/lib/delivery/__tests__/formatDDL.test.ts`
- 测试覆盖率（低优先级）
