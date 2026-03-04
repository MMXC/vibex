/**
 * Code Generator
 */

import type { ExecutableFlow, FlowCodeGenOptions } from '../types';

export class CodeGenerator {
  private generators: Record<string, (flow: ExecutableFlow, options: FlowCodeGenOptions) => string> = {
    typescript: this.generateTypeScript,
    javascript: this.generateJavaScript,
    python: this.generatePython,
    java: this.generateJava,
  };
  
  generate(flow: ExecutableFlow, options: FlowCodeGenOptions): string {
    const generator = this.generators[options.language];
    if (!generator) {
      throw new Error(`Unsupported language: ${options.language}`);
    }
    return generator(flow, options);
  }
  
  private generateTypeScript(flow: ExecutableFlow, _options: FlowCodeGenOptions): string {
    const lines: string[] = [];
    const flowName = flow.name || 'Unnamed Flow';
    
    lines.push('/**');
    lines.push(` * Generated Flow: ${flowName}`);
    lines.push(` * Generated at: ${new Date().toISOString()}`);
    lines.push(' */');
    lines.push('');
    lines.push('interface FlowContext {');
    lines.push('  variables: Record<string, unknown>;');
    lines.push('  services: any;');
    lines.push('}');
    lines.push('');
    lines.push('interface NodeResult {');
    lines.push('  success: boolean;');
    lines.push('  output?: Record<string, unknown>;');
    lines.push('  error?: string;');
    lines.push('}');
    lines.push('');
    
    // Generate node handlers
    for (const node of flow.nodes || []) {
      lines.push(`async function execute${this.capitalize(node.id)}(context: FlowContext): Promise<NodeResult> {`);
      lines.push(`  // ${node.label || node.type}`);
      
      switch (node.type) {
        case 'start':
          lines.push('  return { success: true, output: { startedAt: new Date().toISOString() } };');
          break;
        case 'end':
          lines.push('  return { success: true, output: { completedAt: new Date().toISOString() } };');
          break;
        case 'action':
          lines.push('  // TODO: Implement action execution');
          lines.push('  return { success: true, output: {} };');
          break;
        case 'decision':
          lines.push('  // TODO: Implement decision logic');
          lines.push('  return { success: true, output: {}, nextNodeId: "" };');
          break;
        default:
          lines.push('  return { success: true, output: {} };');
      }
      
      lines.push('}');
      lines.push('');
    }
    
    // Main execution function
    lines.push('export async function executeFlow(context: FlowContext): Promise<NodeResult> {');
    lines.push(`  const startNode = "${flow.startNode || ''}";`);
    lines.push('  let currentNode = startNode;');
    lines.push('');
    lines.push('  while (currentNode) {');
    lines.push('    let result: NodeResult;');
    lines.push('    ');
    lines.push('    switch (currentNode) {');
    
    for (const node of flow.nodes || []) {
      lines.push(`      case "${node.id}":`);
      lines.push(`        result = await execute${this.capitalize(node.id)}(context);`);
      lines.push('        break;');
    }
    
    lines.push('      default:');
    lines.push('        return { success: false, error: "Unknown node" };');
    lines.push('    }');
    lines.push('    ');
    lines.push('    if (!result.success) return result;');
    lines.push('    // TODO: Navigate to next node');
    lines.push('  }');
    lines.push('  ');
    lines.push('  return { success: true };');
    lines.push('}');
    
    return lines.join('\n');
  }
  
  private generateJavaScript(flow: ExecutableFlow, _options: FlowCodeGenOptions): string {
    const lines: string[] = [];
    
    lines.push('/**');
    lines.push(` * Generated Flow: ${flow.name || 'Unnamed Flow'}`);
    lines.push(' */');
    lines.push('');
    lines.push('module.exports = {');
    lines.push('  async executeFlow(context) {');
    lines.push(`    let currentNode = "${flow.startNode || ''}";`);
    lines.push('    ');
    lines.push('    while (currentNode) {');
    lines.push('      const result = await this.executeNode(currentNode, context);');
    lines.push('      if (!result.success) return result;');
    lines.push('    }');
    lines.push('    ');
    lines.push('    return { success: true };');
    lines.push('  },');
    lines.push('  ');
    lines.push('  async executeNode(nodeId, context) {');
    lines.push('    // TODO: Implement node execution');
    lines.push('    return { success: true };');
    lines.push('  }');
    lines.push('};');
    
    return lines.join('\n');
  }
  
  private generatePython(flow: ExecutableFlow, _options: FlowCodeGenOptions): string {
    const lines: string[] = [];
    const flowName = flow.name || 'Unnamed Flow';
    const startNode = flow.startNode || '';
    
    lines.push('"""');
    lines.push('Generated Flow: ' + flowName);
    lines.push('"""');
    lines.push('');
    lines.push('from typing import Dict, Any, Optional');
    lines.push('');
    lines.push('class FlowExecutor:');
    lines.push('    def __init__(self, context: Dict[str, Any]):');
    lines.push('        self.context = context');
    lines.push('        self.variables = {}');
    lines.push('');
    lines.push('    async def execute_flow(self) -> Dict[str, Any]:');
    lines.push('        current_node = "' + startNode + '"');
    lines.push('        ');
    lines.push('        while current_node:');
    lines.push('            result = await self.execute_node(current_node)');
    lines.push('            if not result.get("success"):');
    lines.push('                return result');
    lines.push('        ');
    lines.push('        return {"success": True}');
    lines.push('');
    lines.push('    async def execute_node(self, node_id: str) -> Dict[str, Any]:');
    lines.push('        # TODO: Implement node execution');
    lines.push('        return {"success": True}');
    
    return lines.join('\n');
  }
  
  private generateJava(flow: ExecutableFlow, _options: FlowCodeGenOptions): string {
    const lines: string[] = [];
    const flowName = flow.name || 'Unnamed Flow';
    const startNode = flow.startNode || '';
    
    lines.push('/**');
    lines.push(` * Generated Flow: ${flowName}`);
    lines.push(' */');
    lines.push('');
    lines.push('public class FlowExecutor {');
    lines.push('    private Map<String, Object> context;');
    lines.push('    ');
    lines.push('    public FlowExecutor(Map<String, Object> context) {');
    lines.push('        this.context = context;');
    lines.push('    }');
    lines.push('    ');
    lines.push('    public Map<String, Object> executeFlow() {');
    lines.push(`        String currentNode = "${startNode}";`);
    lines.push('        ');
    lines.push('        while (currentNode != null) {');
    lines.push('            Map<String, Object> result = executeNode(currentNode);');
    lines.push('            if (!(Boolean) result.get("success")) {');
    lines.push('                return result;');
    lines.push('            }');
    lines.push('        }');
    lines.push('        ');
    lines.push('        return Map.of("success", true);');
    lines.push('    }');
    lines.push('    ');
    lines.push('    private Map<String, Object> executeNode(String nodeId) {');
    lines.push('        // TODO: Implement node execution');
    lines.push('        return Map.of("success", true);');
    lines.push('    }');
    lines.push('}');
    
    return lines.join('\n');
  }
  
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
