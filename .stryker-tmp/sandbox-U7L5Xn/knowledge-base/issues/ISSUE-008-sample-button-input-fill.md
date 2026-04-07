# ISSUE: 首页示例点击不填充录入框

## 问题描述
首页示例按钮点击后，需求输入框未填充内容。

## 根因分析
**根本原因**：RequirementInput 组件使用 `useState(initialValue)` 仅在首次挂载时生效，后续 props 变化不触发状态更新。

**修复方案**：添加 useEffect 同步外部 initialValue 变化：
```typescript
useEffect(() => {
  setText(initialValue);
}, [initialValue]);
```

## 修复记录
| 日期 | 提交 | 修复内容 |
|------|------|----------|
| 2026-03-15 14:26 | 6ee143e | 添加 useEffect 同步 initialValue |
| 2026-03-15 14:50 | 14e2666 | 优化 useEffect 逻辑 |

## 验证方式
1. 点击示例按钮
2. 确认输入框显示对应内容

## 注意事项
- 间歇性问题可能是浏览器缓存导致
- 建议清除缓存后重试
