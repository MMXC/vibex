'use client';

import { useEffect, useState } from 'react';
import styles from './changelog.module.css';

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  commit?: string;
}

interface VersionInfo {
  version: string;
  commit: string;
  timestamp: string;
}

const mockChangelog: ChangelogEntry[] = [
  {
    version: '1.0.27',
    date: '2026-03-12',
    changes: [
      '📋 版本历史功能：自动快照、版本预览、差异对比',
      '🔄 Undo/Redo 支持：保存操作自动创建版本快照',
      '📊 差异可视化：jsondiffpatch 集成，绿增红删高亮',
      '📝 版本备注：用户可为版本添加/编辑备注',
      '✅ 代码审查通过：测试修复，安全检查无问题',
    ],
    commit: 'd5abee8',
  },
  {
    version: '1.0.26',
    date: '2026-03-12',
    changes: [
      '🔧 预览功能修复：登录状态实时检测 + Mermaid 图预览',
      '🏗️ 三栏布局：步骤面板(15%) + 预览区(60%) + AI对话(25%)',
      '🔐 AuthStore：Zustand + persist 实现状态持久化',
      '🎨 MermaidRenderer：支持五步流程可视化渲染',
      '✅ 代码审查通过：安全+性能+规范符合要求',
    ],
    commit: '1f09b2d',
  },
  {
    version: '1.0.25',
    date: '2026-03-12',
    changes: [
      '📚 架构文档同步：Schema 文档与 Prisma 一致 (14 模型验证通过)',
      '📋 API 契约文档：OpenAPI 3.0 格式完整',
      '✅ 文档可读性：结构清晰，Mermaid 图表丰富',
      '📝 建议：建立 ADR 体系记录架构决策',
    ],
    commit: 'bd7470f',
  },
  {
    version: '1.0.24',
    date: '2026-03-11',
    changes: [
      '🏠 首页重构：嵌入需求录入表单，营销内容完整',
      '✨ 生成按钮：未登录触发 LoginDrawer，已登录跳转确认页',
      '📱 响应式布局：桌面/平板/移动端适配',
      '🎨 Hero/Features/CTA section 完整实现',
    ],
    commit: '77b0263',
  },
  {
    version: '1.0.23',
    date: '2026-03-10',
    changes: [
      '🎨 设计流程组件：bounded-context, business-flow, domain-model 等',
      '💬 新增 ChatEntry, AIQuestion, ComponentEditor 组件',
      '🔌 WebSocket 服务：connectionPool, messageRouter 实现',
      '🔐 安全配置：gitleaks, pre-commit hooks, vuln-scan workflow',
      '📝 CSS Tokens 系统：colors, spacing, typography 设计变量',
      '🧹 清理 E2E 测试产物：~42M 截图移除，添加 .gitignore',
    ],
    commit: 'db70c28',
  },
  {
    version: '1.0.22',
    date: '2026-03-09',
    changes: [
      '🔧 DDD API 端点修复：fetch → httpClient 迁移',
      '🔐 自动 Authorization：请求拦截器自动添加 Bearer Token',
      '🛡️ 统一错误处理：transformError 友好化错误消息',
      '✅ 代码审查通过：安全性、性能、代码规范 100% 测试覆盖',
    ],
    commit: '90fcacd',
  },
  {
    version: '1.0.21',
    date: '2026-03-09',
    changes: [
      '🔀 路由简化完成：动态路由迁移到查询参数格式',
      '📍 新增 /project 入口页：统一项目管理入口',
      '↩️ 向后兼容：Cloudflare Pages _redirects 重定向规则',
      '🧭 ProjectNav 链接更新：统一使用 ?projectId= 格式',
    ],
    commit: 'b2b74b8',
  },
  {
    version: '1.0.20',
    date: '2026-03-09',
    changes: [
      '🔄 API 模块化重构：api.ts 拆分为 modules/(auth, agent, project 等)',
      '📋 模板系统增强：新增 10 个行业模板（电商/金融/医疗/教育等）',
      '✨ 确认页模板选择器：一键使用预定义模板',
      '🧪 E2E 测试：Page Object Model 实现',
      '🎨 样式 token 系统：tokens.css 设计变量',
    ],
    commit: '81a5033',
  },
  {
    version: '1.0.19',
    date: '2026-03-09',
    changes: [
      '🔐 登录页注册入口优化：字号放大 + 背景边框 + SVG 图标',
      '📱 移动端触摸优化：最小高度 44px 触摸区域',
      '✨ Hover 效果：背景色变化 + 微上移动画',
      '🔀 表单切换：登录/注册表单无缝切换',
    ],
    commit: '6cad007',
  },
  {
    version: '1.0.18',
    date: '2026-03-09',
    changes: [
      '📊 覆盖率监控系统：基线对比 + 阈值阻断 + 趋势追踪',
      '🔔 Slack 告警集成：覆盖率下降自动通知',
      '🏷️ 覆盖率徽章生成：SVG 动态徽章 + JSON 数据',
      '⚙️ 统一配置：coverage.config.js 集中管理阈值',
      '✅ GitHub Actions 工作流：PR 自动检查覆盖率',
    ],
    commit: 'eb9ea71',
  },
  {
    version: '1.0.17',
    date: '2026-03-08',
    changes: [
      '🔀 路由统一化：删除冗余动态路由 /projects/[projectId]',
      '↩️ 重定向规则：/projects/:id → /project?id=:id (301)',
      '🔧 构建优化：增加 Node.js 内存限制解决 OOM',
      '✅ Cloudflare Pages 路由兼容性修复',
    ],
    commit: 'review-approved',
  },
  {
    version: '1.0.16',
    date: '2026-03-08',
    changes: [
      '🚀 移除 @opennextjs/cloudflare，改用原生 Next.js 静态导出',
      '📦 依赖清理：移除 open-next 相关依赖',
      '🔧 配置迁移：next.config.ts + wrangler.toml 静态导出配置',
      '✅ 构建验证：28 个静态页面正确生成',
    ],
    commit: '397c2be',
  },
  {
    version: '1.0.15',
    date: '2026-03-07',
    changes: [
      '🔧 Cloudflare 构建修复：静态导出配置',
      '⚙️ wrangler.toml 多环境配置',
      '✅ 构建验证：out/ 目录正确生成',
    ],
    commit: '8995612',
  },
  {
    version: '1.0.14',
    date: '2026-03-07',
    changes: [
      '📋 需求模板库：8 个行业/场景模板',
      '🔍 模板选择器：分类筛选 + 搜索 + 预览',
      '📊 使用统计：模板使用次数追踪',
      '⭐ 用户评分：5 星评分系统',
      '✅ 单元测试：TemplateStats 完整测试覆盖',
    ],
    commit: '981512d',
  },
  {
    version: '1.0.13',
    date: '2026-03-07',
    changes: [
      '🧭 导航系统重构：GlobalNav + ProjectNav + Breadcrumb',
      '📡 API 变更追踪：OpenAPI 生成 + 变更检测 + 通知机制',
      '✨ 代码质量自动化：Prettier + husky + lint-staged',
      '🔒 安全修复：hono CVE 修复 + 安全审计工作流',
      '🧹 Mock 清理：移除硬编码 mock 数据',
      '📊 需求验证：关键词密度检测 + 实时评分',
      '✅ E2E 测试：导航/认证/截图验证 20+ 测试',
    ],
    commit: 'ccf0a40',
  },
  {
    version: '1.0.12',
    date: '2026-03-06',
    changes: [
      '🔍 静态导出兼容性检查：动态路由检测脚本',
      '📊 识别 17 静态兼容 + 8 潜在问题路由',
      '📝 ESLint 规则：no-static-export (待集成)',
      '📋 文档指南：静态导出最佳实践',
    ],
    commit: 'bed4c35',
  },
  {
    version: '1.0.11',
    date: '2026-03-06',
    changes: [
      '✅ 需求录入前置校验：关键词密度检测 + 完整性评分',
      '📊 5维度评分算法：长度/关键词/结构/清晰度/具体性',
      '🎯 75+ 领域关键词库：domain/function/entity/action',
      '💡 实时评分 UI + 建议提示',
    ],
    commit: 'cd3c075',
  },
  {
    version: '1.0.10',
    date: '2026-03-06',
    changes: [
      '🔐 敏感信息扫描：Gitleaks 规则配置',
      '✅ 10+ 密钥类型检测：AWS/GitHub/Cloudflare/Slack/JWT',
      '🔄 GitHub Actions secrets-scan 工作流',
      '📋 .env.example 环境变量模板',
    ],
    commit: 'pending',
  },
  {
    version: '1.0.9',
    date: '2026-03-06',
    changes: [
      '🔒 依赖漏洞扫描自动化：GitHub Actions + Dependabot',
      '✅ 后端安全审计：0 漏洞',
      '📦 hono 升级到 4.12.5，修复安全漏洞',
      '🔄 每日自动扫描 + 高危漏洞阻断构建',
    ],
    commit: 'dcd2bdb',
  },
  {
    version: '1.0.8',
    date: '2026-03-06',
    changes: [
      '🔐 登录页注册入口优化：切换按钮样式增强',
      '🔗 SEO 优化：支持 ?mode=register/login URL 参数',
      '✅ E2E 测试覆盖：24 个测试用例全部通过',
      '📱 多视口测试：mobile/tablet/desktop 截图验收',
    ],
    commit: '291ac7d',
  },
  {
    version: '1.0.7',
    date: '2026-03-05',
    changes: [
      '📊 测试覆盖率自动化：Jest 阈值配置 + 历史记录',
      '📈 当前覆盖率 62.61% (> 40% 阈值)',
      '⚠️ 退化检测：覆盖率下降 > 5% 阻止合并',
    ],
    commit: '0445e9e',
  },
  {
    version: '1.0.6',
    date: '2026-03-05',
    changes: [
      '📸 E2E 截图功能修复：迁移到 Playwright',
      '✅ 8 个页面截图生成成功',
      '🔧 支持	headless 服务器环境',
    ],
    commit: '6b53b8f',
  },
  {
    version: '1.0.5',
    date: '2026-03-05',
    changes: [
      '🛡️ ErrorBoundary 双级部署：全局 + MermaidPreview',
      '⚠️ 友好错误 UI：重试按钮 + 刷新页面',
      '✅ 渲染错误不崩溃应用',
    ],
    commit: '99cbf9d',
  },
  {
    version: '1.0.4',
    date: '2026-03-05',
    changes: [
      '🎨 CSS 工具类提取：创建 utilities.css (411行)',
      '📦 200+ 工具类：布局/间距/排版/边框/背景等',
      '✅ 命名规范统一，遵循 Tailwind CSS 风格',
    ],
    commit: 'baf2812',
  },
  {
    version: '1.0.3',
    date: '2026-03-05',
    changes: [
      '♻️ API 服务层重构：将 api.ts (1522行) 拆分为 16 个模块',
      '📦 模块边界清晰，无循环依赖',
      '✅ 测试覆盖率 78%，构建通过',
    ],
    commit: '1fc52af',
  },
  {
    version: '1.0.2',
    date: '2026-03-05',
    changes: [
      '🔒 安全修复：Mermaid 组件 XSS 漏洞修复',
      '🛡️ 将 securityLevel 从 loose 改为 strict',
      '✅ 安全测试验证通过',
    ],
    commit: '25a8984',
  },
  {
    version: '1.0.1',
    date: '2026-03-04',
    changes: [
      '🎨 风格统一优化：统一所有页面 UI 风格',
      '🔧 修复交互式确认流程',
      '📊 流程执行引擎实现',
      '🔐 用户角色权限检查 (RBAC)',
    ],
    commit: '8f533ea',
  },
  {
    version: '1.0.0',
    date: '2026-03-02',
    changes: [
      '🎉 全新 AI 原型设计工具上线',
      '✨ 支持需求输入 → 领域模型 → 原型生成完整流程',
      '📊 新增领域模型页面',
      '🎨 新增原型预览页面',
      '🚀 后端部署到 Cloudflare Workers',
      '📱 响应式设计，支持移动端',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-02-15',
    changes: [
      '✨ 全新 UI/UX 设计',
      '🔐 用户认证系统',
      '📁 项目管理系统',
      '💬 AI 对话功能',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-01-20',
    changes: ['🎨 初始版本发布', '📋 基础页面模板'],
  },
];

export default function Changelog() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/version`
        );
        if (response.ok) {
          const data = await response.json();
          setVersionInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch version:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.bgEffect}>
        <div className={styles.gridOverlay} />
        <div className={styles.glowOrb} />
      </div>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>更新日志</h1>
          <p className={styles.subtitle}>VibeX 产品迭代记录</p>

          {versionInfo && (
            <div className={styles.versionInfo}>
              <span className={styles.versionBadge}>
                v{versionInfo.version}
              </span>
              <span className={styles.commitHash}>{versionInfo.commit}</span>
            </div>
          )}
        </header>

        <div className={styles.timeline}>
          {mockChangelog.map((entry, index) => (
            <div key={entry.version} className={styles.entry}>
              <div className={styles.entryHeader}>
                <span className={styles.version}>v{entry.version}</span>
                <span className={styles.date}>{entry.date}</span>
              </div>
              <ul className={styles.changes}>
                {entry.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
              {entry.commit && (
                <div className={styles.commit}>Commit: {entry.commit}</div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
