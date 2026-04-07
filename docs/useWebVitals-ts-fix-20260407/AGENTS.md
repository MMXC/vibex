# AGENTS.md: useWebVitals TypeScript Fix

**项目**: useWebVitals-ts-fix-20260407
**日期**: 2026-04-07

---

## 开发约束

### 约束 1: 仅修类型断言，禁止改逻辑
- **允许**: 添加 `as [string, WebVitalsMetric]` 类型断言
- **禁止**: 修改 if block 内的任何逻辑
- **理由**: 运行时逻辑正确，仅类型标注错误

### 约束 2: 保持 import 依赖
- `WebVitalsMetric` 类型从 `@/lib/web-vitals` 导入（已存在）
- 无需新增任何 import

---

## Dev 实施指南

### 1. 确认文件
```bash
cd vibex-fronted
ls src/hooks/useWebVitals.ts
```

### 2. 查看问题行
```bash
sed -n '55,57p' src/hooks/useWebVitals.ts
```

### 3. 应用修复
```bash
sed -i 's/const \[, data\] = args;/const [, data] = args as [string, WebVitalsMetric];/' src/hooks/useWebVitals.ts
```

### 4. 验证
```bash
npx tsc --noEmit
# 期望: 无 useWebVitals.ts 错误

npm run build
# 期望: 退出码 0
```

### 5. 提交
```bash
git add src/hooks/useWebVitals.ts
git commit -m "fix(useWebVitals): add type assertion to resolve TS error on data.name"
```

---

## 验收检查清单

- [ ] `const [, data] = args as [string, WebVitalsMetric];` 存在于文件中
- [ ] `npx tsc --noEmit` 无 useWebVitals.ts 相关错误
- [ ] `npm run build` 成功，退出码 0
- [ ] git diff 仅显示 1 行变化
- [ ] Commit message 包含 `fix(useWebVitals):`
