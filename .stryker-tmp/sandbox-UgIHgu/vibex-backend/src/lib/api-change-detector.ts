/**
 * API Change Detector
 * Compares two OpenAPI specs and identifies breaking changes
 */
// @ts-nocheck


import fs from 'fs';
import path from 'path';

interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, {
    summary?: string;
    tags?: string[];
    parameters?: object[];
    requestBody?: object;
    responses?: object;
  }>>;
  components?: {
    schemas?: Record<string, object>;
  };
}

type ChangeType = 'BREAKING' | 'NON_BREAKING' | 'INFO';

interface Change {
  type: ChangeType;
  category: string;
  path: string;
  description: string;
  before?: string;
  after?: string;
}

interface ChangeReport {
  baseline: string;
  current: string;
  timestamp: string;
  summary: {
    breaking: number;
    nonBreaking: number;
    info: number;
  };
  changes: Change[];
}

/**
 * Load OpenAPI spec from file
 */
function loadSpec(filePath: string): OpenAPISpec {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Compare two OpenAPI specs and find changes
 */
function detectChanges(baseline: OpenAPISpec, current: OpenAPISpec): Change[] {
  const changes: Change[] = [];

  // Compare paths
  const baselinePaths = Object.keys(baseline.paths);
  const currentPaths = Object.keys(current.paths);

  // Find removed paths (Breaking)
  for (const path of baselinePaths) {
    if (!currentPaths.includes(path)) {
      changes.push({
        type: 'BREAKING',
        category: 'PATH_REMOVED',
        path,
        description: `API endpoint removed: ${path}`,
      });
    }
  }

  // Find added paths (Non-breaking)
  for (const path of currentPaths) {
    if (!baselinePaths.includes(path)) {
      changes.push({
        type: 'NON_BREAKING',
        category: 'PATH_ADDED',
        path,
        description: `New API endpoint added: ${path}`,
      });
    }
  }

  // Compare methods within paths
  for (const path of baselinePaths) {
    if (!currentPaths.includes(path)) continue;

    const baselineMethods = Object.keys(baseline.paths[path] || {});
    const currentMethods = Object.keys(current.paths[path] || {});

    // Find removed methods (Breaking)
    for (const method of baselineMethods) {
      if (!currentMethods.includes(method)) {
        changes.push({
          type: 'BREAKING',
          category: 'METHOD_REMOVED',
          path: `${path} [${method}]`,
          description: `HTTP method removed: ${method.toUpperCase()} ${path}`,
        });
      }
    }

    // Compare request body (Breaking changes)
    for (const method of baselineMethods) {
      if (!currentMethods.includes(method)) continue;

      const baselineOp = baseline.paths[path][method];
      const currentOp = current.paths[path][method];

      // Check request body changes
      if (baselineOp.requestBody && !currentOp.requestBody) {
        changes.push({
          type: 'BREAKING',
          category: 'REQUEST_BODY_REMOVED',
          path: `${path} [${method}]`,
          description: `Request body removed from ${method.toUpperCase()} ${path}`,
        });
      }

      // Check response changes
      const baselineResponses = Object.keys(baselineOp.responses || {});
      const currentResponses = Object.keys(currentOp.responses || {});

      // Check for removed response codes (Breaking)
      for (const code of baselineResponses) {
        if (!currentResponses.includes(code)) {
          const is5xx = code.startsWith('5');
          changes.push({
            type: is5xx ? 'NON_BREAKING' : 'BREAKING',
            category: 'RESPONSE_REMOVED',
            path: `${path} [${method}]`,
            description: `Response code ${code} removed from ${method.toUpperCase()} ${path}`,
            before: code,
            after: undefined,
          });
        }
      }
    }
  }

  // Compare schemas
  const baselineSchemas = baseline.components?.schemas || {};
  const currentSchemas = current.components?.schemas || {};

  const baselineSchemaNames = Object.keys(baselineSchemas);
  const currentSchemaNames = Object.keys(currentSchemas);

  // Find removed schemas (Breaking)
  for (const name of baselineSchemaNames) {
    if (!currentSchemaNames.includes(name)) {
      changes.push({
        type: 'BREAKING',
        category: 'SCHEMA_REMOVED',
        path: `#/components/schemas/${name}`,
        description: `Schema removed: ${name}`,
      });
    }
  }

  // Find added schemas (Non-breaking)
  for (const name of currentSchemaNames) {
    if (!baselineSchemaNames.includes(name)) {
      changes.push({
        type: 'NON_BREAKING',
        category: 'SCHEMA_ADDED',
        path: `#/components/schemas/${name}`,
        description: `New schema added: ${name}`,
      });
    }
  }

  // Compare schema properties (Breaking changes)
  for (const name of baselineSchemaNames) {
    if (!currentSchemaNames.includes(name)) continue;

    const baselineSchema = baselineSchemas[name] as any;
    const currentSchema = currentSchemas[name] as any;

    if (baselineSchema.type === 'object' && currentSchema.type === 'object') {
      const baselineProps = Object.keys(baselineSchema.properties || {});
      const currentProps = Object.keys(currentSchema.properties || {});

      // Required properties added (Breaking)
      const newRequired = (baselineSchema.required || []).filter(
        (r: string) => !(currentSchema.required || []).includes(r)
      );
      for (const prop of newRequired) {
        changes.push({
          type: 'BREAKING',
          category: 'REQUIRED_PROPERTY_ADDED',
          path: `#/components/schemas/${name}/${prop}`,
          description: `Required property added to schema: ${name}.${prop}`,
        });
      }

      // Properties removed (Breaking)
      for (const prop of baselineProps) {
        if (!currentProps.includes(prop)) {
          changes.push({
            type: 'BREAKING',
            category: 'PROPERTY_REMOVED',
            path: `#/components/schemas/${name}/${prop}`,
            description: `Property removed from schema: ${name}.${prop}`,
          });
        }
      }
    }
  }

  return changes;
}

/**
 * Generate change report
 */
function generateReport(
  baselinePath: string,
  currentPath: string,
  changes: Change[]
): ChangeReport {
  const summary = {
    breaking: changes.filter(c => c.type === 'BREAKING').length,
    nonBreaking: changes.filter(c => c.type === 'NON_BREAKING').length,
    info: changes.filter(c => c.type === 'INFO').length,
  };

  return {
    baseline: baselinePath,
    current: currentPath,
    timestamp: new Date().toISOString(),
    summary,
    changes,
  };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node api-change-detector.js <baseline.json> <current.json> [output.json]');
    console.log('');
    console.log('Example:');
    console.log('  node api-change-detector.js openapi.json baseline.yaml change-report.json');
    process.exit(1);
  }

  const [baselinePath, currentPath, outputPath] = args;

  console.log(`📊 Comparing OpenAPI specs...`);
  console.log(`  Baseline: ${baselinePath}`);
  console.log(`  Current:  ${currentPath}`);

  try {
    const baseline = loadSpec(baselinePath);
    const current = loadSpec(currentPath);

    const changes = detectChanges(baseline, current);
    const report = generateReport(baselinePath, currentPath, changes);

    console.log('');
    console.log(`📈 Change Summary:`);
    console.log(`  🔴 Breaking Changes:     ${report.summary.breaking}`);
    console.log(`  🟢 Non-Breaking Changes: ${report.summary.nonBreaking}`);
    console.log(`  🔵 Info Changes:        ${report.summary.info}`);

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      console.log(`\n✅ Report saved to: ${outputPath}`);
    }

    // Exit with error code if breaking changes found
    if (report.summary.breaking > 0) {
      console.log(`\n⚠️  Found ${report.summary.breaking} breaking changes!`);
      process.exit(1);
    }

    console.log(`\n✅ No breaking changes detected.`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

export { detectChanges, generateReport, type Change, type ChangeReport, type ChangeType };
