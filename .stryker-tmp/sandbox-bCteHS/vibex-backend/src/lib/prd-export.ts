/**
 * PRD Export Service
 * 
 * Provides export functionality for Product Requirements Documents (PRD)
 * in various formats:
 * - Markdown: Human-readable documentation format
 * - PDF: Print-ready document format
 * 
 * @module lib/prd-export
 */
// @ts-nocheck


import { Hono } from 'hono';

// ==================== Types ====================

/**
 * PRD data structure
 */
export interface PRDData {
  id: string;
  projectId: string;
  projectName: string;
  projectDescription?: string;
  requirements: PRDRequirement[];
  domainModel?: PRDDomainModel;
  metadata: PRDMetadata;
}

/**
 * PRD Requirement item
 */
export interface PRDRequirement {
  id: string;
  rawInput: string;
  parsedData?: PRDRequirementParsed;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parsed requirement data
 */
export interface PRDRequirementParsed {
  title?: string;
  description?: string;
  actors?: string[];
  goals?: string[];
  userStories?: string[];
  acceptanceCriteria?: string[];
  constraints?: string[];
  notes?: string;
}

/**
 * Domain model for PRD
 */
export interface PRDDomainModel {
  entities: PRDDomainEntity[];
  relations: PRDDomainRelation[];
}

/**
 * Domain entity for PRD
 */
export interface PRDDomainEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
  properties?: PRDEntityProperty[];
}

/**
 * Entity property
 */
export interface PRDEntityProperty {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  defaultValue?: string;
}

/**
 * Domain relation for PRD
 */
export interface PRDDomainRelation {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: string;
  description?: string;
}

/**
 * PRD metadata
 */
export interface PRDMetadata {
  version: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'review' | 'approved' | 'deprecated';
}

/**
 * Export format types
 */
export type PRDExportFormat = 'markdown' | 'pdf';

/**
 * PDF export options
 */
export interface PDFExportOptions {
  pageSize?: 'A4' | 'Letter';
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: boolean;
  footer?: boolean;
  includePageNumbers?: boolean;
}

// ==================== Markdown Export ====================

/**
 * Export PRD to Markdown format
 */
export function exportPRDToMarkdown(prd: PRDData): string {
  const { projectName, projectDescription, requirements, domainModel, metadata } = prd;
  
  let md = '';
  
  // Title and metadata
  md += `# Product Requirements Document\n\n`;
  md += `**Project:** ${projectName}\n\n`;
  
  if (projectDescription) {
    md += `**Description:** ${projectDescription}\n\n`;
  }
  
  md += `---\n\n`;
  
  // Metadata section
  md += `## Document Information\n\n`;
  md += `- **Version:** ${metadata.version}\n`;
  md += `- **Status:** ${metadata.status}\n`;
  md += `- **Created:** ${new Date(metadata.createdAt).toLocaleDateString()}\n`;
  md += `- **Last Updated:** ${new Date(metadata.updatedAt).toLocaleDateString()}\n`;
  if (metadata.author) {
    md += `- **Author:** ${metadata.author}\n`;
  }
  md += `\n---\n\n`;
  
  // Requirements section
  md += `## Requirements\n\n`;
  
  if (requirements.length === 0) {
    md += `_No requirements defined._\n\n`;
  } else {
    for (const req of requirements) {
      md += `### ${req.id}: ${req.parsedData?.title || 'Untitled Requirement'}\n\n`;
      
      // Priority and status badges
      const priorityBadge = getPriorityBadge(req.priority);
      const statusBadge = getStatusBadge(req.status);
      md += `> **Priority:** ${priorityBadge} | **Status:** ${statusBadge}\n\n`;
      
      // Raw input
      md += `**Original Request:**\n\n`;
      md += `> ${req.rawInput}\n\n`;
      
      // Parsed data
      if (req.parsedData) {
        if (req.parsedData.description) {
          md += `**Description:**\n\n${req.parsedData.description}\n\n`;
        }
        
        if (req.parsedData.actors && req.parsedData.actors.length > 0) {
          md += `**Actors:**\n\n`;
          for (const actor of req.parsedData.actors) {
            md += `- ${actor}\n`;
          }
          md += `\n`;
        }
        
        if (req.parsedData.goals && req.parsedData.goals.length > 0) {
          md += `**Goals:**\n\n`;
          for (const goal of req.parsedData.goals) {
            md += `- ${goal}\n`;
          }
          md += `\n`;
        }
        
        if (req.parsedData.userStories && req.parsedData.userStories.length > 0) {
          md += `**User Stories:**\n\n`;
          for (const story of req.parsedData.userStories) {
            md += `- ${story}\n`;
          }
          md += `\n`;
        }
        
        if (req.parsedData.acceptanceCriteria && req.parsedData.acceptanceCriteria.length > 0) {
          md += `**Acceptance Criteria:**\n\n`;
          for (const criteria of req.parsedData.acceptanceCriteria) {
            md += `- [ ] ${criteria}\n`;
          }
          md += `\n`;
        }
        
        if (req.parsedData.constraints && req.parsedData.constraints.length > 0) {
          md += `**Constraints:**\n\n`;
          for (const constraint of req.parsedData.constraints) {
            md += `- ${constraint}\n`;
          }
          md += `\n`;
        }
        
        if (req.parsedData.notes) {
          md += `**Notes:**\n\n${req.parsedData.notes}\n\n`;
        }
      }
      
      md += `---\n\n`;
    }
  }
  
  // Domain Model section
  if (domainModel && domainModel.entities.length > 0) {
    md += `## Domain Model\n\n`;
    md += `### Entities\n\n`;
    
    for (const entity of domainModel.entities) {
      md += `#### ${entity.name}\n\n`;
      md += `- **Type:** ${entity.type}\n`;
      if (entity.description) {
        md += `- **Description:** ${entity.description}\n`;
      }
      
      if (entity.properties && entity.properties.length > 0) {
        md += `\n**Properties:**\n\n`;
        md += `| Name | Type | Required | Description |\n`;
        md += `|------|------|----------|-------------|\n`;
        for (const prop of entity.properties) {
          const required = prop.required ? '✓' : '-';
          const desc = prop.description || '-';
          md += `| ${prop.name} | ${prop.type} | ${required} | ${desc} |\n`;
        }
        md += `\n`;
      }
      md += `\n`;
    }
    
    // Relations
    if (domainModel.relations.length > 0) {
      md += `### Relations\n\n`;
      md += `| From | To | Type | Description |\n`;
      md += `|------|-----|------|-------------|\n`;
      
      for (const relation of domainModel.relations) {
        const fromEntity = domainModel.entities.find(e => e.id === relation.sourceEntityId);
        const toEntity = domainModel.entities.find(e => e.id === relation.targetEntityId);
        const fromName = fromEntity?.name || relation.sourceEntityId;
        const toName = toEntity?.name || relation.targetEntityId;
        const desc = relation.description || '-';
        
        md += `| ${fromName} | ${toName} | ${relation.relationType} | ${desc} |\n`;
      }
      md += `\n`;
    }
    
    // Relation types legend
    md += `### Relation Types\n\n`;
    md += `- **depends-on**: Source entity depends on target entity\n`;
    md += `- **related-to**: Source entity is related to target entity\n`;
    md += `- **parent-child**: Source entity is parent of target entity\n`;
    md += `- **implements**: Source entity implements target entity\n`;
    md += `- **associates**: Source entity associates with target entity\n`;
    md += `- **contains**: Source entity contains target entity\n`;
    md += `- **uses**: Source entity uses target entity\n`;
    
    md += `\n---\n\n`;
  }
  
  // Appendix - Requirements Summary Table
  md += `## Requirements Summary\n\n`;
  md += `| ID | Title | Priority | Status |\n`;
  md += `|----|-------|----------|--------|\n`;
  for (const req of requirements) {
    const title = req.parsedData?.title || 'Untitled';
    md += `| ${req.id} | ${title} | ${req.priority} | ${req.status} |\n`;
  }
  md += `\n`;
  
  // Footer
  md += `---\n\n`;
  md += `*This PRD was generated on ${new Date().toLocaleString()}*\n`;
  
  return md;
}

/**
 * Get priority badge text
 */
function getPriorityBadge(priority: string): string {
  const badges: Record<string, string> = {
    low: '🟢 Low',
    medium: '🟡 Medium',
    high: '🟠 High',
    critical: '🔴 Critical',
  };
  return badges[priority.toLowerCase()] || priority;
}

/**
 * Get status badge text
 */
function getStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    draft: '📝 Draft',
    analyzing: '🔍 Analyzing',
    clarified: '💬 Clarified',
    confirmed: '✅ Confirmed',
  };
  return badges[status.toLowerCase()] || status;
}

// ==================== PDF Export ====================

/**
 * Convert Markdown to HTML for PDF generation
 */
function markdownToHTML(markdown: string): string {
  const html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Lists (using non-greedy match)
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/<\/li><li>/gim, '</li><li>')
    // Wrap consecutive li elements in ul
    .replace(/(<li>[^<]*<\/li>)(?=<li>)/g, '$1')
    .replace(/(<li>[^<]*<\/li>)+/g, '<ul>$&</ul>')
    // Checkboxes
    .replace(/\- \[ \] (.*$)/gim, '<input type="checkbox"> $1<br>')
    .replace(/\- \[x\] (.*$)/gim, '<input type="checkbox" checked> $1<br>')
    // Blockquotes
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr>')
    // Line breaks
    .replace(/\n/gim, '<br>');
  
  return html;
}

/**
 * Generate PDF from Markdown using browser print
 * Returns a simple HTML document that can be printed to PDF
 */
export function generatePDFHTML(markdown: string, options: PDFExportOptions = {}): string {
  const {
    pageSize = 'A4',
    margin = { top: 20, right: 20, bottom: 20, left: 20 },
    header = true,
    footer = true,
    includePageNumbers = true,
  } = options;
  
  const htmlContent = markdownToHTML(markdown);
  const pageSizeCSS = pageSize === 'Letter' ? 'letter' : 'a4';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PRD Document</title>
  <style>
    @page {
      size: ${pageSizeCSS};
      margin: ${margin.top}mm ${margin.right}mm ${margin.bottom}mm ${margin.left}mm;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    
    h1 {
      font-size: 24pt;
      color: #1a1a1a;
      border-bottom: 2px solid #333;
      padding-bottom: 8px;
      margin-top: 0;
    }
    
    h2 {
      font-size: 18pt;
      color: #2a2a2a;
      margin-top: 24pt;
      margin-bottom: 12pt;
    }
    
    h3 {
      font-size: 14pt;
      color: #3a3a3a;
      margin-top: 16pt;
      margin-bottom: 8pt;
    }
    
    p {
      margin: 8pt 0;
    }
    
    ul, ol {
      margin: 8pt 0;
      padding-left: 24pt;
    }
    
    li {
      margin: 4pt 0;
    }
    
    blockquote {
      border-left: 3px solid #ddd;
      margin: 12pt 0;
      padding: 8pt 16pt;
      background: #f9f9f9;
      color: #555;
    }
    
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 16pt 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8pt;
      text-align: left;
    }
    
    th {
      background: #f5f5f5;
      font-weight: 600;
    }
    
    input[type="checkbox"] {
      margin-right: 8pt;
    }
    
    .header {
      display: ${header ? 'block' : 'none'};
      border-bottom: 1px solid #ddd;
      padding-bottom: 8pt;
      margin-bottom: 16pt;
    }
    
    .footer {
      display: ${footer ? 'block' : 'none'};
      border-top: 1px solid #ddd;
      padding-top: 8pt;
      margin-top: 16pt;
      font-size: 10pt;
      color: #666;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <strong>Product Requirements Document</strong>
  </div>
  
  ${htmlContent}
  
  <div class="footer">
    ${includePageNumbers ? '<span class="page-number">Page </span>' : ''}
    Generated on ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;
}

/**
 * Export PRD to PDF format (returns HTML that can be converted to PDF)
 * Note: For actual PDF generation, you would use a library like puppeteer or pdfkit
 * This function generates HTML that can be printed to PDF by a browser
 */
export function exportPRDToPDF(prd: PRDData, options: PDFExportOptions = {}): string {
  const markdown = exportPRDToMarkdown(prd);
  return generatePDFHTML(markdown, options);
}

/**
 * Export PRD to PDF as base64 (using jsPDF library approach)
 * This is a simplified version - in production you'd use puppeteer or similar
 */
export async function exportPRDToPDFFromMarkdown(
  markdown: string,
  options: PDFExportOptions = {}
): Promise<Buffer> {
  // This would require a PDF library like puppeteer or pdfkit
  // For now, return the HTML that can be printed to PDF
  const html = generatePDFHTML(markdown, options);
  
  // In a real implementation, you would use puppeteer:
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.setContent(html);
  // const pdf = await page.pdf({ format: options.pageSize || 'A4' });
  // await browser.close();
  // return Buffer.from(pdf);
  
  // Return HTML as Buffer for now
  return Buffer.from(html, 'utf-8');
}

// ==================== Unified Export Functions ====================

/**
 * Export PRD to specified format
 */
export function exportPRD(
  prd: PRDData,
  format: PRDExportFormat,
  options?: PDFExportOptions
): string {
  switch (format) {
    case 'markdown':
      return exportPRDToMarkdown(prd);
    case 'pdf':
      return exportPRDToPDF(prd, options);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Get content type for export format
 */
export function getPRDExportContentType(format: PRDExportFormat): string {
  switch (format) {
    case 'markdown':
      return 'text/markdown';
    case 'pdf':
      return 'text/html'; // HTML that can be printed to PDF
    default:
      return 'application/octet-stream';
  }
}

/**
 * Get file extension for export format
 */
export function getPRDExportFileExtension(format: PRDExportFormat): string {
  switch (format) {
    case 'markdown':
      return 'md';
    case 'pdf':
      return 'html'; // Returns HTML that can be saved as PDF
    default:
      return 'txt';
  }
}

// ==================== Hono Route ====================

/**
 * Create PRD export routes
 */
export function createPRDExportRoutes() {
  const prdExport = new Hono();
  
  // Export PRD as Markdown
  prdExport.post('/markdown', async (c) => {
    const body = await c.req.json();
    const prd = body.prd as PRDData;
    
    if (!prd) {
      return c.json({ error: 'PRD data is required' }, 400);
    }
    
    const markdown = exportPRDToMarkdown(prd);
    
    return c.json({
      content: markdown,
      contentType: 'text/markdown',
      fileExtension: 'md',
    });
  });
  
  // Export PRD as PDF (HTML for printing)
  prdExport.post('/pdf', async (c) => {
    const body = await c.req.json();
    const prd = body.prd as PRDData;
    const options = body.options as PDFExportOptions | undefined;
    
    if (!prd) {
      return c.json({ error: 'PRD data is required' }, 400);
    }
    
    const pdfHtml = exportPRDToPDF(prd, options);
    
    return c.json({
      content: pdfHtml,
      contentType: 'text/html',
      fileExtension: 'html',
    });
  });
  
  // Export PRD with format selection
  prdExport.post('/export', async (c) => {
    const body = await c.req.json();
    const prd = body.prd as PRDData;
    const format = body.format as PRDExportFormat;
    const options = body.options as PDFExportOptions | undefined;
    
    if (!prd) {
      return c.json({ error: 'PRD data is required' }, 400);
    }
    
    if (!format || !['markdown', 'pdf'].includes(format)) {
      return c.json({ error: 'Invalid format. Use "markdown" or "pdf"' }, 400);
    }
    
    const content = exportPRD(prd, format, options);
    const contentType = getPRDExportContentType(format);
    const fileExtension = getPRDExportFileExtension(format);
    
    return c.json({
      content,
      contentType,
      fileExtension,
    });
  });
  
  return prdExport;
}

// ==================== Default Export ====================

export default {
  exportPRDToMarkdown,
  exportPRDToPDF,
  exportPRD,
  generatePDFHTML,
  getPRDExportContentType,
  getPRDExportFileExtension,
  createPRDExportRoutes,
};
