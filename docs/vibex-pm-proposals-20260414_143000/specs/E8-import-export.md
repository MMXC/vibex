# Spec: E8 - 导入导出规格

## 导入

- 支持格式：`.md`, `.json`, `.yaml`
- 解析字段：`boundedContexts[]`, `domainModels[]`, `businessFlows[]`
- 导入前预览：用户确认后填充表单
- 解析失败：友好错误提示，不崩溃

## 导出

- 导出格式：`.md`（Markdown），`.mermaid`（Mermaid 图代码），`.json`（结构化数据）
- 文件名规范：`{projectName}_{YYYYMMDD}_{HHMMSS}.{format}`
- 下载：浏览器原生下载，无页面跳转
