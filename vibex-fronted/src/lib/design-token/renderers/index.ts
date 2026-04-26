/**
 * Design Token Renderers — E1 Design-to-Code Pipeline
 *
 * Compiles Handlebars templates with token data and renders them into
 * CSS, SCSS, JS/TS, and JSON formats.
 *
 * @module lib/design-token/renderers
 */

import Handlebars from 'handlebars';
import { validateTokenStructure } from '../validation';

// Template sources — imported as raw strings via ?raw or inline
import cssVariablesTemplate from '../templates/css-variables.hbs';
import jsConstantsTemplate from '../templates/js-constants.hbs';

interface RenderContext {
  tokens: Record<string, unknown>;
  schemaVersion: string;
  exportedAt: string;
}

/**
 * Compile a Handlebars template string with context.
 */
function compile(template: string, context: RenderContext): string {
  const hbTemplate = Handlebars.compile(template, { strict: true });
  return hbTemplate(context);
}

/**
 * Validate the token schema before rendering.
 * Throws if tokens do not conform to the expected structure.
 */
function requireValidTokens(tokens: unknown, formatName: string): void {
  if (!validateTokenStructure(tokens)) {
    throw new Error(
      `[render${formatName}] Invalid token structure: expected a non-empty object, got ${typeof tokens}`
    );
  }
}

/**
 * Render tokens as CSS custom properties.
 * Output includes the schema version hash in a comment header.
 */
export function renderCSS(
  tokens: Record<string, unknown>,
  schemaVersion = '0.0.0',
  exportedAt = new Date().toISOString()
): string {
  requireValidTokens(tokens, 'CSS');
  return compile(cssVariablesTemplate, {
    tokens,
    schemaVersion,
    exportedAt,
  });
}

/**
 * Render tokens as SCSS variables.
 * SCSS uses $ prefix for variables instead of CSS -- prefix.
 */
export function renderSCSS(
  tokens: Record<string, unknown>,
  schemaVersion = '0.0.0',
  exportedAt = new Date().toISOString()
): string {
  requireValidTokens(tokens, 'SCSS');

  const scssEntries = Object.entries(tokens)
    .map(([key, value]) => {
      const v = (value as Record<string, unknown>)['value'] ?? value;
      return `$${key.replace(/-/g, '_')}: ${v};`;
    })
    .join('\n');

  return [
    `// VibeX Design Tokens (SCSS) | schema: ${schemaVersion} | exported: ${exportedAt}`,
    '',
    scssEntries,
  ].join('\n');
}

/**
 * Render tokens as JS/TS constants.
 * Output uses ES module export syntax with const declarations.
 */
export function renderJS(
  tokens: Record<string, unknown>,
  schemaVersion = '0.0.0',
  exportedAt = new Date().toISOString()
): string {
  requireValidTokens(tokens, 'JS');

  // Prepare tokens for the Handlebars template
  const templateTokens: Record<string, Record<string, unknown>> = {};
  for (const [key, value] of Object.entries(tokens)) {
    const v = (value as Record<string, unknown>)['value'] ?? value;
    templateTokens[key] = {
      value: typeof v === 'string' ? v : JSON.stringify(v),
      type: typeof v,
      name: (value as Record<string, unknown>)['name'] ?? key,
      description: (value as Record<string, unknown>)['description'] ?? '',
    };
  }

  return compile(jsConstantsTemplate, {
    tokens: templateTokens,
    schemaVersion,
    exportedAt,
  });
}

/**
 * Render tokens as a JSON file.
 * Includes schema version metadata at the top level.
 */
export function renderJSON(
  tokens: Record<string, unknown>,
  schemaVersion = '0.0.0',
  exportedAt = new Date().toISOString()
): string {
  requireValidTokens(tokens, 'JSON');
  return JSON.stringify(
    {
      $schema: `https://vibex.dev/tokens/schema/${schemaVersion}`,
      exportedAt,
      tokens,
    },
    null,
    2
  );
}
