# 未调用路由标注报告

**项目**: vibex-doc-fix-20260328
**Task**: F1.5 — 标注后端独有路由
**日期**: 2026-03-28
**执行人**: Dev agent (subagent)

---

## 概述

通过对比 `api-contract.yaml` 中 95 条路径与前端实际调用情况，标注出**后端独有（前端未调用）的路由**。

| 分类 | 数量 | 标注方式 |
|------|------|----------|
| BackendOnly（后端独有） | 33 | Tag: `BackendOnly` |
| Deprecated（v1 双写废弃） | 28 | Tag: `Deprecated` |
| **前端已用（活跃）** | **86** | 无特殊 Tag |

> 注：部分 BackendOnly 路由在未来的功能迭代中可能被前端调用，因此保留定义但标注来源。

---

## BackendOnly 路由清单（33 条）

### 1. 协作功能（8 条）

| 方法 | 路径 | 说明 | 未来可能调用 |
|------|------|------|-------------|
| GET | /branches | 获取分支列表 | 版本控制集成 |
| POST | /branches | 创建分支 | 版本控制集成 |
| DELETE | /branches/{branchId} | 删除分支 | 版本控制集成 |
| GET | /branches/{branchId} | 获取分支详情 | 版本控制集成 |
| GET | /collaboration-realtime | 实时协作状态 | 多人实时编辑 |
| GET | /prototype-collaboration | 原型协作状态 | 多人实时编辑 |
| POST | /prototype-collaboration | 创建原型协作会话 | 多人实时编辑 |
| GET | /prototype-collaboration/{collaborationId} | 获取协作会话 | 多人实时编辑 |

### 2. AI 生成功能（7 条）

| 方法 | 路径 | 说明 | 未来可能调用 |
|------|------|------|-------------|
| POST | /ai-design-chat | AI 设计对话 | AI 辅助设计面板 |
| POST | /business-domain/generate | 业务域生成 | 业务域自动生成 |
| POST | /collaboration | 创建协作会话 | 协作邀请 |
| POST | /clarification-questions | 澄清问题生成 | AI 澄清流程 |
| POST | /requirements-analysis | 需求分析（批量） | 批量分析入口 |
| POST | /requirements-export | 需求导出 | 导出功能 |
| POST | /ui-generation | UI 批量生成 | AI UI 生成面板 |

### 3. 原型管理（8 条）

| 方法 | 路径 | 说明 | 未来可能调用 |
|------|------|------|-------------|
| GET | /prototype-versions | 获取版本历史 | 版本管理面板 |
| POST | /prototype-versions | 创建版本快照 | 版本保存 |
| GET | /prototype-version/{versionId} | 获取版本详情 | 版本回滚 |
| GET | /components | 获取组件列表 | 组件库管理 |
| GET | /components/{componentId} | 获取组件详情 | 组件编辑 |
| PUT | /components/{componentId} | 更新组件 | 组件库编辑 |
| DELETE | /components/{componentId} | 删除组件 | 组件库管理 |
| POST | /prototype-export | 导出原型 | 导出面板 |

### 4. 预览与模板（4 条）

| 方法 | 路径 | 说明 | 未来可能调用 |
|------|------|------|-------------|
| GET | /live-preview/{previewId} | 实时预览帧 | 预览面板 |
| GET | /templates | 获取模板列表 | 模板市场 |
| POST | /templates | 创建模板 | 模板发布 |
| GET | /ui-nodes | 获取 UI 节点树 | 可视化编辑器 |

### 5. 状态与元数据（5 条）

| 方法 | 路径 | 说明 | 未来可能调用 |
|------|------|------|-------------|
| GET | /step-state | 获取 Step 状态 | Step 导航 |
| PUT | /step-state | 更新 Step 状态 | Step 导航 |
| GET | /domain-models | 获取领域模型列表 | 领域模型面板 |
| POST | /domain-models | 创建领域模型 | 领域建模 |
| GET | /version | 获取系统版本 | 诊断面板 |

### 6. AI UI 单独（1 条）

| 方法 | 路径 | 说明 | 未来可能调用 |
|------|------|------|-------------|
| POST | /ai-ui-generation | AI UI 批量生成 | AI 生成面板 |

---

## Deprecated 路由清单（28 条 v1 双写）

这些路由是 `/api/v1/*` 的别名，前端已统一使用无前缀路径，**后端仍支持但已废弃**：

| 前缀 | 数量 | 状态 |
|------|------|------|
| /v1/auth/* | 4 | Deprecated |
| /v1/projects/* | 2 | Deprecated |
| /v1/messages/* | 2 | Deprecated |
| /v1/agents/* | 3 | Deprecated |
| /v1/pages/* | 3 | Deprecated |
| /v1/flows/* | 3 | Deprecated |
| /v1/chat | 1 | Deprecated |

**策略**: v1 双写路由在 YAML 中标记为 `Deprecated`，后端继续支持确保向后兼容，前端统一使用无 v1 前缀路径。

---

## 架构变更记录

| 日期 | 变更 | 影响 |
|------|------|------|
| 2026-03-28 | 新增 33 条 BackendOnly 路由标注 | 前端未调用但保留定义 |
| 2026-03-28 | 新增 28 条 Deprecated 路由标注 | v1 路由废弃，前端统一用新路径 |
| 2026-03-28 | 前端活跃路由 86 条 | 覆盖所有当前使用场景 |

---

## 验证命令

```bash
# 统计 BackendOnly 数量
python3 -c "
import yaml
with open('docs/api-contract.yaml') as f:
    data = yaml.safe_load(f)
bo = sum(1 for p, ms in data['paths'].items() 
         for m, s in ms.items() if 'BackendOnly' in s.get('tags', []))
dep = sum(1 for p, ms in data['paths'].items() 
          for m, s in ms.items() if 'Deprecated' in s.get('tags', []))
print(f'BackendOnly: {bo}, Deprecated: {dep}')
"
# 预期输出: BackendOnly: 33, Deprecated: 28
```
