/**
 * Feature Flag System
 * E2-T2: Feature flags with environment variable backing
 */

type FeatureFlagName = 
  | 'MULTI_FRAMEWORK_EXPORT'
  | 'VERCEL_DEPLOY'
  | 'MCP_SERVER'
  | 'NEW_CANVAS';

interface FeatureFlagConfig {
  name: FeatureFlagName;
  description: string;
  defaultValue: boolean;
}

const FLAGS: FeatureFlagConfig[] = [
  {
    name: 'MULTI_FRAMEWORK_EXPORT',
    description: 'Enable React→Vue/Solid code export',
    defaultValue: false,
  },
  {
    name: 'VERCEL_DEPLOY',
    description: 'Enable one-click Vercel deployment',
    defaultValue: false,
  },
  {
    name: 'MCP_SERVER',
    description: 'Enable MCP Server integration',
    defaultValue: false,
  },
  {
    name: 'NEW_CANVAS',
    description: 'Enable new canvas rendering engine',
    defaultValue: false,
  },
];

/**
 * Check if a feature flag is enabled
 */
export function isEnabled(flagName: FeatureFlagName): boolean {
  // Environment variable: NEXT_PUBLIC_FEATURE_<NAME>
  const envKey = `NEXT_PUBLIC_FEATURE_${flagName}`;
  const envValue = process.env[envKey];
  
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }
  
  // Fallback to default
  const flag = FLAGS.find(f => f.name === flagName);
  return flag?.defaultValue ?? false;
}

/**
 * Get all feature flags with their current status
 */
export function getAllFlags(): Record<FeatureFlagName, boolean> {
  return FLAGS.reduce((acc, flag) => {
    acc[flag.name] = isEnabled(flag.name);
    return acc;
  }, {} as Record<FeatureFlagName, boolean>);
}

export type { FeatureFlagName };
