# Code Review Report
# vibex-dedup-path-fix / Bug Fix - 路径 + 字段映射修复

**Reviewer:** reviewer
**Date:** 2026-03-24
**Commit:** eab94ede
**Status:** ✅ PASSED

---

## Summary

修复了 `load_existing_projects()` 的两个阻断级 Bug：
1. 数据路径错误（`vibex/scripts/projects/` → `/home/ubuntu/clawd/data/team-tasks`）
2. JSON 字段名映射错误（`"name"` → `"project"`）

---

## Security Issues

🔴 **None** — 无安全漏洞

---

## Bug Fix Details

### 🔴 Bug 1: 数据路径错误

**文件**: `scripts/dedup/dedup.py:278`
**问题**: 默认路径 `vibex/scripts/projects/` 不存在，导致去重机制完全失效
**修复**: 改为实际数据路径 `/home/ubuntu/clawd/data/team-tasks`

### 🔴 Bug 2: JSON 字段名映射错误

**文件**: `scripts/dedup/dedup.py:293-295`
**问题**: 代码读取 `"name"` + `"goal"`，实际 JSON 字段是 `"project"` + `"goal"`
**修复**: 改为 `data.get("project") or data.get("name", "")`

---

## Test Results

```
============================== 57 passed in 0.40s ==============================
```

---

## Conclusion

✅ **PASSED** — 两个阻断级 Bug 均已修复并验证通过。
