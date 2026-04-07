# PRD: current_report 模块独立化 — 2026-03-31

> **任务**: vibex-currentreport-modular/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/vibex-currentreport-modular/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | current_report 硬编码路径，多项目复用需重复配置 |
| **目标** | 统一配置接口，支持 config.json，消除硬编码 |
| **成功指标** | 新项目接入时间 < 5min |

---

## 2. Epic 拆分

### Epic 1: 模块独立化（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 统一配置接口 | 1h | `expect(configure({tasks_dir: '...'})).toBeDefined();` |
| S1.2 | config.json 配置文件支持 | 1h | `expect(fs.existsSync('config.json')).toBe(true);` |
| S1.3 | 路径验证脚本 | 0.5h | `expect(validatePaths(config)).toBe(true);` |

**DoD**: 配置接口统一，新项目接入 < 5min

---

**总工时**: 2.5h
