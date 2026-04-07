# Architecture: vibex-selfcheck-path-normalization

**Project**: 规范化各Agent自检报告路径
**Agent**: coord (代写)
**Date**: 2026-03-31

---

## 1. 执行摘要

定义统一的 HEARTBEAT.md 自检报告路径规范，reviewer 按规范读取无需猜测。

## 2. 路径规范

所有 agent 自检报告统一存放：
```
~/.openclaw/workspace-{agent}/HEARTBEAT/{YYYYMMDD}/README.md
```

示例：
- analyst: `~/.openclaw/workspace-analyst/HEARTBEAT/20260331/README.md`
- dev: `~/.openclaw/workspace-dev/HEARTBEAT/20260331/README.md`

## 3. 修改文件

更新各 agent 的 HEARTBEAT.md，指定统一报告路径
