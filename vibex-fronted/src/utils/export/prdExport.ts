/**
 * PRD Export Utility
 * 导出 PRD 为 Markdown 格式
 */

export interface PRDSection {
  id: string;
  title: string;
  content: string;
}

export interface PRDData {
  projectName: string;
  version: string;
  author?: string;
  createdAt?: string;
  sections: PRDSection[];
}

export interface ExportOptions {
  includeMetadata?: boolean;
  includeTOC?: boolean;
  dateFormat?: string;
}

/**
 * Generate PRD as Markdown
 */
export function exportPRDToMarkdown(
  data: PRDData,
  options: ExportOptions = {}
): string {
  const { includeMetadata = true, includeTOC = true, dateFormat = 'YYYY-MM-DD' } = options;
  
  let md = '';

  // Title
  md += `# ${data.projectName}\n\n`;

  // Metadata
  if (includeMetadata) {
    md += `---\n`;
    if (data.version) md += `**版本**: ${data.version}\n`;
    if (data.author) md += `**作者**: ${data.author}\n`;
    if (data.createdAt) md += `**创建时间**: ${data.createdAt}\n`;
    md += `---\n\n`;
  }

  // Table of Contents
  if (includeTOC && data.sections.length > 0) {
    md += `## 目录\n\n`;
    data.sections.forEach((section, index) => {
      md += `${index + 1}. [${section.title}](#${section.id})\n`;
    });
    md += '\n---\n\n';
  }

  // Sections
  data.sections.forEach((section, index) => {
    md += `## ${index + 1}. ${section.title}\n\n`;
    md += `${section.content}\n\n`;
  });

  return md;
}

/**
 * Download PRD as Markdown file
 */
export function downloadPRDAsMarkdown(
  data: PRDData,
  filename?: string,
  options?: ExportOptions
): void {
  const content = exportPRDToMarkdown(data, options);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${data.projectName.replace(/\s+/g, '-').toLowerCase()}-prd.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate PRD data
 */
export function validatePRD(data: PRDData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.projectName?.trim()) {
    errors.push('项目名称不能为空');
  }

  if (!data.sections?.length) {
    errors.push('PRD 至少需要一个章节');
  }

  data.sections?.forEach((section, index) => {
    if (!section.title?.trim()) {
      errors.push(`章节 ${index + 1}: 标题不能为空`);
    }
    if (!section.content?.trim()) {
      errors.push(`章节 ${index + 1}: 内容不能为空`);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Create PRD from template
 */
export function createPRDFromTemplate(
  projectName: string,
  templateId: string
): PRDData {
  const templates: Record<string, PRDSection[]> = {
    'default': [
      { id: 'overview', title: '项目概述', content: '描述项目的背景、目标和范围。' },
      { id: 'users', title: '用户故事', content: '列出主要用户角色和他们的需求。' },
      { id: 'features', title: '功能需求', content: '详细描述需要实现的功能。' },
      { id: 'non-functional', title: '非功能需求', content: '性能、安全、可用性等要求。' },
      { id: 'ui', title: 'UI/UX 需求', content: '界面设计和用户体验要求。' },
      { id: 'technical', title: '技术方案', content: '技术栈和架构设计。' },
    ],
    'website': [
      { id: 'overview', title: '项目概述', content: '网站项目背景和目标。' },
      { id: 'pages', title: '页面结构', content: '页面列表和层级关系。' },
      { id: 'features', title: '核心功能', content: '主要功能模块描述。' },
      { id: 'design', title: '设计要求', content: '视觉设计和交互要求。' },
    ],
  };

  return {
    projectName,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    sections: templates[templateId] || templates['default'],
  };
}

export default {
  exportPRDToMarkdown,
  downloadPRDAsMarkdown,
  validatePRD,
  createPRDFromTemplate,
};
