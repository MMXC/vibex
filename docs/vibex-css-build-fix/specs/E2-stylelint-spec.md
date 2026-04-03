# E2 Spec: stylelint 集成

## 安装

```bash
cd vibex-fronted
pnpm add -D stylelint stylelint-config-standard
```

## .stylelintrc.json

```json
{
  "rules": {
    "no-invalid-position-declaration": true
  },
  "ignoreFiles": ["**/*.min.css"]
}
```

## package.json script

```json
{
  "scripts": {
    "lint:css": "stylelint \"src/**/*.css\" \"src/**/**/*.css\""
  }
}
```

## CI 集成

```yaml
# .github/workflows/pre-submit.yml 新增 step
- name: Run stylelint CSS quality gate
  run: |
    npx stylelint "src/**/*.css" "src/**/**/*.css" || exit 1
```

## 验证

```bash
pnpm run lint:css
# exit 0 = pass
```
