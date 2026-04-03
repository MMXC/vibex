# SPEC: 集成与增强 (F5-F6)

**Epic**: Epic 2 - 集成与增强  
**文件**: `dedup.py` + `task_manager.py` 改动

---

## F5.1: task_manager.py 集成

### 修改点

#### 1. 新增 `--check-dup` 命令

```bash
python3 task_manager.py check-dup "new-project-name" "项目目标是xxx"
```

**输出示例**:
```
🔍 检查项目: new-project-name
📊 目标相似度分析...
⚠️  找到 1 个相似项目:
   - homepage-fix (相似度 0.52)
     目标: 修复首页Bug
建议: 确认是否重复后使用 --force 创建
```

#### 2. create/phase1 命令中集成

在 `create` 和 `phase1` 命令流程中，自动调用 `check_duplicate_projects()`：

```python
# task_manager.py create/phase1 命令中
def handle_create(args):
    new_name = args.project
    new_goal = args.goal
    
    # 新增：重复检测
    dup_result = check_duplicate_projects(new_name, new_goal)
    if dup_result["level"] == "block":
        print(dup_result["message"])
        if not args.force:
            print("\n💡 使用 --force 强制创建（如确认不重复）")
            sys.exit(1)
        else:
            print("⚠️  已使用 --force 强制创建")
    elif dup_result["level"] == "warn":
        print(dup_result["message"])
        if not args.force and not args.yes:
            response = input("是否继续创建？(y/n): ")
            if response.lower() != 'y':
                sys.exit(0)
    
    # 继续原有创建逻辑...
```

#### 3. 新增 `--force` 和 `--yes` 参数

| 参数 | 说明 |
|------|------|
| `--force` | 绕过 block 警告强制创建 |
| `--yes` | 绕过 warn 确认直接创建 |
| `--no-check` | 完全跳过重复检测 |

---

## F6.1: 规则过滤器增强

### 规则 1: 完全相同项目名

```python
def exact_name_match(new_name: str, existing: list[dict]) -> list[dict]:
    """检测完全相同项目名"""
    return [p for p in existing if p["name"] == new_name]
```

### 规则 2: 前缀+日期相近

```python
import re
from datetime import datetime, timedelta

def prefix_date_match(new_name: str, new_created: datetime, existing: list[dict]) -> list[dict]:
    """检测相同前缀+7天内创建的项目"""
    # 提取前缀（如 "vibex-homepage-" 或 "proposal-"）
    prefix_match = re.match(r'^([a-zA-Z0-9_-]+-)', new_name)
    if not prefix_match:
        return []
    
    prefix = prefix_match.group(1)
    candidates = [
        p for p in existing 
        if p["name"].startswith(prefix) 
        and p.get("created")
    ]
    
    # 过滤 7 天内的
    return [
        p for p in candidates
        if abs((new_created - parse_date(p["created"])).days) <= 7
    ]
```

### 规则 3: 高频词命中

```python
HIGH_RISK_TERMS = [
    "fix", "修复", "bug", "修复Bug",
    "review", "审查",
    "homepage", "首页",
    "test", "测试"
]

def high_risk_term_match(new_goal: str, existing: list[dict]) -> list[dict]:
    """检测高风险词命中 + 目标关键词重叠"""
    new_terms = set(extract_keywords(new_goal)) & set(HIGH_RISK_TERMS)
    if not new_terms:
        return []
    
    return [
        p for p in existing
        if len(set(extract_keywords(p["goal"])) & new_terms) >= 2
    ]
```

### 综合规则过滤

```python
def rule_filter(new_project: dict, existing: list[dict]) -> list[dict]:
    """综合规则过滤器"""
    results = []
    
    # 规则1: 精确匹配
    exact = exact_name_match(new_project["name"], existing)
    for p in exact:
        results.append({**p, "rule": "exact-name", "severity": "high"})
    
    # 规则2: 前缀+日期
    prefix = prefix_date_match(new_project["name"], datetime.now(), existing)
    for p in prefix:
        if p not in [r["name"] for r in results]:
            results.append({**p, "rule": "prefix-date", "severity": "medium"})
    
    # 规则3: 高风险词
    risky = high_risk_term_match(new_project["goal"], existing)
    for p in risky:
        if p not in [r["name"] for r in results]:
            results.append({**p, "rule": "high-risk-term", "severity": "low"})
    
    return results
```

---

## 集成测试

### `test_integration_check_dup_command`

```python
def test_integration_check_dup_command():
    """端到端测试: check-dup 命令"""
    import subprocess
    result = subprocess.run(
        ["python3", "task_manager.py", "check-dup", "test-fix", "修复首页问题"],
        capture_output=True, text=True
    )
    assert result.returncode == 0
    assert "相似项目" in result.stdout or "未发现" in result.stdout
```

### `test_integration_force_flag`

```python
def test_integration_force_flag():
    """端到端测试: --force 绕过 block"""
    result = subprocess.run(
        ["python3", "task_manager.py", "create", "test-fix", "--force", "--goal", "修复Bug"],
        capture_output=True, text=True
    )
    # 不应因重复检测而退出
    assert "已使用 --force" in result.stdout or result.returncode == 0
```

### `test_performance_benchmark`

```python
def test_performance_benchmark():
    """性能测试: 50个项目 < 100ms"""
    import time
    existing = [{"name": f"project-{i}", "goal": f"目标{i}", "status": "active"} for i in range(50)]
    
    start = time.time()
    result = detect_duplicates({"name": "new-project", "goal": "新目标"}, existing)
    elapsed = time.time() - start
    
    assert elapsed < 0.1, f"性能超标: {elapsed:.3f}s"
```
