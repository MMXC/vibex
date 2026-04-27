/**
 * BPMN Export Service
 * Phase 1: StartEvent / EndEvent / ServiceTask / SequenceFlow
 * Dynamic import of bpmn-js to avoid SSR issues.
 */

import type { BusinessFlow } from '@/stores/deliveryStore';

let _modeler: unknown = null;

/** Dynamically import bpmn-js Modeler and return an instance */
async function createBpmnModeler(): Promise<unknown> {
  if (_modeler) return _modeler;

  // Dynamic import — not top-level
  const { default: BpmnModeler } = await import('bpmn-js/lib/Modeler');

  _modeler = new BpmnModeler({
    keyboard: { bindAsGlobal: false },
  });
  return _modeler;
}

/**
 * Export a BusinessFlow to BPMN 2.0 XML string.
 * Phase 1 maps: StartEvent, EndEvent, ServiceTask, SequenceFlow.
 *
 * Uses bpmn-js to validate/format the XML diagram.
 */
export async function exportFlowToBpmn(flow: BusinessFlow): Promise<string> {
  const modeler = await createBpmnModeler();

  // Build the XML structure from the flow
  const xml = buildBpmnXml(flow);

  // Let bpmn-js import and format the XML
  await (modeler as { importXML: (xml: string) => Promise<unknown> }).importXML(xml);
  const result = await (modeler as { saveXML: () => Promise<{ xml: string }> }).saveXML();
  return result.xml;
}

function buildBpmnXml(flow: BusinessFlow): string {
  const processId = `Process_${flow.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  const processName = flow.name;
  const stepCount = flow.stepCount > 0 ? flow.stepCount : 3;

  const elements: string[] = [];
  const flows: string[] = [];
  let elementId = 1;

  // StartEvent
  const startId = `StartEvent_${elementId++}`;
  elements.push(`    <bpmn:startEvent id="${startId}" name="Start" />`);

  // Intermediate steps → ServiceTasks
  const stepNames = flow.steps && flow.steps.length > 0
    ? flow.steps
    : Array.from({ length: stepCount }, (_, i) => `Step ${i + 1}`);

  let prevId = startId;
  for (let i = 0; i < stepNames.length; i++) {
    const taskId = `Task_${elementId++}`;
    const taskName = stepNames[i];
    elements.push(`    <bpmn:serviceTask id="${taskId}" name="${escapeXml(taskName)}" />`);

    const flowId = `Flow_${elementId++}`;
    flows.push(`    <bpmn:sequenceFlow id="${flowId}" sourceRef="${prevId}" targetRef="${taskId}" />`);
    prevId = taskId;
  }

  // EndEvent
  const endId = `EndEvent_${elementId++}`;
  elements.push(`    <bpmn:endEvent id="${endId}" name="End" />`);

  // Final SequenceFlow to EndEvent
  const lastFlowId = `Flow_${elementId++}`;
  flows.push(`    <bpmn:sequenceFlow id="${lastFlowId}" sourceRef="${prevId}" targetRef="${endId}" />`);

  const allElements = elements.join('\n');
  const allFlows = flows.join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                   xmlns:di="http://www.omg.org/spec/BD/20100524/DI"
                   id="Definitions_${elementId}"
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="${processId}" isExecutable="false" name="${escapeXml(processName)}">
${allElements}
${allFlows}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Create a downloadable blob from XML string */
export function xmlToBlob(xml: string): Blob {
  return new Blob([xml], { type: 'application/xml' });
}

/** Trigger browser download of BPMN XML */
export function downloadBpmnXml(xml: string, filename: string): void {
  const blob = xmlToBlob(xml);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}