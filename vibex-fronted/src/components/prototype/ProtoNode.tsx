/**
 * ProtoNode — Custom React Flow Node Renderer
 *
 * Renders a ProtoFlow node as a real-looking UI component using
 * simplified visual mockups. Mock data (if any) is used for Table/Form.
 *
 * Epic1: E1-U3
 */

'use client';

import React, { memo } from 'react';
import type { ProtoNodeData } from '@/stores/prototypeStore';
import styles from './ProtoNode.module.css';

// ==================== Type Helpers ====================

type MockData = Record<string, unknown>;

// ==================== Variant Styles ====================

const VARIANT_COLORS: Record<string, string> = {
  primary: '#6366f1',
  secondary: '#64748b',
  ghost: 'transparent',
  link: 'transparent',
};

// ==================== Individual Component Renderers ====================

function renderButton(
  label: string,
  variant: string = 'primary',
  size: string = 'medium',
  mock?: MockData
): React.ReactNode {
  const color = VARIANT_COLORS[variant] ?? VARIANT_COLORS.primary;
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <button
      type="button"
      className={styles.protoButton}
      style={{
        background: variant === 'ghost' || variant === 'link' ? 'transparent' : color,
        borderColor: color,
        color: variant === 'ghost' || variant === 'link' ? color : '#fff',
        fontSize: isSmall ? '11px' : isLarge ? '15px' : '13px',
        padding: isSmall ? '4px 10px' : isLarge ? '10px 20px' : '7px 14px',
        opacity: !!(mock?.disabled) ? 0.5 : 1,
      }}
      disabled={mock?.disabled === true}
      onClick={(e) => e.stopPropagation()}
    >
      {label || '按钮'}
      {mock?.loading === true && (
        <span className={styles.loadingDot} aria-label="加载中" />
      )}
    </button>
  );
}

function renderInput(
  placeholder: string,
  type: string = 'text',
  mock?: MockData
): React.ReactNode {
  return (
    <div className={styles.protoInputWrap}>
      {!!mock?.label && <label className={styles.protoInputLabel}>{String(mock.label)}</label>}
      <input
        type={type as React.InputHTMLAttributes<HTMLInputElement>['type']}
        className={styles.protoInput}
        placeholder={placeholder || '请输入...'}
        disabled={!!(mock?.disabled)}
        readOnly
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function renderCard(title: string, mock?: MockData): React.ReactNode {
  const isBordered = mock?.bordered !== false;
  return (
    <div
      className={styles.protoCard}
      style={{ border: isBordered ? '1px solid rgba(255,255,255,0.1)' : 'none' }}
    >
      {title && <div className={styles.protoCardTitle}>{title}</div>}
      <div className={styles.protoCardBody}>卡片内容区域</div>
      {!!mock?.hoverable && (
        <div className={styles.protoCardHover} />
      )}
    </div>
  );
}

function renderContainer(mock?: MockData): React.ReactNode {
  const fluid = mock?.fluid;
  const centered = mock?.centered !== false;
  return (
    <div
      className={`${styles.protoContainer} ${fluid ? styles.protoContainerFluid : ''}`}
      style={{ justifyContent: centered ? 'center' : 'flex-start' }}
    >
      <div className={styles.protoContainerDashed}>容器</div>
    </div>
  );
}

function renderHeader(title: string, mock?: MockData): React.ReactNode {
  const transparent = mock?.transparent;
  return (
    <div
      className={styles.protoHeader}
      style={{ background: transparent ? 'transparent' : 'rgba(255,255,255,0.06)' }}
    >
      <span className={styles.protoHeaderTitle}>{title || '页面标题'}</span>
    </div>
  );
}

function renderNavigation(mock?: MockData): React.ReactNode {
  const orientation = (mock?.orientation as string) ?? 'horizontal';
  const items = mock?.items as string[] | undefined;
  const navItems = items ?? ['首页', '关于', '联系'];

  return (
    <div
      className={styles.protoNav}
      style={{ flexDirection: orientation === 'vertical' ? 'column' : 'row' }}
    >
      {navItems.map((item, i) => (
        <span key={i} className={i === 0 ? styles.protoNavItemActive : styles.protoNavItem}>
          {item}
        </span>
      ))}
    </div>
  );
}

function renderModal(mock?: MockData): React.ReactNode {
  const title = mock?.title as string | undefined;
  const closable = mock?.closable !== false;
  return (
    <div className={styles.protoModal}>
      <div className={styles.protoModalOverlay}>
        <div className={styles.protoModalBox}>
          <div className={styles.protoModalHeader}>
            <span>{title || '弹窗标题'}</span>
            {closable && <span className={styles.protoModalClose}>✕</span>}
          </div>
          <div className={styles.protoModalBody}>弹窗内容</div>
        </div>
      </div>
    </div>
  );
}

function renderTable(mock?: MockData): React.ReactNode {
  const dataSource = mock?.dataSource as Record<string, unknown>[] | undefined;
  const rows: Record<string, unknown>[] = dataSource ?? [
    { id: 1, name: '张三', status: '活跃' },
    { id: 2, name: '李四', status: '待激活' },
    { id: 3, name: '王五', status: '禁用' },
  ];

  const columns = mock?.columns as string[] | undefined;
  const headers = columns ?? ['ID', '姓名', '状态'];

  return (
    <div className={styles.protoTable}>
      <table>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 3).map((row, ri) => (
            <tr key={ri}>
              {Object.values(row).slice(0, headers.length).map((val, ci) => (
                <td key={ci}>{String(val)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 3 && (
        <div className={styles.protoTableMore}>+{rows.length - 3} more rows</div>
      )}
    </div>
  );
}

function renderForm(mock?: MockData): React.ReactNode {
  const layout = (mock?.layout as string) ?? 'vertical';
  return (
    <div
      className={styles.protoForm}
      style={{ flexDirection: layout === 'inline' ? 'row' : 'column' }}
    >
      <div className={styles.protoFormItem}>
        <span className={styles.protoFormLabel}>用户名</span>
        <div className={styles.protoFormInput}>输入框</div>
      </div>
      <div className={styles.protoFormItem}>
        <span className={styles.protoFormLabel}>密码</span>
        <div className={styles.protoFormInput}>输入框</div>
      </div>
      <div className={styles.protoFormBtn}>提交</div>
    </div>
  );
}

function renderImage(mock?: MockData): React.ReactNode {
  const src = (mock?.src as string | undefined) ?? '';
  const alt = (mock?.alt as string | undefined) ?? '图片';
  const fit = (mock?.fit as string) ?? 'cover';

  if (src && src.startsWith('http')) {
    return (
      <div className={styles.protoImageWrap}>
        <img src={src} alt={alt} className={styles.protoImage} style={{ objectFit: fit as React.CSSProperties['objectFit'] }} />
      </div>
    );
  }

  return (
    <div className={styles.protoImagePlaceholder}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21,15 16,10 5,21" />
      </svg>
      <span>{alt}</span>
    </div>
  );
}

// ==================== Main ProtoNode ====================

// Use a plain props interface compatible with React Flow v12 custom node types.
// ProtoNodeData is stored as node.data in the store.
interface ProtoNodeProps {
  data: ProtoNodeData;
  selected?: boolean;
  id?: string;
  type?: string;
  [key: string]: unknown;
}

export const ProtoNode = memo(function ProtoNode({ data, selected }: ProtoNodeProps) {
  const { component, mockData } = data as ProtoNodeData;
  const mock = mockData?.data;
  const typeName = (component.name ?? component.type) as string;

  let content: React.ReactNode;
  switch (typeName.toLowerCase()) {
    case 'button':
      content = renderButton(
        String(component.props?.label ?? '按钮'),
        String(component.props?.variant ?? 'primary'),
        String(component.props?.size ?? 'medium'),
        mock
      );
      break;
    case 'input':
      content = renderInput(
        String(component.props?.placeholder ?? ''),
        String(component.props?.type ?? 'text'),
        mock
      );
      break;
    case 'card':
      content = renderCard(String(component.props?.title ?? ''), mock);
      break;
    case 'container':
      content = renderContainer(mock);
      break;
    case 'header':
      content = renderHeader(String(component.props?.title ?? ''), mock);
      break;
    case 'navigation':
      content = renderNavigation(mock);
      break;
    case 'modal':
      content = renderModal(mock);
      break;
    case 'table':
      content = renderTable(mock);
      break;
    case 'form':
      content = renderForm(mock);
      break;
    case 'image':
      content = renderImage(mock);
      break;
    default:
      content = (
        <div className={styles.protoFallback}>
          <span className={styles.protoFallbackLabel}>{typeName}</span>
        </div>
      );
  }

  return (
    <div
      className={`${styles.node} ${selected ? styles.nodeSelected : ''}`}
      data-type={typeName}
      data-node-id={component.id}
    >
      <div className={styles.nodeBadge}>{typeName}</div>
      <div className={styles.nodeContent}>{content}</div>
    </div>
  );
});
