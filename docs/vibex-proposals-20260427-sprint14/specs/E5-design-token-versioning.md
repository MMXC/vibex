# S14-E5 Spec: Design Token 版本化管理

## Epic 概述

对 Design Token Palette Manager（S13-E2）的 token 变更进行版本化管理，支持历史追溯和 rollback。解决 token 修改不可逆、协作时无法追溯变更的问题。

**⚠️ 条件 Epic**：此 Epic **只有**在 S13-E2（Design Token Palette Manager）确认进入 Sprint 14 执行后才启动。若 S13-E2 未实施，此 Epic 自动跳过，不产生空代码。

## 触发条件

- Sprint 14 Planning 时确认 S13-E2 进入执行 → 启动 E5
- S13-E2 未进入执行 → E5 从 Sprint 14 提案中剔除

## 用户故事

### US-E5.1: Token 变更自动记录版本
**作为**系统，**我希望**每次 token 修改时自动生成一个版本快照，**这样**每次变更都有迹可循。

**验收标准**:
- Given Token Palette Store, when token 被修改, then expect(store.versions).toHaveLength(previousLength + 1)
- 每个 version 包含 `{ id, timestamp, author, tokens, description }`

### US-E5.2: Token 版本列表展示
**作为**设计师，**我希望**看到所有历史版本的列表，**这样**我可以了解 token 的演进历史。

**验收标准**:
- Given Token Palette Manager, when 打开版本面板, then expect(versionList).toHaveLength(n > 0)
- 每个列表项显示 timestamp + author + description 摘要

### US-E5.3: Token Rollback 功能
**作为**设计师，**我希望**点击一个旧版本就能回滚到那个状态，**这样**错误的 token 修改可以一键撤销。

**验收标准**:
- Given 选中某历史版本, when 点击 Rollback, then expect(store.tokens).toEqual(selectedVersion.tokens)
- Rollback 后 UI 显示的 token 值与选中版本完全一致
- Rollback 本身也生成一个新 version 记录（不可逆操作）

### US-E5.4: Token Rollback 单元测试
**作为**开发者，**我希望**Rollback 有完整的单元测试覆盖，**这样**回滚逻辑的正确性有保障。

**验收标准**:
- Given store 有 3 个 version，选中 version[0], when rollback, then expect(store.tokens).toEqual(version[0].tokens)
- Given store 有 1 个 version（初始版本），when rollback, then expect(warn).toHaveBeenCalledWith('Cannot rollback to initial version')
- Rollback 后 versions 数组长度 = 4（Rollback 本身生成新 version）

## Definition of Done

- [ ] E5 conditional guard：若 S13-E2 未实施，`E5_VERSIONING_ENABLED=false` 时整个模块不注册
- [ ] Token Palette Store 包含 `versions` 字段（数组，每次变更 push 新 version）
- [ ] 版本列表 UI 可展示 timestamp + author + description
- [ ] Rollback 功能完整（UI + 逻辑）
- [ ] Rollback 单元测试通过（覆盖正常回滚 + 初始版本不可回滚场景）
- [ ] E5 代码不依赖 S13-E2 实现细节（解耦，通过 Store 接口集成）
