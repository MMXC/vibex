# 片段库索引

## 目录结构

```
snippets/
├── index.md                    # 本文件
├── template.md                 # 通用模板片段
├── problem-statements/        # 问题陈述模板
│   ├── bug-template.md
│   ├── feature-template.md
│   ├── refactor-template.md
│   └── security-template.md   # 🆕 安全问题模板
├── solutions/                 # 解决方案模板
│   ├── tech-choice.md
│   ├── implementation.md
│   ├── performance.md
│   └── architecture-template.md # 🆕 架构设计模板
└── verification/             # 验收标准模板
    ├── unit-test.md
    └── e2e-test.md
```

## 按类型索引

### 问题陈述
- [Bug 模板](problem-statements/bug-template.md) - 缺陷报告
- [Feature 模板](problem-statements/feature-template.md) - 功能需求
- [重构模板](problem-statements/refactor-template.md) - 代码重构
- [安全模板 🆕](problem-statements/security-template.md) - 安全漏洞报告

### 解决方案
- [技术选型](solutions/tech-choice.md) - 技术决策文档
- [实现方案](solutions/implementation.md) - 详细实现文档
- [性能优化](solutions/performance.md) - 性能相关方案
- [架构设计 🆕](solutions/architecture-template.md) - 架构设计文档

### 验收标准
- [单元测试](verification/unit-test.md) - 测试用例模板
- [E2E 测试](verification/e2e-test.md) - 端到端测试

---

## 🔍 关键词检索表

### 按场景搜索

| 场景/关键词 | 对应片段 | 适用场景 |
|------------|---------|---------|
| 缺陷/Bug/错误 | [bug-template.md](problem-statements/bug-template.md) | 代码bug、崩溃、异常 |
| 功能/Feature/需求 | [feature-template.md](problem-statements/feature-template.md) | 新功能、改进需求 |
| 重构/Refactor | [refactor-template.md](problem-statements/refactor-template.md) | 代码重构、代码质量 |
| 安全/CVE/漏洞 | [security-template.md](problem-statements/security-template.md) | 安全漏洞、权限问题 |
| 技术选型/对比 | [tech-choice.md](solutions/tech-choice.md) | 技术选型、方案对比 |
| 实现/Implementation | [implementation.md](solutions/implementation.md) | 详细实现方案 |
| 性能/Performance/QPS | [performance.md](solutions/performance.md) | 性能优化、延迟问题 |
| 架构/Architecture/模块 | [architecture-template.md](solutions/architecture-template.md) | 系统设计、模块划分 |
| 单元测试/Unit Test | [unit-test.md](verification/unit-test.md) | 单元测试用例 |
| E2E/集成测试 | [e2e-test.md](verification/e2e-test.md) | 端到端测试场景 |

### 按严重级别搜索

| 级别 | 片段 | 说明 |
|------|------|------|
| P0/阻断 | [bug-template.md](problem-statements/bug-template.md), [security-template.md](problem-statements/security-template.md) | 严重缺陷、安全漏洞 |
| P1/重要 | [feature-template.md](problem-statements/feature-template.md) | 重要功能需求 |
| P2/一般 | [performance.md](solutions/performance.md) | 性能优化 |
| P3/低 | [refactor-template.md](problem-statements/refactor-template.md) | 重构改进 |

### 按文件内容关键词

使用 `grep` 快速搜索：
```bash
# 搜索包含特定关键词的片段
grep -l "QPS\|延迟\|性能" docs/knowledge-base/snippets/solutions/*.md
grep -l "安全\|CVE\|漏洞" docs/knowledge-base/snippets/problem-statements/*.md
grep -l "模块\|接口\|数据流" docs/knowledge-base/snippets/solutions/*.md
```

---

## 使用说明

1. **选择片段**: 根据场景在上方检索表查找对应片段
2. **复制模板**: 点击链接打开模板文件
3. **填充内容**: 替换 `[占位符]` 为实际内容
4. **调整格式**: 根据项目需求调整结构
5. **版本记录**: 在片段末尾记录版本变更

## 贡献指南

添加新片段时：
1. 放在对应分类目录下（problem-statements/solutions/verification）
2. 更新本索引文件（目录结构和检索表）
3. 添加关键词到检索表
4. 更新版本记录

---

**版本**: 1.1
**更新日期**: 2026-03-19
**维护者**: Dev Team
**片段总数**: 10
