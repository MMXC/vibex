# Implementation Plan: canvasLogger Import Fix

**项目**: vibex-canvaslogger-fix-20260407
**日期**: 2026-04-07

---

## 阶段一：修复实施

### Step 1: 添加 import 语句

**文件**: `vibex-fronted/src/app/export/page.tsx`

在第 3 行 `import Link from 'next/link';` 之后添加：

```tsx
import { canvasLogger } from '@/lib/canvas/canvasLogger';
```

**操作**: 
```bash
cd vibex-fronted
sed -i "3a import { canvasLogger } from '@/lib/canvas/canvasLogger';" src/app/export/page.tsx
```

### Step 2: 验证修复

```bash
# 1. 确认 import 存在
head -10 src/app/export/page.tsx | grep canvasLogger

# 2. 运行构建
npm run build

# 3. TypeScript 检查
npx tsc --noEmit
```

---

## 阶段二：验收测试

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | `grep "import.*canvasLogger" src/app/export/page.tsx` 在前 10 行 | 输出包含 import 语句 |
| 2 | `npm run build` | 构建成功，无 canvasLogger 错误 |
| 3 | `npx tsc --noEmit` | 退出码 0 |
| 4 | 手动触发导出异常 | alert 正常弹出 + 日志输出 |

---

## 阶段三：提交

```bash
git add src/app/export/page.tsx
git commit -m "fix(canvasLogger): add missing import in export/page.tsx"
```

---

## 工时估算

| 任务 | 工时 |
|------|------|
| 添加 import | 0.01h |
| 构建验证 | 0.02h |
| 手动测试 | 0.02h |
| **总计** | **0.05h** |
