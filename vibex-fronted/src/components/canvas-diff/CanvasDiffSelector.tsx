/**
 * CanvasDiffSelector — 选择两个 Canvas 项目进行对比
 */
'use client';

import React from 'react';
import styles from './canvas-diff.module.css';

const s = styles as Record<string, string>;

export interface ProjectOption {
  id: string;
  name: string;
}

interface CanvasDiffSelectorProps {
  options: ProjectOption[];
  valueA: string;
  valueB: string;
  onChangeA: (id: string) => void;
  onChangeB: (id: string) => void;
}

export function CanvasDiffSelector({
  options,
  valueA,
  valueB,
  onChangeA,
  onChangeB,
}: CanvasDiffSelectorProps) {
  return (
    <div className={s.selector ?? ''} data-testid="canvas-diff-selector">
      <div className={s.selectorColumn ?? ''}>
        <label className={s.selectorLabel ?? ''} htmlFor="canvas-a-selector">
          基线项目
        </label>
        <select
          id="canvas-a-selector"
          className={s.selectorSelect ?? ''}
          value={valueA}
          onChange={(e) => onChangeA(e.target.value)}
          data-testid="canvas-a-selector"
        >
          <option value="">— 选择项目 A —</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      <div className={s.vsBadge ?? ''}>VS</div>

      <div className={s.selectorColumn ?? ''}>
        <label className={s.selectorLabel ?? ''} htmlFor="canvas-b-selector">
          对比项目
        </label>
        <select
          id="canvas-b-selector"
          className={s.selectorSelect ?? ''}
          value={valueB}
          onChange={(e) => onChangeB(e.target.value)}
          data-testid="canvas-b-selector"
        >
          <option value="">— 选择项目 B —</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}