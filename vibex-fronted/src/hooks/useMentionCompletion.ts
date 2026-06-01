/**
 * useMentionCompletion — Sprint51 E5: @提及补全 Hook
 *
 * 监听 textarea 中的 @ 输入，触发补全下拉。
 * 支持键盘导航（↑↓ Enter Esc）。
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { parseMentions, getMentionQueryAtCursor } from '@/lib/canvas/parseMentions';

export interface MentionSuggestion {
  username: string;
  displayName: string;
  avatar?: string;
}

export interface UseMentionCompletionOptions {
  /** 模拟用户列表（实际从 API 获取） */
  suggestions?: MentionSuggestion[];
  /** 补全触发回调 */
  onQueryChange?: (query: string) => void;
}

const MENTION_TRIGGER = '@';

/**
 * 获取 @mention 在文本中的插入位置
 */
export function getMentionInsertPosition(text: string, cursorPos: number): number {
  const beforeCursor = text.slice(0, cursorPos);
  const triggerIndex = beforeCursor.lastIndexOf('@');
  return triggerIndex;
}

export function useMentionCompletion(
  options: UseMentionCompletionOptions = {}
) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerPosition, setTriggerPosition] = useState<{ top: number; left: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const suggestions = options.suggestions ?? getMockSuggestions();

  const filteredSuggestions = suggestions.filter(s =>
    s.username.toLowerCase().includes(query.toLowerCase()) ||
    s.displayName.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart ?? text.length;
    const q = getMentionQueryAtCursor(text, cursorPos);

    if (q !== null) {
      setIsOpen(true);
      setQuery(q);
      setSelectedIndex(0);
      options.onQueryChange?.(q);
    } else {
      setIsOpen(false);
      setQuery('');
    }
  }, [options]);

  const insertMention = useCallback((username: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = textarea.value;
    const cursorPos = textarea.selectionStart ?? text.length;
    const beforeCursor = text.slice(0, cursorPos);
    const triggerIndex = beforeCursor.lastIndexOf(MENTION_TRIGGER);

    if (triggerIndex === -1) return;

    const afterCursor = text.slice(cursorPos);
    const newText = text.slice(0, triggerIndex) + `@${username} ` + afterCursor;
    const newCursorPos = triggerIndex + username.length + 2; // +1 for @, +1 for space

    // Create a synthetic event to update the textarea
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(textarea, newText);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    textarea.selectionStart = newCursorPos;
    textarea.selectionEnd = newCursorPos;

    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredSuggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredSuggestions[selectedIndex]) {
          insertMention(filteredSuggestions[selectedIndex].username);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setQuery('');
        break;
    }
  }, [isOpen, filteredSuggestions, selectedIndex, insertMention]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  return {
    isOpen,
    query,
    selectedIndex,
    suggestions: filteredSuggestions,
    textareaRef,
    handleTextChange,
    handleKeyDown,
    insertMention,
    close,
  };
}

// Mock suggestions for development (replace with API call)
function getMockSuggestions(): MentionSuggestion[] {
  return [
    { username: 'alice', displayName: 'Alice Chen' },
    { username: 'bob', displayName: 'Bob Wang' },
    { username: 'carol', displayName: 'Carol Li' },
    { username: 'david', displayName: 'David Zhang' },
    { username: 'emma', displayName: 'Emma Liu' },
  ];
}
