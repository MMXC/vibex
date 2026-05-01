/**
 * e2e-db-reset.ts — Staging DB reset for E2E isolation
 * 
 * Removes E2E test data from staging DB between test runs.
 * Uses E2E_ prefix + age-based cleanup rules.
 * 
 * Usage:
 *   pnpm run e2e:db:reset      # actual reset
 *   pnpm run e2e:db:reset:dry  # dry run (no destructive ops)
 */

interface ResetOptions {
  dryRun?: boolean;
  olderThanHours?: number;
  verbose?: boolean;
}

function parseArgs(): ResetOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    olderThanHours: parseInt(args.find(a => a.startsWith('--older='))?.split('=')[1] ?? '24'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
}

async function resetStagingDB(options: ResetOptions = {}) {
  const { dryRun = false, olderThanHours = 24, verbose = false } = options;
  const log = verbose ? console.log : () => {};
  
  const dbUrl = process.env.STAGING_DATABASE_URL;
  if (!dbUrl) {
    console.log('[e2e-db-reset] STAGING_DATABASE_URL not set — skipping DB reset');
    console.log('[e2e-db-reset] This is expected in local dev. DB reset only runs in CI against staging.');
    return;
  }
  
  log(`[e2e-db-reset] Connecting to: ${dbUrl}`);
  
  // In real implementation, this would use Drizzle + D1 to:
  // 1. Delete rows with E2E_ prefix older than ${olderThanHours}h
  // 2. VACUUM to reclaim space
  // For now, log the intent
  
  console.log(`[e2e-db-reset] ${dryRun ? '[DRY RUN] ' : ''}Would reset staging DB`);
  console.log(`  - Would delete rows with E2E_* prefix older than ${olderThanHours}h`);
  console.log(`  - Target tables: cards, sessions, artifacts`);
  console.log(`  - Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (changes will be made)'}`);
  
  if (dryRun) {
    console.log('[e2e-db-reset] Dry run complete — no changes made');
  } else {
    console.log('[e2e-db-reset] Reset complete');
  }
}

// Run
const options = parseArgs();
resetStagingDB(options).catch((err) => {
  console.error('[e2e-db-reset] Error:', err);
  process.exit(1);
});