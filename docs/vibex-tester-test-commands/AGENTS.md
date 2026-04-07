# AGENTS.md — Test Commands Unification

## 开发约束

### Makefile 规范
```makefile
# 每个 target 必须有注释
test: ## 运行单元测试
	pnpm test
```

### 命令命名规范
```bash
# ✅ 正确：test:* 格式
make test
make test:e2e
make test:flaky

# ❌ 错误：混合命名
make run-tests
make e2e-test
```

### 禁止事项
- ❌ Makefile 中硬编码路径
- ❌ 缺少 `.PHONY` 声明
- ❌ 新增 npm scripts 不通过 Makefile

*Architect Agent | 2026-04-07*
