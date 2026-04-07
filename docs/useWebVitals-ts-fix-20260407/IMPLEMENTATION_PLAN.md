# Implementation Plan: useWebVitals TypeScript Fix

**项目**: useWebVitals-ts-fix-20260407
**日期**: 2026-04-07

---

## Step 1: 应用修复

**文件**: `vibex-fronted/src/hooks/useWebVitals.ts`

**操作**: 将第 56 行修改为：

```tsx
const [, data] = args as [string, WebVitalsMetric];
```

**命令**:
```bash
cd vibex-fronted
sed -i 's/const \[, data\] = args;/const [, data] = args as [string, WebVitalsMetric];/' src/hooks/useWebVitals.ts
```

---

## Step 2: 验证修复

```bash
# 1. TypeScript 检查（无 useWebVitals 相关错误）
npx tsc --noEmit 2>&1 | grep -v useWebVitals
# 期望: 无 useWebVitals.ts 错误

# 2. 构建验证
npm run build
# 期望: 退出码 0

# 3. 确认只有 1 处修改
git diff src/hooks/useWebVitals.ts
```

---

## Step 3: 提交

```bash
git add src/hooks/useWebVitals.ts
git commit -m "fix(useWebVitals): add type assertion to resolve TS error on data.name"
```

---

## 工时估算

| 任务 | 工时 |
|------|------|
| 类型断言修复 | 0.01h |
| 验证构建 | 0.02h |
| 手动测试 | 0.02h |
| **总计** | **0.05h** |
