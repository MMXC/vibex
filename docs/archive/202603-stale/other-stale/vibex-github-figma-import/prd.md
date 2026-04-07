# PRD: GitHub/Figma 一键导入功能

**项目**: vibex-github-figma-import  
**版本**: 1.0  
**日期**: 2026-03-14  
**角色**: PM  

---

## 1. 执行摘要

**背景**: 用户需手动输入需求，门槛高。两个平台均提供完善 REST API。

**目标**: GitHub/Figma 一键导入，转化率提升 20-30%。

---

## 2. 功能需求

### F1: GitHub 导入 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F1.1 | 仓库 URL 输入 | `expect(input).toAccept(url)` | P0 |
| F1.2 | 仓库信息获取 | `expect(fetchRepo()).toReturn(info)` | P0 |
| F1.3 | README 提取 | `expect(extractReadme()).toContain(text)` | P0 |
| F1.4 | package.json 解析 | `expect(parsePkg()).toShow(dependencies)` | P0 |
| F1.5 | 目录结构解析 | `expect(parseTree()).toShow(structure)` | P0 |

### F2: Figma 导入 【需页面集成】

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1 | Figma URL 输入 | `expect(input).toAccept(figmaUrl)` | P0 |
| F2.2 | 文件信息获取 | `expect(fetchFile()).toReturn(info)` | P0 |
| F2.3 | 页面结构提取 | `expect(extractPages()).toShow(list)` | P0 |
| F2.4 | 组件列表提取 | `expect(extractComponents()).toShow(components)` | P0 |
| F2.5 | 样式信息提取 | `expect(extractStyles()).toShow(styles)` | P0 |

### F3: 认证授权

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | GitHub OAuth | `expect(oauth).toConnect('github')` | P0 |
| F3.2 | Figma OAuth | `expect(oauth).toConnect('figma')` | P0 |
| F3.3 | Token 存储 | `expect(store).toSaveSecure(token)` | P0 |

### F4: 需求转换

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F4.1 | 转换为需求文本 | `expect(convertToRequirement()).toGenerate(text)` | P0 |
| F4.2 | 预览转换结果 | `expect(preview).toShow()` | P0 |
| F4.3 | 一键导入 | `expect(import).toApplyToForm()` | P0 |

---

## 3. Epic 拆分

### Epic 1: GitHub 导入

| Story | 验收 |
|-------|------|
| S1.1 URL 输入 | `expect(input).toWork()` |
| S1.2 信息获取 | `expect(fetch).toReturn()` |
| S1.3 内容解析 | `expect(parse).toExtract()` |

### Epic 2: Figma 导入

| Story | 验收 |
|-------|------|
| S2.1 URL 输入 | `expect(input).toWork()` |
| S2.2 文件获取 | `expect(fetch).toReturn()` |
| S2.3 结构提取 | `expect(extract).toShow()` |

### Epic 3: 认证授权

| Story | 验收 |
|-------|------|
| S3.1 OAuth 流程 | `expect(oauth).toConnect()` |
| S3.2 Token 管理 | `expect(token).toStore()` |

### Epic 4: 需求转换

| Story | 验收 |
|-------|------|
| S4.1 格式转换 | `expect(convert).toGenerate()` |
| S4.2 导入应用 | `expect(import).toApply()` |

---

## 4. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | GitHub 仓库导入 | `expect(importRepo()).toExtract()` |
| AC2 | Figma 文件导入 | `expect(importFile()).toExtract()` |
| AC3 | OAuth 连接 | `expect(connect).toAuthenticate()` |
| AC4 | 需求转换 | `expect(convert).toGenerateText()` |

---

## 5. 实施计划

| 阶段 | 任务 | 工时 |
|------|------|------|
| 1 | GitHub 导入 | 2d |
| 2 | Figma 导入 | 2d |
| 3 | 认证 | 1d |
| 4 | 转换 | 1d |

**总计**: 6d
