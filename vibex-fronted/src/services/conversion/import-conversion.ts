/**
 * Import Conversion Service
 * 将 GitHub/Figma 导入数据转换为需求文本
 */

import type { GitHubRepoInfo, PackageJsonInfo, DirectoryTreeNode } from '@/services/github/github-import';
import type { FigmaFileData } from '@/services/figma/figma-import';

export interface ConversionOptions {
  includeReadme?: boolean;
  includeDependencies?: boolean;
  includeDirectoryStructure?: boolean;
  includeComponents?: boolean;
  maxReadmeLength?: number;
}

export interface ConversionResult {
  requirementText: string;
  metadata: {
    source: 'github' | 'figma';
    projectName: string;
    generatedAt: string;
    features: string[];
  };
}

/**
 * 从 GitHub 仓库转换为需求文本
 */
export function convertGitHubToRequirement(
  repoInfo: GitHubRepoInfo,
  options: ConversionOptions = {}
): ConversionResult {
  const {
    includeReadme = true,
    includeDependencies = true,
    includeDirectoryStructure = true,
    maxReadmeLength = 2000,
  } = options;

  const features: string[] = [];
  let requirementText = `# 项目需求文档\n\n`;

  // 项目基本信息
  requirementText += `## 1. 项目概述\n\n`;
  requirementText += `**项目名称**: ${repoInfo.fullName}\n\n`;
  
  if (repoInfo.description) {
    requirementText += `**项目描述**: ${repoInfo.description}\n\n`;
    features.push('项目描述');
  }
  
  requirementText += `**开源许可**: ${repoInfo.license || '未指定'}\n\n`;
  requirementText += `**主要语言**: ${repoInfo.language || '未指定'}\n\n`;
  requirementText += `**星标数**: ${repoInfo.stars}\n\n`;
  requirementText += `**分支数**: ${repoInfo.forks}\n\n`;

  features.push('项目基本信息');

  // 技术栈
  if (includeDependencies) {
    requirementText += `## 2. 技术栈\n\n`;
    requirementText += `- 编程语言: ${repoInfo.language || '待定'}\n`;
    requirementText += `- 许可证: ${repoInfo.license || '待定'}\n`;
    features.push('技术栈');
  }

  // 项目结构
  if (includeDirectoryStructure) {
    requirementText += `\n## 3. 项目结构\n\n`;
    requirementText += `\`\`\`\n`;
    requirementText += `${repoInfo.fullName}/\n`;
    requirementText += `├── src/          # 源代码\n`;
    requirementText += `├── tests/        # 测试文件\n`;
    requirementText += `├── docs/         # 文档\n`;
    requirementText += `├── config/       # 配置文件\n`;
    requirementText += `└── README.md    # 项目说明\n`;
    requirementText += `\`\`\`\n\n`;
    features.push('项目结构');
  }

  // 功能模块推断
  requirementText += `\n## 4. 核心功能\n\n`;
  
  // 根据目录结构推断功能
  const inferredFeatures = inferFeaturesFromRepo(repoInfo);
  inferredFeatures.forEach(feature => {
    requirementText += `- ${feature}\n`;
  });
  
  features.push('核心功能');

  // 用户需求补充
  requirementText += `\n## 5. 用户需求\n\n`;
  requirementText += `请根据以下提示完善需求：\n\n`;
  requirementText += `1. 目标用户群体：\n`;
  requirementText += `2. 核心使用场景：\n`;
  requirementText += `3. 主要痛点：\n`;
  requirementText += `4. 期望的解决方案：\n`;

  return {
    requirementText,
    metadata: {
      source: 'github',
      projectName: repoInfo.fullName,
      generatedAt: new Date().toISOString(),
      features,
    },
  };
}

/**
 * 从 Figma 设计稿转换为需求文本
 */
export function convertFigmaToRequirement(
  fileData: FigmaFileData,
  options: ConversionOptions = {}
): ConversionResult {
  const {
    includeComponents = true,
    maxReadmeLength = 2000,
  } = options;

  const features: string[] = [];
  let requirementText = `# 设计稿需求文档\n\n`;

  // 设计稿基本信息
  requirementText += `## 1. 设计稿概述\n\n`;
  requirementText += `**文件名**: ${fileData.file.name}\n\n`;
  requirementText += `**最后修改**: ${new Date(fileData.file.lastModified).toLocaleString()}\n\n`;
  features.push('设计稿基本信息');

  // 页面结构
  if (fileData.pages.length > 0) {
    requirementText += `## 2. 页面结构 (${fileData.pages.length} 个页面)\n\n`;
    fileData.pages.forEach(page => {
      requirementText += `### ${page.name}\n`;
      requirementText += `- 页面 ID: ${page.id}\n`;
      requirementText += `- 类型: ${page.type}\n\n`;
    });
    features.push('页面结构');
  }

  // 组件清单
  if (includeComponents && fileData.components.length > 0) {
    requirementText += `## 3. 组件清单 (${fileData.components.length} 个组件)\n\n`;
    requirementText += `| 组件名称 | 描述 |\n`;
    requirementText += `|---------|-------|\n`;
    
    fileData.components.slice(0, 50).forEach(comp => {
      requirementText += `| ${comp.name} | ${comp.description || '-'} |\n`;
    });
    
    if (fileData.components.length > 50) {
      requirementText += `\n*...还有 ${fileData.components.length - 50} 个组件*\n`;
    }
    features.push('组件清单');
  }

  // 设计风格
  if (fileData.styles.length > 0) {
    requirementText += `\n## 4. 设计风格\n\n`;
    
    const colorStyles = fileData.styles.filter(s => s.styleType === 'FILL');
    const textStyles = fileData.styles.filter(s => s.styleType === 'TEXT');
    
    if (colorStyles.length > 0) {
      requirementText += `### 颜色\n`;
      colorStyles.slice(0, 10).forEach(style => {
        requirementText += `- ${style.name}: ${style.description || ''}\n`;
      });
    }
    
    if (textStyles.length > 0) {
      requirementText += `\n### 文本样式\n`;
      textStyles.slice(0, 10).forEach(style => {
        requirementText += `- ${style.name}: ${style.description || ''}\n`;
      });
    }
    features.push('设计风格');
  }

  // 用户需求补充
  requirementText += `\n## 5. 功能需求\n\n`;
  requirementText += `请根据设计稿补充以下内容：\n\n`;
  requirementText += `1. 页面交互逻辑：\n`;
  requirementText += `2. 数据流转：\n`;
  requirementText += `3. 状态管理：\n`;
  requirementText += `4. 响应式设计要求：\n`;

  return {
    requirementText,
    metadata: {
      source: 'figma',
      projectName: fileData.file.name,
      generatedAt: new Date().toISOString(),
      features,
    },
  };
}

/**
 * 从仓库信息推断功能模块
 */
function inferFeaturesFromRepo(repo: GitHubRepoInfo): string[] {
  const features: string[] = [];
  const name = repo.name.toLowerCase();
  const desc = (repo.description || '').toLowerCase();

  // 根据项目名称推断
  if (name.includes('dashboard')) features.push('仪表板/控制面板');
  if (name.includes('admin')) features.push('管理员后台');
  if (name.includes('api')) features.push('RESTful API');
  if (name.includes('auth')) features.push('用户认证');
  if (name.includes('login')) features.push('登录/注册');
  if (name.includes('cms')) features.push('内容管理系统');
  if (name.includes('blog')) features.push('博客系统');
  if (name.includes('shop') || name.includes('store') || name.includes('ecommerce')) features.push('电商系统');
  if (name.includes('chat')) features.push('即时通讯');
  if (name.includes('video')) features.push('视频播放');
  if (name.includes('music')) features.push('音乐播放');
  if (name.includes('social')) features.push('社交功能');

  // 根据描述推断
  if (desc.includes('user')) features.push('用户管理');
  if (desc.includes('payment')) features.push('支付功能');
  if (desc.includes('order')) features.push('订单管理');
  if (desc.includes('product')) features.push('商品管理');
  if (desc.includes('analytics')) features.push('数据分析');
  if (desc.includes('report')) features.push('报表生成');

  // 默认功能
  if (features.length === 0) {
    features.push('基础 CRUD 功能');
    features.push('用户界面');
  }

  return features;
}

/**
 * 合并多个来源的需求
 */
export function mergeRequirements(
  sources: Array<ConversionResult>
): ConversionResult {
  let mergedText = '# 合并需求文档\n\n';
  const allFeatures: string[] = [];
  let projectName = 'Unknown';

  sources.forEach((source, index) => {
    mergedText += `## 来源 ${index + 1}: ${source.metadata.source.toUpperCase()} - ${source.metadata.projectName}\n\n`;
    mergedText += source.requirementText;
    mergedText += '\n\n---\n\n';
    
    allFeatures.push(...source.metadata.features);
    projectName = source.metadata.projectName;
  });

  return {
    requirementText: mergedText,
    metadata: {
      source: 'github', // 合并后
      projectName,
      generatedAt: new Date().toISOString(),
      features: [...new Set(allFeatures)], // 去重
    },
  };
}
