# 需求创建后 404 错误分析报告

## 问题描述

**现象**: 用户创建需求后跳转到 `/requirements/req-xxx` 返回 404

**分析时间**: 2026-03-02 18:58

**项目路径**: `/root/.openclaw/vibex`

---

## 1. 根因分析

### 1.1 问题代码定位

**文件**: `vibex-fronted/src/app/requirements/new/page.tsx`

```typescript
// 第 49 行
router.push(`/requirements/${newRequirement.id}`)
```

### 1.2 根本原因

| 原因 | 说明 |
|------|------|
| 静态导出限制 | `output: 'export'` 不支持动态路由 |
| 缺少动态路由文件 | `/requirements/[id]/page.tsx` 不存在 |
| 动态路由需要预渲染 | 静态导出只能预渲染已知路径 |

### 1.3 当前目录结构

```
src/app/requirements/
├── new/
│   └── page.tsx        # 创建需求页面 ✅
├── page.tsx            # 需求列表页面 ✅
└── requirements.module.css

# 缺少:
# [id]/
#   └── page.tsx        # 需求详情页面 ❌ 不存在
```

### 1.4 可用页面

| 页面 | 路由 | 状态 |
|------|------|------|
| 需求列表 | `/requirements` | ✅ 存在 |
| 创建需求 | `/requirements/new` | ✅ 存在 |
| 领域模型 | `/domain` | ✅ 存在 |
| 需求详情 | `/requirements/[id]` | ❌ 不存在 |

---

## 2. 解决方案分析

### 方案 A: 跳转到领域模型页 `/domain` (推荐)

**实现**:
```typescript
// 修改 requirements/new/page.tsx 第 49 行
// router.push(`/requirements/${newRequirement.id}`)
router.push('/domain')  // 领域模型页面已存在
```

**优点**:
- ✅ 无需新增页面
- ✅ 领域模型页面已存在
- ✅ 符合用户工作流（需求→领域模型）
- ✅ 实现简单，改动最小

**缺点**:
- ⚠️ 无法直接查看刚创建的需求
- ⚠️ 需要在 `/domain` 页面显示提示信息

**用户体验**:
```
创建需求 → 跳转到 /domain → 显示"需求创建成功"提示 → 用户查看领域模型
```

### 方案 B: 使用查询参数 `/requirements?id=xxx`

**实现**:
```typescript
// 修改 requirements/new/page.tsx 第 49 行
router.push(`/requirements?id=${newRequirement.id}`)

// 修改 requirements/page.tsx 添加查询参数处理
const searchParams = useSearchParams()
const highlightId = searchParams.get('id')
// 高亮显示对应需求
```

**优点**:
- ✅ 可以高亮显示刚创建的需求
- ✅ 用户能看到需求列表
- ✅ 无需新增动态路由

**缺点**:
- ⚠️ 需要修改需求列表页面逻辑
- ⚠️ 只能显示列表，无法显示详情

### 方案 C: 跳转到项目详情页 `/project/[id]`

**实现**:
```typescript
// 修改 requirements/new/page.tsx 第 49 行
router.push(`/project/${projectId}`)  // 项目详情页已存在
```

**优点**:
- ✅ 项目详情页已存在
- ✅ 包含需求、模型、流程、原型四个标签页
- ✅ 符合整体项目结构

**缺点**:
- ⚠️ 需要关联需求和项目
- ⚠️ 需要传入正确的 projectId

---

## 3. 推荐方案

### 🎯 推荐: 方案 A - 跳转到 `/domain`

**理由**:
1. 改动最小（只修改 1 行代码）
2. 领域模型页面已存在
3. 符合需求→领域模型的工作流
4. 无需新增路由

### 实现步骤

**步骤 1**: 修改跳转逻辑

```typescript
// 文件: vibex-fronted/src/app/requirements/new/page.tsx
// 第 49 行

// 修改前:
router.push(`/requirements/${newRequirement.id}`)

// 修改后:
router.push('/domain')
```

**步骤 2**: (可选) 添加成功提示

```typescript
// 在 domain 页面添加 toast 提示
import { useToast } from '@/components/Toast'

const toast = useToast()
toast.success('需求创建成功，正在生成领域模型...')
```

**步骤 3**: 验证构建

```bash
cd vibex-fronted
npm run build
# 确保无错误
```

---

## 4. 替代方案: 添加需求详情页

如果未来需要需求详情页，可以采用以下方案:

### 方案 D: 使用静态生成 + 客户端渲染

**实现**:
```typescript
// src/app/requirements/[id]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { apiService } from '@/services/api'

export default function RequirementDetailPage() {
  const params = useParams()
  const id = params.id
  
  // 客户端获取需求数据
  const { data, isLoading } = useSWR(`/requirements/${id}`, () => 
    apiService.getRequirement(id)
  )
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      <h1>需求详情</h1>
      <p>ID: {id}</p>
      <p>内容: {data?.content}</p>
    </div>
  )
}
```

**注意**: 此方案在 `output: 'export'` 下仍有限制，页面刷新会 404。

### 方案 E: 移除静态导出，使用 SSR

**修改 next.config.ts**:
```typescript
// 移除静态导出
// output: 'export'  // 删除此行
```

**影响**:
- ✅ 支持所有动态路由
- ❌ 无法部署到 Cloudflare Pages（需要 Node.js 服务器）
- ❌ 需要更改部署方案

---

## 5. 验证清单

### 修复后验证

```bash
# 1. 本地验证
cd /root/.openclaw/vibex/vibex-fronted
npm run build

# 2. 测试流程
# - 访问 /requirements/new
# - 填写需求内容
# - 点击"开始生成原型"
# - 确认跳转到 /domain（不是 /requirements/req-xxx）
# - 确认无 404 错误
```

### 预期结果

| 操作 | 预期结果 |
|------|----------|
| 创建需求 | 跳转到 `/domain` |
| 访问 `/domain` | 显示领域模型页面 |
| 无 404 错误 | ✅ |

---

## 6. 总结

| 项目 | 内容 |
|------|------|
| **根因** | 静态导出不支持动态路由 `/requirements/[id]` |
| **推荐方案** | 跳转到 `/domain` (方案 A) |
| **改动范围** | 1 行代码 |
| **风险等级** | 低 |
| **预估工时** | 10 分钟 |

---

**分析完成时间**: 2026-03-02 18:58
**分析者**: Analyst Agent