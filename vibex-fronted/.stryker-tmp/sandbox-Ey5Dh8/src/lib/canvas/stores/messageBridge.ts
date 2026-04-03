/**
 * Message Bridge — decouples addMessage from circular canvasStore dependency.
 * Used by extracted slices (contextStore) to post user action messages
 * without directly importing canvasStore.
 */
// @ts-nocheck

type AddMessageFn = (msg: { type: string; content: string; meta?: string }) => void;

let _addMessage: AddMessageFn | null = null;

export function registerMessageBridge(fn: AddMessageFn): void {
  _addMessage = fn;
}

export function postContextActionMessage(content: string, meta?: string): void {
  _addMessage?.({ type: 'user_action', content, meta });
}
