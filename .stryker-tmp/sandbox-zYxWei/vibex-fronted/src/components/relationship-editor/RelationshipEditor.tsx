/**
 * Relationship Editor Component
 * 添加/删除/修改实体关系
 */
// @ts-nocheck


'use client';

import { useState, useCallback } from 'react';
import styles from './RelationshipEditor.module.css';

export type RelationshipType = 'association' | 'aggregation' | 'composition' | 'dependency' | 'inheritance';

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  label?: string;
}

export interface Entity {
  id: string;
  name: string;
}

export interface RelationshipEditorProps {
  relationships: Relationship[];
  entities: Entity[];
  onAdd?: (rel: Omit<Relationship, 'id'>) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Relationship>) => void;
}

const relationshipTypes: { value: RelationshipType; label: string }[] = [
  { value: 'association', label: '关联' },
  { value: 'aggregation', label: '聚合' },
  { value: 'composition', label: '组合' },
  { value: 'dependency', label: '依赖' },
  { value: 'inheritance', label: '继承' },
];

export function RelationshipEditor({
  relationships,
  entities,
  onAdd,
  onDelete,
  onUpdate,
}: RelationshipEditorProps) {
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedType, setSelectedType] = useState<RelationshipType>('association');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    if (!selectedSource || !selectedTarget || selectedSource === selectedTarget) return;

    onAdd?.({
      sourceId: selectedSource,
      targetId: selectedTarget,
      type: selectedType,
    });

    setSelectedSource('');
    setSelectedTarget('');
  }, [selectedSource, selectedTarget, selectedType, onAdd]);

  const handleDelete = useCallback((id: string) => {
    onDelete?.(id);
  }, [onDelete]);

  const handleTypeChange = useCallback((id: string, type: RelationshipType) => {
    onUpdate?.(id, { type });
    setEditingId(null);
  }, [onUpdate]);

  return (
    <div className={styles.container}>
      <div className={styles.addForm}>
        <h3 className={styles.title}>添加关系</h3>
        <div className={styles.formRow}>
          <select
            className={styles.select}
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            <option value="">选择源实体</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <span className={styles.arrow}>→</span>
          <select
            className={styles.select}
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
          >
            <option value="">选择目标实体</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select
            className={styles.select}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as RelationshipType)}
          >
            {relationshipTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            type="button"
            className={styles.addButton}
            onClick={handleAdd}
            disabled={!selectedSource || !selectedTarget}
          >
            添加
          </button>
        </div>
      </div>

      <div className={styles.list}>
        <h3 className={styles.title}>关系列表 ({relationships.length})</h3>
        {relationships.length === 0 ? (
          <p className={styles.empty}>暂无关系</p>
        ) : (
          <ul className={styles.relationshipList}>
            {(relationships ?? []).map((rel) => {
              const source = entities.find((e) => e.id === rel.sourceId);
              const target = entities.find((e) => e.id === rel.targetId);

              return (
                <li key={rel.id} className={styles.relationshipItem}>
                  <span className={styles.entityName}>{source?.name}</span>
                  <span className={styles.relationType}>{rel.type}</span>
                  <span className={styles.entityName}>{target?.name}</span>

                  {editingId === rel.id ? (
                    <select
                      className={styles.selectSmall}
                      value={rel.type}
                      onChange={(e) => handleTypeChange(rel.id, e.target.value as RelationshipType)}
                    >
                      {relationshipTypes.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => setEditingId(rel.id)}
                    >
                      编辑
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDelete(rel.id)}
                  >
                    删除
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default RelationshipEditor;
