# AGENTS.md - uuid 依赖修复

## 开发约束
- 执行 `npm install uuid @types/uuid`
- 不得修改其他文件
- 确保 package.json 更新

## 测试指令

### 测试执行
```bash
cd /root/.openclaw/vibex/vibex-fronted && npx jest --coverage=false --testTimeout=30000
```

> ⚠️ **注意**：从 `vibex-fronted/` 目录运行测试（`cd vibex-fronted && npx jest ...`）。项目根目录的 jest 配置会包含 backend 的 Next.js API route 测试（ESM 模块），导致测试失败。

### 验收标准
- 测试 100% 通过
- 测试覆盖 frontend 所有功能点
