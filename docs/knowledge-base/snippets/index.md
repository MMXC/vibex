# 片段库索引

## 目录结构

```
snippets/
├── index.md                    # 本文件
├── template.md                 # 通用模板片段
├── problem-statements/        # 问题陈述模板
│   ├── bug-template.md
│   ├── feature-template.md
│   └── refactor-template.md
├── solutions/                 # 解决方案模板
│   ├── tech-choice.md
│   ├── implementation.md
│   └── performance.md
└── verification/             # 验收标准模板
    ├── unit-test.md
    └── e2e-test.md
```

## 按类型索引

### 问题陈述
- [Bug 模板](problem-statements/bug-template.md) - 缺陷报告
- [Feature 模板](problem-statements/feature-template.md) - 功能需求
- [重构模板](problem-statements/refactor-template.md) - 代码重构

### 解决方案
- [技术选型](solutions/tech-choice.md) - 技术决策文档
- [实现方案](solutions/implementation.md) - 详细实现文档
- [性能优化](solutions/performance.md) - 性能相关方案

### 验收标准
- [单元测试](verification/unit-test.md) - 测试用例模板
- [E2E 测试](verification/e2e-test.md) - 端到端测试

## 按关键词索引

| 关键词 | 对应片段 |
|--------|----------|
| Bug/缺陷 | problem-statements/bug-template.md |
| Feature/功能 | problem-statements/feature-template.md |
| 重构 | problem-statements/refactor-template.md |
| 技术选型 | solutions/tech-choice.md |
| 实现 | solutions/implementation.md |
| 性能 | solutions/performance.md |
| 单元测试 | verification/unit-test.md |
| E2E 测试 | verification/e2e-test.md |
| 优先级 | solutions/tech-choice.md |
| 风险 | solutions/tech-choice.md |

## 使用说明

1. **复制片段**: 根据需求类型选择对应模板
2. **填充内容**: 替换 `[占位符]` 为实际内容
3. **调整格式**: 根据项目需求调整结构
4. **版本记录**: 在片段末尾记录版本变更

## 贡献指南

添加新片段时：
1. 放在对应分类目录下
2. 更新本索引文件
3. 添加关键词索引
4. 更新版本记录

---

**版本**: 1.0
**更新日期**: 2026-03-19
**维护者**: Dev Team
