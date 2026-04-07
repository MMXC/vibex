"""
dedup.py - 提案重复检测核心算法

提供关键词提取、相似度计算、重复检测功能。
仅使用 Python 标准库 (re, json, pathlib, dataclasses)。

Epic 1: 核心算法 (F1-F4)
"""

import os
import re
import json
import pathlib
from dataclasses import dataclass
from typing import Optional

# ==================== 常量 ====================

STOPWORDS = {
    # 中文停用词
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
    '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
    '自己', '这', '那', '但', '还', '又', '与', '或', '把', '被',
    '让', '从', '向', '对', '而', '之', '以', '及', '于', '中', '下', '过',
    # 英文停用词
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'it', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
    'she', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
}

# 告警阈值
THRESHOLD_BLOCK = 0.7  # 高度相似 → block
THRESHOLD_WARN = 0.4    # 中度相似 → warn


# ==================== 数据模型 ====================

@dataclass
class ProjectInfo:
    """项目信息数据模型"""
    name: str
    goal: str
    status: str = "active"
    created: str = ""
    mode: str = "linear"

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "goal": self.goal,
            "status": self.status,
            "created": self.created,
            "mode": self.mode,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "ProjectInfo":
        return cls(
            name=data.get("name", ""),
            goal=data.get("goal", ""),
            status=data.get("status", "active"),
            created=data.get("created", ""),
            mode=data.get("mode", "linear"),
        )


# ==================== F1: 关键词提取 ====================

def extract_keywords(text: str) -> set[str]:
    """
    从文本中提取关键词集合。
    
    Args:
        text: 待处理文本（项目名+目标描述）
    
    Returns:
        关键词集合（小写，移除停用词和长度<2的词）
    
    Algorithm:
        1. 转为小写
        2. 移除标点符号
        3. 分词：
           - 英文/数字: 连续字符
           - 中文: bigram（连续2字）+ 单字（>=3字时保留单字）
        4. 过滤停用词
        5. 过滤长度 < 2 的词
        6. 返回集合
    """
    if not text:
        return set()
    
    # 1. 转为小写
    text = text.lower()
    
    # 2. 移除标点符号（保留中文、英文、数字）
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # 3. 分词
    keywords: set[str] = set()
    
    # 英文/数字: 连续字符
    english_words = re.findall(r'[a-z0-9]+', text)
    keywords.update(english_words)
    
    # 中文: 提取 bigram（连续2字）
    chinese_chars = re.findall(r'[\u4e00-\u9fff]', text)
    for i in range(len(chinese_chars) - 1):
        bigram = chinese_chars[i] + chinese_chars[i + 1]
        keywords.add(bigram)
    
    # 4-5. 过滤停用词和长度 < 2 的词（保留中文bigram和英文短词）
    keywords = {
        w for w in keywords
        if w not in STOPWORDS and len(w) >= 2
    }
    
    return keywords


# ==================== F2: 相似度计算 ====================

def similarity_score(proj_a: dict, proj_b: dict) -> float:
    """
    计算两个项目的相似度（Jaccard 相似度）。
    
    Args:
        proj_a: 项目A {"name": "...", "goal": "...", "description": "..."}
        proj_b: 项目B 同上
    
    Returns:
        Jaccard 相似度 [0.0, 1.0]
    
    Algorithm:
        keywords_a = extract_keywords(proj_a['name'] + ' ' + proj_a['goal'])
        keywords_b = extract_keywords(proj_b['name'] + ' ' + proj_b['goal'])
        return len(keywords_a ∩ keywords_b) / len(keywords_a ∪ keywords_b)
    
    Edge cases:
        - 任一项目 name 为空 → 返回 0.0
        - 两项目完全相同 → 返回 1.0
    """
    name_a = proj_a.get('name', '').strip()
    name_b = proj_b.get('name', '').strip()
    
    # 边界：任一项目名为空
    if not name_a or not name_b:
        return 0.0
    
    goal_a = proj_a.get('goal', '').strip()
    goal_b = proj_b.get('goal', '').strip()
    
    keywords_a = extract_keywords(f"{name_a} {goal_a}")
    keywords_b = extract_keywords(f"{name_b} {goal_b}")
    
    # 边界：关键词为空
    if not keywords_a or not keywords_b:
        return 0.0
    
    # Jaccard 相似度
    intersection = keywords_a & keywords_b
    union = keywords_a | keywords_b
    
    return len(intersection) / len(union) if union else 0.0


# ==================== F3: 重复检测 ====================

def detect_duplicates(
    new_project: dict,
    existing_projects: list[dict],
    threshold: float = 0.4
) -> list[dict]:
    """
    检测重复项目。
    
    Args:
        new_project: 待检测项目 {"name": "...", "goal": "..."}
        existing_projects: 现有项目列表
        threshold: 相似度阈值，默认 0.4
    
    Returns:
        按相似度降序排列的重复候选列表
        [
            {"name": "...", "goal": "...", "similarity": 0.75},
            {"name": "...", "goal": "...", "similarity": 0.52}
        ]
    """
    candidates = []
    
    for proj in existing_projects:
        # 跳过非活跃项目
        if proj.get("status") != "active":
            continue
        
        sim = similarity_score(new_project, proj)
        
        if sim >= threshold:
            candidates.append({
                "name": proj.get("name", ""),
                "goal": proj.get("goal", ""),
                "status": proj.get("status", ""),
                "created": proj.get("created", ""),
                "similarity": round(sim, 4),
            })
    
    # 按相似度降序排列
    candidates.sort(key=lambda x: x["similarity"], reverse=True)
    
    return candidates


# ==================== F4: 告警机制 ====================

def alert_level(similarity: float) -> str:
    """
    根据相似度返回告警级别。
    
    Args:
        similarity: 相似度 0.0-1.0
    
    Returns:
        "block" | "warn" | "pass"
    
    | 范围   | 返回   |
    |--------|--------|
    | >0.7   | "block" |
    | 0.4-0.7| "warn"  |
    | <0.4   | "pass"  |
    """
    if similarity > THRESHOLD_BLOCK:
        return "block"
    elif similarity >= THRESHOLD_WARN:
        return "warn"
    else:
        return "pass"


def format_alert_message(level: str, candidates: list[dict]) -> str:
    """格式化告警消息"""
    if level == "block":
        msg = "❌ 项目名/目标与现有项目高度相似，建议检查:"
    elif level == "warn":
        msg = "⚠️  存在相似项目，建议确认:"
    else:
        return "✅ 未发现重复项目"
    
    for c in candidates[:5]:  # 最多显示5个
        msg += f"\n   - {c['name']} (相似度 {c['similarity']:.2f})"
        if c.get('goal'):
            msg += f"\n     目标: {c['goal'][:50]}..."
    
    if len(candidates) > 5:
        msg += f"\n   ... 还有 {len(candidates) - 5} 个相似项目"
    
    return msg


# ==================== 项目加载 ====================

def load_existing_projects(workspace: Optional[str] = None) -> list[dict]:
    """
    从 team-tasks 数据目录加载所有活跃项目。
    
    Args:
        workspace: 工作目录路径，默认使用 skills/team-tasks
    
    Returns:
        项目列表
    """
    if workspace is not None:
        base_dir = pathlib.Path(workspace)
    else:
        # 优先使用环境变量，否则回退到默认数据目录
        base_dir = pathlib.Path(
            os.environ.get(
                "TEAM_TASKS_DIR",
                "/root/.openclaw/workspace-coord/team-tasks"
            )
        )
    
    if not base_dir.exists():
        return []
    
    projects = []
    
    # 遍历所有项目 JSON 文件（扁平结构）
    for proj_file in base_dir.glob("*.json"):
        try:
            with open(proj_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # 字段映射: JSON 使用 "project"，内部使用 "name"
            project_name = data.get("project") or data.get("name", "")
            goal = data.get("goal", "")
            
            if project_name and goal:
                projects.append({
                    "name": project_name,
                    "goal": goal,
                    "status": data.get("status", "active"),
                    "created": data.get("created", ""),
                    "mode": data.get("mode", "linear"),
                })
        except (json.JSONDecodeError, IOError):
            continue
    
    return projects


# ==================== 主入口 ====================

def check_duplicate_projects(
    name: str,
    goal: str,
    workspace: Optional[str] = None,
    threshold: float = 0.4
) -> dict:
    """
    检查重复项目的主入口函数。
    
    Args:
        name: 项目名
        goal: 目标描述
        workspace: 工作目录
        threshold: 相似度阈值
    
    Returns:
        {
            "level": "block|warn|pass",
            "candidates": [...],  # 相似项目列表
            "message": str
        }
    """
    new_project = {"name": name, "goal": goal}
    existing = load_existing_projects(workspace)
    
    # 检测重复
    candidates = detect_duplicates(new_project, existing, threshold)
    
    # 确定告警级别
    if candidates:
        level = alert_level(candidates[0]["similarity"])
    else:
        level = "pass"
    
    message = format_alert_message(level, candidates)
    
    return {
        "level": level,
        "candidates": candidates,
        "message": message,
    }


# ==================== CLI 支持 ====================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="提案重复检测工具")
    parser.add_argument("name", help="项目名")
    parser.add_argument("goal", help="项目目标")
    parser.add_argument("--workspace", help="工作目录路径")
    parser.add_argument("--threshold", type=float, default=0.4, help="相似度阈值")
    
    args = parser.parse_args()
    
    result = check_duplicate_projects(args.name, args.goal, args.workspace, args.threshold)
    
    print(f"🔍 检查项目: {args.name}")
    print(f"📊 目标: {args.goal}")
    print()
    print(result["message"])
