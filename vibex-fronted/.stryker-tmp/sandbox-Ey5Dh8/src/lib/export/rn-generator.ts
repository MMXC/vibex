// @ts-nocheck
export interface CanvasNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

export function generateRNComponent(nodes: CanvasNode[]): string {
  const viewStyles = nodes.map((n) => `
    <View key="${n.id}" style={styles.node}>
      <Text>${String(n.data?.label || n.id)}</Text>
    </View>
  `).join('\n');

  return `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const VibeXCanvas: React.FC = () => (
  <View style={styles.canvas}>
${viewStyles}
  </View>
);

const styles = StyleSheet.create({
  canvas: { flex: 1, padding: 16 },
  node: { padding: 8, marginBottom: 8 },
});
`;
}
