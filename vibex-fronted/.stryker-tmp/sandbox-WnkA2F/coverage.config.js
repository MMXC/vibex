/**
 * Coverage Monitor Configuration
 * 统一配置文件 - 定义覆盖率阈值和监控规则
 */
// @ts-nocheck


module.exports = {
  // 覆盖率阈值配置
  thresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // 按目录模块的阈值
    modules: {
      './src/components/**/*.tsx': {
        branches: 40,
        functions: 40,
        lines: 40,
      },
      './src/lib/**/*.ts': {
        branches: 45,
        functions: 45,
        lines: 50,
      },
      './src/hooks/**/*.ts': {
        branches: 40,
        functions: 40,
        lines: 40,
      },
      './src/services/**/*.ts': {
        branches: 45,
        functions: 45,
        lines: 50,
      },
    },
  },

  // 告警规则
  alerts: {
    // 覆盖率下降超过此值阻断构建 (%)
    blockThreshold: 5,
    // 警告阈值 (%)
    warningThreshold: 2,
  },

  // 报告配置
  reporters: ['text', 'lcov', 'json', 'json-summary'],

  // 忽略的文件/目录
  ignorePatterns: [
    '/node_modules/',
    'tests/e2e',
    'tests/basic.spec.ts',
    'tests/e2e.spec.ts',
    '/e2e/',
    '/.next/',
    '/coverage/',
    '/storybook-static/',
  ],

  // 基线配置
  baseline: {
    // 基线文件路径
    path: './coverage/baseline.json',
    // Git 分支名称（用于获取基线）
    branch: 'main',
    // 自动更新基线
    autoUpdate: false,
  },
};
