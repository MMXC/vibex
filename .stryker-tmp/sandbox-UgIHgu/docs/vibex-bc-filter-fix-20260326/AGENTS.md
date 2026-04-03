# AGENTS.md: vibex-bc-filter-fix-20260326

## 开发约束

---

## 1. 开发 Agent 职责

**Dev Agent** 负责执行以下任务：
1. 按照 `IMPLEMENTATION_PLAN.md` 修改 `bounded-contexts-filter.ts` 的 `DEFAULT_OPTIONS`
2. 更新 `bounded-contexts-filter.test.ts` 中的测试用例
3. 运行测试验证全部通过
4. 提交 Git commit

---

## 2. 修改范围（严格限制）

### 2.1 只修改这 2 个文件

| 文件 | 操作 |
|------|------|
| `vibex-backend/src/lib/bounded-contexts-filter.ts` | 仅修改 DEFAULT_OPTIONS（3 行） |
| `vibex-backend/src/lib/bounded-contexts-filter.test.ts` | 更新现有测试 + 新增 C3 分组 |

### 2.2 禁止事项

- ❌ 不修改其他文件
- ❌ 不重构过滤逻辑（保持 `name.includes()` 包含匹配）
- ❌ 不修改 `minCoreRatio` / `maxCoreRatio`
- ❌ 不添加新依赖

---

## 3. 关键决策点

### 3.1 测试用例修改原则

**核心原则**: 删除/替换的是 **bug-encoded 测试**（即把错误行为当作预期行为），不是正常功能测试。

| 原测试断言 | 问题 | 修复方式 |
|------------|------|----------|
| `expect(isNameFiltered('患者管理')).toBe(true)` | 把误杀当预期 | 改为 `toBe(false)`，正向验证 DDD 合法人名 |
| `expect(isNameFiltered('患者管理系统集成模块')).toBe(true)` | 12字在 maxNameLength=12 下通过 | 替换为真正的 13 字超长名 |
| `expect(filterInvalidContexts(...)).toEqual(['患者档案', '认证授权'])` | 期望 '患者管理系统' 被过滤 | 断言仍保留（因为含'系统'，会被过滤） |

### 3.2 不要引入方案 B

方案 B（精确后缀/前缀匹配）留作后续优化。当前实现：
- `name.includes(n)` 包含匹配 → 保持不变
- `'系统'` 仍会误杀 "问诊系统" → 记录为已知局限，不在此 PR 修复

---

## 4. 测试执行命令

```bash
cd /root/.openclaw/vibex/vibex-backend
npx jest src/lib/bounded-contexts-filter.test.ts --no-coverage --verbose
```

**验收标准**: 0 failures, 0 skipped, 所有测试 PASS。

---

## 5. Git Commit 规范

```
fix(bounded-contexts): 移除'管理'误杀，调整maxNameLength至12

- 移除 '管理' from forbiddenNames（DDD合法后缀，不再误杀）
- 调整 maxNameLength: 10 → 12（支持8字中文名称）
- 新增 C3 分组：DDD 合法人名测试
- 更新 C2 分组：maxNameLength 边界测试
- 更新现有测试用例（删除/替换 bug-encoded 断言）
Fixes: vibex-bc-filter-fix-20260326
```

---

## 6. 完成后自检

Dev 完成后请自行检查：
- [ ] `bounded-contexts-filter.ts` 仅改了 DEFAULT_OPTIONS（diff 不超过 5 行）
- [ ] `bounded-contexts-filter.test.ts` 新增 C3 分组
- [ ] 所有测试 PASS
- [ ] Git commit 已推送

---

*Architect: AGENTS.md 产出时间 2026-03-26 20:51 UTC+8*
