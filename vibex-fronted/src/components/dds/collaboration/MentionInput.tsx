'use client';

/**
 * MentionInput — S68-E2: @提及通知系统
 *
 * 协作文本输入框，支持 @ 触发用户名自动补全。
 * 在 @ 后输入字符触发下拉用户列表，点击用户完成补全。
 *
 * 设计决策（来自 PRD E2 DoD）：
 * - @ 后显示用户列表（从 presenceStore 在线用户过滤）
 * - 点击用户补全 @username
 * - 与现有 CollabActivityPanel 互补（活动流仅展示）
 */
import React, {
  memo,
  useState,
  useRef,
  useCallback,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
} from 'react';
import styles from './MentionInput.module.css';

export interface MentionInputProps {
  /** 当前用户 ID */
  currentUserId?: string;
  /** Placeholder 文案 */
  placeholder?: string;
  /** 发送消息回调 */
  onSend: (text: string, mentions: string[]) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 初始值 */
  defaultValue?: string;
}

/** 模拟在线用户（实际应从 presenceStore 读取） */
const MOCK_ONLINE_USERS = [
  { id: 'u1', name: '张三', avatar: '👤' },
  { id: 'u2', name: '李四', avatar: '👤' },
  { id: 'u3', name: '王五', avatar: '👤' },
  { id: 'u4', name: '赵六', avatar: '👤' },
  { id: 'u5', name: '钱七', avatar: '👤' },
];

function filterUsers(query: string, excludeId?: string) {
  if (!query) return MOCK_ONLINE_USERS.filter(u => u.id !== excludeId);
  return MOCK_ONLINE_USERS.filter(
    u => u.id !== excludeId && u.name.includes(query)
  );
}

const MentionInput = memo(function MentionInput({
  currentUserId,
  placeholder = '说点什么...（输入 @ 提及协作者）',
  onSend,
  disabled = false,
  defaultValue = '',
}: MentionInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // Filtered user list
  const users = filterUsers(mentionQuery, currentUserId);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      autoResize();

      // Detect @ trigger
      const cursor = e.target.selectionStart ?? newValue.length;
      const textBefore = newValue.slice(0, cursor);

      // Find last @ before cursor
      const lastAt = textBefore.lastIndexOf('@');
      if (lastAt >= 0) {
        const textAfterAt = textBefore.slice(lastAt + 1);
        // Only trigger if no space between @ and cursor
        if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
          setMentionStart(lastAt);
          setMentionQuery(textAfterAt);
          setShowDropdown(true);
          setSelectedIndex(0);
          return;
        }
      }
      setShowDropdown(false);
      setMentionQuery('');
      setMentionStart(-1);
    },
    [autoResize]
  );

  const insertMention = useCallback(
    (userName: string, userId: string) => {
      const el = textareaRef.current;
      if (!el) return;
      const cursor = el.selectionStart ?? value.length;
      const before = value.slice(0, mentionStart);
      const after = value.slice(cursor);
      const mentionText = `@${userName} `;
      const newValue = before + mentionText + after;
      setValue(newValue);
      setShowDropdown(false);
      setMentionQuery('');
      setMentionStart(-1);
      autoResize();
      // Restore focus
      setTimeout(() => {
        const newCursor = mentionStart + mentionText.length;
        el.focus();
        el.setSelectionRange(newCursor, newCursor);
      }, 0);
    },
    [value, mentionStart, autoResize]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showDropdown) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, users.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (users[selectedIndex]) {
            insertMention(users[selectedIndex].name, users[selectedIndex].id);
          }
          break;
        case 'Escape':
          setShowDropdown(false);
          setMentionQuery('');
          break;
      }
    },
    [showDropdown, users, selectedIndex, insertMention]
  );

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    // Extract mentioned user IDs from @username patterns
    const mentionMatches = trimmed.match(/@(\S+)/g) ?? [];
    const mentions = mentionMatches.map((m: string) => m.slice(1));
    onSend(trimmed, mentions);
    setValue('');
    autoResize();
  }, [value, disabled, onSend, autoResize]);

  // Scroll dropdown into view
  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('li');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, showDropdown]);

  return (
    <div className={styles.container} role="form" aria-label="协作者消息输入">
      {showDropdown && users.length > 0 && (
        <ul
          ref={dropdownRef}
          className={styles.dropdown}
          role="listbox"
          aria-label="在线协作者"
        >
          {users.map((user, i) => (
            <li
              key={user.id}
              className={`${styles.dropdownItem} ${i === selectedIndex ? styles.selected : ''}`}
              role="option"
              aria-selected={i === selectedIndex}
              onClick={() => insertMention(user.name, user.id)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className={styles.avatar} aria-hidden="true">
                {user.avatar}
              </span>
              <span className={styles.userName}>{user.name}</span>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.inputRow}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label="消息输入"
          aria-multiline="true"
        />
        <button
          type="button"
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="发送消息"
          title="发送"
        >
          ➤
        </button>
      </div>
    </div>
  );
});

export default MentionInput;
