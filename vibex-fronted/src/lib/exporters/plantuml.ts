/**
 * plantuml.ts — E4-Export-Formats S4.1
 *
 * Generates PlantUML class diagram from canvas nodes.
 * Outputs @startuml / @enduml wrapper compatible with StarUML.
 */

import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';

export interface PlantUMLOptions {
  diagramType?: 'class' | 'sequence' | 'usecase';
  title?: string;
}

interface DiagramNode {
  nodeId: string;
  name: string;
  type: string;
  description?: string;
}

/**
 * Escapes PlantUML string content
 */
function pumlEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function generateClassDiagram(
  contexts: BoundedContextNode[],
  flows: BusinessFlowNode[],
  components: ComponentNode[],
): string {
  const lines: string[] = [];

  // Bounded Contexts as packages
  for (const ctx of contexts) {
    lines.push(`package "${pumlEscape(ctx.name)}" {`);
    lines.push(`  class "${pumlEscape(ctx.name)}Context" {`);
    lines.push(`    ${pumlEscape(ctx.type)}`);
    if (ctx.description) {
      lines.push(`    ${pumlEscape(ctx.description.split('\n')[0]!)}`);
    }
    lines.push(`  }`);
    lines.push(`}`);

    // Draw relationships
    if (ctx.relationships) {
      for (const rel of ctx.relationships) {
        lines.push(`${pumlEscape(ctx.name)}Context ..> ${rel.targetId} : ${rel.type}`);
      }
    }
  }

  // Components as classes inside contexts
  for (const comp of components) {
    const ctxName = comp.flowId
      ? contexts.find((c) => c.nodeId === comp.flowId)?.name ?? 'Unknown'
      : 'Unattached';
    lines.push(`class "${pumlEscape(comp.name)}" as ${comp.nodeId} {`);
    lines.push(`  ${pumlEscape(comp.type)}`);
    if (comp.api) {
      lines.push(`  ${comp.api.method} ${comp.api.path}`);
    }
    lines.push(`}`);
    lines.push(`${pumlEscape(ctxName)}Context ..> ${comp.nodeId}`);
  }

  // Business flows as notes
  for (const flow of flows) {
    const steps = flow.steps
      .map((s) => `${s.order}. ${pumlEscape(s.name)} (${pumlEscape(s.actor)})`)
      .join('\\n');
    lines.push(`note right of "${pumlEscape(flow.name)}" {`);
    lines.push(`  ${steps}`);
    lines.push(`}`);
  }

  return lines.join('\n');
}

function generateSequenceDiagram(
  contexts: BoundedContextNode[],
  flows: BusinessFlowNode[],
): string {
  const lines: string[] = [];

  // Participants
  const participants = contexts.map((c) => pumlEscape(c.name));
  lines.push(`participant ${participants.join(' || ')}`);

  // Flow steps
  for (const flow of flows) {
    lines.push(`== ${pumlEscape(flow.name)} ==`);
    for (const step of flow.steps.sort((a, b) => a.order - b.order)) {
      lines.push(`${pumlEscape(step.actor)} -> ${pumlEscape(flow.contextId)} : ${pumlEscape(step.name)}`);
      if (step.description) {
        lines.push(`note right: ${pumlEscape(step.description.split('\n')[0] ?? '')}`);
      }
    }
  }

  return lines.join('\n');
}

export function generatePlantUML(
  contexts: BoundedContextNode[],
  flows: BusinessFlowNode[],
  components: ComponentNode[],
  options: PlantUMLOptions = {},
): string {
  const title = options.title ?? 'VibeX Canvas Export';

  let diagram = '';
  switch (options.diagramType) {
    case 'sequence':
      diagram = generateSequenceDiagram(contexts, flows);
      break;
    default:
      diagram = generateClassDiagram(contexts, flows, components);
  }

  return [
    '@startuml',
    `title ${pumlEscape(title)}`,
    'skinparam shadowing false',
    'skinparam roundcorner 8',
    'skinparam packageStyle rectangle',
    '',
    diagram,
    '',
    '@enduml',
  ].join('\n');
}

/**
 * Validates PlantUML syntax — returns true if no obvious errors
 */
export function validatePlantUML(code: string): boolean {
  if (!code.includes('@startuml') || !code.includes('@enduml')) {
    return false;
  }
  if (code.indexOf('@startuml') > code.indexOf('@enduml')) {
    return false;
  }
  return true;
}
