/**
 * parseMentions — Sprint51 E5: @提及解析工具
 *
 * 从文本中提取 @用户名列表。
 * 支持格式: @alice, @bob, @张三
 * 不区分大小写，但保留原始大小写在结果中。
 */

const MENTION_REGEX = /@([\w\u4e00-\u9fa5]+)/g;

/**
 * 从文本中解析所有 @mention 用户名
 * @param text 输入文本
 * @returns 用户名列表（去重，按出现顺序）
 *
 * @example
 * parseMentions('@alice @bob 你好') // ['alice', 'bob']
 * parseMentions('Hello @Alice, 请找@Bob处理') // ['Alice', 'Bob']
 * parseMentions('没有提及') // []
 */
export function parseMentions(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  const mentions: string[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  MENTION_REGEX.lastIndex = 0;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    const username = match[1];
    if (username && !mentions.includes(username)) {
      mentions.push(username);
    }
  }

  return mentions;
}

/**
 * 检查文本是否包含指定用户的 @提及
 * @param text 输入文本
 * @param username 要检查的用户名
 */
export function mentionsUser(text: string, username: string): boolean {
  const mentions = parseMentions(text);
  return mentions.some(m => m.toLowerCase() === username.toLowerCase());
}

/**
 * getMentionQueryAtCursor — 解析 textarea 光标前的 @ 触发器
 * @param text 当前文本
 * @param cursorPos 光标位置（0-indexed）
 * @returns 查询字符串、''（@开头但无输入）、或 null（未在 mention 中）
 */
export function getMentionQueryAtCursor(text: string, cursorPos: number): string | null {
  const beforeCursor = text.slice(0, cursorPos);
  const triggerIndex = beforeCursor.lastIndexOf('@');

  if (triggerIndex === -1) return null;

  // 确保 @ 后面没有空格
  const afterTrigger = beforeCursor.slice(triggerIndex + 1);
  if (afterTrigger.includes(' ')) return null;

  return afterTrigger;
}

