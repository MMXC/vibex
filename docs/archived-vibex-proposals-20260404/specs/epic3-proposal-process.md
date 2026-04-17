# Spec: Epic3 — 提案流程优化

## 概述
标准化提案从提交到评估的完整流程，解决提案质量参差不齐、无优先级排序、无执行追踪的问题。

## 影响文件
- `~/.openclaw/workspace/proposals/TEMPLATE.md`（新建）
- `~/.openclaw/skills/team-tasks/scripts/task_manager.py`
- `~/.openclaw/workspace/vibex/AGENTS.md`

---

## Spec E3-F1: 提案模板强制化

### 行为
提供标准提案模板，task_manager 对 `proposal-*` 任务增加章节完整性检查。

### 实现
创建 `~/.openclaw/workspace/proposals/TEMPLATE.md`：

```markdown
# {Agent} 提案 — {YYYY-MM-DD}

## 元信息
- Agent: {agent}
- 日期: {YYYY-MM-DD}

## 问题描述
{清晰描述发现的问题}

## 根因分析
{分析根本原因}

## 建议方案
{方案描述}

## 验收标准
- [ ] 可测试的验收条件

## 优先级自评
- 影响用户数: 1-10
- 发生频次: 1-10  
- 实现成本: 1-10
- 紧急度: 1-10
```

### task_manager 验证
```python
REQUIRED_SECTIONS = ['问题描述', '根因分析', '建议方案', '验收标准']

def validate_proposal(filepath):
    content = open(filepath).read()
    missing = [s for s in REQUIRED_SECTIONS if s not in content]
    if missing:
        print(f"❌ 提案缺少章节: {', '.join(missing)}")
        return False
    return True
```

### 验收
```bash
# proposals/TEMPLATE.md 存在
# 包含 4 个强制章节
grep -E "^## (问题描述|根因|建议方案|验收标准)" proposals/TEMPLATE.md | wc -l
# 输出: 4
```

---

## Spec E3-F2: 提案优先级算法

### 行为
基于 `impact × urgency / effort` 计算优先级得分，自动推荐 P0/P1/P2。

### 实现
创建 `proposals/priority_calculator.py`：

```python
def calculate_priority(impact: int, urgency: int, effort: int) -> str:
    """
    impact: 用户数 × 影响幅度 (1-100)
    urgency: 紧急度 (1-10)
    effort: 实现成本 (1-10)
    
    score = (impact * urgency) / (effort ** 0.5)  # 成本开方避免过度惩罚大项目
    P0: score > 70
    P1: 30 < score <= 70
    P2: score <= 30
    """
    score = (impact * urgency) / (effort ** 0.5)
    if score > 70:
        return 'P0'
    elif score > 30:
        return 'P1'
    return 'P2'

def score_proposal(proposal_content: str) -> dict:
    # 解析提案中的自评字段，计算优先级
    pass
```

### 验收
```python
def test_priority_calculation():
    assert calculate_priority(9, 9, 3) == 'P0'   # 高影响×紧急，低成本 → P0
    assert calculate_priority(5, 5, 10) == 'P1'  # 中等 → P1
    assert calculate_priority(3, 3, 9) == 'P2'    # 低影响，高成本 → P2
```

---

## Spec E3-F3: 存量代码继承规范

### 行为
Dev 任务中涉及修改非当前项目文件时，必须新增测试覆盖。

### 实现
在 `task_manager.py` 的 Dev 任务 done 逻辑中：

```python
def check_inherited_code_tests(repo, changed_files):
    """检查是否修改了非当前项目的文件"""
    project_files = set()
    # 扫描 project 目录
    for root, dirs, files in os.walk(os.path.join(repo, 'projects')):
        project_files.update(files)
    
    inherited = [f for f in changed_files if os.path.basename(f) not in project_files]
    
    if inherited:
        test_files = [f for f in changed_files 
                      if re.search(r'\.test\.(ts|tsx|js|jsx)$', f)]
        if not test_files:
            print("⚠️ Warning: Inherited code changed without new tests")
```

### 验收
```bash
# Dev 任务修改了 store 文件，但无对应 test 文件 → 警告
# Dev 任务修改了 store 文件，同时有 .test.ts → 正常
```

---

## Spec E3-F4: Changelog 职责标准化

### 行为
在 AGENTS.md 中明确 Dev（写功能代码）和 Reviewer（补 changelog）的职责边界。

### 实现
在 `AGENTS.md` 新增章节：

```markdown
## Changelog 职责分工

### Dev Agent
- 负责功能代码 commit
- commit message 格式: `<type>(<scope>): <description>`
- 不负责 changelog 补全

### Reviewer Agent
- 负责 changelog 补全
- 补全位置: root `CHANGELOG.md` + `fed CHANGELOG.md` + `page.tsx`
- commit message 格式: `docs(changelog): add <project> <Epic> entry`

### 示例
Dev 完成 E1: `feat(canvas): add skeleton loading`
Reviewer 补 changelog: `docs(changelog): add canvas-skeleton E1 entry`
```

### 验收
```bash
# AGENTS.md 包含 Changelog 职责章节
grep -A10 "Changelog" AGENTS.md | grep -E "(Dev|Reviewer)"
# 输出包含 Dev 和 Reviewer 的明确分工
```

---

## 工时

- E3-F1: 1h
- E3-F2: 2h
- E3-F3: 1h
- E3-F4: 1h
- 总计: 5h
