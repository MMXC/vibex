"""
dedup_rules.py - 规则过滤器

提供基于规则的重复检测增强：
- 规则1: 完全相同项目名
- 规则2: 前缀+日期相近
- 规则3: 高频词命中

Epic 2: 规则过滤器 (F6.1)
"""

import re
from datetime import datetime, timedelta
from typing import Optional

from dedup import extract_keywords, ProjectInfo

# ==================== 常量 ====================

# 高风险词列表
HIGH_RISK_TERMS = {
    "fix", "修复", "bug", "修复bug",
    "review", "审查", "reviewer",
    "homepage", "首页", "home",
    "test", "测试", "testing",
    "api", "backend", "frontend",
    "layout", "布局", "ui", "ux",
    "proposal", "提案",
    "epic", "task",
    "component", "组件",
    "performance", "性能",
    "security", "安全",
}

# 日期格式
DATE_FORMATS = [
    "%Y-%m-%d",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%dT%H:%M:%S.%fZ",
    "%Y/%m/%d",
]


# ==================== 规则1: 精确匹配 ====================

def exact_name_match(new_name: str, existing: list[dict]) -> list[dict]:
    """
    规则1: 检测完全相同项目名。
    
    Args:
        new_name: 新项目名
        existing: 现有项目列表
    
    Returns:
        完全匹配的项目列表
    """
    return [
        {**p, "rule": "exact-name", "severity": "high"}
        for p in existing
        if p.get("name") == new_name and p.get("status") == "active"
    ]


# ==================== 规则2: 前缀+日期 ====================

def parse_date(date_str: str) -> Optional[datetime]:
    """解析日期字符串"""
    if not date_str:
        return None
    
    # 清理字符串
    date_str = date_str.strip()
    
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(date_str, fmt)
        except (ValueError, TypeError):
            continue
    
    return None


def prefix_date_match(
    new_name: str,
    new_created: Optional[datetime] = None,
    existing: list[dict] = None
) -> list[dict]:
    """
    规则2: 检测相同前缀+7天内创建的项目。
    
    Args:
        new_name: 新项目名
        new_created: 新项目创建时间，默认当前时间
        existing: 现有项目列表
    
    Returns:
        匹配的项目列表（按 severity: "high" > "medium" > "low" 排序）
    """
    if existing is None:
        existing = []
    
    if new_created is None:
        new_created = datetime.now()
    
    # 提取前缀：取到最后一个连字符之前（保留连字符）
    # 例如: vibex-homepage-new -> vibex-homepage-
    #       proposal-test -> proposal-
    if '-' in new_name or '_' in new_name:
        # 找到最后一个连字符
        last_hyphen = max(new_name.rfind('-'), new_name.rfind('_'))
        prefix = new_name[:last_hyphen + 1]
    else:
        # 无连字符，使用整个名称作为前缀
        prefix = new_name
    
    if not prefix:
        return []
    
    results = []
    for p in existing:
        if p.get("status") != "active":
            continue
        
        if not p.get("name", "").startswith(prefix):
            continue
        
        # 检查日期
        created_str = p.get("created", "")
        if not created_str:
            # 没有日期，默认匹配（高风险）
            results.append({**p, "rule": "prefix-date", "severity": "high"})
            continue
        
        created_date = parse_date(created_str)
        if created_date is None:
            continue
        
        # 7 天内的项目
        days_diff = abs((new_created - created_date).days)
        if days_diff <= 7:
            severity = "high" if days_diff <= 2 else "medium"
            results.append({**p, "rule": "prefix-date", "severity": severity})
    
    return results


# ==================== 规则3: 高风险词命中 ====================

def high_risk_term_match(new_goal: str, existing: list[dict]) -> list[dict]:
    """
    规则3: 检测高风险词命中 + 目标关键词重叠。
    
    当新项目目标包含高风险词，且与现有某个项目的关键词重叠 >= 2 时触发。
    
    Args:
        new_goal: 新项目目标
        existing: 现有项目列表
    
    Returns:
        匹配的项目列表
    """
    # 提取新项目的关键词并与高风险词取交集
    new_keywords = extract_keywords(new_goal)
    hit_terms = new_keywords & HIGH_RISK_TERMS
    
    if len(hit_terms) < 1:
        return []
    
    results = []
    for p in existing:
        if p.get("status") != "active":
            continue
        
        existing_keywords = extract_keywords(p.get("goal", ""))
        overlap = new_keywords & existing_keywords
        
        # 关键词重叠 >= 2
        if len(overlap) >= 2:
            results.append({
                **p,
                "rule": "high-risk-term",
                "severity": "low",
                "hit_terms": list(hit_terms),
                "overlap": list(overlap),
            })
    
    return results


# ==================== 综合规则过滤器 ====================

def rule_filter(
    new_project: dict,
    existing: list[dict],
    new_created: Optional[datetime] = None
) -> list[dict]:
    """
    综合规则过滤器。
    
    按 severity 排序返回所有匹配规则的结果。
    
    Args:
        new_project: 新项目 {"name": ..., "goal": ...}
        existing: 现有项目列表
        new_created: 新项目创建时间
    
    Returns:
        按 severity 排序的结果列表
        [
            {**project, "rule": "...", "severity": "high|medium|low"},
            ...
        ]
    """
    results = []
    seen_names = set()
    
    # 规则1: 精确匹配（最高优先级）
    exact = exact_name_match(new_project["name"], existing)
    for p in exact:
        if p["name"] not in seen_names:
            results.append(p)
            seen_names.add(p["name"])
    
    # 规则2: 前缀+日期
    prefix = prefix_date_match(new_project["name"], new_created, existing)
    for p in prefix:
        if p["name"] not in seen_names:
            results.append(p)
            seen_names.add(p["name"])
    
    # 规则3: 高风险词
    risky = high_risk_term_match(new_project["goal"], existing)
    for p in risky:
        if p["name"] not in seen_names:
            results.append(p)
            seen_names.add(p["name"])
    
    # 按 severity 排序
    severity_order = {"high": 0, "medium": 1, "low": 2}
    results.sort(key=lambda x: severity_order.get(x.get("severity", "low"), 3))
    
    return results


def check_with_rules(
    name: str,
    goal: str,
    workspace: Optional[str] = None
) -> dict:
    """
    使用规则过滤器检查重复项目。
    
    与 check_duplicate_projects 不同，这里使用规则而非相似度。
    
    Returns:
        {
            "has_match": bool,
            "results": [...],  # 规则匹配结果
            "message": str
        }
    """
    from dedup import load_existing_projects
    
    new_project = {"name": name, "goal": goal}
    existing = load_existing_projects(workspace)
    
    results = rule_filter(new_project, existing)
    
    if not results:
        return {
            "has_match": False,
            "results": [],
            "message": "✅ 规则检查：未发现重复项目"
        }
    
    # 格式化消息
    high_count = sum(1 for r in results if r.get("severity") == "high")
    medium_count = sum(1 for r in results if r.get("severity") == "medium")
    low_count = sum(1 for r in results if r.get("severity") == "low")
    
    msg = f"⚠️  规则检查发现 {len(results)} 个潜在重复项目:\n"
    
    if high_count > 0:
        msg += f"\n🔴 高风险 ({high_count} 个):\n"
        for r in results:
            if r.get("severity") == "high":
                msg += f"   - {r['name']} [{r.get('rule', '')}]\n"
                if r.get('goal'):
                    msg += f"     目标: {r['goal'][:50]}...\n"
    
    if medium_count > 0:
        msg += f"\n🟡 中风险 ({medium_count} 个):\n"
        for r in results:
            if r.get("severity") == "medium":
                msg += f"   - {r['name']} [{r.get('rule', '')}]\n"
    
    if low_count > 0:
        msg += f"\n🟢 低风险 ({low_count} 个):\n"
        for r in results:
            if r.get("severity") == "low":
                msg += f"   - {r['name']} [{r.get('rule', '')}]\n"
    
    return {
        "has_match": True,
        "results": results,
        "message": msg,
        "high_risk_count": high_count,
        "medium_risk_count": medium_count,
        "low_risk_count": low_count,
    }
