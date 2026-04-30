# Feature Flags

## WORKBENCH_ENABLED

| 字段 | 值 |
|-----|-----|
| 类型 | Boolean (environment variable) |
| 默认值 | `false` |
| 环境变量 | `NEXT_PUBLIC_WORKBENCH_ENABLED` |
| 灰度阶段 | Internal → Beta → GA |

### 路由行为
- `true`: `/workbench` → HTTP 200
- `false` (默认): `/workbench` → HTTP 404
