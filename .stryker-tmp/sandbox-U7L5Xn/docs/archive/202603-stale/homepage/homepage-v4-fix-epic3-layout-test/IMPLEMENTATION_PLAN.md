# 实施计划: homepage-v4-fix-epic3-layout-test

> **项目**: homepage-v4-fix-epic3-layout-test  
> **版本**: v1.0  
> **日期**: 2026-03-22  
> **总工时**: ~1h

---

## 实施阶段

### Phase 1: Babel/Jest 配置修复（1h）

| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 1.1 | 提取 jest.config.js | 独立配置文件 | `test -f jest.config.js` |
| 1.2 | 添加 `.spec.ts` 排除正则 | testPathIgnorePatterns | 无 spec 文件被运行 |
| 1.3 | 运行 `pnpm test` 验证 | 退出码 0 | 257 套件通过 |
| 1.4 | 验证 Epic3 布局测试 | 测试结果 | GridContainer, StepNavigator 通过 |
| 1.5 | 删除 package.json jest 配置 | 配置统一 | package.json 中无 jest 键 |

---

## 验收命令

```bash
pnpm test                              # 退出码 0，无 Babel 错误
pnpm test -- --testPathPattern=Epic3   # 布局组件测试通过
grep -c "\.spec\." <(pnpm test 2>&1) # 输出应为 0
```
