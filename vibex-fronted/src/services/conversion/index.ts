/**
 * Conversion Service
 * 需求转换服务 - 将 GitHub/Figma 数据转换为需求文本
 */

import type { GitHubRepoInfo, PackageJsonInfo } from '@/services/github/github-import';

/**
 * 转换配置选项
 */
export interface ConversionOptions {
  includeDescription?: boolean;
  includeTechStack?: boolean;
  includeDirectoryTree?: boolean;
  includeReadme?: boolean;
  maxReadmeLength?: number;
}

/**
 * 转换结果
 */
export interface ConversionResult {
  requirementText: string;
  metadata: {
    source: 'github' | 'figma';
    sourceName: string;
    generatedAt: string;
    options: ConversionOptions;
  };
}

/**
 * 默认转换选项
 */
const DEFAULT_OPTIONS: ConversionOptions = {
  includeDescription: true,
  includeTechStack: true,
  includeDirectoryTree: true,
  includeReadme: true,
  maxReadmeLength: 2000,
};

/**
 * 从 GitHub 仓库信息生成需求文本
 */
export function convertGitHubToRequirement(
  repoInfo: GitHubRepoInfo,
  packageJson?: PackageJsonInfo | null,
  readme?: string,
  directoryTree?: { name: string; path: string; type: string }[],
  options: ConversionOptions = DEFAULT_OPTIONS
): ConversionResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let requirement = '';

  // Header
  requirement += `# 需求文档：从 GitHub 导入\n\n`;
  requirement += `**来源仓库**: ${repoInfo.fullName}\n`;
  requirement += `**Stars**: ${repoInfo.stars} | **Forks**: ${repoInfo.forks}\n`;
  if (repoInfo.language) {
    requirement += `**主要语言**: ${repoInfo.language}\n`;
  }
  requirement += `\n---\n\n`;

  // Description
  if (opts.includeDescription && repoInfo.description) {
    requirement += `## 项目描述\n${repoInfo.description}\n\n`;
  }

  // Tech Stack
  if (opts.includeTechStack && packageJson) {
    requirement += `## 技术栈\n`;
    
    if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
      requirement += `### 生产依赖\n`;
      // Only include key dependencies (limit to 20)
      const deps = Object.entries(packageJson.dependencies).slice(0, 20);
      deps.forEach(([name, version]) => {
        requirement += `- \`${name}\`: ${version}\n`;
      });
      if (Object.keys(packageJson.dependencies).length > 20) {
        requirement += `- ... 还有 ${Object.keys(packageJson.dependencies).length - 20} 个依赖\n`;
      }
      requirement += '\n';
    }

    if (packageJson.devDependencies && Object.keys(packageJson.devDependencies).length > 0) {
      requirement += `### 开发依赖\n`;
      const devDeps = Object.entries(packageJson.devDependencies).slice(0, 10);
      devDeps.forEach(([name, version]) => {
        requirement += `- \`${name}\`: ${version}\n`;
      });
      if (Object.keys(packageJson.devDependencies).length > 10) {
        requirement += `- ... 还有 ${Object.keys(packageJson.devDependencies).length - 10} 个依赖\n`;
      }
      requirement += '\n';
    }
  }

  // Directory Structure
  if (opts.includeDirectoryTree && directoryTree && directoryTree.length > 0) {
    requirement += `## 目录结构\n`;
    requirement += '```\n';
    // Show top-level structure
    const topLevel = directoryTree.slice(0, 15);
    topLevel.forEach(item => {
      const icon = item.type === 'directory' ? '📂' : '📄';
      requirement += `${icon} ${item.path}\n`;
    });
    if (directoryTree.length > 15) {
      requirement += `\n... 还有 ${directoryTree.length - 15} 个文件/目录\n`;
    }
    requirement += '```\n\n';
  }

  // README Summary
  if (opts.includeReadme && readme && readme.length > 0) {
    const maxLen = opts.maxReadmeLength || 2000;
    const truncated = readme.length > maxLen 
      ? readme.slice(0, maxLen) + '\n\n... (README 已截断)'
      : readme;
    
    requirement += `## README\n${truncated}\n`;
  }

  return {
    requirementText: requirement,
    metadata: {
      source: 'github',
      sourceName: repoInfo.fullName,
      generatedAt: new Date().toISOString(),
      options: opts,
    },
  };
}

/**
 * 从 Figma 文件信息生成需求文本
 */
export function convertFigmaToRequirement(
  fileInfo: {
    name: string;
    key: string;
    lastModified?: string;
  },
  pages?: { id: string; name: string; childCount?: number }[],
  components?: { id: string; name: string; description?: string }[],
  styles?: {
    colors?: { name: string; value: string }[];
    typography?: { name: string; fontSize: number; fontWeight: string }[];
  },
  options: ConversionOptions = DEFAULT_OPTIONS
): ConversionResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let requirement = '';

  // Header
  requirement += `# 需求文档：从 Figma 导入\n\n`;
  requirement += `**来源文件**: ${fileInfo.name}\n`;
  if (fileInfo.lastModified) {
    requirement += `**最后修改**: ${new Date(fileInfo.lastModified).toLocaleDateString()}\n`;
  }
  requirement += `\n---\n\n`;

  // Pages
  if (pages && pages.length > 0) {
    requirement += `## 页面结构\n`;
    pages.forEach(page => {
      requirement += `- ${page.name}`;
      if (page.childCount !== undefined) {
        requirement += ` (${page.childCount} 个元素)`;
      }
      requirement += '\n';
    });
    requirement += '\n';
  }

  // Components
  if (components && components.length > 0) {
    requirement += `## 组件库\n`;
    // Limit to 20 components
    const displayComponents = components.slice(0, 20);
    displayComponents.forEach(comp => {
      requirement += `- ${comp.name}`;
      if (comp.description) {
        requirement += `: ${comp.description}`;
      }
      requirement += '\n';
    });
    if (components.length > 20) {
      requirement += `- ... 还有 ${components.length - 20} 个组件\n`;
    }
    requirement += '\n';
  }

  // Styles
  if (styles) {
    if (styles.colors && styles.colors.length > 0) {
      requirement += `## 颜色系统\n`;
      styles.colors.slice(0, 10).forEach(color => {
        requirement += `- ${color.name}: \`${color.value}\`\n`;
      });
      if (styles.colors.length > 10) {
        requirement += `- ... 还有 ${styles.colors.length - 10} 个颜色\n`;
      }
      requirement += '\n';
    }

    if (styles.typography && styles.typography.length > 0) {
      requirement += `## 字体系统\n`;
      styles.typography.forEach(typo => {
        requirement += `- ${typo.name}: ${typo.fontSize}px / ${typo.fontWeight}\n`;
      });
      requirement += '\n';
    }
  }

  return {
    requirementText: requirement,
    metadata: {
      source: 'figma',
      sourceName: fileInfo.name,
      generatedAt: new Date().toISOString(),
      options: opts,
    },
  };
}

/**
 * 验证需求文本是否有效
 */
export function validateRequirementText(text: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!text || text.trim().length === 0) {
    issues.push('需求文本为空');
  }

  if (text.length < 50) {
    issues.push('需求文本过短，可能信息不足');
  }

  if (!text.includes('#') && !text.includes('##')) {
    issues.push('建议添加标题层级结构');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
