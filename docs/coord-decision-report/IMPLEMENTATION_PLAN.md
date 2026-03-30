# Implementation Plan: coord-decision-report 命令

> **项目**: coord-decision-report
> **阶段**: Phase1 — CLI + 集成
> **版本**: 1.0.0
> **日期**: 2026-03-30
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex

---

## 1. 概述

### 1.1 目标
实现独立 CLI 脚本 `coord_decision_report.py`，复用 `task-manager-current-report` 的分析器。

### 1.2 复用策略
- ✅ 完全复用 D1/D2/D3 分析器
- ✅ 完全复用报告生成器
- 🆕 仅新增 CLI 适配层

---

## 2. 文件变更

### 2.1 新建文件

| 文件 | 描述 | 复杂度 |
|------|------|--------|
| `coord_decision_report.py` | CLI 入口脚本 | 低 |
| `tests/coord_decision_report/` | 测试目录 | 低 |

### 2.2 依赖文件（已存在）

| 文件 | 来源 |
|------|------|
| `src/task_manager/current_report/*.py` | task-manager-current-report |

---

## 3. 详细实现

### 3.1 新建: `coord_decision_report.py`

```python
#!/usr/bin/env python3
"""
Coord Decision Report CLI

快速获取三个决策答案：
1. 下一步做什么？（Ready 任务建议）
2. 有没有卡住？（Blocked 根因）
3. 该不该创建新项目？（空转提案推荐）

用法:
    python coord_decision_report.py              # 文本输出
    python coord_decision_report.py --json      # JSON 输出
    python coord_decision_report.py --idle 3   # 设置连续空转次数
    python coord_decision_report.py --workspace /path/to/workspace

依赖:
    - src/task_manager/current_report/ (复用)
    - tasks.json
    - proposals/
"""

import argparse
import json
import sys
from pathlib import Path
from datetime import datetime


def load_tasks_json(workspace: str) -> dict:
    """加载 tasks.json"""
    tasks_file = Path(workspace) / "tasks.json"
    if not tasks_file.exists():
        return {"projects": {}}
    with open(tasks_file) as f:
        return json.load(f)


def get_idle_count(workspace: str) -> int:
    """获取连续空转次数"""
    count_file = Path(workspace) / ".heartbeat_count"
    if count_file.exists():
        try:
            return int(count_file.read_text().strip())
        except (ValueError, IOError):
            pass
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Coord 决策报告 - 快速获取三个决策答案",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python coord_decision_report.py
  python coord_decision_report.py --json
  python coord_decision_report.py --idle 3
  python coord_decision_report.py --workspace /root/.openclaw/vibex
        """
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="输出 JSON 格式"
    )
    parser.add_argument(
        "--idle",
        type=int,
        default=None,
        help="连续空转次数（默认: 从 .heartbeat_count 读取）"
    )
    parser.add_argument(
        "--workspace",
        default="/root/.openclaw/vibex",
        help="工作目录（默认: /root/.openclaw/vibex）"
    )
    parser.add_argument(
        "--proposals-dir",
        default="proposals",
        help="提案库目录（默认: proposals）"
    )
    
    args = parser.parse_args()
    
    # 加载数据
    tasks_json = load_tasks_json(args.workspace)
    idle_count = args.idle if args.idle is not None else get_idle_count(args.workspace)
    
    # 复用分析器
    try:
        src_path = Path(args.workspace) / "src" / "task_manager"
        sys.path.insert(0, str(src_path))
        from current_report import (
            generate_report,
            format_as_text,
            format_as_json
        )
        
        proposals_path = Path(args.workspace) / args.proposals_dir
        report = generate_report(
            tasks_json,
            consecutive_idle=idle_count,
            proposals_dir=str(proposals_path)
        )
        
        # 输出
        if args.json:
            print(format_as_json(report))
        else:
            print(format_as_text(report))
        
        # 退出码：有阻塞或连续空转 >= 3 时返回非零
        has_blocked = len(report.blocked_tasks) > 0
        should_alert = has_blocked or idle_count >= 3
        sys.exit(1 if should_alert else 0)
        
    except ImportError as e:
        # 分析器未找到，使用简化输出
        print("⚠️ 警告: 分析器模块未找到，使用简化输出", file=sys.stderr)
        print("=== Coord Decision Report ===", file=sys.stderr)
        print(f"Generated: {datetime.now().isoformat()}", file=sys.stderr)
        print("--- Ready to Execute ---", file=sys.stderr)
        print("📋 (分析器未加载)", file=sys.stderr)
        print("--- Blocked Tasks ---", file=sys.stderr)
        print("🔴 (分析器未加载)", file=sys.stderr)
        print("--- Idle Status ---", file=sys.stderr)
        print(f"⏳ 0 active | 📋 0 ready | 连续空转: {idle_count}/3", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
```

### 3.2 新建: `tests/coord_decision_report/__init__.py`

```python
"""Tests for coord_decision_report"""
```

### 3.3 新建: `tests/coord_decision_report/test_cli.py`

```python
"""CLI tests for coord_decision_report"""

import pytest
import json
import sys
from pathlib import Path
from io import StringIO
from unittest.mock import patch

# 添加 src 到 path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))


def test_load_tasks_json(tmp_path):
    """测试加载 tasks.json"""
    tasks = {"projects": {"test": {"status": "active", "tasks": []}}}
    tasks_file = tmp_path / "tasks.json"
    tasks_file.write_text(json.dumps(tasks))
    
    # 导入前设置 path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from coord_decision_report import load_tasks_json
    
    result = load_tasks_json(str(tmp_path))
    assert result == tasks


def test_load_tasks_json_not_exists(tmp_path):
    """测试 tasks.json 不存在时返回空结构"""
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from coord_decision_report import load_tasks_json
    
    result = load_tasks_json(str(tmp_path))
    assert result == {"projects": {}}


def test_get_idle_count(tmp_path):
    """测试获取空转计数"""
    count_file = tmp_path / ".heartbeat_count"
    count_file.write_text("5")
    
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from coord_decision_report import get_idle_count
    
    result = get_idle_count(str(tmp_path))
    assert result == 5


def test_get_idle_count_not_exists(tmp_path):
    """测试计数文件不存在时返回 0"""
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from coord_decision_report import get_idle_count
    
    result = get_idle_count(str(tmp_path))
    assert result == 0
```

---

## 4. 测试

### 4.1 单元测试

```bash
# 运行测试
pytest tests/coord_decision_report/ -v

# 覆盖率
pytest tests/coord_decision_report/ --cov=coord_decision_report --cov-report=term-missing
```

### 4.2 集成测试

```bash
# 1. 文本输出
python coord_decision_report.py

# 2. JSON 输出
python coord_decision_report.py --json | python -m json.tool

# 3. 指定空转次数
python coord_decision_report.py --idle 3

# 4. 指定工作目录
python coord_decision_report.py --workspace /root/.openclaw/vibex

# 5. 执行时间
time python coord_decision_report.py
```

---

## 5. 估计工时

| 任务 | 估计 |
|------|------|
| CLI 脚本实现 | 0.5h |
| 测试 | 0.5h |
| 集成到 coord-heartbeat | 0.5h |
| **总计** | **~1.5h** |

---

## 6. 验收标准

- [ ] `coord_decision_report.py` 可执行
- [ ] 文本输出格式正确
- [ ] `--json` 输出 valid JSON
- [ ] 执行时间 < 2 秒
- [ ] 复用 task-manager 分析器
- [ ] 测试通过

---

*本文档由 Architect Agent 生成*
