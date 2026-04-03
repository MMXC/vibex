# 单元测试模板

## 测试覆盖

| 模块 | 测试用例数 | 覆盖率目标 |
|------|-----------|------------|
| [模块1] | [N] | 80% |

## 测试用例模板

```typescript
describe('[模块名称]', () => {
  describe('[功能名称]', () => {
    it('should [预期行为]', () => {
      // Given
      const input = [测试输入];
      
      // When
      const result = [执行函数](input);
      
      // Then
      expect(result).to[预期结果];
    });
    
    it('should handle [边界条件]', () => {
      // Given
      const input = [边界输入];
      
      // When / Then
      expect([执行函数](input)).to[预期结果];
    });
  });
});
```

## Mock 示例

```typescript
// Mock 依赖
const mockDependency = {
  method: jest.fn().mockResolvedValue({ data: 'mocked' }),
};

// Spy 真实方法
const spy = jest.spyOn(RealClass.prototype, 'method');
```

## 覆盖率检查

```bash
npm test -- --coverage --coverageThreshold='{"lines":80,"branches":70}'
```

---

**版本**: 1.0 | **更新日期**: 2026-03-19
