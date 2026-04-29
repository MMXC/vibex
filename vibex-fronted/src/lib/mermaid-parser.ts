import { Node, Edge } from '@xyflow/react'

// Mermaid parser types (simplified)
interface MermaidAST {
  diagramType: string
  nodes: MermaidNode[]
  edges: MermaidEdge[]
}

interface MermaidNode {
  id: string
  label: string
  type?: string
}

interface MermaidEdge {
  id: string
  from: string
  to: string
  label?: string
  type?: string
}

// Parse Mermaid graph definition
export function parseMermaidGraph(mermaidCode: string): MermaidAST {
  const lines = mermaidCode.trim().split('\n')
  const firstLine = lines[0] ?? ''
  const diagramType = firstLine.replace('graph', '').replace('TD', '').replace('LR', '').trim() || 'TB'
  
  const nodes: MermaidNode[] = []
  const edges: MermaidEdge[] = []
  const processedNodes = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? ''
    if (!line || line.startsWith('classDef')) continue

    // Match node definitions: `ID[Label]` or `ID(Label)` or `ID{Label}`
    const nodeMatch = line.match(/^(\w+)\[([^\]]+)\]|^(\w+)\(([^)]+)\)|^(\w+)\{([^}]+)\}/)
    if (nodeMatch) {
      const id = nodeMatch[1] ?? nodeMatch[3] ?? nodeMatch[5] ?? ''
      const label = nodeMatch[2] ?? nodeMatch[4] ?? nodeMatch[6] ?? ''
      
      if (id && !processedNodes.has(id)) {
        nodes.push({ id, label })
        processedNodes.add(id)
      }
      continue
    }

    // Match edges: `A --> B` or `A -->|Label| B` or `A -.-> B`
    const edgeMatch = line.match(/^(\w+)\s*(-->?\.?>?)\|?([^|]*)\|?\s*(\w+)/)
    if (edgeMatch) {
      const from = edgeMatch[1] ?? ''
      const label = (edgeMatch[3] ?? '').trim() || undefined
      const to = edgeMatch[4] ?? ''
      
      edges.push({
        id: `edge-${edges.length + 1}`,
        from,
        to,
        label,
        type: line.includes('-.') ? 'dashed' : 'solid'
      })
    }
  }

  return { diagramType, nodes, edges }
}

// Parse Mermaid classDiagram
export function parseMermaidClassDiagram(mermaidCode: string): MermaidAST {
  const lines = mermaidCode.trim().split('\n')
  
  const nodes: MermaidNode[] = []
  const edges: MermaidEdge[] = []
  const processedClasses = new Set<string>()

  for (const line of lines) {
    const trimmed = (line ?? '').trim()
    if (!trimmed || trimmed.startsWith('classDef')) continue

    // Match class definition: `ClassName {`
    const classMatch = trimmed.match(/^(\w+)\s*\{/)
    if (classMatch && classMatch[1] && !processedClasses.has(classMatch[1])) {
      nodes.push({
        id: classMatch[1],
        label: classMatch[1],
        type: 'class'
      })
      processedClasses.add(classMatch[1])
      continue
    }

    // Match inheritance: `ClassA --> ClassB` or `ClassA -- ClassB`
    const inheritMatch = trimmed.match(/^(\w+)\s*(--?|-+>|--+)\s*(\w+)/)
    if (inheritMatch && inheritMatch[1] && inheritMatch[3]) {
      edges.push({
        id: `edge-${edges.length + 1}`,
        from: inheritMatch[1],
        to: inheritMatch[3],
        label: trimmed.includes('-->') ? 'inherits' : 'association',
        type: trimmed.includes('-->') ? 'inheritance' : 'association'
      })
    }
  }

  return { diagramType: 'classDiagram', nodes, edges }
}

// Parse Mermaid stateDiagram
export function parseMermaidStateDiagram(mermaidCode: string): MermaidAST {
  const lines = mermaidCode.trim().split('\n')
  
  const nodes: MermaidNode[] = []
  const edges: MermaidEdge[] = []
  const processedStates = new Set<string>()

  for (const line of lines) {
    const trimmed = (line ?? '').trim()
    if (!trimmed) continue

    // Match state: `[*] --> StateName` or `StateName --> [*]`
    const stateStartMatch = trimmed.match(/\[\*\]\s*-->\s*(\w+)/)
    if (stateStartMatch && stateStartMatch[1] && !processedStates.has(stateStartMatch[1])) {
      nodes.push({ id: stateStartMatch[1], label: stateStartMatch[1], type: 'initial' })
      processedStates.add(stateStartMatch[1])
      continue
    }

    const stateEndMatch = trimmed.match(/(\w+)\s*-->\s*\[\*\]/)
    if (stateEndMatch && stateEndMatch[1] && !processedStates.has(stateEndMatch[1])) {
      nodes.push({ id: stateEndMatch[1], label: stateEndMatch[1], type: 'final' })
      processedStates.add(stateEndMatch[1])
      continue
    }

    // Match state transition: `StateA --> StateB : Event`
    const transitionMatch = trimmed.match(/^(\w+)\s*-->\s*(\w+)(?:\s*:\s*(.+))?/)
    if (transitionMatch && transitionMatch[1] && transitionMatch[2]) {
      const from = transitionMatch[1]
      const to = transitionMatch[2]
      const label = transitionMatch[3] ?? undefined

      if (!processedStates.has(from)) {
        nodes.push({ id: from, label: from, type: 'intermediate' })
        processedStates.add(from)
      }
      if (!processedStates.has(to)) {
        nodes.push({ id: to, label: to, type: 'intermediate' })
        processedStates.add(to)
      }

      edges.push({
        id: `edge-${edges.length + 1}`,
        from,
        to,
        label,
        type: 'transition'
      })
    }
  }

  return { diagramType: 'stateDiagram', nodes, edges }
}

// Convert parsed AST to React Flow nodes
export function mermaidToFlowNodes(
  ast: MermaidAST,
  layout: 'TB' | 'LR' | 'BT' | 'RL' = 'TB'
): Node[] {
  const nodes: Node[] = []
  const nodeCount = ast.nodes.length
  
  // Simple grid layout
  const cols = Math.ceil(Math.sqrt(nodeCount))
  
  ast.nodes.forEach((node, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    
    const x = layout === 'LR' ? row * 200 : col * 200
    const y = layout === 'LR' ? col * 150 : row * 150

    nodes.push({
      id: node.id,
      position: { x, y },
      data: { 
        label: node.label,
        type: node.type || 'default'
      },
      type: getFlowNodeType(ast.diagramType, node.type),
    })
  })

  return nodes
}

// Convert parsed AST to React Flow edges
export function mermaidToFlowEdges(ast: MermaidAST): Edge[] {
  return ast.edges.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    label: edge.label,
    type: 'default',
    animated: edge.type === 'dashed',
    style: { stroke: '#60a5fa', strokeWidth: 2 },
    labelStyle: { fill: '#fff', fontSize: 12 },
    labelBgStyle: { fill: '#1e1e2e', fillOpacity: 0.8 },
  }))
}

// Get appropriate React Flow node type based on diagram type
function getFlowNodeType(diagramType: string, nodeType?: string): string {
  switch (diagramType) {
    case 'classDiagram':
      return 'domainModel'
    case 'stateDiagram':
      return 'state'
    default:
      if (nodeType === 'initial' || nodeType === 'final') {
        return 'state'
      }
      return 'context'
  }
}

// Full conversion: Mermaid code -> React Flow nodes and edges
export function convertMermaidToFlow(
  mermaidCode: string,
  layout: 'TB' | 'LR' | 'BT' | 'RL' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  let ast: MermaidAST
  
  if (mermaidCode.includes('classDiagram')) {
    ast = parseMermaidClassDiagram(mermaidCode)
  } else if (mermaidCode.includes('stateDiagram')) {
    ast = parseMermaidStateDiagram(mermaidCode)
  } else {
    ast = parseMermaidGraph(mermaidCode)
  }
  
  const nodes = mermaidToFlowNodes(ast, layout)
  const edges = mermaidToFlowEdges(ast)
  
  return { nodes, edges }
}

// Convert React Flow back to Mermaid code
export function convertFlowToMermaid(nodes: Node[], edges: Edge[]): string {
  const lines: string[] = ['graph TD']
  
  // Add nodes
  nodes.forEach(node => {
    const label = node.data?.label || node.id
    lines.push(`  ${node.id}[${label}]`)
  })
  
  // Add edges
  edges.forEach(edge => {
    const arrow = edge.animated ? '-.->' : '-->'
    const label = edge.label ? `|${edge.label}|` : ''
    lines.push(`  ${edge.source} ${arrow}${label} ${edge.target}`)
  })
  
  return lines.join('\n')
}

// Validate Mermaid syntax
export function validateMermaid(mermaidCode: string): { valid: boolean; error?: string } {
  try {
    const trimmed = mermaidCode.trim()
    
    if (!trimmed) {
      return { valid: false, error: 'Empty diagram' }
    }
    
    // Check for valid diagram types
    const validTypes = ['graph', 'flowchart', 'classDiagram', 'stateDiagram', 'stateDiagram-v2']
    const diagramLine = trimmed.split('\n')[0]?.trim() ?? ''
    
    const hasValidType = validTypes.some(type => diagramLine.includes(type))
    if (!hasValidType) {
      return { valid: false, error: `Unknown diagram type: ${diagramLine}` }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: String(error) }
  }
}