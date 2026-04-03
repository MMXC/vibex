#!/usr/bin/env python3
"""
test_selfcheck_validator.py — 单元测试 for selfcheck-validator.py
Run: python3 -m pytest scripts/tests/test_selfcheck_validator.py -v
"""
import sys
import os
from pathlib import Path
# scripts/tests → scripts → vibex
sys.path.insert(0, str(Path(__file__).parent.parent))

from selfcheck_validator import (
    validate_selfcheck, detect_format, validate_format,
    validate_required_fields, validate_score, extract_actionable,
    extract_agent, extract_date
)


YAML_DOC = """---
agent: architect
date: 2026-03-30
score: 8
---
## 完成
- 分析架构设计

## 问题
- 无问题

## 改进建议
- [ACTIONABLE] 优化流程
"""


HEADER_DOC = """# 🏗️ Architect Agent 自我总结 [2026-03-30]

**周期**: 2026-03-29 ~ 2026-03-30
**Agent**: architect
**产出**: 3 个 ADR，1 个架构设计

## 完成
- 完成系统架构

## 问题
- 无

## 改进建议
- [ACTIONABLE] 优化流程

## 自检评分
| Agent | 评分 |
|------|------|
| architect | 8 |
"""


def test_detect_yaml_format():
    assert detect_format(YAML_DOC) == 'yaml'


def test_detect_header_format():
    assert detect_format(HEADER_DOC) == 'header'


def test_detect_unknown_format():
    assert detect_format('no format at all') == 'unknown'


def test_valid_yaml_doc():
    result = validate_selfcheck(YAML_DOC)
    assert result['valid'] is True
    assert result['format'] == 'yaml'
    assert result['agent'] == 'architect'
    assert result['date'] == '2026-03-30'
    assert len(result['errors']) == 0


def test_valid_header_doc():
    result = validate_selfcheck(HEADER_DOC)
    assert result['valid'] is True
    assert result['format'] == 'header'
    assert result['agent'] == 'architect'
    assert result['date'] == '2026-03-30'
    assert len(result['errors']) == 0


def test_missing_frontmatter_and_header():
    doc = """## Some content
no required format
"""
    result = validate_selfcheck(doc)
    assert result['valid'] is False


def test_yaml_missing_closing():
    doc = """---
agent: dev
date: 2026-03-30
score: 8
no closing"""
    result = validate_selfcheck(doc)
    assert result['valid'] is False
    assert any('未正确闭合' in e for e in result['errors'])


def test_score_too_high():
    doc = """---
agent: dev
date: 2026-03-30
score: 15
完成: []
问题: []
改进: []
---
"""
    result = validate_selfcheck(doc)
    assert result['valid'] is False
    assert any('1-10' in e for e in result['errors'])


def test_score_too_low():
    doc = """---
agent: dev
date: 2026-03-30
score: 0
完成: []
问题: []
改进: []
---
"""
    result = validate_selfcheck(doc)
    assert result['valid'] is False
    assert any('1-10' in e for e in result['errors'])


def test_score_boundary_ok():
    for score in [1, 10]:
        doc = f"""---
agent: dev
date: 2026-03-30
score: {score}
完成: []
问题: []
改进: []
---
"""
        result = validate_selfcheck(doc)
        assert result['valid'] is True, f"score={score} should be valid"


def test_actionable_extraction():
    count = extract_actionable(HEADER_DOC)
    assert count == 1


def test_actionable_count_in_result():
    result = validate_selfcheck(HEADER_DOC)
    assert result['actionable_count'] == 1
    assert any('1 个可执行建议' in w for w in result['warnings'])


def test_extract_agent_yaml():
    assert extract_agent(YAML_DOC) == 'architect'


def test_extract_agent_header():
    assert extract_agent(HEADER_DOC) == 'architect'


def test_extract_date_yaml():
    assert extract_date(YAML_DOC) == '2026-03-30'


def test_extract_date_header():
    assert extract_date(HEADER_DOC) == '2026-03-30'


def test_header_missing_agent_in_title():
    doc = """# Architect 自我总结 [2026-03-30]
完成: a
問題: b
改進: c
"""
    result = validate_selfcheck(doc)
    assert result['valid'] is False


def test_header_missing_date_in_title():
    doc = """# Architect Agent 自我总结
完成: a
問題: b
改進: c
"""
    result = validate_selfcheck(doc)
    assert result['valid'] is False


if __name__ == '__main__':
    import pytest
    sys.exit(pytest.main([__file__, '-v']))
