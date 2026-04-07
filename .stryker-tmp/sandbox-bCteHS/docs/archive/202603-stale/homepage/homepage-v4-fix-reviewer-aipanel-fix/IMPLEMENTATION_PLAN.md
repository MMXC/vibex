# 实施计划: homepage-v4-fix-reviewer-aipanel-fix

> **项目**: homepage-v4-fix-reviewer-aipanel-fix  
> **版本**: v1.0  
> **日期**: 2026-03-22  
> **总工时**: ~1h

---

## 实施阶段

### Phase 1: Jest 配置修复（1h）

| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 1.1 | 创建 `jest.config.js`（从 package.json 提取） | 独立配置文件 | `test -f jest.config.js` |
| 1.2 | 添加精确 e2e/spec 排除正则 | testPathIgnorePatterns | 无 e2e/spec 文件被运行 |
| 1.3 | 运行 `pnpm test` 验证 | 退出码 0 | 241 套件通过 |
| 1.4 | 运行 `pnpm test:e2e` 验证 | Playwright 正常 | e2e 测试独立运行 |
| 1.5 | 删除 package.json 中的 jest 配置 | 配置统一 | package.json 中 jest 为 null |

---

## 验收命令

```bash
pnpm test                        # 退出码 0，无 ESM 错误
pnpm test:e2e                  # Playwright 正常运行
pnpm test 2>&1 | grep "\.spec\."  # 应为空
```
