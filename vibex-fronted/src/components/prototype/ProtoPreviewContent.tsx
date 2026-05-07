/**
 * ProtoPreviewContent — Shows selected node props preview
 * E01-U2: Props hot-update with data-rebuild="false"
 */
'use client';

import React from 'react';
import type { ProtoNode, ProtoNodeData } from '@/stores/prototypeStore';
import styles from './ProtoFlowCanvas.module.css';

interface Props {
  node: ProtoNode;
}

export function ProtoPreviewContent({ node }: Props) {
  const data = node.data as ProtoNodeData;
  const componentLabel = data.component?.type ?? data.component?.name ?? 'Unknown';
  const nodeProps = data.props ?? {};
  const width = (data.width ?? '') as string;
  const height = (data.height ?? '') as string;
  const propEntries = Object.entries(nodeProps as Record<string, unknown>);

  const propRows = propEntries.map(([key, value]) => (
    <div key={key} className={styles.propRow}>
      <span className={styles.propKey}>{key}</span>
      <span className={styles.propValue}>{String(value)}</span>
    </div>
  ));

  return (
    <div
      className={styles.protoPreviewContent}
      data-testid="proto-preview-content"
      data-rebuild="false"
    >
      <div className={styles.componentType}>{String(componentLabel)}</div>
      {propEntries.length > 0 ? <div className={styles.propsList}>{propRows}</div> : null}
      <div className={styles.dimensions}>
        {width ? <span>W: {width}</span> : null}
        {height ? <span>H: {height}</span> : null}
      </div>
    </div>
  );
}
