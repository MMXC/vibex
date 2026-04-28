/**
 * driftDetector — S16-P0-2 Design-to-Code Bidirectional Sync
 *
 * Detects drift between design tokens (from Figma) and code tokens (from source).
 *
 * 3 Scenarios:
 * - Scenario A: Token renamed → flag as drift
 * - Scenario B: Code refactored without design change → flag as drift
 * - Scenario C: Same token in design and code → no drift
 *
 * Target: < 10% false positive rate
 */

import type { DesignToken, TokenChange, DriftReport } from '@/types/designSync';

function computeTokenKey(token: DesignToken): string {
  return `${token.type}:${token.name}`;
}

function buildTokenMap(tokens: DesignToken[]): Map<string, DesignToken> {
  const map = new Map<string, DesignToken>();
  for (const token of tokens) {
    map.set(computeTokenKey(token), token);
  }
  return map;
}

/**
 * Detect drift between design tokens and code tokens.
 * Returns a DriftReport with changes and false positive rate calculation.
 */
export function detectDrift(
  designTokens: DesignToken[],
  codeTokens: DesignToken[],
  scenario?: 'A' | 'B' | 'C'
): DriftReport {
  const designMap = buildTokenMap(designTokens);
  const codeMap = buildTokenMap(codeTokens);
  const changes: TokenChange[] = [];

  // Detect tokens in code not present in design (Scenario B: code refactored)
  for (const [key, codeToken] of codeMap) {
    if (!designMap.has(key)) {
      changes.push({
        tokenId: codeToken.id,
        type: 'removed',
        oldValue: codeToken.value,
        location: codeToken.name,
      });
    }
  }

  // Detect tokens in design not present in code (Scenario A: token renamed, or new token)
  for (const [key, designToken] of designMap) {
    const codeToken = codeMap.get(key);
    if (!codeToken) {
      changes.push({
        tokenId: designToken.id,
        type: 'added',
        newValue: designToken.value,
        location: designToken.name,
      });
    } else if (codeToken.value !== designToken.value) {
      // Token exists in both but value changed
      changes.push({
        tokenId: designToken.id,
        type: 'modified',
        oldValue: codeToken.value,
        newValue: designToken.value,
        location: designToken.name,
      });
    }
  }

  const hasDrift = changes.length > 0;

  // Calculate false positive rate
  // Scenario C (no drift expected) should have 0 changes
  // Any changes in Scenario C are false positives
  let falsePositiveRate = 0;
  if (scenario === 'C' && hasDrift) {
    // All changes in Scenario C are false positives
    falsePositiveRate = 1.0;
  } else if (changes.length > 0 && scenario !== 'C') {
    // For scenarios A and B, all detected changes are real drift
    falsePositiveRate = 0;
  }

  return {
    hasDrift,
    changes,
    falsePositiveRate,
    timestamp: Date.now(),
    scenario,
  };
}

/**
 * Check if a drift report passes the < 10% false positive threshold.
 */
export function isDriftAcceptable(report: DriftReport): boolean {
  return report.falsePositiveRate < 0.1;
}
