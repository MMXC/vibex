/**
 * PDF Export Utility
 * 导出 PRD 为 PDF 格式
 */

import { PRDData, PRDSection } from './prdExport';

/**
 * Generate simple HTML for PDF
 */
function generateHTML(data: PRDData): string {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.projectName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111827; }
    h1 { font-size: 28px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; }
    h2 { font-size: 20px; margin-top: 32px; color: #111827; }
    h3 { font-size: 16px; color: #374151; }
    p { line-height: 1.7; color: #4b5563; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .section { margin-bottom: 24px; }
    .divider { border-top: 1px solid #e5e7eb; margin: 32px 0; }
  </style>
</head>
<body>
  <h1>${data.projectName}</h1>
  <div class="meta">
    ${data.version ? `<span>版本: ${data.version}</span>` : ''}
    ${data.author ? `<span> | 作者: ${data.author}</span>` : ''}
    ${data.createdAt ? `<span> | 创建时间: ${data.createdAt}</span>` : ''}
  </div>
  <div class="divider"></div>
`;

  data.sections.forEach((section: PRDSection, index: number) => {
    html += `
  <div class="section">
    <h2>${index + 1}. ${section.title}</h2>
    <p>${section.content.replace(/\n/g, '<br>')}</p>
  </div>
`;
  });

  html += `
</body>
</html>`;

  return html;
}

/**
 * Export PRD to PDF using browser print
 * This creates a print-friendly HTML that can be saved as PDF
 */
export async function exportPRDToPDF(data: PRDData): Promise<void> {
  const html = generateHTML(data);
  
  // Create a new window with the HTML content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('无法打开打印窗口，请检查弹出窗口设置');
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load then trigger print
  printWindow.onload = () => {
    printWindow.print();
  };
}

/**
 * Download PRD as PDF using a simple approach
 * Creates HTML that user can print to PDF
 */
export function downloadPRDAsPDF(data: PRDData, filename?: string): void {
  const html = generateHTML(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${data.projectName.replace(/\s+/g, '-').toLowerCase()}-prd.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create a complete PDF-ready HTML document
 */
export function createPDFReadyHTML(data: PRDData): string {
  return generateHTML(data);
}

export default {
  exportPRDToPDF,
  downloadPRDAsPDF,
  createPDFReadyHTML,
};
