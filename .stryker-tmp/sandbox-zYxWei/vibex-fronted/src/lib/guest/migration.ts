/**
 * Data Migration - F4 数据迁移
 * 将游客数据迁移到注册用户账户
 */
// @ts-nocheck


import { 
  getGuestData, 
  clearGuestData,
  GuestData,
  GuestProject 
} from './session';

/**
 * 迁移结果
 */
export interface MigrationResult {
  success: boolean;
  migratedProjects: number;
  errors: string[];
}

/**
 * 迁移冲突项目
 */
export interface MigrationConflict {
  guestProject: GuestProject;
  existingProject: GuestProject;
  resolution?: 'keep_both' | 'replace' | 'skip';
}

/**
 * 待迁移数据
 */
export interface PendingMigration {
  guestData: GuestData;
  conflicts: MigrationConflict[];
}

/**
 * 获取待迁移数据
 */
export function getPendingMigration(): PendingMigration | null {
  const guestData = getGuestData();
  
  if (!guestData || guestData.projects.length === 0) {
    return null;
  }
  
  return {
    guestData,
    conflicts: [], // 冲突检测需要在服务端完成
  };
}

/**
 * 检查是否有可迁移的数据
 */
export function hasMigratableData(): boolean {
  const data = getGuestData();
  return data !== null && data.projects.length > 0;
}

/**
 * 获取可迁移的项目数量
 */
export function getMigratableProjectCount(): number {
  const data = getGuestData();
  return data?.projects.length || 0;
}

/**
 * 请求数据迁移（发送到服务器）
 */
export async function requestMigration(
  userId: string,
  options?: {
    projectIds?: string[];
    onConflict?: 'keep_both' | 'replace' | 'skip';
  }
): Promise<MigrationResult> {
  const guestData = getGuestData();
  
  if (!guestData) {
    return {
      success: false,
      migratedProjects: 0,
      errors: ['No guest data to migrate'],
    };
  }
  
  // 筛选要迁移的项目
  const projectsToMigrate = options?.projectIds
    ? guestData.projects.filter(p => options.projectIds!.includes(p.id))
    : guestData.projects;
  
  // 模拟 API 调用
  try {
    // 在实际环境中，这里应该调用后端 API
    const response = await mockMigrationAPI(userId, projectsToMigrate);
    
    if (response.success) {
      // 迁移成功后清除游客数据
      clearGuestData();
    }
    
    return response;
  } catch (error) {
    return {
      success: false,
      migratedProjects: 0,
      errors: [error instanceof Error ? error.message : 'Migration failed'],
    };
  }
}

/**
 * 模拟迁移 API
 */
async function mockMigrationAPI(
  userId: string, 
  projects: GuestProject[]
): Promise<MigrationResult> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 模拟成功迁移
  return {
    success: true,
    migratedProjects: projects.length,
    errors: [],
  };
}

/**
 * 选择性迁移（用户选择要迁移的项目）
 */
export async function selectiveMigration(
  userId: string,
  selectedProjectIds: string[]
): Promise<MigrationResult> {
  return requestMigration(userId, {
    projectIds: selectedProjectIds,
    onConflict: 'keep_both',
  });
}

/**
 * 迁移所有数据
 */
export async function migrateAll(userId: string): Promise<MigrationResult> {
  return requestMigration(userId);
}

/**
 * 迁移单个项目
 */
export async function migrateSingleProject(
  userId: string,
  projectId: string
): Promise<MigrationResult> {
  return requestMigration(userId, {
    projectIds: [projectId],
  });
}

/**
 * 取消迁移（清除游客数据不迁移）
 */
export function cancelMigration(): void {
  clearGuestData();
}

/**
 * 获取迁移预览信息
 */
export function getMigrationPreview(): {
  totalProjects: number;
  totalSize: number;
  estimatedTime: string;
} {
  const data = getGuestData();
  
  if (!data || data.projects.length === 0) {
    return {
      totalProjects: 0,
      totalSize: 0,
      estimatedTime: '0秒',
    };
  }
  
  // 估算数据大小（简化计算）
  const size = JSON.stringify(data).length;
  
  // 估算迁移时间（假设 500ms/项目）
  const time = Math.max(500, data.projects.length * 500);
  
  return {
    totalProjects: data.projects.length,
    totalSize: size,
    estimatedTime: `${Math.ceil(time / 1000)}秒`,
  };
}

/**
 * 检查是否有未保存的更改
 */
export function hasUnsavedChanges(): boolean {
  // 在实际环境中，应该检查 localStorage 与服务器数据的差异
  return hasMigratableData();
}

/**
 * 创建迁移提醒
 */
export function createMigrationReminder(): string {
  const preview = getMigrationPreview();
  
  if (preview.totalProjects === 0) {
    return '';
  }
  
  return `您有 ${preview.totalProjects} 个项目未保存。注册后可以一键迁移到您的账户，保留所有数据。`;
}

export default {
  getPendingMigration,
  hasMigratableData,
  getMigratableProjectCount,
  requestMigration,
  selectiveMigration,
  migrateAll,
  migrateSingleProject,
  cancelMigration,
  getMigrationPreview,
  hasUnsavedChanges,
  createMigrationReminder,
};
