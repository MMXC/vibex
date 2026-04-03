# uuid 依赖缺失分析

## 问题
```
./src/lib/guest/session.ts:6:30
Type error: Cannot find module 'uuid' or its corresponding type declarations.
```

## 根因
`src/lib/guest/session.ts` 引入了 `uuid` 模块，但 `package.json` 中未声明该依赖。

## 解决方案
安装 `uuid` 和 `@types/uuid` 依赖：
```bash
npm install uuid @types/uuid
```

## 验收标准
- [ ] npm install 成功
- [ ] 构建通过 (`npm run build`)
- [ ] 测试通过 (`npm test`)
