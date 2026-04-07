# Spec: Pre-commit Orphan Test Detector

**文件**: `specs/pre-commit-orphan-detector.md`  
**状态**: Pending  
**创建日期**: 2026-03-21

---

## 功能描述

在 pre-commit hook 中自动检测测试文件引用的模块是否仍然存在。

## 技术方案

### 检测逻辑

```typescript
// 伪代码
function detectOrphanTests() {
  const testFiles = glob('src/**/__tests__/*.test.{ts,tsx}');
  const missing = [];
  
  for (const testFile of testFiles) {
    const imports = extractImports(testFile);
    for (const imp of imports) {
      if (!moduleExists(imp)) {
        missing.push({ file: testFile, import: imp });
      }
    }
  }
  
  return missing;
}
```

### 集成方式

| 组件 | 技术选型 |
|------|----------|
| Pre-commit 框架 | husky |
| 检测脚本 | TypeScript + ts-node |
| 错误报告 | 彩色输出 + 退出码 1 |

### 验证标准

```typescript
describe('OrphanTestDetector', () => {
  it('should detect missing module imports', () => {
    const result = detectOrphanTests();
    expect(result.length).toBe(0); // 必须为 0 才能通过
  });
  
  it('should run within 5 seconds', () => {
    const start = Date.now();
    detectOrphanTests();
    expect(Date.now() - start).toBeLessThan(5000);
  });
});
```

### 集成验收

| 验收项 | 标准 |
|--------|------|
| hook 已安装 | `test -f .husky/pre-commit` |
| hook 内容正确 | `grep -q "orphan-detector" .husky/pre-commit` |
| 检测执行成功 | `git commit` 不报模块错误 |

---

**下一步**: 等待 Dev Agent 实现
