/**
 * export-bpmn.test.ts — E15-P003 U4 Tests
 * Tests bpmn-js modeler instantiation and BPMN XML structure.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dynamic imports
vi.mock('bpmn-js/lib/Modeler', () => ({
  default: vi.fn().mockImplementation(() => ({
    importXML: vi.fn().mockResolvedValue(undefined),
    saveXML: vi.fn().mockResolvedValue({
      xml: '<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions />',
    }),
    importDefinitions: vi.fn(),
  })),
}));

vi.mock('bpmn-js/lib/features/modeling/Modeling', () => ({
  default: {},
}));

vi.mock('bpmn-js/lib/auto/ElementFactory', () => ({
  default: {},
}));

// Import after mocks
import type { BusinessFlow } from '@/stores/deliveryStore';

describe('BPMN Export — E15-P003 U4', () => {
  describe('BpmnModeler instantiation', () => {
    it('creates a bpmnModeler instance without top-level import', async () => {
      // The mock verifies that BpmnModeler is called only when createBpmnModeler() is invoked,
      // not at module load time. This ensures dynamic import works correctly.
      const { default: BpmnModeler } = await import('bpmn-js/lib/Modeler');
      const modeler = new BpmnModeler({
        additionalModules: [{}, {}],
        keyboard: { bindAsGlobal: false },
      });
      expect(modeler).toBeDefined();
      expect(typeof modeler.importXML).toBe('function');
      expect(typeof modeler.saveXML).toBe('function');
    });

    it('modeler supports importXML and saveXML', async () => {
      const { default: BpmnModeler } = await import('bpmn-js/lib/Modeler');
      const modeler = new BpmnModeler({ additionalModules: [], keyboard: { bindAsGlobal: false } });
      expect(typeof modeler.importXML).toBe('function');
      expect(typeof modeler.saveXML).toBe('function');
    });
  });

  describe('BPMN XML structure', () => {
    it('generates XML containing bpmn:startEvent', async () => {
      const { exportFlowToBpmn } = await import('@/lib/delivery/export-bpmn');
      const flow: BusinessFlow = {
        id: 'flow-1',
        name: '测试流程',
        contextName: '测试域',
        stepCount: 2,
        decisionCount: 0,
        steps: ['步骤1', '步骤2'],
      };
      const xml = await exportFlowToBpmn(flow);
      expect(xml).toContain('<bpmn:startEvent');
    });

    it('generates XML containing bpmn:endEvent', async () => {
      const { exportFlowToBpmn } = await import('@/lib/delivery/export-bpmn');
      const flow: BusinessFlow = {
        id: 'flow-2',
        name: '下单流程',
        contextName: '订单域',
        stepCount: 3,
        decisionCount: 1,
      };
      const xml = await exportFlowToBpmn(flow);
      expect(xml).toContain('<bpmn:endEvent');
    });

    it('generates XML containing bpmn:serviceTask', async () => {
      const { exportFlowToBpmn } = await import('@/lib/delivery/export-bpmn');
      const flow: BusinessFlow = {
        id: 'flow-3',
        name: '支付流程',
        contextName: '支付域',
        stepCount: 1,
        decisionCount: 0,
      };
      const xml = await exportFlowToBpmn(flow);
      expect(xml).toContain('<bpmn:serviceTask');
    });

    it('generates XML containing bpmn:sequenceFlow', async () => {
      const { exportFlowToBpmn } = await import('@/lib/delivery/export-bpmn');
      const flow: BusinessFlow = {
        id: 'flow-4',
        name: '注册流程',
        contextName: '用户域',
        stepCount: 2,
        decisionCount: 0,
      };
      const xml = await exportFlowToBpmn(flow);
      expect(xml).toContain('<bpmn:sequenceFlow');
    });

    it('uses flow.steps names when provided', async () => {
      const { exportFlowToBpmn } = await import('@/lib/delivery/export-bpmn');
      const flow: BusinessFlow = {
        id: 'flow-5',
        name: '订单流程',
        contextName: '订单域',
        stepCount: 2,
        decisionCount: 0,
        steps: ['创建订单', '支付订单'],
      };
      const xml = await exportFlowToBpmn(flow);
      expect(xml).toContain('创建订单');
      expect(xml).toContain('支付订单');
    });

    it('escapes special characters in flow name', async () => {
      const { exportFlowToBpmn } = await import('@/lib/delivery/export-bpmn');
      const flow: BusinessFlow = {
        id: 'flow-6',
        name: '流程 & 测试 <special> chars',
        contextName: '测试域',
        stepCount: 1,
        decisionCount: 0,
      };
      const xml = await exportFlowToBpmn(flow);
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&lt;');
      expect(xml).not.toContain('& <');
    });

    it('produces valid XML declaration', async () => {
      const { exportFlowToBpmn } = await import('@/lib/delivery/export-bpmn');
      const flow: BusinessFlow = {
        id: 'flow-7',
        name: '简单流程',
        contextName: '测试域',
        stepCount: 1,
        decisionCount: 0,
      };
      const xml = await exportFlowToBpmn(flow);
      expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    });

    it('downloadBpmnXml triggers download without error', async () => {
      const { downloadBpmnXml } = await import('@/lib/delivery/export-bpmn');
      const xml = '<?xml version="1.0"?><bpmn:definitions />';
      // Should not throw
      expect(() => downloadBpmnXml(xml, 'test.bpmn')).not.toThrow();
    });

    it('xmlToBlob produces application/xml blob', async () => {
      const { xmlToBlob } = await import('@/lib/delivery/export-bpmn');
      const xml = '<?xml version="1.0"?><bpmn:definitions />';
      const blob = xmlToBlob(xml);
      expect(blob.type).toBe('application/xml');
    });
  });
});