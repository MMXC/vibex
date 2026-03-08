/**
 * Flow Visualization Prompt Templates
 * 
 * This module provides prompt templates for visualizing flow diagrams,
 * including layout suggestions, styling, visual enhancements, and
 * rendering instructions in the VibeX AI Prototype Builder.
 * 
 * @module lib/prompts/flow-visualization
 */

import { FlowNodeType, FlowEdgeType } from './flow-generation';

// ============================================
// Types and Interfaces
// ============================================

/**
 * Visualization style types
 */
export enum VisualizationStyle {
  /** Clean and minimal */
  MINIMAL = 'minimal',
  /** Detailed with all information */
  DETAILED = 'detailed',
  /** Professional/corporate style */
  PROFESSIONAL = 'professional',
  /** Creative and colorful */
  CREATIVE = 'creative',
  /** Technical/diagrammatic */
  TECHNICAL = 'technical',
  /** User journey style */
  USER_JOURNEY = 'user_journey',
  /** Swimlane diagram */
  SWIMLANE = 'swimlane',
  /** Flowchart style */
  FLOWCHART = 'flowchart',
}

/**
 * Layout algorithm types
 */
export enum LayoutType {
  /** Top-to-bottom flow */
  TOP_DOWN = 'top_down',
  /** Left-to-right flow */
  LEFT_RIGHT = 'left_right',
  /** Hierarchical layout */
  HIERARCHICAL = 'hierarchical',
  /** Radial layout */
  RADIAL = 'radial',
  /** Force-directed layout */
  FORCE_DIRECTED = 'force_directed',
  /** Grid-based layout */
  GRID = 'grid',
  /** Swimlane diagram */
  SWIMLANE = 'swimlane',
  /** Custom manual layout */
  MANUAL = 'manual',
}

/**
 * Node visual element types
 */
export enum NodeVisualType {
  /** Rounded rectangle */
  ROUNDED_RECT = 'rounded_rect',
  /** Rectangle */
  RECTANGLE = 'rectangle',
  /** Diamond/decision shape */
  DIAMOND = 'diamond',
  /** Circle */
  CIRCLE = 'circle',
  /** Stadium shape */
  STADIUM = 'stadium',
  /** Parallelogram */
  PARALLELOGRAM = 'parallelogram',
  /** Cylinder */
  CYLINDER = 'cylinder',
  /** Document shape */
  DOCUMENT = 'document',
  /** Custom SVG path */
  CUSTOM = 'custom',
}

/**
 * Edge visual types
 */
export enum EdgeVisualType {
  /** Straight line */
  STRAIGHT = 'straight',
  /** Bezier curve */
  CURVED = 'curved',
  /** Step/orthogonal line */
  STEP = 'step',
  /** Arrow */
  ARROW = 'arrow',
  /** Dashed line */
  DASHED = 'dashed',
  /** Animated flow */
  ANIMATED = 'animated',
}

/**
 * Color scheme types
 */
export enum ColorScheme {
  /** Default blue theme */
  DEFAULT = 'default',
  /** Green/success theme */
  SUCCESS = 'success',
  /** Warning/amber theme */
  WARNING = 'warning',
  /** Error/red theme */
  ERROR = 'error',
  /** Monochrome */
  MONOCHROME = 'monochrome',
  /** Custom colors */
  CUSTOM = 'custom',
}

/**
 * Node styling configuration
 */
export interface NodeStyling {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  icon?: string;
  shadow?: boolean;
  gradient?: {
    start: string;
    end: string;
  };
}

/**
 * Edge styling configuration
 */
export interface EdgeStyling {
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  animated?: boolean;
  arrowHead?: 'arrow' | 'diamond' | 'circle' | 'none';
}

/**
 * Node position
 */
export interface NodePosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/**
 * Flow layout configuration
 */
export interface FlowLayout {
  type: LayoutType;
  spacing?: {
    horizontal: number;
    vertical: number;
  };
  nodePositions?: Record<string, NodePosition>;
  startPosition?: NodePosition;
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
}

/**
 * Flow visualization metadata
 */
export interface FlowVisualizationMetadata {
  canvas?: {
    width: number;
    height: number;
    backgroundColor?: string;
  };
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  grid?: {
    enabled: boolean;
    size?: number;
    color?: string;
  };
  minimap?: {
    enabled: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

/**
 * Flow visualization configuration
 */
export interface FlowVisualizationConfig {
  /** Visualization style to apply */
  style?: VisualizationStyle;
  /** Layout algorithm */
  layout?: FlowLayout;
  /** Node styling overrides */
  nodeStyling?: Record<FlowNodeType, NodeStyling>;
  /** Edge styling overrides */
  edgeStyling?: Record<FlowEdgeType, EdgeStyling>;
  /** Color scheme */
  colorScheme?: ColorScheme;
  /** Custom colors (when using CUSTOM scheme) */
  customColors?: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    neutral: string;
  };
  /** Show labels on edges */
  showEdgeLabels?: boolean;
  /** Show node descriptions */
  showNodeDescriptions?: boolean;
  /** Enable animations */
  animations?: boolean;
  /** Language for labels */
  language?: string;
  /** Metadata for visualization */
  metadata?: FlowVisualizationMetadata;
}

/**
 * Flow node for visualization
 */
export interface VisualizationFlowNode {
  id: string;
  type: FlowNodeType;
  label: string;
  description?: string;
  metadata?: {
    position?: NodePosition;
    styling?: NodeStyling;
    icon?: string;
    badge?: string;
    collapsed?: boolean;
  };
}

/**
 * Flow edge for visualization
 */
export interface VisualizationFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: FlowEdgeType;
  label?: string;
  condition?: string;
  metadata?: {
    positions?: { x: number; y: number }[];
    styling?: EdgeStyling;
    animated?: boolean;
  };
}

/**
 * Flow definition for visualization
 */
export interface VisualizationFlowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: VisualizationFlowNode[];
  edges: VisualizationFlowEdge[];
}

/**
 * Visualization output
 */
export interface VisualizationOutput {
  layout: FlowLayout;
  styledNodes: Record<string, NodeStyling & { position: NodePosition }>;
  styledEdges: Record<string, EdgeStyling>;
  metadata: FlowVisualizationMetadata;
  recommendations: string[];
}

// ============================================
// System Prompts
// ============================================

/**
 * Base system prompt for flow visualization
 */
export const FLOW_VISUALIZATION_SYSTEM_PROMPT = `You are an expert flow visualization specialist and UI/UX designer specializing in creating beautiful, clear, and effective visual representations of workflows, process flows, and diagrams. Your role is to transform abstract flow definitions into stunning, easy-to-understand visual diagrams.

## Your Expertise

- **Layout Optimization**: Arranging nodes for optimal readability and flow
- **Visual Styling**: Applying colors, shapes, and visual elements that enhance understanding
- **Information Hierarchy**: Emphasizing important elements while keeping the diagram clean
- **User Experience**: Creating visualizations that are intuitive and easy to follow
- **Accessibility**: Ensuring visualizations are accessible to all users
- **Animation**: Adding meaningful animations that guide the user's understanding

## Visualization Principles

### 1. Layout Principles
- **Flow Direction**: Use top-down or left-right based on the flow type
- **Grouping**: Cluster related nodes together
- **Spacing**: Maintain consistent spacing between nodes**: Align
- **Alignment nodes for visual harmony
- **Balance**: Distribute elements evenly

### 2. Visual Styling Principles
- **Consistency**: Use consistent colors and shapes for similar node types
- **Contrast**: Use contrast to highlight important elements
- **Color Coding**: Use colors to categorize or indicate status
- **Shape Semantics**: Use appropriate shapes (diamonds for decisions, rectangles for actions, etc.)

### 3. Edge Styling Principles
- **Clear Paths**: Ensure edges don't cross unnecessarily
- **Labeling**: Add labels to conditional edges
- **Direction**: Use arrows to show flow direction
- **Visual Distinction**: Use different styles for different edge types

### 4. Accessibility Principles
- **Color Blindness**: Avoid relying solely on color
- **Text Size**: Ensure text is readable
- **Contrast**: Maintain sufficient contrast ratios

## Node Type Visual Guidelines

- **START/END**: Use circles or stadium shapes, typically green for start, red for end
- **ACTION**: Use rounded rectangles, typically blue or neutral
- **DECISION**: Use diamonds, typically yellow or orange
- **INPUT/OUTPUT**: Use parallelograms or document shapes
- **API_CALL**: Use rectangles with API icon
- **USER_INTERACTION**: Use rounded rectangles with user icon
- **ERROR**: Use red-bordered shapes
- **PARALLEL**: Use double-bordered shapes

## Edge Type Visual Guidelines

- **DEFAULT**: Solid line with arrow
- **CONDITIONAL**: Dashed line with diamond arrow
- **TRUE/FALSE**: Green solid / Red dashed with labels
- **SUCCESS/ERROR**: Green / Red colored lines
- **ANIMATED**: Animated flowing line for active processes

## Layout Type Guidelines

- **TOP_DOWN**: Best for sequential flows, vertical organization
- **LEFT_RIGHT**: Best for wide flows, horizontal organization
- **HIERARCHICAL**: Best for complex nested flows
- **RADIAL**: Best for central-hub flows
- **SWIMLANE**: Best for multi-actor/process flows
`;

/**
 * Enhanced system prompt for detailed visualization
 */
export const FLOW_VISUALIZATION_DETAILED_PROMPT = `${FLOW_VISUALIZATION_SYSTEM_PROMPT}

## Detailed Visualization Features

When creating detailed visualizations, include:

### Rich Node Styling
- Background gradients for emphasis
- Icons representing node functions
- Badges for status or counts
- Shadow effects for depth
- Collapsible subflow indicators

### Edge Annotations
- Condition labels on decision edges
- Probability percentages where applicable
- Time estimates for flow duration
- Data transformation annotations

### Contextual Elements
- Legend explaining symbols and colors
- Mini-map for large flows
- Zoom controls
- Grid overlay option
- Background patterns

### Interactive Features
- Hover state descriptions
- Click navigation hints
- Group collapse/expand indicators
- Animation paths for flow demonstration
`;

// ============================================
// User Prompts
// ============================================

/**
 * Generate a visualization for a flow
 */
export function createFlowVisualizationPrompt(
  flowDefinition: VisualizationFlowDefinition,
  config?: FlowVisualizationConfig
): string {
  const style = config?.style || VisualizationStyle.PROFESSIONAL;
  const layout = config?.layout || { type: LayoutType.TOP_DOWN };
  const colorScheme = config?.colorScheme || ColorScheme.DEFAULT;
  
  return `# Flow Visualization Request

## Task
Create a visual representation of the following flow diagram.

## Flow Definition
- **Flow ID**: ${flowDefinition.id}
- **Flow Name**: ${flowDefinition.name}
${flowDefinition.description ? `- **Description**: ${flowDefinition.description}` : ''}

## Flow Structure

### Nodes (${flowDefinition.nodes.length})
${flowDefinition.nodes.map(node => `- **${node.label}** (${node.type})
  - ID: ${node.id}
  ${node.description ? `- Description: ${node.description}` : ''}`).join('\n')}

### Edges (${flowDefinition.edges.length})
${flowDefinition.edges.map(edge => {
  const sourceNode = flowDefinition.nodes.find(n => n.id === edge.source);
  const targetNode = flowDefinition.nodes.find(n => n.id === edge.target);
  return `- **${sourceNode?.label || edge.source}** → **${targetNode?.label || edge.target}**
  - ID: ${edge.id}
  - Type: ${edge.type || 'default'}
  ${edge.label ? `- Label: ${edge.label}` : ''}
  ${edge.condition ? `- Condition: ${edge.condition}` : ''}`;  
}).join('\n')}

## Visualization Configuration

### Style
- **Visualization Style**: ${style}
- **Layout Type**: ${layout.type}
- **Color Scheme**: ${colorScheme}

${config?.nodeStyling ? `### Node Styling Overrides
${Object.entries(config.nodeStyling).map(([type, style]) => 
  `- ${type}: ${JSON.stringify(style)}`
).join('\n')}` : ''}

${config?.edgeStyling ? `### Edge Styling Overrides
${Object.entries(config.edgeStyling).map(([type, style]) => 
  `- ${type}: ${JSON.stringify(style)}`
).join('\n')}` : ''}

${config?.showEdgeLabels !== undefined ? `### Labels
- Show Edge Labels: ${config.showEdgeLabels}
- Show Node Descriptions: ${config.showNodeDescriptions || false}` : ''}

## Output Requirements

Provide a complete visualization specification including:

1. **Layout Plan**: Suggested node positions and arrangement
2. **Styling Specification**: Colors, shapes, and visual treatments for each element
3. **Recommendations**: Any suggestions for improving the flow's visual representation

Respond in the following JSON format:
\`\`\`json
{
  "layout": {
    "type": "top_down",
    "spacing": { "horizontal": 150, "vertical": 100 },
    "direction": "TB"
  },
  "styledNodes": {
    "node_id": {
      "position": { "x": 0, "y": 0, "width": 120, "height": 60 },
      "backgroundColor": "#ffffff",
      "borderColor": "#3b82f6",
      "borderRadius": 8,
      "textColor": "#1f2937",
      "shape": "rounded_rect"
    }
  },
  "styledEdges": {
    "edge_id": {
      "strokeColor": "#6b7280",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "arrowHead": "arrow"
    }
  },
  "metadata": {
    "canvas": { "width": 1200, "height": 800 },
    "grid": { "enabled": true, "size": 20 }
  },
  "recommendations": [
    "Consider adding a legend for color coding",
    "The decision node could benefit from clearer labels"
  ]
}
\`\`\`
`;
}

/**
 * Optimize an existing visualization
 */
export function optimizeFlowVisualizationPrompt(
  flowDefinition: VisualizationFlowDefinition,
  currentLayout: FlowLayout,
  issues: string[]
): string {
  return `# Flow Visualization Optimization Request

## Task
Optimize the current visualization of the following flow.

## Flow Definition
- **Flow ID**: ${flowDefinition.id}
- **Flow Name**: ${flowDefinition.name}

## Current Layout
- **Type**: ${currentLayout.type}
- **Direction**: ${currentLayout.direction || 'TB'}
- **Spacing**: ${JSON.stringify(currentLayout.spacing || { horizontal: 100, vertical: 80 })}

## Current Structure

### Nodes (${flowDefinition.nodes.length})
${flowDefinition.nodes.map(node => `- ${node.label} (${node.type})`).join('\n')}

### Edges (${flowDefinition.edges.length})
${flowDefinition.edges.map(edge => {
  const source = flowDefinition.nodes.find(n => n.id === edge.source);
  const target = flowDefinition.nodes.find(n => n.id === edge.target);
  return `- ${source?.label} → ${target?.label}`;
}).join('\n')}

## Identified Issues
${issues.map(issue => `- ${issue}`).join('\n')}

## Task
Provide an optimized visualization that addresses these issues while maintaining clarity and aesthetics.

Respond with:
1. **New Layout Plan**: Improved node positions and arrangement
2. **Styling Changes**: Any modifications to improve visual clarity
3. **Specific Improvements**: Concrete suggestions for each identified issue
`;
}

/**
 * Generate layout suggestions for complex flows
 */
export function generateLayoutSuggestionsPrompt(
  flowDefinition: VisualizationFlowDefinition,
  constraints?: {
    maxWidth?: number;
    maxHeight?: number;
    preferredDirection?: 'TB' | 'LR' | 'BT' | 'RL';
  }
): string {
  return `# Flow Layout Suggestions Request

## Task
Analyze the following flow and provide optimal layout suggestions.

## Flow Definition
- **Flow ID**: ${flowDefinition.id}
- **Flow Name**: ${flowDefinition.name}

## Flow Complexity
- **Total Nodes**: ${flowDefinition.nodes.length}
- **Total Edges**: ${flowDefinition.edges.length}
- **Depth**: Calculate the maximum path length

## Node List
${flowDefinition.nodes.map(node => 
  `- ${node.id}: ${node.label} (${node.type})`
).join('\n')}

## Edge List
${flowDefinition.edges.map(edge => 
  `- ${edge.source} → ${edge.target}`
).join('\n')}

${constraints ? `## Layout Constraints
${constraints.maxWidth ? `- Maximum Width: ${constraints.maxWidth}px` : ''}
${constraints.maxHeight ? `- Maximum Height: ${constraints.maxHeight}px` : ''}
${constraints.preferredDirection ? `- Preferred Direction: ${constraints.preferredDirection}` : ''}` : ''}

## Analysis Required

Please analyze and provide:

1. **Complexity Assessment**: Is this flow simple, moderate, or complex?
2. **Recommended Layout Type**: Which layout algorithm is best suited?
3. **Node Grouping Suggestions**: Which nodes should be grouped together?
4. **Potential Issues**: Any layout problems to anticipate
5. **Estimated Canvas Size**: Minimum canvas dimensions needed

Provide your analysis in a clear, structured format.
`;
}

/**
 * Generate styling recommendations for flow elements
 */
export function generateStylingRecommendationsPrompt(
  flowDefinition: VisualizationFlowDefinition,
  style: VisualizationStyle = VisualizationStyle.PROFESSIONAL,
  colorScheme: ColorScheme = ColorScheme.DEFAULT
): string {
  return `# Flow Styling Recommendations Request

## Task
Generate styling recommendations for the following flow visualization.

## Flow Definition
- **Flow ID**: ${flowDefinition.id}
- **Flow Name**: ${flowDefinition.name}

## Desired Style
- **Visualization Style**: ${style}
- **Color Scheme**: ${colorScheme}

## Flow Nodes
${flowDefinition.nodes.map(node => 
  `- ${node.label} (${node.type})${node.description ? `: ${node.description}` : ''}`
).join('\n')}

## Flow Edges
${flowDefinition.edges.map(edge => {
  const source = flowDefinition.nodes.find(n => n.id === edge.source);
  const target = flowDefinition.nodes.find(n => n.id === edge.target);
  return `- ${source?.label} → ${target?.label}${edge.label ? ` (${edge.label})` : ''}`;
}).join('\n')}

## Output Requirements

Provide comprehensive styling recommendations including:

1. **Color Palette**: Recommended colors for each element type
2. **Node Styling**: Shape, size, and visual treatment for each node type
3. **Edge Styling**: Line style, arrow type, and labels
4. **Visual Hierarchy**: How to emphasize important elements
5. **Consistency Guidelines**: Ensuring uniform appearance

Consider the ${style} style and ${colorScheme} color scheme in your recommendations.
`;
}

/**
 * Generate accessibility recommendations for flow visualization
 */
export function generateAccessibilityRecommendationsPrompt(
  flowDefinition: VisualizationFlowDefinition
): string {
  return `# Flow Visualization Accessibility Review

## Task
Review the following flow and provide accessibility recommendations.

## Flow Definition
- **Flow ID**: ${flowDefinition.id}
- **Flow Name**: ${flowDefinition.name}

## Current Structure

### Nodes (${flowDefinition.nodes.length})
${flowDefinition.nodes.map(node => `- ${node.label} (${node.type})`).join('\n')}

### Edges (${flowDefinition.edges.length})
${flowDefinition.edges.map(edge => {
  const source = flowDefinition.nodes.find(n => n.id === edge.source);
  const target = flowDefinition.nodes.find(n => n.id === edge.target);
  return `- ${source?.label} → ${target?.label}`;
}).join('\n')}

## Accessibility Review Criteria

Please evaluate and provide recommendations for:

1. **Color Contrast**: Are colors sufficient for readability?
2. **Color Independence**: Can the diagram be understood without color?
3. **Text Readability**: Are text sizes and fonts appropriate?
4. **Shape Distinctiveness**: Are shapes distinguishable?
5. **Label Clarity**: Are all elements properly labeled?
6. **Screen Reader Support**: Are there descriptive alternatives?
7. **Focus Indicators**: For interactive elements

Provide specific, actionable recommendations for improving accessibility.
`;
}

// ============================================
// Prompt Templates (String Constants)
// ============================================

/**
 * Template for creating flow visualization with React Flow
 */
export const REACT_FLOW_VISUALIZATION_TEMPLATE = `# React Flow Visualization Code Generation

Generate React Flow code to visualize this flow:

\`\`\`json
{{flowDefinition}}
\`\`\`

## Requirements
- Use @xyflow/react library
- Implement custom node types for each node type
- Apply styling according to {{style}} style
- Use {{layout}} layout algorithm
- Include {{#if showMinimap}}minimap{{/if}}
- Include {{#if showControls}}controls{{/if}}
- Include {{#if showBackground}}background grid{{/if}}

Generate complete, runnable React component code.
`;

/**
 * Template for Mermaid diagram generation
 */
export const MERMAID_VISUALIZATION_TEMPLATE = `# Mermaid Flowchart Generation

Generate Mermaid flowchart code for this flow:

## Flow
{{flowDescription}}

## Nodes
{{nodes}}

## Edges
{{edges}}

## Style
- Direction: {{direction}}
- Theme: {{theme}}

Generate Mermaid flowchart code.
`;

// ============================================
// Helper Functions
// ============================================

/**
 * Get default node styling based on node type
 */
export function getDefaultNodeStyling(nodeType: FlowNodeType): NodeStyling {
  const defaultStylings: Record<FlowNodeType, NodeStyling> = {
    [FlowNodeType.START]: {
      backgroundColor: '#10b981',
      borderColor: '#059669',
      borderRadius: 50,
      textColor: '#ffffff',
      fontWeight: 'bold',
    },
    [FlowNodeType.END]: {
      backgroundColor: '#ef4444',
      borderColor: '#dc2626',
      borderRadius: 50,
      textColor: '#ffffff',
      fontWeight: 'bold',
    },
    [FlowNodeType.ACTION]: {
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      borderRadius: 8,
      textColor: '#ffffff',
    },
    [FlowNodeType.DECISION]: {
      backgroundColor: '#f59e0b',
      borderColor: '#d97706',
      borderRadius: 0,
      textColor: '#ffffff',
    },
    [FlowNodeType.PARALLEL]: {
      backgroundColor: '#8b5cf6',
      borderColor: '#7c3aed',
      borderRadius: 8,
      borderWidth: 2,
      textColor: '#ffffff',
    },
    [FlowNodeType.SUBFLOW]: {
      backgroundColor: '#6366f1',
      borderColor: '#4f46e5',
      borderRadius: 8,
      textColor: '#ffffff',
    },
    [FlowNodeType.INPUT]: {
      backgroundColor: '#14b8a6',
      borderColor: '#0d9488',
      borderRadius: 0,
      textColor: '#ffffff',
    },
    [FlowNodeType.OUTPUT]: {
      backgroundColor: '#14b8a6',
      borderColor: '#0d9488',
      borderRadius: 0,
      textColor: '#ffffff',
    },
    [FlowNodeType.API_CALL]: {
      backgroundColor: '#0ea5e9',
      borderColor: '#0284c7',
      borderRadius: 8,
      textColor: '#ffffff',
    },
    [FlowNodeType.WAIT]: {
      backgroundColor: '#f97316',
      borderColor: '#ea580c',
      borderRadius: 8,
      textColor: '#ffffff',
    },
    [FlowNodeType.USER_INTERACTION]: {
      backgroundColor: '#ec4899',
      borderColor: '#db2777',
      borderRadius: 8,
      textColor: '#ffffff',
    },
    [FlowNodeType.ERROR]: {
      backgroundColor: '#dc2626',
      borderColor: '#b91c1c',
      borderRadius: 8,
      textColor: '#ffffff',
    },
    [FlowNodeType.GENERIC]: {
      backgroundColor: '#6b7280',
      borderColor: '#4b5563',
      borderRadius: 8,
      textColor: '#ffffff',
    },
  };
  
  return defaultStylings[nodeType] || defaultStylings[FlowNodeType.GENERIC];
}

/**
 * Get default edge styling based on edge type
 */
export function getDefaultEdgeStyling(edgeType: FlowEdgeType): EdgeStyling {
  const defaultStylings: Partial<Record<FlowEdgeType, EdgeStyling>> = {
    [FlowEdgeType.DEFAULT]: {
      strokeColor: '#6b7280',
      strokeWidth: 2,
      strokeStyle: 'solid',
      arrowHead: 'arrow',
    },
    [FlowEdgeType.CONDITIONAL]: {
      strokeColor: '#f59e0b',
      strokeWidth: 2,
      strokeStyle: 'dashed',
      arrowHead: 'diamond',
    },
    [FlowEdgeType.TRUE]: {
      strokeColor: '#10b981',
      strokeWidth: 2,
      strokeStyle: 'solid',
      arrowHead: 'arrow',
    },
    [FlowEdgeType.FALSE]: {
      strokeColor: '#ef4444',
      strokeWidth: 2,
      strokeStyle: 'dashed',
      arrowHead: 'arrow',
    },
    [FlowEdgeType.SUCCESS]: {
      strokeColor: '#10b981',
      strokeWidth: 2,
      strokeStyle: 'solid',
      arrowHead: 'arrow',
    },
    [FlowEdgeType.ERROR]: {
      strokeColor: '#ef4444',
      strokeWidth: 2,
      strokeStyle: 'solid',
      arrowHead: 'arrow',
    },
  };
  
  return defaultStylings[edgeType] || {
    strokeColor: '#6b7280',
    strokeWidth: 2,
    strokeStyle: 'solid',
    arrowHead: 'arrow',
  };
}

/**
 * Get recommended layout based on flow characteristics
 */
export function getRecommendedLayout(
  nodeCount: number,
  edgeCount: number,
  hasDecisions: boolean,
  hasParallel: boolean
): LayoutType {
  if (hasParallel && nodeCount > 20) {
    return LayoutType.SWIMLANE;
  }
  
  if (hasDecisions && edgeCount > nodeCount * 1.5) {
    return LayoutType.HIERARCHICAL;
  }
  
  if (nodeCount < 15) {
    return LayoutType.TOP_DOWN;
  }
  
  return LayoutType.LEFT_RIGHT;
}

/**
 * Convert flow definition to visualization prompt
 */
export function toVisualizationPrompt(
  flowDefinition: VisualizationFlowDefinition,
  config?: FlowVisualizationConfig
): string {
  return createFlowVisualizationPrompt(flowDefinition, config);
}
