# E1 Spec: 修复 CSS 孤立属性行

## 修复内容

**文件**: `vibex-fronted/src/app/dashboard/dashboard.module.css`

**第 808 行（修复前）**:
```css
    flex-direction: column;
```

**修复后**: 删除该行即可。

## 修复验证命令

```bash
# 1. 确认孤立属性存在
rg -n '^\s{2,}[a-z-]+\s*:' src/app/dashboard/dashboard.module.css
# 预期：第 808 行

# 2. 执行修复
sed -i '808d' src/app/dashboard/dashboard.module.css

# 3. 验证构建
cd vibex-fronted && npm run build
# 预期：exit code = 0

# 4. 验证无其他孤立属性
rg -n '^\s{2,}[a-z-]+\s*:' src/app/dashboard/dashboard.module.css
# 预期：无输出
```

## 回归测试

```bash
# 开发模式验证
npm run dev &
# 访问 http://localhost:3000/dashboard
# 使用 DevTools 模拟 375px 宽度，检查布局是否正常
```
