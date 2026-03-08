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
          `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/version`
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
