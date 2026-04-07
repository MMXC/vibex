# IMPLEMENTATION_PLAN: fix-panel-background

## Sprint 0（4h）

### Epic 1: design-tokens.css（1h）
1. 读取 `design-tokens.css`
2. 修改 `--color-bg-primary`: `#0a0a0f` → `#0d0d16`
3. 修改 `--color-bg-secondary`: `#12121a` → `#17172a`
4. 修改 `--color-bg-glass`: `0.7` → `0.88`
5. 同步更新 `--gradient-bg` 依赖值

### Epic 2: auth 页面（1h）
1. 查找 auth 页面中 `rgba(255,255,255,0.03)` 的内联样式
2. 修改为 `rgba(255,255,255,0.08)`
3. gstack screenshot 对比

### Epic 3: landing 页面（0.75h）
1. gstack screenshot 验证 Hero 玻璃卡片可见
2. 验证 Feature Card 与 body 背景可区分
3. 验证 Code Preview textarea 可读

### Epic 4: canvas 回归（0.5h）
1. gstack screenshot 验证 TreePanel 背景可见
2. 验证 dashboard 无回归

### Epic 5: 截图验证（0.75h）
1. 保存修复前后截图对比
2. 对比度计算脚本验证 ≥ 2:1

## 验收
- npm run build 通过
- gstack screenshot 验证三页面板可见
- dashboard 无回归
