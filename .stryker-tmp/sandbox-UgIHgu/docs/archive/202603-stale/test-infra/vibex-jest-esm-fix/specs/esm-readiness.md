# Feature: ESM Readiness Documentation

## Jobs-To-Be-Done
- 作为 **技术负责人**，我需要在未来评估是否迁移到 ESM 时有清晰的文档参考。

## User Stories
- US1: 作为开发者，阅读文档后能理解当前 CommonJS 配置与 ESM 的差异，以及迁移成本。

## Requirements
- [ ] (F2.1) 在 `/docs/vibex-jest-esm-fix/` 目录下补充 `CONFIG_COMPARISON.md`，说明 CommonJS vs ESM 配置差异
- [ ] (F2.2) 文档包含迁移步骤清单和预估工时（1-2 人天）

## Technical Notes
- 当前配置：`module.exports` + `ts-jest` 编译为 CommonJS，无需 `"type": "module"`
- ESM 迁移需要：`ts-jest/presets/default-esm`、`.mjs` 扩展处理、`import x from '...'` 语法保留
- 风险评估：中等，涉及大量文件配置变更

## Acceptance Criteria
- [ ] `CONFIG_COMPARISON.md` 存在且内容完整（对应 F2.1）
- [ ] 文档中迁移步骤可操作、包含风险评估（对应 F2.2）
