# SPEC: 核心算法 (F1-F4)

**Epic**: Epic 1 - 核心算法  
**文件**: `task_manager.py` 同目录 `dedup.py`

---

## 接口规格

### `dedup.py`

#### `extract_keywords(text: str) -> set[str]`

从文本中提取关键词集合。

**参数**:
- `text`: 待处理文本（项目名+目标描述）

**返回**: 关键词集合（小写，移除停用词和长度<3的词）

**停用词列表**（中文+英文）:
```python
STOPWORDS = {'的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', 
             '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
             '自己', '这', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
             'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being'}
```

**伪代码**:
```
1. 转为小写
2. 移除标点符号
3. 分词（按空格+中文连续字符）
4. 过滤停用词
5. 过滤长度 < 3 的词
6. 返回集合
```

---

#### `similarity_score(proj_a: dict, proj_b: dict) -> float`

计算两个项目的相似度。

**参数**:
- `proj_a`: `{"name": "...", "goal": "...", "description": "..."}` 
- `proj_b`: 同上

**返回**: Jaccard 相似度 `[0.0, 1.0]`

**算法**:
```
keywords_a = extract_keywords(proj_a['name'] + ' ' + proj_a['goal'])
keywords_b = extract_keywords(proj_b['name'] + ' ' + proj_b['goal'])
return len(keywords_a ∩ keywords_b) / len(keywords_a ∪ keywords_b)
```

**边界条件**:
- 任一项目关键词为空 → 返回 0.0
- 两项目完全相同 → 返回 1.0

---

#### `detect_duplicates(new_project: dict, existing_projects: list[dict], threshold: float = 0.4) -> list[dict]`

检测重复项目。

**参数**:
- `new_project`: 待检测项目 `{"name": "...", "goal": "..."}`
- `existing_projects`: 现有项目列表
- `threshold`: 相似度阈值，默认 0.4

**返回**: 按相似度降序排列的重复候选列表
```json
[
  {"name": "...", "goal": "...", "similarity": 0.75},
  {"name": "...", "goal": "...", "similarity": 0.52}
]
```

---

#### `alert_level(similarity: float) -> str`

根据相似度返回告警级别。

**参数**: `similarity`: 0.0-1.0

**返回**: `"block"` | `"warn"` | `"pass"`

| 范围 | 返回 |
|------|------|
| >0.7 | `"block"` |
| 0.4-0.7 | `"warn"` |
| <0.4 | `"pass"` |

---

## 数据结构

### 项目数据模型（从 team-tasks JSON 读取）

```python
@dataclass
class ProjectInfo:
    name: str           # 项目名
    goal: str           # 目标描述
    status: str        # active/completed/terminated
    created: str        # ISO 时间戳
    mode: str           # dag/linear
```

### 加载现有项目

```python
def load_existing_projects(workspace: str = None) -> list[dict]:
    """从 team-tasks 数据目录加载所有活跃项目"""
    # 路径: /home/ubuntu/clawd/data/team-tasks/*.json
    # 过滤: status == "active"
    # 返回: list[ProjectInfo]
```

---

## 集成接口

### `check_duplicate_projects(name: str, goal: str) -> dict`

task_manager.py 调用的主入口。

```python
def check_duplicate_projects(name: str, goal: str) -> dict:
    """
    返回:
    {
        "level": "block|warn|pass",
        "candidates": [...],  # 相似项目列表
        "message": str
    }
    """
```

**调用示例**:
```python
# 在 task_manager.py create 命令中
result = check_duplicate_projects(new_name, new_goal)
if result["level"] == "block":
    print("❌ 项目名/目标与现有项目高度相似，建议检查:")
    for c in result["candidates"]:
        print(f"  - {c['name']} (相似度 {c['similarity']:.2f})")
    sys.exit(1)
elif result["level"] == "warn":
    print("⚠️  存在相似项目，建议确认:")
    ...
```

---

## 测试用例

### `test_extract_keywords`
```python
def test_extract_keywords():
    kw = extract_keywords("建立提案重复检测机制")
    assert "提案" in kw
    assert "重复" in kw
    assert "检测" in kw
    assert "机制" in kw
    assert "的" not in kw  # 停用词过滤
    assert "a" not in kw   # 长度<3过滤
```

### `test_similarity_score`
```python
def test_similarity_score():
    p1 = {"name": "test-project", "goal": "修复首页Bug"}
    p2 = {"name": "test-project", "goal": "修复首页Bug"}
    assert similarity_score(p1, p2) == 1.0
    
    p3 = {"name": "diff-project", "goal": "完全不同的功能"}
    assert similarity_score(p1, p3) < 0.3
```

### `test_alert_level`
```python
def test_alert_level():
    assert alert_level(0.8) == "block"
    assert alert_level(0.5) == "warn"
    assert alert_level(0.2) == "pass"
```

### `test_detect_duplicates`
```python
def test_detect_duplicates():
    existing = [
        {"name": "homepage-fix", "goal": "修复首页Bug", "status": "active"},
        {"name": "api-retry", "goal": "API重试机制", "status": "active"},
    ]
    new = {"name": "homepage-bug-fix", "goal": "修复首页问题"}
    result = detect_duplicates(new, existing, threshold=0.3)
    assert len(result) >= 1
    assert result[0]["name"] == "homepage-fix"
```
