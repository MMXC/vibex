# Spec: E1 - Sprint 0 CI 基线修复

## 1. 概述

**工时**: 2.5h | **优先级**: P0
**依赖**: 无

## 2. 修改范围

### 2.1 E1-S1: TypeScript 错误修复

**文件**: `vibex-fronted/` 多个文件

```bash
# 统计当前 TS 错误
cd vibex-fronted && npm run build 2>&1 | grep "error TS"

# 分类修复：
# - 废弃 API 使用 → 升级或替换
# - 类型定义缺失 → 补充 @types 包或 inline 类型
# - 路径别名错误 → 修复 tsconfig.json paths
```

### 2.2 E1-S2: DOMPurify Override

**文件**: `package.json`

```json
{
  "overrides": {
    "dompurify": "3.3.3"
  }
}
```

### 2.3 E1-S3: Vitest 稳定性

**文件**: `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    maxWorkers: 2,
    workerIdleMemoryLimit: '512MB',
    // 分离快慢测试
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.slow.test.ts'],
  }
});
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | npm run build | 构建完成 | 0 error TS |
| E1-AC2 | npm audit | 安全检查 | 无 high/critical |
| E1-AC3 | npm test × 3 | 连续运行 | passRate ≥ 95% |

## 4. DoD

- [ ] npm run build 0 error
- [ ] npm audit 无 DOMPurify 漏洞
- [ ] npm test 通过率 > 95%
