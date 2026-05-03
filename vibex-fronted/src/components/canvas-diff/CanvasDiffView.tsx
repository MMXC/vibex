/**
 * CanvasDiffView — 展示 Canvas 项目对比结果
 */
'use client';

import React from 'react';
import styles from './canvas-diff.module.css';
import type { CanvasDiff, DiffItem } from '@/lib/canvasDiff';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';

const s = styles as Record<string, string>;

type AnyNode = BoundedContextNode | BusinessFlowNode | ComponentNode;

function getNodeLabel(node: AnyNode): string {
  if ('name' in node) return (node as any).name;
  if ('nodeId' in node) return (node as any).nodeId;
  return String(node);
}

function getNodeTypeLabel(node: AnyNode): string {
  if ('type' in node) return (node as any).type as string;
  return 'unknown';
}

function DiffCard({
  item,
  borderClass,
  testId,
  diffLabel,
}: {
  item: DiffItem<AnyNode>;
  borderClass: string;
  testId: string;
  diffLabel: string;
}) {
  return (
    <div className={borderClass} data-testid={testId}>
      <div className={`${s.diffCardHeader ?? ''}`}>
        <span className={`${s.diffLabel ?? ''}`}>{diffLabel}</span>
        <span className={`${s.nodeTypeBadge ?? ''}`}>{getNodeTypeLabel(item.node)}</span>
      </div>
      <div className={`${s.nodeName ?? ''}`}>{getNodeLabel(item.node)}</div>
      {item.type === 'modified' && item.before && item.after && (
        <div className={`${s.modifiedFields ?? ''}`}>
          <span className={`${s.fieldLabel ?? ''}`}>修改内容:</span>
          {Object.keys(item.after as object)
            .filter((k) => k !== 'nodeId' && (item.after as any)[k] !== (item.before as any)[k])
            .map((key) => (
              <div key={key} className={`${s.fieldChange ?? ''}`}>
                <span className={`${s.fieldName ?? ''}`}>{key}:</span>
                <span className={`${s.fieldBefore ?? ''}`}>{(item.before as any)[key] ?? '—'}</span>
                <span className={`${s.arrow ?? ''}`}>→</span>
                <span className={`${s.fieldAfter ?? ''}`}>{(item.after as any)[key] ?? '—'}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

interface CanvasDiffViewProps {
  diff: CanvasDiff | null;
  projectAName: string;
  projectBName: string;
  onExport: () => void;
}

export function CanvasDiffView({ diff, projectAName, projectBName, onExport }: CanvasDiffViewProps) {
  if (!diff) {
    return (
      <div className={`${s.emptyState ?? ''}`}>
        <div className={`${s.emptyIcon ?? ''}`}>📊</div>
        <h2 className={`${s.emptyTitle ?? ''}`}>选择两个项目开始对比</h2>
        <p className={`${s.emptyDesc ?? ''}`}>
          从上方下拉框中选择两个 Canvas 项目，系统将自动分析三棵树的节点差异。
        </p>
      </div>
    );
  }

  const { summary, added, removed, modified, unchanged } = diff;
  const hasChanges = added.length > 0 || removed.length > 0 || modified.length > 0;

  return (
    <div className={`${s.diffContainer ?? ''}`}>
      {/* Summary */}
      <div className={`${s.summaryBar ?? ''}`}>
        <div className={`${s.summaryTitle ?? ''}`}>
          {projectAName} <span className={`${s.vsText ?? ''}`}>vs</span> {projectBName}
        </div>
        <div className={`${s.summaryStats ?? ''}`}>
          <span className={`${s.statAdded ?? ''}`}>+{summary.contextAdded + summary.flowAdded + summary.componentAdded} 新增</span>
          <span className={`${s.statRemoved ?? ''}`}>-{summary.contextRemoved + summary.flowRemoved + summary.componentRemoved} 移除</span>
          <span className={`${s.statModified ?? ''}`}>~{summary.contextModified + summary.flowModified + summary.componentModified} 修改</span>
          <span className={`${s.statUnchanged ?? ''}`}>{unchanged.length} 未变化</span>
        </div>
        <button
          type="button"
          className={`${s.exportBtn ?? ''}`}
          onClick={onExport}
          data-testid="diff-export-btn"
        >
          导出报告
        </button>
      </div>

      {/* Tree breakdown */}
      <div className={`${s.treeBreakdown ?? ''}`}>
        {([
          { label: '限界上下文', key: 'context' as const },
          { label: '业务流程', key: 'flow' as const },
          { label: '组件', key: 'component' as const },
        ] as const).map(({ label, key }) => (
          <div key={key} className={`${s.treeRow ?? ''}`}>
            <span className={`${s.treeLabel ?? ''}`}>{label}</span>
            <span className={`${s.treeStat ?? ''}`}>
              <span className={`${s.statAdded ?? ''}`}>+{(summary as any)[`${key}Added`]}</span>
              {' / '}
              <span className={`${s.statRemoved ?? ''}`}>-{(summary as any)[`${key}Removed`]}</span>
              {' / '}
              <span className={`${s.statModified ?? ''}`}>~{(summary as any)[`${key}Modified`]}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Three-column diff */}
      {hasChanges ? (
        <div className={`${s.diffColumns ?? ''}`}>
          {/* Left: Added */}
          <div className={`${s.diffColumn ?? ''}`}>
            <div className={`${s.columnHeader ?? ''} ${s.columnAdded ?? ''}`}>
              🟢 新增节点（{added.length}）
            </div>
            <div className={`${s.columnContent ?? ''}`}>
              {added.length === 0 ? (
                <p className={`${s.noItems ?? ''}`}>无新增</p>
              ) : (
                added.map((item, i) => (
                  <DiffCard
                    key={`added-${i}`}
                    item={item}
                    borderClass={`${s.diffCard ?? ''} ${s.borderAdded ?? ''}`}
                    testId="diff-item-added"
                    diffLabel="新增"
                  />
                ))
              )}
            </div>
          </div>

          {/* Center: Modified */}
          <div className={`${s.diffColumn ?? ''}`}>
            <div className={`${s.columnHeader ?? ''} ${s.columnModified ?? ''}`}>
              🟡 修改节点（{modified.length}）
            </div>
            <div className={`${s.columnContent ?? ''}`}>
              {modified.length === 0 ? (
                <p className={`${s.noItems ?? ''}`}>无修改</p>
              ) : (
                modified.map((item, i) => (
                  <DiffCard
                    key={`modified-${i}`}
                    item={item}
                    borderClass={`${s.diffCard ?? ''} ${s.borderModified ?? ''}`}
                    testId="diff-item-modified"
                    diffLabel="修改"
                  />
                ))
              )}
            </div>
          </div>

          {/* Right: Removed */}
          <div className={`${s.diffColumn ?? ''}`}>
            <div className={`${s.columnHeader ?? ''} ${s.columnRemoved ?? ''}`}>
              🔴 移除节点（{removed.length}）
            </div>
            <div className={`${s.columnContent ?? ''}`}>
              {removed.length === 0 ? (
                <p className={`${s.noItems ?? ''}`}>无移除</p>
              ) : (
                removed.map((item, i) => (
                  <DiffCard
                    key={`removed-${i}`}
                    item={item}
                    borderClass={`${s.diffCard ?? ''} ${s.borderRemoved ?? ''}`}
                    testId="diff-item-removed"
                    diffLabel="移除"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={`${s.noChangesState ?? ''}`}>
          <span className={`${s.checkIcon ?? ''}`}>✅</span>
          <p>两个项目完全一致，没有发现差异。</p>
        </div>
      )}
    </div>
  );
}