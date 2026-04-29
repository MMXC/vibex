import { User, UserUpdate } from '../types/user';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';
import { unwrapField } from '../unwrappers';

// ==================== 接口定义 ====================

export interface UserApi {
  getUser(userId: string): Promise<User>;
  updateUser(userId: string, data: UserUpdate): Promise<User>;
}

// ==================== 实现 ====================

class UserApiImpl implements UserApi {
  async getUser(userId: string): Promise<User> {
    const cacheKey = getCacheKey('user', userId);
    const cached = cache.get<User>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    return retry.execute(async () => {
      const response = await httpClient.get<User>(`/users/${userId}`);
      const user = unwrapField<User>(response, 'user')!;
      cache.set(cacheKey, user);
      return user;
    });
  }

  async updateUser(userId: string, data: UserUpdate): Promise<User> {
    return retry.execute(async () => {
      const response = await httpClient.put<User>(`/users/${userId}`, data);
      const user = unwrapField<User>(response, 'user')!;
      cache.remove(getCacheKey('user', userId));
      return user;
    });
  }

  private isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }
}

// ==================== 工厂函数 ====================

export function createUserApi(): UserApi {
  return new UserApiImpl();
}

// ==================== 单例导出 ====================

export const userApi = createUserApi();
