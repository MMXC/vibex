/**
 * messageDrawerStore.ts — Zustand store for Canvas 消息抽屉
 *
 * Epic 1: F1.5 消息存储
 * PRD D1: Chat 模式（Slack 风格），独立于 AIChatPanel
 *
 * 消息类型:
 * - user_action: 用户操作（添加/确认/删除节点）
 * - ai_suggestion: AI 建议（预留）
 * - system: 系统消息（抽屉开关等）
 * - command_executed: 命令执行结果
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ── Types ────────────────────────────────────────────────────────────────────

export type MessageType = 'user_action' | 'ai_suggestion' | 'system' | 'command_executed';

export interface MessageItem {
  id: string;
  type: MessageType;
  /** 主文本，如 "添加了上下文节点: 用户模块" */
  content: string;
  /** 辅助信息，如命令名 "/gen-context" */
  meta?: string;
  timestamp: number; // Date.now()
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface MessageDrawerState {
  isOpen: boolean;
  messages: MessageItem[];
  // Actions
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  addMessage: (msg: Omit<MessageItem, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
}

let _messageIdCounter = 0;
function newMessageId(): string {
  return `msg-${Date.now()}-${++_messageIdCounter}`;
}

// ── Epic 1 F1.4: canvasStore 联动 ──────────────────────────────────────────
// canvasStore 各节点操作后调用此函数追加消息
export const useMessageDrawerStore = create<MessageDrawerState>()(
  persist(
    (set) => ({
      isOpen: false,
      messages: [],

      toggleDrawer: () =>
        set((s) => ({ isOpen: !s.isOpen })),

      openDrawer: () =>
        set({ isOpen: true }),

      closeDrawer: () =>
        set({ isOpen: false }),

      addMessage: (msg) =>
        set((s) => ({
          messages: [
            ...s.messages,
            {
              ...msg,
              id: newMessageId(),
              timestamp: Date.now(),
            },
          ],
        })),

      clearMessages: () =>
        set({ messages: [] }),
    }),
    {
      name: 'message-drawer-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist messages, not open state
      partialize: (state) => ({
        messages: state.messages,
      }),
    }
  )
);

// ── Epic 1 F1.4: Helper — 联动 canvasStore 节点操作 ────────────────────────
// 在 canvasStore 的 addContextNode / confirmContextNode / deleteContextNode 等函数中调用
export function addNodeMessage(
  action: 'add' | 'confirm' | 'delete',
  nodeType: 'context' | 'flow' | 'component',
  nodeName: string
) {
  const actionText = { add: '添加', confirm: '确认', delete: '删除' }[action];
  const typeText = { context: '上下文节点', flow: '流程节点', component: '组件节点' }[nodeType];
  useMessageDrawerStore.getState().addMessage({
    type: 'user_action',
    content: `${actionText}了${typeText}`,
    meta: nodeName,
  });
}

export function addSystemMessage(content: string, meta?: string) {
  useMessageDrawerStore.getState().addMessage({ type: 'system', content, meta });
}

export function addCommandMessage(command: string, result: string) {
  useMessageDrawerStore.getState().addMessage({
    type: 'command_executed',
    content: result,
    meta: command,
  });
}
