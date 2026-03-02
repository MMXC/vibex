import { Message } from '@/services/api';

/**
 * 导出对话为 Markdown 格式
 */
export function exportToMarkdown(messages: Message[], title: string = '对话记录'): string {
  let md = `# ${title}\n\n`;
  md += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  md += `---\n\n`;

  messages.forEach((msg) => {
    const roleLabel = msg.role === 'user' ? '👤 用户' : msg.role === 'assistant' ? '🤖 AI' : '⚙️ 系统';
    const time = msg.createdAt ? new Date(msg.createdAt).toLocaleString('zh-CN') : '';
    
    md += `### ${roleLabel}${time ? ` - ${time}` : ''}\n\n`;
    
    if (msg.quotedContent) {
      md += `> 引用: ${msg.quotedContent}\n\n`;
    }
    
    md += `${msg.content}\n\n`;
    md += `---\n\n`;
  });

  return md;
}

/**
 * 导出对话为 JSON 格式
 */
export function exportToJSON(messages: Message[], title: string = '对话记录'): string {
  return JSON.stringify({
    title,
    exportedAt: new Date().toISOString(),
    messageCount: messages.length,
    messages: messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      quotedContent: msg.quotedContent,
      createdAt: msg.createdAt,
    })),
  }, null, 2);
}

/**
 * 导出对话为纯文本格式
 */
export function exportToText(messages: Message[], title: string = '对话记录'): string {
  let text = `${title}\n`;
  text += `${'='.repeat(40)}\n\n`;
  text += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

  messages.forEach((msg) => {
    const roleLabel = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? 'AI' : '系统';
    const time = msg.createdAt ? new Date(msg.createdAt).toLocaleString('zh-CN') : '';
    
    text += `[${roleLabel}]${time ? ` ${time}` : ''}\n`;
    
    if (msg.quotedContent) {
      text += `> 引用: ${msg.quotedContent}\n`;
    }
    
    text += `${msg.content}\n\n`;
    text += `${'-'.repeat(40)}\n\n`;
  });

  return text;
}

/**
 * 触发文件下载
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 导出对话并触发下载
 */
export function exportConversation(
  messages: Message[],
  format: 'markdown' | 'json' | 'text',
  title?: string
): void {
  const timestamp = new Date().toISOString().slice(0, 10);
  const defaultTitle = title || '对话记录';

  switch (format) {
    case 'markdown':
      downloadFile(
        exportToMarkdown(messages, defaultTitle),
        `${defaultTitle}_${timestamp}.md`,
        'text/markdown'
      );
      break;
    case 'json':
      downloadFile(
        exportToJSON(messages, defaultTitle),
        `${defaultTitle}_${timestamp}.json`,
        'application/json'
      );
      break;
    case 'text':
      downloadFile(
        exportToText(messages, defaultTitle),
        `${defaultTitle}_${timestamp}.txt`,
        'text/plain'
      );
      break;
  }
}
