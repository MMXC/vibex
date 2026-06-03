/**
 * parseMentions — S57-E5: @username extraction utility
 *
 * 功能：
 * - 从文本中提取 @username 模式
 * - 返回去重后的 username 数组
 *
 * 边界处理：
 * - 空字符串 → []
 * - 无 mention → []
 * - 重复 mentions → 去重
 * - @ 在行首 → 正确提取
 * - 多 mentions → 全部提取
 * - @ 后为非单词字符 → 不计入
 */

/** 匹配 @ 后紧跟字母/数字/下划线的连续字符 */
const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

/**
 * Extract unique @usernames from text.
 *
 * @param text - input text (e.g. comment text, chat message)
 * @returns deduplicated array of usernames (without the @ prefix)
 *
 * @example
 * parseMentions('@alice @bob hello @alice') → ['alice', 'bob']
 * parseMentions('no mentions here')          → []
 * parseMentions('@alice @alice @alice')       → ['alice']
 * parseMentions('@alice @bob @charlie')       → ['alice', 'bob', 'charlie']
 * parseMentions('')                           → []
 * parseMentions('@alice\n@bob')               → ['alice', 'bob']
 */
export function parseMentions(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const mentions: string[] = [];
  let match: RegExpExecArray | null;

  // Reset lastIndex to ensure we start from the beginning
  MENTION_REGEX.lastIndex = 0;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    const username = match[1];
    if (username && !mentions.includes(username)) {
      mentions.push(username);
    }
  }

  return mentions;
}
