# AGENTS.md: canvasLogger Import Fix

**项目**: vibex-canvaslogger-fix-20260407
**日期**: 2026-04-07

---

## 开发约束

### 约束 1: 仅添加 import，禁止修改逻辑
- **允许**: 在文件顶部添加 1 行 import
- **禁止**: 修改 catch block 逻辑、alert 内容、canvasLogger 调用方式
- **理由**: b85f3ac7 已建立标准模式，保持一致即可

### 约束 2: 保持 canvasLogger.default 模式
- **要求**: 使用 `canvasLogger.default.error()` 而非 `canvasLogger.error()`
- **理由**: b85f3ac7 引入的模式，102 个文件统一使用 `.default`

### 约束 3: import 路径必须使用 @ 别名
- **正确**: `import { canvasLogger } from '@/lib/canvas/canvasLogger';`
- **禁止**: `import { canvasLogger } from '../../lib/canvas/canvasLogger';`
- **理由**: 项目统一使用 `@` 路径别名

### 约束 4: import 位置
- **位置**: `useState` import 之后，`FrameworkSelector` import 之前
- **理由**: 按字母顺序插入，保持 import 区块整洁

---

## Dev 实施指南

### 1. 确认文件位置
```bash
cd vibex-fronted
ls -la src/app/export/page.tsx
```

### 2. 查看当前 import 区块（前 10 行）
```bash
head -10 src/app/export/page.tsx
```

### 3. 插入 import
在第 3 行后插入：
```tsx
import { canvasLogger } from '@/lib/canvas/canvasLogger';
```

### 4. 验证
```bash
npm run build 2>&1 | grep -i "canvasLogger"
# 期望: 无错误输出

npx tsc --noEmit
# 期望: 退出码 0
```

### 5. 提交
```bash
git add src/app/export/page.tsx
git commit -m "fix(canvasLogger): add missing import in export/page.tsx
\
- Fix ReferenceError: canvasLogger is not defined
- Follow b85f3ac7 canvasLogger migration pattern
- Fixes build failure"
```

---

## 验收检查清单

- [ ] `import { canvasLogger }` 存在于文件顶部（前 10 行）
- [ ] `npm run build` 通过，无 canvasLogger 错误
- [ ] `npx tsc --noEmit` 通过
- [ ] 导出异常路径测试：catch block 触发时 alert 正常
- [ ] Commit message 包含 `fix(canvasLogger):`
