# Spec: E4 - console.log 清除 + Pre-commit Hook 规格

## E4.1 Husky Pre-commit Hook

```bash
# 安装 husky（如果尚未安装）
npm install -D husky
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

## E4.2 lint-staged 配置

```json
// package.json 或 lint-staged.config.js
{
  "lint-staged": {
    "*.ts": [
      "eslint --cache --max-warnings=0",
      "node scripts/check-no-console.js"
    ],
    "*.tsx": [
      "eslint --cache --max-warnings=0"
    ]
  }
}
```

## E4.3 console.log 检测脚本

```javascript
// scripts/check-no-console.js
const { execSync } = require('child_process');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

try {
  const result = execSync(
    `grep -rn "console\\.\\(log\\|debug\\|error\\)" ${srcDir} --include="*.ts" --include="*.tsx" --exclude-dir=__tests__ --exclude-dir=node_modules`,
    { encoding: 'utf8' }
  );
  
  if (result.trim()) {
    console.error('❌ 发现 console.log，提交被阻断:');
    console.error(result);
    process.exit(1);
  }
  
  console.log('✅ 无 console.log');
  process.exit(0);
} catch (e) {
  // grep 没找到 = 好
  if (e.status === 1) {
    console.log('✅ 无 console.log');
    process.exit(0);
  }
  console.error('检测脚本执行失败:', e.message);
  process.exit(1);
}
```

## E4.4 替换方案

```typescript
// ✅ 正确: 使用项目日志模块
import { logger } from '@/lib/logger';
logger.info('User logged in', { userId });

// ✅ 正确: __tests__ 目录允许
test('example', () => {
  console.log('Debug in test'); // ✅ 允许
});

// ❌ 错误
console.log('Debug output');
console.debug('Debug');
console.error('Error');
```
