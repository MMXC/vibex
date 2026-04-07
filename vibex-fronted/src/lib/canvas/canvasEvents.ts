/**
 * canvasEvents.ts — Canvas 事件类型定义
 *
 * E2: 画布消息抽屉
 * 统一管理 canvas 内部事件类型，供 messageDrawer / CommandInput 使用
 */

export type CanvasEventType =
  | 'canvas:submit'
  | 'canvas:gen-context'
  | 'canvas:gen-flow'
  | 'canvas:gen-component'
  | 'canvas:update-card'
  | 'canvas:clear';

export interface CanvasEvent {
  type: CanvasEventType;
  timestamp: number;
  payload?: unknown;
}
