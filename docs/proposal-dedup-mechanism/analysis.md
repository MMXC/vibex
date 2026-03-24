# Analysis: proposal-dedup-mechanism

**任务**: `proposal-dedup-mechanism / analyze-requirements`  
**分析师**: analyst  
**分析时间**: 2026-03-23 23:22 (Asia/Shanghai)  
**目标**: 研究提案重复检测机制，评估技术方案

---

## 1. 问题陈述

### 1.1 问题描述

当前提案系统存在重复创建问题：

| 现象 | 示例 |
|------|------|
| 项目目标重复 | `vibex-homepage-final-review` vs `homepage-redesign` |
| 分析阶段重复 | `reviewer-epic2-fix` vs `reviewer-epic2-proposalcollection-fix` |
| 产出物路径不同 | 同一提案分散在多个目录 |

**影响**：
- 浪费 analyst 资源重复分析
- 阻塞协调决策
- 项目状态不一致

### 1.2 根因

1. **缺乏提案唯一性检查**：创建新项目前未比对现有项目
2. **项目命名不规范**：同一问题可用多个名称
3. **缺乏相似度检测**：无法识别语义重复的提案

---

## 2. 技术方案

### 方案 A：关键词 + 规则匹配（推荐）

**原理**: 基于项目名、目标、描述的关键词提取和规则匹配。

```python
import re
from collections import Counter

def extract_keywords(text: str) -> set:
    # 移除停用词，提取关键短语
    words = re.findall(r'\b\w{3,}\b', text.lower())
    return set(words)

def similarity_score(proj1: dict, proj2: dict) -> float:
    """基于关键词重叠度计算相似度"""
    kw1 = extract_keywords(proj1['goal']) | extract_keywords(proj1.get('description', ''))
    kw2 = extract_keywords(proj2['goal']) | extract_keywords(proj2.get('description', ''))
    
    if not kw1 or not kw2:
        return 0.0
    
    intersection = kw1 & kw2
    union = kw1 | kw2
    return len(intersection) / len(union)

# 阈值: >0.5 判定为重复
```

**优点**：
- 实现简单，依赖少（仅 Python 标准库）
- 运行速度快
- 可解释性强

**缺点**：
- 无法识别语义相似但表述不同的情况

---

### 方案 B：TF-IDF + Cosine Similarity

**原理**: 将项目描述转为 TF-IDF 向量，计算余弦相似度。

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def detect_duplicates(projects: list[dict], threshold: float = 0.3) -> list[tuple]:
    """返回所有相似度超过阈值的项目对"""
    texts = [p['goal'] + ' ' + p.get('description', '') for p in projects]
    
    vectorizer = TfidfVectorizer(max_features=1000)
    tfidf_matrix = vectorizer.fit_transform(texts)
    
    similarities = cosine_similarity(tfidf_matrix)
    
    duplicates = []
    n = len(projects)
    for i in range(n):
        for j in range(i+1, n):
            if similarities[i][j] > threshold:
                duplicates.append((projects[i]['name'], projects[j]['name'], similarities[i][j]))
    
    return duplicates
```

**优点**：
- 可识别表述不同但语义相似的提案
- 有成熟库支持

**缺点**：
- 需要 sklearn 依赖
- 解释性较弱

---

### 方案 C：语义嵌入（AI驱动）

**原理**: 使用 Embedding API 将提案文本转为向量，计算语义相似度。

```python
import openai

def embed_text(text: str) -> list[float]:
    response = openai.Embedding.create(
        model="text-embedding-3-small",
        input=text
    )
    return response['data'][0]['embedding']

def semantic_similarity(emb1: list, emb2: list) -> float:
    # 余弦相似度
    dot = sum(a*b for a,b in zip(emb1, emb2))
    norm1 = sum(a*a for a in emb1)**0.5
    norm2 = sum(b*b for b in emb2)**0.5
    return dot / (norm1 * norm2)

# 调用示例
emb1 = embed_text("修复 page.test.tsx 中 4 个测试失败")
emb2 = embed_text("page.test.tsx 4 个 E2E 测试修复")
print(semantic_similarity(emb1, emb2))  # 高相似度
```

**优点**：
- 最佳准确率，捕捉语义
- 可处理复杂表述

**缺点**：
- 需要 API 调用（有成本）
- 有延迟
- 依赖外部服务

---

## 3. 推荐方案

### 选择：方案 A（关键词 + 规则匹配）

理由：
1. **无额外依赖**：仅 Python 标准库
2. **快速实现**：< 1 天
3. **适用于简单场景**：提案项目名和目标通常表述直接
4. **可逐步升级**：检测到高相似度后人工确认

**增强**：结合规则过滤：
- 完全相同项目名 → 直接报警
- 相同前缀 + 日期相近 → 重复嫌疑
- 目标关键词 >50% 重叠 → 需审查

---

## 4. 实现建议

### 4.1 集成点

**时机**: coord 创建新项目前 / analyst 执行 analyze-requirements 前

```python
# 在 task_manager.py 的 create 或 claim 流程中调用
def check_duplicate_projects(new_project_name: str, new_goal: str) -> list[dict]:
    existing = load_all_projects()  # 从 team-tasks/projects/ 加载
    candidates = []
    for p in existing:
        score = similarity_score({'name': new_project_name, 'goal': new_goal}, p)
        if score > 0.4:
            candidates.append({**p, 'similarity': score})
    return sorted(candidates, key=lambda x: -x['similarity'])
```

### 4.2 告警机制

| 相似度 | 动作 |
|--------|------|
| >0.7 | 🚨 阻止创建，提示检查现有项目 |
| 0.4-0.7 | ⚠️ 警告，建议确认 |
| <0.4 | ✅ 放行 |

---

## 5. 验收标准

| # | 标准 | 测试方法 |
|---|------|---------|
| V1 | 相同项目名检测准确率 100% | 单元测试 |
| V2 | 相似目标（>0.5）检测率 ≥ 80% | 人工标注数据集测试 |
| V3 | 误报率（不相似被标记）< 10% | 人工标注数据集测试 |
| V4 | 集成到 task_manager.py 无性能影响 | benchmark < 100ms |

---

## 6. 风险与约束

| 风险 | 影响 | 缓解 |
|------|------|------|
| 误报阻止正常提案 | 中 | 阈值可调，提供 override 选项 |
| 跨语言表述（英/中）| 低 | 中英文分词处理 |
| 依赖 sklearn | 低 | 方案A无需依赖 |

---

## 8. 复验 (2026-03-24)

**复验时间**: 2026-03-24 10:00

**结论**: 分析内容仍然有效，无需更新。

**状态**: ✅ 已就绪，等待 coord 决策后实施

---

## 7. 范围问题提醒（来自 PM 提案）

PM 提案提到 `vibex-reactflow-visualization` 范围过大（6 Epic），建议拆分两阶段。

**分析发现**：这与提案重复检测问题本质相同——缺乏项目范围边界审查机制。建议提案重复检测机制 **一并审查项目范围**，避免范围蔓延。
