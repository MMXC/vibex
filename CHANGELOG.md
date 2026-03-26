# CHANGELOG

All notable changes to vibex will be documented in this file.

## [Unreleased]

## [v1.0.88] - 2026-03-26

### Added
- **vibex-task-state-20260326**: Epic1 — task_state CLI + 乐观锁
  - `atomic_write_json()`: tempfile.mkstemp + os.rename 原子写入 (F1.1)
  - `load_project_with_rev()`: 返回 (data, revision) (F1.3)
  - `save_project_with_lock()`: 乐观锁 revision 比对 + 重试 (F1.2)
  - `save_project()`: 原子写入 + 旧文件兼容 (F1.4)
  - Tests: 10/10 Epic1 tests pass
  - Review: `docs/review-reports/20260326/review-vibex-task-state-20260326-epic1.md`

## [Previous Changes]

See git history for complete changelog.
