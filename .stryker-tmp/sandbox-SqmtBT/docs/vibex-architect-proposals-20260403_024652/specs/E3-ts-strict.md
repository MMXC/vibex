# Spec: E3 - TypeScript Strict 模式

**Epic ID**: E3  
**Epic 名称**: TypeScript Strict 模式  
**优先级**: P1  
**预估工时**: 7h（E3-S1: 3h + E3-S2: 4h）

---

## 1. Overview

启用 TypeScript Strict 模式，将 `any` 类型减少 80%，提升代码类型安全基线。

**当前基线**:
- `any` 类型数量: ~250 个
- TypeScript Strict: 未启用
- `strictNullChecks`: false
- `noImplicitAny`: false

**目标**:
- `any` 类型数量: ≤ 50 个（减少 80%）
- TypeScript Strict: 启用
- CI 中 `tsc --strict` 作为独立 step

---

## 2. Story Specs

### E3-S1: tsconfig.json Strict 配置启用（Phase 1）

#### 功能点
修改 `tsconfig.json`，启用 `noImplicitAny: true`；扫描并修复前 50 个高频 `any` 类型。

#### 技术规格

**tsconfig.json 变更**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**扫描命令**:
```bash
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | wc -l
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | sort -t: -k3 | head -50
```

**修复优先级**（按引用频率排序）:
1. `lib/` 核心库（影响面广）
2. `components/` UI 组件（用户可见）
3. `hooks/` 自定义 hooks（开发者常用）
4. `stores/` 状态管理

#### 验收标准
```typescript
// 配置启用
expect(tsconfig.compilerOptions.noImplicitAny).toBe(true);
expect(tsconfig.compilerOptions.strict).toBe(true);

// 编译错误数控制
const tscResult = execSync('npx tsc --noEmit 2>&1');
const errorCount = parseErrorCount(tscResult);
expect(errorCount).toBeLessThanOrEqual(50);

// 核心目录错误已清零
expect(libErrors).toBe(0);
expect(componentErrors).toBeLessThanOrEqual(10);
```

#### 文件变更
| 文件 | 操作 |
|------|------|
| `tsconfig.json` | 修改 |
| `tsconfig.strict.json`（可选，分离 strict 配置）| 新建 |
| `src/` 下约 50 个文件 | 修改（类型修复）|

---

### E3-S2: 剩余 any 类型全面修复（Phase 2）

#### 功能点
在 Phase 1 基础上，继续修复剩余 `any` 类型；确保全库 `any` 类型减少 ≥ 80%；在 CI 中增加 `tsc --strict` 检查。

#### 技术规格

**分阶段目标**:
```
Phase 1 (E3-S1): any 类型从 ~250 → ~50, tsc 错误 ≤ 50
Phase 2 (E3-S2): any 类型从 ~50 → ~25, tsc 错误 = 0
```

**CI 配置** (`.github/workflows/ci.yml`):
```yaml
- name: TypeScript Strict Check
  run: npx tsc --noEmit --strict
  env:
    CI: true
```

**禁止新增规则**:
- 禁止新增 `@ts-ignore`（除非必要 review）
- 禁止新增 `// @ts-nocheck`
- 违反者 PR 被 block

#### 验收标准
```typescript
// any 减少率
const baseline = 250;
const currentAny = execSync('grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | wc -l');
expect(parseInt(currentAny)).toBeLessThanOrEqual(baseline * 0.2); // ≤ 50

// 无新增 ts-ignore
const newTsIgnore = execSync('git diff HEAD -- "*.ts" "*.tsx" | grep "@ts-ignore" | wc -l');
expect(parseInt(newTsIgnore)).toBe(0);

// CI tsc --strict 通过
expect(ciStep.exitCode).toBe(0);
```

#### 文件变更
| 文件 | 操作 |
|------|------|
| `.github/workflows/ci.yml` | 修改（新增 strict step）|
| `src/` 剩余类型修复文件 | 修改 |
| `CONTRIBUTING.md`（可选）| 新建（类型规范指南）|

---

## 3. 风险缓解

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| R2: TS Strict 引入大量编译错误，阻塞 CI | 🔴 高 | 分阶段启用（先 noImplicitAny），设置 2 周宽限期 |
| Regression 风险 | 🟡 中 | 每个 PR 单独验证类型，不做大批量合并 |
| 第三方库类型缺失 | 🟡 中 | 使用 `@types/*` 包，或局部 `// @ts-ignore` |

---

*Spec 由 PM Agent 生成于 2026-04-03*
