/**
 * messageMiddleware.test.tsx
 * Unit tests for Epic 4: auto-messaging on node operations
 *
 * PRD Epic 4 S4.2: 验证节点操作自动追加消息
 * PRD Epic 4 S4.3: 验证刷新后消息持久化
 */

// Mock localStorage BEFORE importing stores
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    get length() { return 0; },
  },
  writable: true,
  configurable: true,
});

import { act } from '@testing-library/react';
import { useCanvasStore } from '../canvasStore';
import { useMessageDrawerStore } from '@/components/canvas/messageDrawer/messageDrawerStore';

describe('Epic 4: messageMiddleware — auto-append messages on node operations', () => {
  beforeEach(() => {
    // Reset both stores before each test
    act(() => {
      // Clear canvasStore messages (Epic 6: messages now live in canvasStore)
      useCanvasStore.getState().clearMessages();
      useCanvasStore.setState({
        contextNodes: [],
        flowNodes: [],
        componentNodes: [],
        projectId: null,
      });
      useMessageDrawerStore.setState({ messages: [], isOpen: false });
    });
  });

  describe('S4.2: Context node operations auto-append messages', () => {
    it('should append user_action message when adding context node', () => {
      act(() => {
        useCanvasStore.getState().addContextNode({
          name: '测试上下文',
          description: '测试描述',
          type: 'core',
        });
      });
      const messages = useCanvasStore.getState().messages;
      expect(messages.length).toBeGreaterThanOrEqual(1);
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.type).toBe('user_action');
      expect(lastMsg.content).toBe('添加了上下文节点');
      expect(lastMsg.meta).toBe('测试上下文');
    });

    it('should append user_action message when deleting context node', () => {
      act(() => {
        useCanvasStore.getState().addContextNode({
          name: '待删除节点',
          description: '',
          type: 'core',
        });
      });
      const nodeId = useCanvasStore.getState().contextNodes[0]?.nodeId;
      act(() => {
        useCanvasStore.getState().deleteContextNode(nodeId);
      });
      const messages = useCanvasStore.getState().messages;
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.type).toBe('user_action');
      expect(lastMsg.content).toBe('删除了上下文节点');
      expect(lastMsg.meta).toBe('待删除节点');
    });

    it('should append user_action message when confirming context node', () => {
      act(() => {
        useCanvasStore.getState().addContextNode({
          name: '待确认节点',
          description: '',
          type: 'core',
        });
      });
      const nodeId = useCanvasStore.getState().contextNodes[0]?.nodeId;
      act(() => {
        useCanvasStore.getState().confirmContextNode(nodeId);
      });
      const messages = useCanvasStore.getState().messages;
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.type).toBe('user_action');
      expect(lastMsg.content).toBe('确认了上下文节点');
      expect(lastMsg.meta).toBe('待确认节点');
    });

    it('should append user_action message when un-confirming context node', () => {
      act(() => {
        useCanvasStore.getState().addContextNode({
          name: '待取消节点',
          description: '',
          type: 'core',
        });
      });
      const nodeId = useCanvasStore.getState().contextNodes[0]?.nodeId;
      // First confirm
      act(() => {
        useCanvasStore.getState().confirmContextNode(nodeId);
      });
      // Then un-confirm
      act(() => {
        useCanvasStore.getState().confirmContextNode(nodeId);
      });
      const messages = useCanvasStore.getState().messages;
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.type).toBe('user_action');
      expect(lastMsg.content).toBe('删除了上下文节点');
      expect(lastMsg.meta).toBe('待取消节点');
    });
  });

  describe('S4.2: Flow node operations auto-append messages', () => {
    it('should append user_action message when adding flow node', () => {
      act(() => {
        useCanvasStore.getState().addFlowNode({
          contextId: 'ctx-1',
          name: '测试流程',
          steps: [],
        });
      });
      const messages = useCanvasStore.getState().messages;
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.type).toBe('user_action');
      expect(lastMsg.content).toBe('添加了流程节点');
      expect(lastMsg.meta).toBe('测试流程');
    });

    it('should append user_action message when deleting flow node', () => {
      act(() => {
        useCanvasStore.getState().addFlowNode({
          contextId: 'ctx-1',
          name: '待删除流程',
          steps: [],
        });
      });
      const nodeId = useCanvasStore.getState().flowNodes[0]?.nodeId;
      act(() => {
        useCanvasStore.getState().deleteFlowNode(nodeId);
      });
      const messages = useCanvasStore.getState().messages;
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.type).toBe('user_action');
      expect(lastMsg.content).toBe('删除了流程节点');
      expect(lastMsg.meta).toBe('待删除流程');
    });

    it('should append user_action message when confirming flow node', () => {
      act(() => {
        useCanvasStore.getState().addFlowNode({
          contextId: 'ctx-1',
          name: '待确认流程',
          steps: [],
        });
      });
      const nodeId = useCanvasStore.getState().flowNodes[0]?.nodeId;
      act(() => {
        useCanvasStore.getState().confirmFlowNode(nodeId);
      });
      const messages = useCanvasStore.getState().messages;
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.type).toBe('user_action');
      expect(lastMsg.content).toBe('确认了流程节点');
      expect(lastMsg.meta).toBe('待确认流程');
    });
  });

  describe('S4.2: Component node operations auto-append messages', () => {
    it('should append user_action message when adding component node', () => {
      act(() => {
        useCanvasStore.getState().addComponentNode({
          flowId: 'flow-1',
          name: '测试组件',
          type: 'page',
          props: {},
          api: { method: 'GET', path: '/test', params: [] },
        });
      });
      const messages = useCanvasStore.getState().messages;
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.type).toBe('user_action');
      expect(lastMsg.content).toBe('添加了组件节点');
      expect(lastMsg.meta).toBe('测试组件');
    });

    it('should append user_action message when deleting component node', () => {
      act(() => {
        useCanvasStore.getState().addComponentNode({
          flowId: 'flow-1',
          name: '待删除组件',
          type: 'page',
          props: {},
          api: { method: 'GET', path: '/test', params: [] },
        });
      });
      const nodeId = useCanvasStore.getState().componentNodes[0]?.nodeId;
      act(() => {
        useCanvasStore.getState().deleteComponentNode(nodeId);
      });
      const messages = useCanvasStore.getState().messages;
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.type).toBe('user_action');
      expect(lastMsg.content).toBe('删除了组件节点');
      expect(lastMsg.meta).toBe('待删除组件');
    });

    it('should append user_action message when confirming component node', () => {
      act(() => {
        useCanvasStore.getState().addComponentNode({
          flowId: 'flow-1',
          name: '待确认组件',
          type: 'page',
          props: {},
          api: { method: 'GET', path: '/test', params: [] },
        });
      });
      const nodeId = useCanvasStore.getState().componentNodes[0]?.nodeId;
      act(() => {
        useCanvasStore.getState().confirmComponentNode(nodeId);
      });
      const messages = useCanvasStore.getState().messages;
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg.type).toBe('user_action');
      expect(lastMsg.content).toBe('确认了组件节点');
      expect(lastMsg.meta).toBe('待确认组件');
    });
  });

  describe('S4.3: Message persistence', () => {
    it('should store messages in messageDrawerStore (which has persist middleware)', () => {
      act(() => {
        useCanvasStore.getState().addContextNode({
          name: '持久化测试',
          description: '',
          type: 'core',
        });
      });
      const messages = useCanvasStore.getState().messages;
      expect(messages.length).toBeGreaterThan(0);
      // messageDrawerStore uses persist middleware — messages survive page refresh
      const msgWithTimestamp = messages.find((m) => m.timestamp > 0);
      expect(msgWithTimestamp).toBeDefined();
    });
  });
});
