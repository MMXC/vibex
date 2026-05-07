# IMPLEMENTATION_PLAN — Sprint 25 E5 RBAC 安全漏洞修复

## Unit Index

| Unit | 描述 | 状态 | 变更文件 |
|------|------|------|---------|
| U1 | RBAC Hook 修复 | ✅ 需实施 | `useCanvasRBAC.ts` |
| U2 | DDSToolbar TS 验证 | ✅ 需验证 | `DDSToolbar.tsx` |
| U3 | 单元测试覆盖 | ✅ 需验证 | RBAC 测试文件 |

## U1: RBAC Hook 修复

### 当前代码
```typescript
canShare: data.role === 'owner' || data.role === 'member',
canEdit: data.role === 'owner' || data.role === 'member',
```

### 修复后代码
```typescript
canShare: data.role === 'owner',
canEdit: data.role === 'owner',
```

### 验证命令
```bash
cd /root/.openclaw/vibex/vibex-fronted && pnpm exec tsc --noEmit
```

## U2: DDSToolbar 验证

验证 TS 编译通过（DDSToolbar 读取 rbac 值，不改逻辑）：
```bash
cd /root/.openclaw/vibex/vibex-fronted && pnpm exec tsc --noEmit src/components/dds/toolbar/DDSToolbar.tsx
```

## U3: 单元测试验证

```bash
cd /root/.openclaw/vibex/vibex-fronted && pnpm test -- --run
```

预期：RBAC 相关测试应覆盖 owner/member 角色差异。
