# Epic 4: 低优先级规范建设 — 技术规格

## 概述

建立 Git 规范增强、测试覆盖率门禁提升和 Changelog 规范化文档。

---

## E4-S1: commit-msg hook 验证 Refs 格式

### 现状
commit message 部分缺少 Refs 标注（关联 issue/PR 编号）。

### 实施步骤
1. 安装 husky（若未安装）：`npx husky install`
2. 创建 hook：`npx husky add .husky/commit-msg 'npx commitlint --edit "$1"'`
3. 配置 commitlint 规则允许 `Refs:` 格式：
   ```json
   {
     "rules": {
       "refs-empty": [2, "never"],
       "refs-format": [2, "always", "^(Refs|Fixes): #[0-9]+"]
     }
   }
   ```
4. 测试：创建不带 Refs 的 commit 应被拒绝

### 验收条件
- `.husky/commit-msg` hook 存在
- 不规范的 commit message 被 hook 拒绝
- 规范的 commit message 通过验证

---

## E4-S2: CI 覆盖率下降检测

### 现状
前端测试覆盖率（Statements ~60%）未达目标（65%），且 CI 未检测覆盖率下降。

### 实施步骤
1. 在 CI 中使用 Istanbul/nyc 的 baseline 比较功能：
   ```yaml
   - name: Coverage
     run: |
       npx nyc --reporter=lcov --reporter=text npm test
       npx nyc report --reporter=text-lcov > coverage.lcov
   ```
2. 使用 CI 缓存保存 coverage JSON：
   ```yaml
   - uses: actions/cache@v3
     with:
       path: coverage/
       key: coverage-${{ github.sha }}
   ```
3. 添加覆盖率 diff 检查脚本：
   ```bash
   node scripts/check-coverage-drop.js
   ```

### check-coverage-drop.js 示例逻辑
```javascript
// 读取 baseline 和当前覆盖率，比较差值
// 下降 >1% 时输出 warning 并退出码 0（不阻断，但 warning）
// 下降 >5% 时退出码 1（阻断 CI）
```

### 验收条件
- CI 保存 coverage baseline
- 覆盖率下降 >1% 时输出 CI warning
- 覆盖率下降 >5% 时 CI 失败

---

## E4-S3: CHANGELOG_CONVENTION.md 创建

### 规范内容

```markdown
# CHANGELOG 规范

## 格式约定

每条 changelog 条目格式：
```
- <类型>: <简短描述> <详细上下文>
```

### 类型定义

| 类型 | 适用场景 | 示例 |
|------|---------|------|
| feat | 新功能 | feat: 新增 Step 折叠展开功能 |
| fix | Bug 修复 | fix: 修复 canvas 校验状态丢失问题 |
| refactor | 重构 | refactor: canvasStore 状态管理重构 |
| test | 测试相关 | test: 新增 canvas 组件测试覆盖率 |
| docs | 文档更新 | docs: 更新 API 文档 |
| chore | 维护任务 | chore: 升级依赖版本 |
| security | 安全相关 | security: 追踪 GHSA-xxxx XSS 漏洞 |

### Epic 标注

- `E1`, `E2`, `E3` 表示 Epic 编号
- `[E1+E2]` 表示该 commit 覆盖多个 Epic
- `(shared-commit <hash>)` 表示多 Epic 共 commit

### 示例

```markdown
## 2026-04-02

- fix: 修复 canvas-expand.spec.ts TypeScript 类型错误 (E1-S1)
- feat: 新增 ESLint TypeScript CI 门禁 (E1-S2)
- security: 追踪 dompurify GHSA-v2wj-7wpq-c8vv XSS 漏洞 (E2-S1)
- fix: canvasStore.ts as any 类型断言减少 50% (E3-S2)
```

## 提交频率

- 每个 Epic 完成时提交一条
- 紧急修复随时提交
- Sprint 结束时汇总
```

### 验收条件
- `CHANGELOG_CONVENTION.md` 存在
- 包含所有类型的格式示例
- 团队遵循此规范
