import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';
import { User } from '../types/user';
import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';
import { retry } from '../retry';

// ==================== 接口定义 ====================

export interface AuthApi {
  login(credentials: LoginRequest): Promise<AuthResponse>;
  register(data: RegisterRequest): Promise<AuthResponse>;
  getCurrentUser(): Promise<User>;
  logout(): Promise<SuccessResponse>;
}

// ==================== 实现 ====================

class AuthApiImpl implements AuthApi {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const result = await retry.execute(async () => {
      const response = await httpClient.post<{ data: AuthResponse }>(
        '/auth/login',
        credentials
      );
      return response;
    });
    const data: AuthResponse = (result as any).data || result;

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_token', data.token);
      sessionStorage.setItem('user_id', data.user.id);
    }

    return data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const result = await retry.execute(async () => {
      const response = await httpClient.post<{ data: AuthResponse }>(
        '/auth/register',
        data
      );
      return response;
    });
    const authResult: AuthResponse = (result as any).data || result;

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_token', authResult.token);
      sessionStorage.setItem('user_id', authResult.user.id);
    }

    return authResult;
  }

  async getCurrentUser(): Promise<User> {
    const result = await retry.execute(async () => {
      const response = await httpClient.get<{ data: User }>('/auth/me');
      return response;
    });
    return (result as any).data || result;
  }

  async logout(): Promise<SuccessResponse> {
    const result = await retry.execute(async () => {
      const response = await httpClient.post<SuccessResponse>('/auth/logout');
      return response;
    });

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token'); sessionStorage.removeItem('user_id'); localStorage.removeItem('auth_token'); localStorage.removeItem('user_id');
    }

    return result;
  }
}

// ==================== 工厂函数 ====================

export function createAuthApi(): AuthApi {
  return new AuthApiImpl();
}

// ==================== 单例导出 ====================

export const authApi = createAuthApi();
