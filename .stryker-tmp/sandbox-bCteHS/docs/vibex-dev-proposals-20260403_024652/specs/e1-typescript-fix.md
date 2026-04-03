# Epic E1 Spec: TypeScript 严格模式收尾

## 基本信息

| 字段 | 内容 |
|------|------|
| Epic ID | E1 |
| 名称 | TypeScript 严格模式收尾 |
| 优先级 | P0 |
| 状态 | 待开发 |
| 工时 | 1h |
| 对应提案 | D-003 |

## 背景

Sprint 2 遗留 `StepClarification.tsx` 中 `StepComponentProps` 的重复类型定义，导致 `tsc --noEmit` 报 2 个 TS 错误，阻断 CI 构建。

## Story 列表

| 功能 ID | Story | 功能点 | 验收标准 | 页面集成 | 工时 | 依赖 |
|---------|-------|--------|----------|----------|------|------|
| E1-S1 | 修复 StepClarification 重复定义 | 移除 `StepComponentProps` 的重复定义，保留一个统一版本 | `expect(tscOutput.errors).toHaveLength(0)` | 无 | 0.5h | 无 |
| E1-S2 | 添加 ESLint 防复发规则 | 配置 `no-duplicate-imports` 或等效规则，在 CI 中 gate | `expect(eslintOutput.errorCount).toBe(0)` | 无 | 0.5h | E1-S1 |

## 验收标准（完整 expect 断言）

### E1-S1

```typescript
// tsc --noEmit 零错误
const tscOutput = execSync('cd vibex-frontend && npx tsc --noEmit', { encoding: 'utf-8' });
expect(tscOutput.trim()).toBe('');

// StepClarification.tsx 无重复定义
const stepClarificationContent = readFile('src/components/StepClarification.tsx');
const stepComponentPropsMatches = stepClarificationContent.match(/StepComponentProps/g);
expect(stepComponentPropsMatches).toHaveLength(1);

// 不包含 "Duplicate identifier"
expect(stepClarificationContent).not.toContain('Duplicate identifier');
```

### E1-S2

```typescript
// ESLint 配置中包含防复发规则
const eslintConfig = readFile('.eslintrc.json');
expect(eslintConfig).toContain('no-duplicate-imports');

// 对包含重复 import 的文件执行 ESLint 应报错
const eslintOutput = execSync('npx eslint src/components/StepClarification.tsx', { encoding: 'utf-8' });
expect(eslintOutput).toContain('0 errors');
```

## 技术规格

### 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/StepClarification.tsx` | 修改 | 移除重复的 `StepComponentProps` 定义 |
| `.eslintrc.json` | 修改 | 添加 `no-duplicate-imports` 规则 |

### 约束

- 不得删除任何功能逻辑，仅移除类型定义的重复项
- ESLint 规则需在 CI 中 gate，防止未来复发

## DoD

- [ ] `tsc --noEmit` 输出 0 error
- [ ] `StepClarification.tsx` 无重复 `StepComponentProps` 定义
- [ ] ESLint 配置 `no-duplicate-imports` 规则已生效
- [ ] CI pipeline 中 TS 类型检查步骤通过
