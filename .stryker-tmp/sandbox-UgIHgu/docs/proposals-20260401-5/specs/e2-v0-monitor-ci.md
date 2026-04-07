# Spec: E2 - v0 监控 + Domain CI 检查

## F2.1-F2.2: v0 竞品周会机制

### 规格
- 周会议程模板增加 v0 更新项
- docs/competitive/v0-updates.md 记录历史

### 验收
```typescript
test('周会模板包含 v0', () => {
  const template = readFileSync('docs/meeting/agenda-template.md', 'utf-8');
  expect(template).toContain('v0');
});

test('v0-updates.md 存在', () => {
  const path = 'docs/competitive/v0-updates.md';
  expect(existsSync(path)).toBe(true);
});
```

---

## F2.3-F2.4: Domain CI 检查

### 规格
- CI workflow: .github/workflows/domain-check.yml
- 检查: domain.md @updated 时间戳，超过 30 天 warn

### 验收
```yaml
# domain-check.yml
name: Domain Docs Check
on:
  schedule:
    - cron: '0 0 * * 0' # 每周检查
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check domain.md update
        run: |
          UPDATED=$(grep '@updated' docs/architecture/domain.md | grep -oP '\d{4}-\d{2}-\d{2}')
          DAYS=$(( $(date +%s) - $(date -d $UPDATED +%s) ) / 86400)
          if [ $DAYS -gt 30 ]; then
            echo "::warning::domain.md 未更新超过 30 天"
          fi
```
