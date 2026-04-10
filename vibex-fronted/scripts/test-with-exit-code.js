#!/usr/bin/env node
/**
 * test-with-exit-code.js
 *
 * Wraps vitest run and guarantees non-zero exit code when tests fail.
 * Vitest 4.x has a known issue where MODULE_NOT_FOUND and similar
 * serialized errors in worker threads may result in exit code 0 despite
 * visible test failures. This wrapper detects failures from output and
 * enforces proper CI gate behavior.
 */
const { spawn } = require('child_process');

// Strip ANSI color codes for reliable pattern matching
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

const vitestArgs = process.argv.slice(2);
const child = spawn('npx', ['vitest', 'run', ...vitestArgs], {
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: __dirname,
});

let stdout = '';
let stderr = '';

child.stdout.on('data', (data) => {
  const str = data.toString();
  stdout += str;
  process.stdout.write(str);
});

child.stderr.on('data', (data) => {
  const str = data.toString();
  stderr += str;
  process.stderr.write(str);
});

child.on('close', (code) => {
  const combined = stripAnsi(stdout) + '\n' + stripAnsi(stderr);

  // Parse "Test Files X failed" from vitest summary
  const failedFiles = (combined.match(/Test Files\s+(\d+)\s+failed/i) || [])[1] || 0;
  const failedTests = (combined.match(/Tests\s+(\d+)\s+failed/i) || [])[1] || 0;

  // Detect serialized errors (vitest worker crashes / unhandled errors)
  const hasSerializedErrors = /Serialized Error/i.test(combined);

  // Detect build/transform errors
  const hasBuildErrors = /Transform failed|Build failed|MODULE_NOT_FOUND/i.test(combined);

  // Detect vitest internal errors
  const hasVitestError = /Vitest did not pass/i.test(combined);

  const hasFailure = failedFiles > 0 || failedTests > 0 ||
    hasSerializedErrors || hasBuildErrors || hasVitestError;

  if (hasFailure) {
    console.error(
      `\n[test-with-exit-code] Failure detected — forcing non-zero exit.\n` +
      `  Test files failed: ${failedFiles}\n` +
      `  Tests failed:      ${failedTests}\n` +
      `  Serialized errors: ${hasSerializedErrors ? 'yes' : 'no'}\n` +
      `  Build errors:      ${hasBuildErrors ? 'yes' : 'no'}`
    );
    process.exit(1);
  }

  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error(`[test-with-exit-code] Failed to spawn vitest: ${err.message}`);
  process.exit(1);
});
