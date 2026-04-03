# AGENTS.md: simplified-flow-test-fix

**项目**: simplified-flow-test-fix  
**Agent**: dev  
**创建时间**: 2026-03-23

---

## 开发约束

### 禁止事项

- ❌ 修改 `vibex-fronted/src/app/page.tsx` 组件代码
- ❌ 删除现有测试用例（只能改名字/断言）
- ❌ 添加新的外部依赖
- ❌ 修改 jest.config.ts 或测试配置
- ❌ 引入 flaky 断言（如 sleep, 随机值）

### 必须事项

- ✅ 运行 `npm test` 确认修改后所有测试通过
- ✅ 每个修改后立即运行 `npx jest page.test.tsx` 验证
- ✅ 使用 `git add` 仅提交 `page.test.tsx` 一个文件
- ✅ Commit message 必须以 `fix(page.test):` 开头

### 开发流程

```
1. cd vibex-fronted
2. npx jest page.test.tsx  # 确认基线通过
3. 修改测试（每次改一个用例）
4. 运行 npx jest page.test.tsx --testNamePattern="<修改的用例>"
5. 重复 3-4 直到全部完成
6. npm test  # 全量回归
7. git add src/app/page.test.tsx && git commit
```

### 验收清单

| # | 检查项 | 验证命令 |
|---|--------|---------|
| 1 | 所有 page.test.tsx 测试通过 | `npx jest page.test.tsx` |
| 2 | 测试数量保持 4 个 | `npx jest page.test.tsx --listTests` |
| 3 | npm test 全量通过 | `npm test` |
| 4 | 无未提交修改 | `git status --porcelain` |
| 5 | Commit 包含 `fix(page.test):` | `git log -1 --format=%s` |

### 常见问题

**Q: 测试失败但原因不明怎么办?**
A: 单独运行该测试 `npx jest page.test.tsx --testNamePattern="<name>"`，检查断言错误信息。

**Q: 布局验证找不到可用的选择器?**
A: 使用 `screen.getByText()` 按文本查找，或 `queryAllByTestId()` 按 data-testid 查找，避免硬编码 class。

**Q: 修改后 npm test 整体失败?**
A: 先检查是否是 page.test.tsx 本身失败：`npx jest page.test.tsx`。如果其他文件失败，可能是 pre-existing 问题，不在本项目范围内。
