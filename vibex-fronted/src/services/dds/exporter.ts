/**
 * dds-exporter.ts — DDS Canvas Exporters
 * Sprint4 E4-U1: APICanvasExporter (OpenAPI 3.0)
 * Sprint4 E4-U2: SMExporter (State Machine JSON)
 *
 * Converts DDS Canvas card data to structured export formats.
 */

'use client';

import type { APIEndpointCard, StateMachineCard } from '@/types/dds';

// ==================== Shared Types ====================

/** OpenAPI 3.0 export format */
export interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, OpenAPIEndpoint>>;
  tags?: Array<{ name: string }>;
}

interface OpenAPIEndpoint {
  summary: string;
  description: string;
  tags: string[];
  parameters: Array<{ name: string; in: string; schema: unknown; required?: boolean }>;
  responses: Record<string, unknown>;
  requestBody?: { required: boolean; content: Record<string, { schema: unknown }> };
}

/** State machine export format */
export interface SMExportData {
  smVersion: string;
  states: SMStateExport[];
  initial: string;
}

interface SMStateExport {
  id: string;
  name: string;
  type?: string;
  on?: Record<string, string>;
}

// ==================== Helpers ====================

/** Convert HTTP method string to uppercase */
function toUpperMethod(method: string): string {
  const m = String(method ?? 'GET').toUpperCase();
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(m) ? m : 'GET';
}

// ==================== E4-U1: APICanvasExporter ====================

/**
 * Export API chapter cards to OpenAPI 3.0 JSON format.
 *
 * @param cards - APIEndpointCard[] from DDSCanvasStore.chapters.api.cards
 * @param options.title - Optional OpenAPI document title (default: 'DDS Canvas API')
 * @param options.version - Optional API version (default: '1.0.0')
 * @returns OpenAPI 3.0 document as JSON string
 *
 * @example
 * const openapi = exportDDSCanvasData(apiCards, { title: 'My API', version: '2.0.0' });
 */
export function toOpenAPISpec(
  cards: APIEndpointCard[],
  options: { title?: string; version?: string } = {}
): string {
  const { title = 'DDS Canvas API', version = '1.0.0' } = options;

  const paths: OpenAPISpec['paths'] = {};
  const allTags = new Set<string>();

  for (const card of cards) {
    if (!card) continue;
    const method = toUpperMethod(card.method);
    const safePath = card.path?.startsWith('/') ? card.path : `/${card.path ?? 'unknown'}`;

    if (!paths[safePath]) {
      paths[safePath] = {};
    }

    const endpoint: OpenAPIEndpoint = {
      summary: card.summary ?? card.title ?? 'Unnamed endpoint',
      description: card.description ?? '',
      tags: card.tags ?? [],
      parameters: (card.parameters ?? []).map((p) => ({
        name: p.name,
        in: p.in,
        schema: { type: p.type },
        required: p.required,
      })),
      responses: buildResponses(card.responses),
    };

    if (card.requestBody?.schema) {
      endpoint.requestBody = {
        required: true,
        content: {
          [card.requestBody.contentType ?? 'application/json']: {
            schema: parseSchema(card.requestBody.schema),
          },
        },
      };
    }

    paths[safePath][method.toLowerCase()] = endpoint;

    // Collect unique tags
    (card.tags ?? []).forEach((t) => allTags.add(t));
  }

  const doc: OpenAPISpec = {
    openapi: '3.0.3',
    info: { title, version },
    paths,
  };

  if (allTags.size > 0) {
    doc.tags = Array.from(allTags).map((name) => ({ name }));
  }

  return doc;
}

/** E4-U1: Export API cards as OpenAPI JSON string */
export function exportDDSCanvasData(
  cards: APIEndpointCard[],
  options: { title?: string; version?: string } = {}
): string {
  return JSON.stringify(toOpenAPISpec(cards, options), null, 2);
}

function buildResponses(responses?: APIEndpointCard['responses']): Record<string, unknown> {
  if (!responses || responses.length === 0) {
    return { '200': { description: 'Successful response', content: {} } };
  }
  const result: Record<string, unknown> = {};
  for (const r of responses) {
    result[String(r.status)] = {
      description: r.description,
      content: r.schema ? { 'application/json': { schema: parseSchema(r.schema) } } : {},
    };
  }
  return result;
}

function parseSchema(schema: string): unknown {
  try {
    return JSON.parse(schema);
  } catch {
    return { type: schema };
  }
}

// ==================== E4-U2: SMExporter ====================

/**
 * Export business-rules chapter state machine cards to State Machine JSON format.
 *
 * @param cards - StateMachineCard[] from DDSCanvasStore.chapters['business-rules'].cards
 * @returns State machine JSON as string
 *
 * @example
 * const smJson = exportToStateMachine(smCards);
 */
export function toStateMachineSpec(cards: StateMachineCard[]): string {
  const allStates: SMStateExport[] = [];
  let initialState = '';

  for (const card of cards) {
    const states = card.states ?? [];
    const transitions = card.transitions ?? [];
    const initial = card.initialState ?? states[0]?.stateId ?? '';

    // Build on-entry map from transitions
    const onMap: Record<string, Record<string, string>> = {};
    for (const t of transitions) {
      if (!onMap[t.from]) onMap[t.from] = {};
      onMap[t.from][t.event] = t.to;
    }

    for (const state of states) {
      // Avoid duplicates across multiple cards
      if (!allStates.find((s) => s.id === state.stateId)) {
        allStates.push({
          id: state.stateId,
          name: state.label,
          type: state.stateType,
          on: onMap[state.stateId] ?? {},
        });
      }
    }

    if (!initialState && initial) {
      initialState = initial;
    }
  }

  const doc: SMExportData = {
    smVersion: '1.0.0',
    states: allStates,
    initial: initialState,
  };

  return doc;
}

/** E4-U2: Export state machine cards as JSON string */
export function exportToStateMachine(cards: StateMachineCard[]): string {
  return JSON.stringify(toStateMachineSpec(cards), null, 2);
}
