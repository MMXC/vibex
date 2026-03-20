# AGENTS.md - uuid 依赖修复

## 开发约束
- 执行 `npm install uuid @types/uuid`
- 不得修改其他文件
- 确保 package.json 更新

## 测试指令

### 确定测试范围
根据上游产物 `impl-uuid-dependency-fix` 的路径判断测试范围：

| 产物路径 | 测试目录 |
|---------|---------|
| `vibex-fronted/...` | `vibex-fronted/` |
| `vibex-backend/...` | `vibex-backend/` |
| 两者都有 | 分别测试对应目录 |

> ⚠️ 禁止从项目根目录 `/root/.openclaw/vibex` 运行测试，否则会包含 monorepo 其他子包的测试（如 backend 的 Next.js API route ESM 模块），导致测试失败。

### 测试执行
```bash
# 示例（根据实际产物选择）
cd <测试目录> && npx jest --coverage=false --testTimeout=30000
```

### 验收标准
- 测试 100% 通过
- 测试覆盖产物对应的所有功能点
