/**
 * Guest Session Management - F1 游客身份识别
 * 管理游客会话的创建、识别和数据存储
 */

import { v4 as uuidv4 } from 'uuid';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

// 游客会话 key 前缀
const GUEST_SESSION_KEY = 'vibex_guest_session';
const GUEST_DATA_KEY = 'vibex_guest_data';

/**
 * 游客会话数据结构
 */
export interface GuestSession {
  id: string;
  createdAt: number;
  ip?: string;
  userAgent?: string;
  lastActiveAt: number;
  expiresAt: number;
}

/**
 * 游客数据
 */
export interface GuestData {
  sessionId: string;
  projects: GuestProject[];
  preferences: Record<string, any>;
  createdAt: number;
  expiresAt: number;
}

/**
 * 游客项目数据
 */
export interface GuestProject {
  id: string;
  name: string;
  data: Record<string, any>;
  createdAt: number;
}

/**
 * 识别当前游客 IP
 */
export function identifyIP(): string {
  // 在客户端环境获取 IP（通过代理或 CF headers）
  if (typeof window !== 'undefined') {
    // 尝试从 localStorage 获取之前记录的 IP
    try {
      const session = getGuestSession();
      return session?.ip || 'client-unknown';
    } catch {
      return 'client-unknown';
    }
  }
  return 'server-unknown';
}

/**
 * 创建游客会话
 */
export function createGuestSession(): GuestSession {
  const now = Date.now();
  const session: GuestSession = {
    id: `guest_${uuidv4().substring(0, 8)}`,
    createdAt: now,
    lastActiveAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000, // 24小时过期
  };
  
  // 存储会话
  try {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    canvasLogger.default.error('[Guest] Failed to save session:', e);
  }
  
  return session;
}

/**
 * 获取当前游客会话
 */
export function getGuestSession(): GuestSession | null {
  try {
    const stored = localStorage.getItem(GUEST_SESSION_KEY);
    if (!stored) return null;
    
    const session: GuestSession = JSON.parse(stored);
    
    // 检查是否过期
    if (session.expiresAt < Date.now()) {
      clearGuestSession();
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

/**
 * 更新游客会话活跃时间
 */
export function updateGuestActivity(): GuestSession | null {
  const session = getGuestSession();
  if (!session) return null;
  
  session.lastActiveAt = Date.now();
  
  try {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    canvasLogger.default.error('[Guest] Failed to update session:', e);
  }
  
  return session;
}

/**
 * 检查是否有有效的游客会话
 */
export function hasGuestSession(): boolean {
  const session = getGuestSession();
  return session !== null;
}

/**
 * 获取游客会话 ID
 */
export function getGuestId(): string | null {
  const session = getGuestSession();
  return session?.id || null;
}

/**
 * 清除游客会话
 */
export function clearGuestSession(): void {
  try {
    localStorage.removeItem(GUEST_SESSION_KEY);
    localStorage.removeItem(GUEST_DATA_KEY);
  } catch (e) {
    canvasLogger.default.error('[Guest] Failed to clear session:', e);
  }
}

// ========== 游客数据管理 (F3) ==========

/**
 * 获取游客数据
 */
export function getGuestData(): GuestData | null {
  try {
    const stored = localStorage.getItem(GUEST_DATA_KEY);
    if (!stored) return null;
    
    const data: GuestData = JSON.parse(stored);
    
    // 检查是否过期
    if (data.expiresAt < Date.now()) {
      clearGuestData();
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

/**
 * 创建游客数据存储
 */
export function createGuestData(): GuestData {
  const session = getGuestSession();
  const now = Date.now();
  
  const data: GuestData = {
    sessionId: session?.id || 'unknown',
    projects: [],
    preferences: {},
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000, // 24小时过期
  };
  
  try {
    localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    canvasLogger.default.error('[Guest] Failed to save guest data:', e);
  }
  
  return data;
}

/**
 * 保存游客数据
 */
export function saveGuestData(data: GuestData): void {
  try {
    localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    canvasLogger.default.error('[Guest] Failed to save guest data:', e);
  }
}

/**
 * 清除游客数据
 */
export function clearGuestData(): void {
  try {
    localStorage.removeItem(GUEST_DATA_KEY);
  } catch (e) {
    canvasLogger.default.error('[Guest] Failed to clear guest data:', e);
  }
}

/**
 * 检查数据是否过期
 */
export function isGuestDataExpired(): boolean {
  const data = getGuestData();
  if (!data) return true;
  return data.expiresAt < Date.now();
}

/**
 * 获取剩余有效时间（毫秒）
 */
export function getRemainingTime(): number {
  const session = getGuestSession();
  if (!session) return 0;
  
  return Math.max(0, session.expiresAt - Date.now());
}

export default {
  identifyIP,
  createGuestSession,
  getGuestSession,
  updateGuestActivity,
  hasGuestSession,
  getGuestId,
  clearGuestSession,
  getGuestData,
  createGuestData,
  saveGuestData,
  clearGuestData,
  isGuestDataExpired,
  getRemainingTime,
};
