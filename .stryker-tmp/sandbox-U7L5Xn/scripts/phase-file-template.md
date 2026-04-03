# Phase 文件标准模板

> **版本**: v1.0 | **日期**: 2026-03-29 | **用途**: Agent 阶段任务文件规范化

## 背景

Phase 文件用于记录 Agent 执行阶段任务的完整过程。每次执行生成新文件（带时间戳），避免同一文件被多次追加导致膨胀。

## 文件命名规范

```
<project>-<task>-<YYYYMMDD_HHMMSS>.md
```

示例：
```
vibex-canvas-feature-gap-20260329-dev-Epic4-20260329_120000.md
```

## 标准模板

```markdown
# 阶段任务文件: <project>/<task>
**Agent**: <agent> | **创建时间**: <YYYY-MM-DD HH:MM:SS>

## 项目信息
- **项目**: <project>
- **任务**: <task>
- **目标**: <goal>

## 当前任务
- **描述**: <task description>
- **约束**: <constraints>
- **上游产物**: <upstream outputs>

## 执行记录
[<HH:MM:SS>] 阶段任务文件已创建，任务状态更新为 in-progress

<!-- 任务执行过程记录，每次 append_phase_log 会追加此区块 -->

## 处理结果
（待填写）

<!--
__FINAL__: <ISO timestamp>
__FINAL__ 标记后的内容在读取时应被忽略
__FINAL__ 执行次数: <N>
-->
```

## Metadata 字段说明

| 字段 | 说明 | 必填 |
|------|------|------|
| `__PROJECT__` | 项目名称 | ✅ |
| `__EPIC__` | Epic 标识 | ✅ |
| `__AGENT__` | Agent 名称 | ✅ |
| `__START__` | 开始时间（ISO） | ✅ |
| `__STATUS__` | 状态（pending/in-progress/done） | ✅ |
| `__FINAL__` | 完成时间（ISO），仅最终完成时写入 | ✅ |

## 写入规范

### 创建阶段（Agent 领取任务后）
使用 `create_phase_file()` 或 `create_phase_file_from_claim()` 创建新文件，**不要**追加到已有文件。

### 执行记录（`append_phase_log`）
每次写入使用 `>>` 追加，不覆盖之前记录：
```bash
echo "[$(date '+%H:%M:%S')] <message>" >> "$phase_file"
```

### 完成阶段（`complete_phase_report`）
1. 追加完成记录到执行记录
2. 写入 `## 完成信息` 节
3. 写入 `__FINAL__` HTML 注释块
4. 发送 Slack 通知
5. 标记任务 done

## 读取规范

```bash
# 读取 phase 文件，自动忽略 __FINAL__ 后的内容
source /root/.openclaw/scripts/heartbeats/common.sh
content=$(read_phase_file "$phase_file")
```

Python 实现：
```python
def read_phase_file(path):
    with open(path) as f:
        content = f.read()
    if '__FINAL__' in content:
        content = content[:content.rfind('__FINAL__')]
    return content
```

## __FINAL__ 标记规范

- 位置：`<!--` + `__FINAL__: <timestamp>` + `-->` HTML 注释块
- 作用：标记文件已完成，读取时应忽略标记后的内容
- 追加：不修改原有内容，仅追加到文件末尾

```html
<!--
__FINAL__: 2026-03-29T12:00:00+08:00
__FINAL__ 标记后的内容在读取时应被忽略
__FINAL__ 执行次数: 1
-->
```

## 验收标准

1. 每次执行生成带时间戳的新文件，不追加到旧文件
2. `complete_phase_report()` 后文件包含 `__FINAL__` 标记
3. `read_phase_file()` 能正确忽略 `__FINAL__` 后的内容
4. 多次执行同一任务，phase 文件大小增长 < 10%

## 相关文件

| 文件 | 位置 | 说明 |
|------|------|------|
| `phase-file-template.md` | `scripts/` | 本模板 |
| `common.sh` | `scripts/heartbeats/` | `create_phase_file`, `complete_phase_report`, `read_phase_file` |
| `dev-heartbeat.sh` | `scripts/heartbeats/` | Dev 心跳脚本 |
