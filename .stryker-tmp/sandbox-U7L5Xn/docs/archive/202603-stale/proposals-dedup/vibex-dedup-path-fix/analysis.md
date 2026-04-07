# Analysis: vibex-dedup-path-fix

## 问题来源
proposal-dedup-mechanism 项目 reviewer-epic1 审查发现 2 个阻断级 Bug。

## Bug 清单

### Bug 1: load_existing_projects 路径错误
- **位置**: `scripts/dedup/dedup.py:248`
- **问题**: 默认路径 `vibex/scripts/projects/` 不存在
- **实际数据**: `/home/ubuntu/clawd/data/team-tasks/`
- **影响**: 去重机制完全失效
- **修复**: 将默认路径改为 `/home/ubuntu/clawd/data/team-tasks/`

### Bug 2: JSON 字段名不匹配
- **位置**: `scripts/dedup/dedup.py`
- **问题**: 代码读取 `"name"` + `"goal"`，实际字段是 `"project"`
- **影响**: 路径修复后仍无法正确加载
- **修复**: 将字段读取改为 `"project"`

## 验收标准
- [ ] Bug1: dedup.py 默认路径改为 `/home/ubuntu/clawd/data/team-tasks/`
- [ ] Bug2: 字段名改为 `"project"`
- [ ] npm test 通过
