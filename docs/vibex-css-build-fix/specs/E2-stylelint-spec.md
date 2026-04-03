# E2 Spec: stylelint 集成

## 安装

```bash
cd vibex-fronted
pnpm add -D stylelint stylelint-config-standard
```

## .stylelintrc.json

```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "no-empty-source": true,
    "no-invalid-position-at-rule": true,
    "no-invalid-position-declaration": true
  },
  "ignoreFiles": [
    "**/*.min.css"
  ]
}
```

## package.json script

```json
{
  "scripts": {
    "lint:css": "stylelint \"src/**/*.css\" \"src/**/*.module.css\""
  }
}
```

## CI 集成

```yaml
# .github/workflows/ci.yml 新增 step
- name: Lint CSS
  run: pnpm run lint:css
```
