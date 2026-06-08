'use client';

/**
 * BranchPermissionDialog.tsx — E3 (Sprint77)
 *
 * 画布分支权限管理对话框：
 * - 显示分支当前权限（owner/admin/write/read）
 * - 显示当前分支 owner
 * - 允许 owner/admin 转移分支所有权
 * - 使用 canvasHistoryStore.setBranchOwner() 和 getBranchPermission()
 */

import { useState, useEffect } from 'react';
import { useCanvasHistoryStore } from '@/stores/dds/canvasHistoryStore';
import { useTranslations } from '@/hooks/useTranslations';
import type { BranchPermission } from '@/stores/dds/canvasHistoryStore';

interface BranchPermissionDialogProps {
  canvasId: string;
  branchName: string;
  onClose: () => void;
}

export function BranchPermissionDialog({ canvasId, branchName, onClose }: BranchPermissionDialogProps) {
  const t = useTranslations('branchPermission')();
  const getBranchMeta = useCanvasHistoryStore((s) => s.getBranchMeta);
  const getBranchPermission = useCanvasHistoryStore((s) => s.getBranchPermission);
  const setBranchOwner = useCanvasHistoryStore((s) => s.setBranchOwner);

  const [owner, setOwner] = useState<string>('');
  const [myPermission, setMyPermission] = useState<BranchPermission>('read');
  const [newOwner, setNewOwner] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const currentUserId = 'user-1'; // TODO: wire to auth store

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const meta = await getBranchMeta(canvasId, branchName);
      if (!cancelled) setOwner(meta?.branchOwner ?? '');
      const perm = await getBranchPermission(canvasId, branchName, currentUserId);
      if (!cancelled) setMyPermission(perm);
    })();
    return () => { cancelled = true; };
  }, [canvasId, branchName, getBranchMeta, getBranchPermission]);

  const handleTransfer = async () => {
    if (!newOwner.trim()) { setError('请输入新 owner 用户 ID'); return; }
    setLoading(true);
    setError('');
    const result = await setBranchOwner(canvasId, branchName, newOwner.trim(), currentUserId);
    setLoading(false);
    if (result.ok) {
      setOwner(newOwner.trim());
      setNewOwner('');
      onClose();
    } else {
      setError(result.error ?? '转移所有权失败');
    }
  };

  const permissionLabel: Record<BranchPermission, string> = {
    owner: '所有者',
    admin: '管理员',
    write: '可编辑',
    read: '只读',
  };

  const canTransfer = myPermission === 'owner' || myPermission === 'admin';

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="perm-dialog-title">
        <div className="dialog-header">
          <h3 id="perm-dialog-title">分支权限管理</h3>
          <button className="dialog-close" onClick={onClose} aria-label="关闭">×</button>
        </div>

        <div className="dialog-body">
          <div className="perm-info">
            <div className="perm-row">
              <span className="perm-label">分支名称</span>
              <span className="perm-value">{branchName}</span>
            </div>
            <div className="perm-row">
              <span className="perm-label">当前 Owner</span>
              <span className="perm-value">{owner || '(未设置)'}</span>
            </div>
            <div className="perm-row">
              <span className="perm-label">我的权限</span>
              <span className={`perm-badge perm-${myPermission}`}>{permissionLabel[myPermission]}</span>
            </div>
          </div>

          {canTransfer && (
            <div className="perm-transfer">
              <h4>转移所有权</h4>
              <input
                type="text"
                className="perm-input"
                placeholder="输入新 owner 用户 ID"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTransfer()}
              />
              {error && <p className="perm-error">{error}</p>}
              <button className="btn-primary" onClick={handleTransfer} disabled={loading}>
                {loading ? '转移中...' : '确认转移'}
              </button>
            </div>
          )}

          {!canTransfer && (
            <p className="perm-restricted">只有所有者或管理员可以转移分支所有权。</p>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
