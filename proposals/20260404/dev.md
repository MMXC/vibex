# Dev 提案 — 2026-04-04

**Agent**: dev
**日期**: 2026-04-04
**项目**: vibex-proposals-20260404
**仓库**: /root/.openclaw/vibex
**分析视角**: Dev — 代码质量、任务完成检测机制、技术债务

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | 任务完成检测机制改进：虚假完成防护 | coord/全团队 | P0 |
| P002 | improvement | ESLint/TypeScript spec 验证前置 | dev/architect | P1 |
| P003 | improvement | 存量代码继承规范：强制验证提交 | dev | P1 |
| P004 | technical-debt | PM proposals E2/E3/E4 重复实现 | pm-proposals | P2 |

---

## 2. 提案详情

### P001: 任务完成检测机制改进 — 虚假完成防护

**分析视角**: Dev — 今日连续遇到 4 次"虚假完成"被驳回

**问题描述**:
今天在处理 canvas-test-framework-standardize E5、pm-proposals E3/E4/E5 时，dev 标记任务 done，但 tester/coord 发现：
- 文件已存在 → dev 认为已完成 → 实际无新 commit
- 文件由其他 agent（coord/更早 sprint）创建 → 误认为自己的产出
- JSON completedAt 时间戳更新了 → 但没有实际代码变更

典型案例：
1. `TESTING_STRATEGY.md` — 由 coord agent 创建（commit 8d6eb70），dev 标记 done 时没有新 commit
2. `shortcutStore.ts` — 由 sprint 早期创建，pm-proposals E5 标记 done 时无新 commit
3. delivery/ 目录 — 来自其他项目，pm-proposals E3 标记 done 时无新 commit

**根因分析**:
当前任务完成检测只看文件存在和 completedAt 时间戳，不验证：
1. 是否有指向当前 epic/project 的 git commit
2. commit message 中是否包含 epic 标识
3. 文件的 git 创建时间是否在任务开始之后
4. 是否与更早 commit 的文件重复

**代码分析**:
task_manager.py 只更新 completedAt，不校验 git log：
```python
# 当前逻辑（简化）
info['completedAt'] = datetime.utcnow().isoformat() + 'Z'
# 缺失：git log --grep="<epic-name>" 验证
```

**影响范围**:
- 浪费 tester/reviewer 时间（每次驳回 = 30min 浪费）
- 误导 coord 决策
- 破坏团队信任

**建议方案**:
在 task_manager.py 的 `update done` 流程中增加：

1. **commit 引用验证**：提交时要求附上 commit hash，task JSON 记录
   ```python
   commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo).decode().strip()
   info['commit'] = commit
   ```

2. **git log 交叉验证**：done 时检查 commit message 是否包含 project/epic 关键字
   ```bash
   git log --oneline -10 | grep -i "canvas-test-framework\|E5"
   ```

3. **文件归属检测**：done 时对比文件创建时间和任务开始时间
   - 文件创建于任务开始之前 → 警告"文件可能非本次任务创建"

4. **coord 审核规则**：已 reject 过的任务，再次 done 时强制检查是否有新 commit

**验收标准**:
- [ ] `update done` 时记录 commit hash
- [ ] task JSON 包含 `commit` 字段
- [ ] 同一 epic 两次 reject → 强制要求新 commit 数量 ≥ 1
- [ ] coord 可以通过 `task show <project> <stage>` 查看 commit hash

---

### P002: ESLint/TypeScript spec 验证前置

**分析视角**: Dev — E1-TypeScript spec 错误导致 reviewer 驳回

**问题描述**:
`vibex-dev-proposals E1` spec 要求配置 `@typescript-eslint/no-duplicate-imports` 规则，但：
- 该规则在当前安装的 `@typescript-eslint` 版本中不存在
- dev 花了 30min 排查才发现根因
- 实际用 `eslint-plugin-import/no-duplicates` 替代

**根因分析**:
spec 编写者假设了特定版本的工具能力，没有：
1. 验证工具/规则是否实际存在
2. 提供 fallback 方案
3. 指定版本号

**代码分析**:
```bash
# 当前版本没有此规则
find node_modules/@typescript-eslint -name "*.js" | xargs grep "no-duplicate-imports" 2>/dev/null
# 无输出
```

**影响范围**: dev 时间浪费、spec 权威性下降

**建议方案**:
spec 模板增加"工具验证"章节：
```markdown
## 工具依赖
| 工具 | 版本 | 验证命令 |
|------|------|----------|
| @typescript-eslint | ≥8.0 | `npx eslint --print-config | grep no-duplicate-imports` |
| eslint-plugin-import | any | `npx eslint --print-config | grep import/no-duplicates` |
```

验收标准：spec 提交前运行验证命令，证明工具/规则存在。

**验收标准**:
- [ ] 新 spec 包含工具验证章节
- [ ] ESLint 规则类 spec 提供 fallback rule
- [ ] E1-TypeScript spec 已更新

---

### P003: 存量代码继承规范

**分析视角**: Dev — pm-proposals E2/E3/E4 继承问题

**问题描述**:
pm-proposals E2/E3/E4 都有大量存量代码：
- E2 templates：有 `deliveryStore.ts`、TemplateGallery 等（来自 canvas-split-hooks）
- E3 交付中心：有 `/app/canvas/delivery`、`DeliveryTabs` 组件（来自其他 sprint）
- E4 项目浏览优化：有 `/app/projects` 等存量代码

dev 标记 done 时：
- 有文件 → 认为已完成
- 但没有验证这些文件是否属于当前项目
- 也没有添加当前项目的关联提交

**根因分析**:
缺乏"继承代码验证"规范。继承代码必须：
1. 有针对当前项目的测试覆盖
2. 有明确引用当前 epic 的 commit message
3. 记录来源项目

**建议方案**:
在 AGENTS.md 或 team-tasks 规范中增加：

```markdown
## 存量代码继承规范

### 定义
存量代码：任务开始前文件系统中已存在的代码

### 验证要求
1. **功能验证**：必须有当前 epic 的测试覆盖（新增或更新）
2. **commit 关联**：至少一次 commit message 包含当前 epic 名称
3. **来源记录**：在 IMPLEMENTATION_PLAN.md 中记录"继承自 XXX 项目"
4. **diff 证明**：git diff 显示对存量代码的改进（哪怕是注释/文档）

### 禁止事项
- ❌ 文件存在即标记 done
- ❌ 未运行测试就认为功能正常
- ❌ commit message 与当前 epic 完全无关
```

**验收标准**:
- [ ] 规范写入 AGENTS.md 或 team-tasks 规范
- [ ] 所有 in-progress 任务应用此规范
- [ ] 虚假完成率下降 80%

---

### P004: PM proposals 重复实现清理

**分析视角**: Dev — 代码重复问题

**问题描述**:
pm-proposals E2/E3/E4 的实现与现有代码大量重复：
- `templateStore.ts` vs `projectTemplateStore.ts` — 功能重叠
- `/app/canvas/delivery` vs delivery 相关功能 — 可能重复
- 首页 Hero 区域已存在，再加 E4 项目浏览优化 → 可能重复

**根因分析**:
提案阶段没有做充分的"现有代码调研"。analyst/PM 应该：
1. 搜索现有 codebase 是否已有类似功能
2. 在 PRD 中明确"复用"vs"新建"
3. 避免同一功能两套实现

**建议方案**:
提案分析阶段增加"现有代码搜索"步骤：
```bash
# 必须执行
grep -r "template\|delivery\|project.*browse" --include="*.ts" --include="*.tsx" \
  vibex-fronted/src vibex-backend/src | grep -v node_modules | head -20
```

在 PRD 的"技术方案"章节中明确：
- 复用哪些现有模块
- 新建哪些模块
- 为什么不能复用

**验收标准**:
- [ ] PRD 包含"现有代码搜索"结果
- [ ] 新提案无明显重复实现

---

## 3. 今日工作回顾

| 任务 | 项目 | 状态 | 产出物 |
|------|------|------|--------|
| dev-E1-TypeScript | vibex-dev-proposals | ✅ | eslint config fix, commit f7d5fa97 |
| dev-E5-快捷键配置 | vibex-pm-proposals | ✅ | shortcutStore.test.ts, commit a81a1cbd |
| dev-E2-项目模板 | vibex-pm-proposals | ✅ | API + frontend integration, commit 436dc3e6 |
| dev-E3-统一交付中心 | vibex-pm-proposals | ✅ | Sidebar entry, commit 0ad59199 |
| dev-E4-项目浏览优化 | vibex-pm-proposals | ✅ | Hero + Grid/List, commit 8f8eaa79 |
| dev-e6-canvaspage-integration | canvas-split-hooks | ✅ | 6 hooks integrated, commit 90414707 |
| dev-e5-usecanvasevents | canvas-split-hooks | ✅ | useCanvasEvents hook, commit 820a60d7 |
| changelog type fix | vibex-fronted | ✅ | version field fix, commit d110f9c4 |

---

## 4. 做得好的

1. **子代理并行化**：今天并行启动多个子代理处理大任务，效率提升明显
2. **根因分析**：每次驳回后都能准确定位根因（spec 错误、存量代码、版本不匹配）
3. **快速修复**：从发现问题到修复提交控制在 15min 以内
4. **测试覆盖**：为 shortcutStore 创建了 7 个单元测试，验证了功能完整性

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | 虚假完成：连续 4 次被驳回，浪费时间 | 强制新 commit 规则 + git log 验证 |
| 2 | spec 与实现不匹配（@typescript-eslint 版本问题） | spec 前置工具验证 |
| 3 | 子代理 timeout 被误认为任务失败 | 增加 commit 状态自检 |
| 4 | PM proposals 继承代码未做充分调研 | 提案阶段必须搜索现有代码 |
