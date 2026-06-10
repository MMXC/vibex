# S70 提案分析 — 基于 S69 产出缺口识别

**Sprint**: vibex-proposals-sprint70  
**日期**: 2026-06-06  
**分析方法**: CHANGELOG 缺口分析 (S67/S68/S69)

---

## 提案摘要

| ID | 优先级 | 功能名称 | 类别 |
|----|--------|---------|------|
| P001 | P0 | 画布分支合并与冲突处理 | 数据管理 |
| P002 | P0 | 模板市场发现与浏览 | 模板系统 |
| P003 | P1 | 多格式批量画布导出 | 数据管理 |
| P004 | P1 | 协作冲突检测与锁升级 | 协作增强 |
| P005 | P2 | 画布设置面板完善 | UI 增强 |

---

## P001: 画布分支合并与冲突处理 — P0

**问题**: S69-E1 完成分支创建/切换/删除，但缺少分支合并能力。  
**根因**: `historyDB.ts` 已有 `mergeBranchInDB` (S66-E1)，但无 UI 入口。  
**影响**: 用户无法将实验分支合并回主分支，协作时无法处理冲突。  
**技术方案**: BranchManager 新增合并按钮 + SnapshotCompareDialog merge-preview 模式 + ConflictResolutionDialog。  
**验收标准**: BranchManager 有"合并"按钮 → 预览 diff → 解决冲突 → 合并成功刷新画布。

---

## P002: 模板市场发现与浏览 — P0

**问题**: S69-E3 完成分享 URL，但无市场浏览 UI。  
**根因**: `templateStore` 有 `topTemplates()` (S67-E3)，但无市场页签。  
**影响**: 用户无法主动发现和搜索社区模板。  
**技术方案**: 新增 TemplateMarketplacePanel → 集成到 TemplateGallery "发现" Tab → 热门榜单 + 标签云 + 搜索。  
**验收标准**: 发现 Tab 显示热门模板 → 标签筛选 → 模板卡片增强（使用量/标签）。

---

## P003: 多格式批量画布导出 — P1

**问题**: S60-E4 完成 PNG/PDF 批量导出，但单一画布无法一次导出多格式。  
**根因**: ExportMenu 仅支持单一格式导出选项。  
**影响**: 用户需多次操作导出同一画布不同格式。  
**技术方案**: ExportMenu 新增多格式子项 → MultiFormatExporter 封装三种格式 → Zip 打包下载。  
**验收标准**: 多格式导出(zip) 入口 → 下载含 png/svg/pdf 三文件 → 进度条显示格式。

---

## P004: 协作冲突检测与锁升级 — P1

**问题**: S66-E2 完成了节点锁定通知，但冲突无解决 UI。  
**根因**: `presenceStore` 有 `nodeLocks`，但无 pendingConflicts 记录。  
**影响**: 双写时仅 toast 警告，无法解决。  
**技术方案**: presenceStore 新增 pendingConflicts + ConflictResolutionDialog → 自动弹出解决。  
**验收标准**: 双写检测 → 自动弹出对话框 → 三种解决方式 → 正确应用。

---

## P005: 画布设置面板完善 — P2

**问题**: DDSToolbar 齿轮按钮未连接设置面板。  
**根因**: 设置按钮未绑定 open handler，`CanvasSettingsPanel` 存在但无入口。  
**影响**: 设置入口分散，用户无法统一管理画布设置。  
**技术方案**: DDSToolbar 绑定设置抽屉 → CanvasSettingsDrawer 整合 ViewPresetsPanel + 画布/节点/协作 Tab。  
**验收标准**: 齿轮按钮打开抽屉 → 预设/画布/节点/协作 Tab → ESC 关闭。
