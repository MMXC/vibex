# PRD: vibex-jest-esm-fix

> **项目目标**：修复 vibex-backend Jest 测试输出噪声问题，使测试结果清晰可读
> **分析师结论**：✅ 测试实际全部通过，无 ESM 配置问题；问题来源为 `console.error` 日志干扰

---

## 1. Epic 拆分

| Epic | 标题 | 优先级 |
|------|------|--------|
| Epic 1 | 测试日志静默化 | P0 |
| Epic 2 | ESM 迁移准备文档 | P2 |

### Epic 1: 测试日志静默化

**目标**：消除测试输出中的 `console.error` 干扰，让开发者一眼看清测试结果。

#### Story 1.1: 创建 Jest 全局 setup 文件
**作为** 开发者，**我想要** `console.error` 在测试运行时被自动静默，**以便** 测试输出干净可读。
- **工作项**：
  - 在 `vibex-backend/` 根目录创建 `jest.setup.ts`
  - 内容：`jest.spyOn(console, 'error').mockImplementation(() => {})`
- **验收标准**：
  - `jest.setup.ts` 文件存在
  - 文件内容包含 `jest.spyOn(console, 'error').mockImplementation`

#### Story 1.2: 配置 Jest 使用 setup 文件
**作为** Jest 配置，**我需要** 加载 `jest.setup.ts`，**以便** 所有测试套件共享静默行为。
- **工作项**：
  - 修改 `jest.config.js`，添加 `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`
  - 确保路径正确，Jest 27+ 兼容
- **验收标准**：
  - `jest.config.js` 中包含 `setupFilesAfterEnv` 配置
  - `npm test` 执行后配置校验通过（`--showConfig` 或实际运行）

#### Story 1.3: 验证测试结果
**作为** 开发者，**我需要** 确认修改后所有测试仍然通过，**以便** 确认改动无副作用。
- **工作项**：
  - 执行 `npm test`
  - 验证输出：`Test Suites: 55 passed`, `Tests: 436 passed`
  - 验证输出中无 `Error fetching projects`、`Error creating project` 等日志
- **验收标准**：
  - `npm test` 退出码为 0
  - 输出中无 `console.error` 相关字符串（grep 验证）

### Epic 2: ESM 迁移准备文档

**目标**：为未来可能的 ESM 迁移提供技术参考，避免重复调研。

#### Story 2.1: 编写配置对比文档
**作为** 技术负责人，**我想要** 一份 CommonJS vs ESM 配置对比文档，**以便** 评估迁移成本。
- **工作项**：
  - 创建 `docs/vibex-jest-esm-fix/CONFIG_COMPARISON.md`
  - 包含：当前配置说明、ESM 迁移步骤、预估工时、风险评估
- **验收标准**：
  - 文档存在且内容完整
  - 包含可操作的迁移步骤

---

## 2. 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Jest setup 文件 | 创建 `jest.setup.ts` mock console.error | `expect(fs.existsSync('jest.setup.ts')).toBe(true)` | - |
| F1.2 | Jest 配置更新 | `jest.config.js` 添加 setupFilesAfterEnv | `expect(config.setupFilesAfterEnv).toContain('jest.setup.ts')` | - |
| F1.3 | 测试输出验证 | `npm test` 输出无 console.error 干扰 | `expect(output).not.toMatch(/Error fetching projects/)` | - |
| F1.4 | 测试通过验证 | 所有 55 套件、436 测试通过 | `expect(result.exitCode).toBe(0)` | - |
| F2.1 | 配置对比文档 | 创建 `CONFIG_COMPARISON.md` | `expect(fs.existsSync('CONFIG_COMPARISON.md')).toBe(true)` | - |

---

## 3. 优先级矩阵

| 功能点 | Impact | Effort | 优先级 | 说明 |
|--------|--------|--------|--------|------|
| F1.1 | H | L | **P0** | 核心修复，无替代方案 |
| F1.2 | H | L | **P0** | 依赖 F1.1 |
| F1.3 | H | L | **P0** | 验证修复效果 |
| F1.4 | H | L | **P0** | 确保无回归 |
| F2.1 | L | L | **P2** | 文档补充，不影响测试 |

---

## 4. 验收标准（DoD）

- [ ] `jest.setup.ts` 已创建，内容正确
- [ ] `jest.config.js` 已更新，包含 `setupFilesAfterEnv`
- [ ] `npm test` 通过：55 suites, 436 tests, 0 failures
- [ ] 测试输出中无 `console.error` 相关字符串（`Error fetching projects` 等）
- [ ] `CONFIG_COMPARISON.md` 已创建

---

## 5. 技术约束

- 修改仅限 `jest.config.js` 和新增 `jest.setup.ts`，不改动业务代码
- `jest.setup.ts` 使用 CommonJS compatible 写法（`module.exports` 或直接调用）
- 不引入额外依赖

---

## 6. Out of Scope

- ESM 实际迁移（仅文档记录）
- 修改路由 handler 中的 `console.error` 调用（保持原样）
- 修改测试文件断言逻辑
