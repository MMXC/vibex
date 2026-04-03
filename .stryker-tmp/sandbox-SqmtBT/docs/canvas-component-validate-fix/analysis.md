# Canvas Component Generate API 验证错误分析

## 问题描述
**来源**: 小羊反馈 (2026-04-02)
**API**: `https://api.vibex.top/api/v1/canvas/generate-components`

## 错误信息
ZodError 验证失败：
1. Component type 枚举不匹配
2. API method 大小写问题
3. confidence 字段缺失
4. flowId 显示 unknown

## 验收标准
- [ ] Component type 枚举与 API 返回值匹配
- [ ] API method 大小写正确
- [ ] confidence 字段有默认值
- [ ] flowId 正确传递
