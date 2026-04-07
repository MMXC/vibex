# Bug 分析报告: Navbar 链接 404 修复 (vibex-navbar-projects-fix)

**分析日期**: 2026-03-15  
**分析人**: Analyst Agent  
**状态**: 已确认

---

## 一、问题描述

| 项目 | 内容 |
|------|------|
| **现象** | 首页右上角「我的项目」点击后 404 |
| **文件** | `src/components/homepage/Navbar/Navbar.tsx` |
| **问题行** | 第 38 行 |

---

## 二、根因分析

### 2.1 问题代码

```typescript
// Navbar.tsx 第 35-39 行
{!isAuthenticated ? (
  <button className={styles.ctaButton} onClick={onLoginClick}>
    开始使用
  </button>
) : (
  <Link href="/projects" className={styles.ctaButton}>  // 🔴 错误路径
    我的项目
  </Link>
)}
```

### 2.2 路由验证

| 路由 | 存在性 | 用途 |
|------|--------|------|
| `/projects` | ❌ 不存在 | - |
| `/dashboard` | ✅ 存在 | 项目列表页面 |
| `/project` | ✅ 存在 | 单个项目详情页 |

### 2.3 结论

**根因**: 链接路径错误，应指向 `/dashboard`（项目列表页面），而非不存在的 `/projects`。

---

## 三、修复方案

### 方案 A: 修改为正确路径（推荐）

```typescript
// 修复后
<Link href="/dashboard" className={styles.ctaButton}>
  我的项目
</Link>
```

**优点**: 最小改动，直接修复问题

### 方案 B: 创建 /projects 路由重定向

```typescript
// app/projects/page.tsx
import { redirect } from 'next/navigation'
export default function ProjectsPage() {
  redirect('/dashboard')
}
```

**优点**: 保留语义化路径  
**缺点**: 增加不必要的重定向

---

## 四、修复清单

| 文件 | 行号 | 修改内容 |
|------|------|----------|
| `Navbar.tsx` | 38 | `/projects` → `/dashboard` |

---

## 五、风险评估

| 风险 | 等级 | 说明 |
|------|------|------|
| 用户书签失效 | 🟢 Low | 新用户不太可能书签 `/projects` |
| 其他地方引用 | 🟢 Low | 需确认是否有其他地方使用 `/projects` |

---

## 六、验证命令

```bash
# 修复后验证
grep -r 'href="/projects"' src/ --include="*.tsx"
# 应无结果

# 确认 dashboard 路由
test -d src/app/dashboard && echo "✅ /dashboard exists"
```

---

## 七、下一步

立即修复：将 `/projects` 改为 `/dashboard`