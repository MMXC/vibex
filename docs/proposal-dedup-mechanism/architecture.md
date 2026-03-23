# Architecture: proposal-dedup-mechanism

**项目**: proposal-dedup-mechanism  
**角色**: Architect  
**设计时间**: 2026-03-23  
**状态**: Draft v1.0  

---

## 1. 背景与目标

提案重复检测机制旨在解决当前提案系统中重复创建项目的问题。通过在 `task_manager.py` 中集成重复检测能力，在 coord 创建新项目前自动比对现有项目，避免资源浪费和决策阻塞。

**核心目标**：
- 相似度 > 0.7 → 阻止创建，提示检查现有项目
- 相似度 0.4-0.7 → 警告，建议确认
- 相似度 < 0.4 → 放行
- 检测性能 < 100ms（50 个现有项目）

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     Coord Agent (人)                             │
│         创建新项目 → task_manager.py create <name>               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              task_manager.py (扩展)                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  CLI Hook    │───▶│ DedupEngine  │───▶│  Decision    │       │
│  │  (create)    │    │  (check)     │    │  (alert)     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  dedup/ 模块 (新增)                              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ keywords.py │  │ similarity.py│ │ rules.py    │              │
│  │ - extract   │  │ - jaccard   │  │ - name_match│              │
│  │ - stopwords │  │ - score     │  │ - prefix_dt │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │ detector.py │  │ config.py   │                               │
│  │ - detect    │  │ - thresholds│                               │
│  │ - load_proj │  │ - env override                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│           team-tasks-data/projects/*.json                       │
│                  (现有项目数据，只读)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 目录结构

```
~/.openclaw/workspace/vibex/
├── skills/team-tasks/
│   ├── scripts/
│   │   ├── task_manager.py          # 扩展: create/claim 前调用 dedup
│   │   └── dedup/
│   │       ├── __init__.py          # 导出 Detector, check_duplicates
│   │       ├── keywords.py          # 关键词提取
│   │       ├── similarity.py        # 相似度计算
│   │       ├── rules.py             # 规则过滤器
│   │       ├── detector.py          # 主检测引擎
│   │       ├── config.py            # 阈值配置
│   │       └── tests/
│   │           ├── __init__.py
│   │           ├── test_keywords.py
│   │           ├── test_similarity.py
│   │           ├── test_rules.py
│   │           └── test_detector.py
│   └── data/                        # team-tasks 数据目录
│       └── projects/                # 现有项目 JSON 文件
```

**文件变更摘要**：

| 操作 | 文件 |
|-------|------|
| 新增 | `dedup/__init__.py`, `keywords.py`, `similarity.py`, `rules.py`, `detector.py`, `config.py` |
| 新增 | `dedup/tests/` 下 4 个测试文件 |
| 修改 | `task_manager.py` 添加 `--check-dup` 和 `create` 钩子 |

---

## 4. 核心模块设计

### 4.1 `config.py` — 配置中心

```python
# 阈值配置（可通过环境变量覆盖）
THRESHOLD_BLOCK = float(os.getenv("DEDUP_THRESHOLD_BLOCK", "0.7"))
THRESHOLD_WARN  = float(os.getenv("DEDUP_THRESHOLD_WARN", "0.4"))
# 可选：升级到 TF-IDF
USE_TFIDF       = os.getenv("DEDUP_USE_TFIDF", "0") == "1"
# override token（用于绕过 block）
FORCE_TOKEN     = os.getenv("DEDUP_FORCE_TOKEN", "")
```

**设计原则**：
- 所有阈值可通过环境变量调整，无需改代码
- 提供 `FORCE_TOKEN` 支持误报绕过

---

### 4.2 `keywords.py` — 关键词提取

```python
STOPWORDS = {"的", "在", "和", "是", "了", "with", "the", "for", "a", "an"}

def extract_keywords(text: str) -> set[str]:
    """从文本中提取关键词，移除停用词和短词（<3字符）"""
    words = re.findall(r'\b[\w]{3,}\b', text.lower())
    return set(w for w in words if w not in STOPWORDS)

def extract_project_keywords(project: dict) -> set[str]:
    """从项目字典中提取完整关键词集（name + goal + description）"""
    fields = [project.get("name", ""), project.get("goal", ""), project.get("description", "")]
    kw = set()
    for f in fields:
        kw |= extract_keywords(f)
    return kw
```

**中英文分词**：
- 英文：正则 `\b[\w]{3,}\b` 提取单词
- 中文：正则 `\b[\u4e00-\u9fff]{2,}\b` 提取中文词
- 统一转为小写后去重

---

### 4.3 `similarity.py` — 相似度计算

```python
def jaccard_similarity(kw1: set, kw2: set) -> float:
    """Jaccard 相似度: |A ∩ B| / |A ∪ B|"""
    if not kw1 or not kw2:
        return 0.0
    return len(kw1 & kw2) / len(kw1 | kw2)

def compute_similarity(proj_a: dict, proj_b: dict) -> float:
    """计算两个项目的综合相似度"""
    kw_a = extract_project_keywords(proj_a)
    kw_b = extract_project_keywords(proj_b)
    return jaccard_similarity(kw_a, kw_b)
```

**升级路径**：
```
Phase 1: Jaccard (当前) → Phase 2: TF-IDF (可选) → Phase 3: Embedding (可选)
```

---

### 4.4 `rules.py` — 规则过滤器

独立于相似度分数的硬规则：

| 规则 | 条件 | 结果 |
|------|------|------|
| `EXACT_NAME` | 项目名完全相同 | `duplicate-name` |
| `SAME_PREFIX_RECENT` | 相同前缀 + 7天内创建 | `suspicious` |
| `EXACT_GOAL` | 目标文字完全相同 | `duplicate-goal` |

```python
RULES = [
    ("EXACT_NAME", lambda new, existing: new["name"].lower() == existing["name"].lower()),
    ("EXACT_GOAL", lambda new, existing: new.get("goal", "").strip() == existing.get("goal", "").strip()),
    ("SAME_PREFIX_RECENT", check_same_prefix_recent),  # 前缀相同且 7 天内
]

def apply_rules(new_proj: dict, existing_proj: dict) -> list[str]:
    """返回触发的规则名称列表"""
    return [name for name, rule_fn in RULES if rule_fn(new_proj, existing_proj)]
```

---

### 4.5 `detector.py` — 检测引擎（主入口）

```python
from .keywords import extract_project_keywords
from .similarity import compute_similarity
from .rules import apply_rules
from .config import THRESHOLD_BLOCK, THRESHOLD_WARN

@dataclass
class DedupResult:
    project_name: str
    similarity: float
    rules_triggered: list[str]
    alert: str  # "block" | "warn" | "pass"

def check_duplicates(new_name: str, new_goal: str, new_desc: str = "") -> list[DedupResult]:
    """
    主检测函数：从所有现有项目中找出与新项目相似的项目。
    返回按相似度降序排列的结果列表。
    """
    new_proj = {"name": new_name, "goal": new_goal, "description": new_desc}
    existing = load_all_projects()  # 从 team-tasks-data/projects/ 加载
    
    results = []
    for proj in existing:
        score = compute_similarity(new_proj, proj)
        rules = apply_rules(new_proj, proj)
        
        # 规则优先：规则触发则直接 block
        if rules:
            alert = "block"
        elif score > THRESHOLD_BLOCK:
            alert = "block"
        elif score > THRESHOLD_WARN:
            alert = "warn"
        else:
            alert = "pass"
        
        if alert != "pass":  # 只返回需要关注的结果
            results.append(DedupResult(
                project_name=proj["name"],
                similarity=score,
                rules_triggered=rules,
                alert=alert,
            ))
    
    return sorted(results, key=lambda x: -x.similarity)


def load_all_projects() -> list[dict]:
    """从 team-tasks-data/projects/ 目录加载所有项目 JSON"""
    # 实现：遍历目录，解析每个 JSON 文件
    pass
```

---

## 5. task_manager.py 集成

### 5.1 新增命令

```bash
# 独立检测命令
python3 task_manager.py check-dup <项目名> [--goal "目标"]
```

输出示例：

```
🔍 检测重复项目: vibex-homepage-improvements

  🚨 EXACT_NAME 重复 (score=1.00)
     → vibex-homepage-improvements (已存在)

  ⚠️  相似项目 (score=0.52)
     → vibex-homepage-redesign

  ✅ 无重复，放行
```

### 5.2 create 钩子

在 `task_manager.py` 的 `create` action 中：

```python
def cmd_create(args):
    # 1. 解析参数
    project_name = args.project
    project_goal = args.goal or ""
    
    # 2. 调用重复检测
    if not args.force:
        results = check_duplicates(project_name, project_goal)
        blocks = [r for r in results if r.alert == "block"]
        warns = [r for r in results if r.alert == "warn"]
        
        if blocks:
            print("🚨 检测到重复项目，创建被阻止:")
            for b in blocks:
                print(f"   - {b.project_name} (score={b.similarity:.2f}, rules={b.rules_triggered})")
            print("   使用 --force 强制创建")
            sys.exit(1)
        
        if warns:
            print("⚠️  警告：检测到相似项目:")
            for w in warns:
                print(f"   - {w.project_name} (score={w.similarity:.2f})")
            # 不阻止，仅警告
    
    # 3. 继续原有创建流程
    do_create_project(project_name, project_goal)
```

### 5.3 新增参数

| 参数 | 用途 | 默认值 |
|------|------|--------|
| `--check-dup` | 独立检测模式 | False |
| `--force` | 绕过 block，强制创建 | False |
| `--goal` | 项目目标（check-dup 用） | "" |
| `--threshold-block` | 覆盖 block 阈值 | config 值 |
| `--threshold-warn` | 覆盖 warn 阈值 | config 值 |

---

## 6. 数据流

```
用户输入 (name, goal)
       │
       ▼
┌─────────────────┐
│ extract_keywords │  提取中文+英文关键词
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ load_all_proj   │  读取 team-tasks-data/projects/*.json
└────────┬────────┘
         │
         ▼
    ┌────────────┐      ┌────────────────────┐
    │ For each   │─────▶│ apply_rules        │ 硬规则过滤
    │ existing   │      └─────────┬──────────┘
    │ project    │                │
    │            │                ▼
    │            │      ┌────────────────────┐
    │            │─────▶│ compute_similarity │ Jaccard 计算
    │            │      └─────────┬──────────┘
    └────────────┘                │
                                  ▼
                          ┌────────────────────┐
                          │ determine_alert    │ block/warn/pass
                          └─────────┬──────────┘
                                    │
                                    ▼
                          ┌────────────────────┐
                          │ format_output      │ 人类可读输出
                          └────────────────────┘
```

---

## 7. Epic 拆分与交付物

### Epic 1: 核心算法（2h）

| 交付物 | 文件 |
|--------|------|
| 关键词提取模块 | `dedup/keywords.py` |
| 相似度计算模块 | `dedup/similarity.py` |
| 规则过滤器 | `dedup/rules.py` |
| 主检测引擎 | `dedup/detector.py` |
| 配置中心 | `dedup/config.py` |
| 单元测试（覆盖率 ≥ 80%）| `dedup/tests/` |

**DoD**：
- `pytest dedup/tests/ -v` 全部通过
- `coverage report` ≥ 80%

### Epic 2: 集成与增强（2h）

| 交付物 | 文件 |
|--------|------|
| task_manager.py 集成 | `task_manager.py` |
| CLI `check-dup` 命令 | `task_manager.py` |
| 端到端集成测试 | `test_dedup_integration.py` |
| benchmark 测试 | `benchmark_dedup.py` |

**DoD**：
- `task_manager.py check-dup test --goal "测试"` 输出正确
- benchmark < 100ms（50 个现有项目）

---

## 8. 性能估算

| 操作 | 复杂度 | 50 个项目耗时 |
|------|--------|-------------|
| 关键词提取 | O(n) 字符数 | < 5ms |
| 相似度计算 | O(m) 关键词数 | < 10ms/项目 |
| 总计 | O(p * m) | < 100ms ✅ |

注：`m` = 关键词数量（通常 10-50），`p` = 项目数量（当前 50）

---

## 9. 升级路径

```
当前阶段（v1.0）
  └─ Jaccard 关键词相似度 + 规则过滤
       └─ 适用：项目名和目标表述直接、简短

中期（v1.1，可选）
  └─ 升级为 TF-IDF + 余弦相似度
       └─ 适用：描述文本较长、词汇差异大

远期（v2.0，可选）
  └─ 升级为 Embedding API 语义向量
       └─ 适用：高度语义相似但表述完全不同
```

**升级策略**：保持 `detector.py` 接口不变，替换 `similarity.py` 底层实现即可平滑升级。

---

## 10. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 误报阻止正常提案 | 高 | 提供 `--force` override + 环境变量阈值可调 |
| 跨语言（中/英）分词不准确 | 中 | 中文正则提取单独处理，与英文结果合并去重 |
| 性能退化（项目数增长）| 低 | 当前算法 O(n*m)，100 个项目内无压力；超量后可加缓存 |
| 依赖外部 sklearn/embedding API | 低 | Phase 1/2 不依赖外部库；TF-IDF/Embedding 可选升级 |

---

## 11. 测试策略

| 级别 | 测试内容 | 工具 |
|------|---------|------|
| 单元测试 | keywords / similarity / rules / detector | `pytest` |
| 集成测试 | task_manager.py 集成流程 | `pytest` + subprocess |
| 性能测试 | 50/100/500 项目的 benchmark | `timeit` |
| 回归测试 | 确保不阻塞正常提案创建 | 现有项目名 + 随机目标 |

---

*Architecture version: 1.0 — 2026-03-23*
