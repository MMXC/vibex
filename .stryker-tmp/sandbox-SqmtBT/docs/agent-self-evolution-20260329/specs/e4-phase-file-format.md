# Spec: E4 Phase 文件格式升级

## 问题

Phase 文件有多次重复执行记录（同一文件有多个 `[任务完成]` 块），导致：
- 文件膨胀（单文件可达 10KB+）
- 读取时需解析最新块
- 历史记录难以追溯

## 解决方案

### 方案：使用 `__FINAL__` 标记 + `--overwrite` 模式

## Phase 文件标准模板

```markdown
# Phase: [Epic Name] — [Timestamp]

## Metadata
__PROJECT__: [project-name]
__EPIC__: [epic-id]
__AGENT__: [agent-name]
__START__: [ISO timestamp]
__STATUS__: [pending|in-progress|done]
__FINAL__: [ISO timestamp]  <!-- 仅在最终完成时写入 -->

## 执行摘要
[1-3 行总结本次执行结果]

## 详细记录
[可追加的详细记录，仅 __FINAL__ 前有效]

## DoD Checklist
- [ ] [x] 功能点 1
- [ ] [x] 功能点 2

## 输出产物
- [ ] [文件路径或链接]

<!--
__FINAL__ 标记后的内容在读取时应被忽略
__FINAL__ 写入时间: [timestamp]
__FINAL__ 执行次数: [N]
-->
```

## 读取规范

```python
def read_phase_file(path):
    content = open(path).read()
    # 查找 __FINAL__ 标记
    if '__FINAL__' in content:
        # 只读取 __FINAL__ 之前的最新块
        final_index = content.rfind('__FINAL__')
        content = content[:final_index]
    
    # 解析 metadata 和执行摘要
    # ...
```

## HEARTBEAT.md 更新

```bash
# Phase 文件写入逻辑
function write_phase() {
    local project=$1
    local epic=$2
    local status=$3
    local content=$4
    
    local phase_file="docs/${project}-${epic}-$(date +%Y%m%d_%H%M%S).md"
    
    # 使用 overwrite 模式（而非追加）
    cat > "$phase_file" << EOF
# Phase: $epic — $(date -Iseconds)

## Metadata
__PROJECT__: $project
__EPIC__: $epic
__AGENT__: $(whoami)
__START__: $(date -Iseconds)
__STATUS__: $status

$content

EOF
    
    # 完成后写入 __FINAL__ 标记
    if [ "$status" == "done" ]; then
        echo "__FINAL__: $(date -Iseconds)" >> "$phase_file"
    fi
}
```

## 现有文件迁移

```bash
# 为现有 phase 文件添加 __FINAL__ 标记
# 仅追加，不修改原有内容
for file in docs/*-tester-*.md docs/*-dev-*.md; do
    if ! grep -q "__FINAL__" "$file"; then
        echo "" >> "$file"
        echo "<!-- __FINAL__: 2026-03-29T00:00:00+08:00 -->" >> "$file"
    fi
done
```

## 验收标准

```bash
# 测试：多次执行同一任务
# 观察：phase 文件大小增长 < 10%
# 预期：每次执行生成新文件，而非追加到同一文件

# 验证 __FINAL__ 标记
grep -l "__FINAL__" docs/*-tester-*.md | wc -l
# 预期：所有 phase 文件均有 __FINAL__ 标记
```

## 输出

- `vibex/scripts/phase-file-template.md` — 标准模板
- 更新后的各 agent `HEARTBEAT.md`（使用 overwrite 模式）
- 迁移脚本 `scripts/migrate-phase-files.sh`
