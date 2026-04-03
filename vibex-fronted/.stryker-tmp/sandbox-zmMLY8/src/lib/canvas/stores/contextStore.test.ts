// @ts-nocheck
import { useContextStore } from './contextStore';

describe('useContextStore', () => {
  beforeEach(() => {
    useContextStore.setState({ contextNodes: [], contextDraft: null });
  });

  it('should add a context node', () => {
    useContextStore.getState().addContextNode({
      name: '测试上下文',
      description: '测试描述',
      type: 'core',
    });
    const nodes = useContextStore.getState().contextNodes;
    expect(nodes.length).toBe(1);
    expect(nodes[0].name).toBe('测试上下文');
    expect(nodes[0].status).toBe('pending');
  });

  it('should edit a context node', () => {
    useContextStore.getState().addContextNode({ name: '原始名称', description: '', type: 'core' });
    const nodeId = useContextStore.getState().contextNodes[0].nodeId;
    useContextStore.getState().editContextNode(nodeId, { name: '新名称' });
    expect(useContextStore.getState().contextNodes[0].name).toBe('新名称');
    expect(useContextStore.getState().contextNodes[0].status).toBe('pending');
  });

  it('should delete a context node', () => {
    useContextStore.getState().addContextNode({ name: '待删除', description: '', type: 'core' });
    const nodeId = useContextStore.getState().contextNodes[0].nodeId;
    useContextStore.getState().deleteContextNode(nodeId);
    expect(useContextStore.getState().contextNodes.length).toBe(0);
  });

  it('should confirm a context node', () => {
    useContextStore.getState().addContextNode({ name: '待确认', description: '', type: 'core' });
    const nodeId = useContextStore.getState().contextNodes[0].nodeId;
    useContextStore.getState().confirmContextNode(nodeId);
    const node = useContextStore.getState().contextNodes[0];
    expect(node.status).toBe('confirmed');
    expect(node.isActive).toBe(true);
  });
});
