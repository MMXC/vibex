/**
 * Component Registry
 * 组件注册表 - 用于验证组件集成状态
 * 
 * 用法:
 * 1. 在组件中注册: import { registerComponent } from '@/lib/componentRegistry';
 *    registerComponent('MyComponent', { status: 'integrated', since: '2026-03-09' });
 * 2. 在 CI 中检查: npm run verify-components
 */
// @ts-nocheck


export type ComponentStatus = 'integrated' | 'pending' | 'deprecated';

export interface ComponentEntry {
  name: string;
  status: ComponentStatus;
  since?: string;
  integratedIn?: string; // 页面/功能名称
  notes?: string;
}

export interface ComponentRegistry {
  components: Map<string, ComponentEntry>;
  register(name: string, entry: Omit<ComponentEntry, 'name'>): void;
  get(name: string): ComponentEntry | undefined;
  getAll(): ComponentEntry[];
  getUnintegrated(): ComponentEntry[];
  verify(): { valid: boolean; issues: string[] };
}

// 全局注册表实例
const registry = new Map<string, ComponentEntry>();

export const componentRegistry = {
  /**
   * 注册组件
   */
  register(name: string, entry: Omit<ComponentEntry, 'name'>): void {
    registry.set(name, { name, ...entry });
  },

  /**
   * 获取组件信息
   */
  get(name: string): ComponentEntry | undefined {
    return registry.get(name);
  },

  /**
   * 获取所有已注册组件
   */
  getAll(): ComponentEntry[] {
    return Array.from(registry.values());
  },

  /**
   * 获取未集成的组件
   */
  getUnintegrated(): ComponentEntry[] {
    return this.getAll().filter(c => c.status !== 'integrated');
  },

  /**
   * 验证组件状态
   */
  verify(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const unintegrated = this.getUnintegrated();
    
    if (unintegrated.length > 0) {
      issues.push(`Found ${unintegrated.length} unintegrated components: ${unintegrated.map(c => c.name).join(', ')}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  },

  /**
   * 打印所有组件状态 (用于调试) - 仅开发环境
   */
  print(): void {
    if (process.env.NODE_ENV === 'production') return;
    console.log('\n📦 Component Registry Status\n');
    console.log('=' .repeat(50));
    
    const components = this.getAll();
    if (components.length === 0) {
      console.log('No components registered yet.');
      return;
    }

    const byStatus = {
      integrated: components.filter(c => c.status === 'integrated'),
      pending: components.filter(c => c.status === 'pending'),
      deprecated: components.filter(c => c.status === 'deprecated'),
    };

    console.log(`\n✅ Integrated: ${byStatus.integrated.length}`);
    byStatus.integrated.forEach(c => console.log(`   - ${c.name}`));

    console.log(`\n⏳ Pending: ${byStatus.pending.length}`);
    byStatus.pending.forEach(c => console.log(`   - ${c.name}`));

    console.log(`\n⚠️  Deprecated: ${byStatus.deprecated.length}`);
    byStatus.deprecated.forEach(c => console.log(`   - ${c.name}`));

    console.log('\n' + '=' .repeat(50) + '\n');
  }
};

// 便捷函数: registerComponent
export function registerComponent(name: string, entry: Omit<ComponentEntry, 'name'>): void {
  componentRegistry.register(name, entry);
}

// 导出默认实例
export default componentRegistry;
