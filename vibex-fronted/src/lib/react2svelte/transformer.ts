/**
 * React → Svelte 4 transformer
 * E5-T2: reactComponentToSvelte generator
 *
 * Transforms React JSX code to Svelte 4 Single File Components.
 * Uses string replacement patterns (not AST-based) for demonstration.
 * E5-C3: Generated code must be Svelte 4 compatible (no runes like $state/$derived)
 * E5-C5: Generated code must not include React runtime imports
 */

import { React2SvelteMappings, type SvelteComponentName } from './mappings';

export interface TransformResult {
  /** Transformed Svelte SFC code */
  svelteCode: string;
  /** Transformation warnings (unsupported patterns) */
  warnings: string[];
  /** Whether transformation was fully supported */
  isSupported: boolean;
  /** File extension for preview */
  fileExtension: string;
}

/**
 * React → Svelte pattern replacements
 * E5-C2: onClick → on:click, onChange → bind:value
 * E5-C4: children → <slot />
 */
const PATTERN_REPLACEMENTS: Array<[RegExp, string]> = [
  // Fragment shorthand <> → nothing (Svelte uses <slot>)
  [/<>\s*/g, ''],
  [/\s*<\/\s*>/g, ''],

  // className → class (E5-C4)
  [/\bclassName\s*=/g, 'class='],

  // Event handlers: onClick → on:click
  [/\bonClick\s*=/g, 'on:click='],
  [/\bonMouseEnter\s*=/g, 'on:mouseenter='],
  [/\bonMouseLeave\s*=/g, 'on:mouseleave='],
  [/\bonFocus\s*=/g, 'on:focus='],
  [/\bonBlur\s*=/g, 'on:blur='],
  [/\bonKeyDown\s*=/g, 'on:keydown='],
  [/\bonKeyUp\s*=/g, 'on:keyup='],
  [/\bonSubmit\s*=/g, 'on:submit='],
  // Note: onChange is handled per-component (Input uses bind:value, others use on:change)

  // style={{ width: 100 }} → style="width: 100px"
  // Matches style={{ prop: value }} patterns
  [/style=\{\{\s*"([^"]+)"\s*\}\}/g, 'style="$1"'],
  [/style=\{\{\s*'([^']+)'\s*\}\}/g, 'style="$1"'],
  // style={{ width: n }} → style="width: npx" (numeric values)
  [/style=\{\{\s*width:\s*(\d+)\s*\}\}/g, 'style="width: $1px"'],
  [/style=\{\{\s*height:\s*(\d+)\s*\}\}/g, 'style="height: $1px"'],
  // Generic style={{ ... }} — leave as is but warn
];

const REACT_RUNTIME_IMPORTS: RegExp[] = [
  /import\s+React\s+from\s+'react';/g,
  /import\s+\{[^}]*\}\s+from\s+'react';/g,
  /import\s+\*\s+as\s+React\s+from\s+'react';/g,
];

/**
 * Remove React runtime imports from generated code
 * E5-C5: No React runtime dependencies in generated .svelte files
 */
function stripReactImports(code: string): { code: string; hadReact: boolean } {
  let hadReact = false;
  for (const pattern of REACT_RUNTIME_IMPORTS) {
    if (pattern.test(code)) {
      hadReact = true;
      code = code.replace(pattern, '');
    }
  }
  return { code: code.trim(), hadReact };
}

/**
 * Transform inline style objects to CSS strings
 */
function transformStyleObjects(code: string): string {
  // Handle style={{ prop: value, prop: value }} → style="prop: value; prop: value"
  const styleObjectPattern = /style=\{\{\s*([\s\S]*?)\s*\}\}/g;

  return code.replace(styleObjectPattern, (_match, styleContent) => {
    // Remove quotes from string values in style objects
    let css = styleContent
      .replace(/"/g, '')
      .replace(/'/g, '')
      .replace(/,\s*/g, '; ')
      .replace(/;\s*;/g, ';') // Clean up double semicolons
      .trim();

    // Add px to numeric values that need it
    css = css.replace(/(\d+)(?!px|%|em|rem|vh|vw|deg|s)/g, '$1px');

    return `style="${css}"`;
  });
}

/**
 * Transform React JSX children to Svelte slot
 * E5-C4: React children prop → Svelte <slot /> element
 */
function transformChildren(code: string, componentName: string): string {
  const mapping = React2SvelteMappings[componentName];
  if (!mapping?.usesSlot) return code;

  // {children} → <slot />
  code = code.replace(/\{children\}/g, '<slot />');

  // children={<SomeComponent />} → <slot name="default"><SomeComponent /></slot>
  code = code.replace(
    /children=\{\s*([\s\S]*?)\s*\}/g,
    '<slot>$1</slot>'
  );

  return code;
}

/**
 * Transform React JSX code to Svelte 4 SFC
 */
export function reactComponentToSvelte(
  reactCode: string,
  componentName: string
): TransformResult {
  const mapping = React2SvelteMappings[componentName as keyof typeof React2SvelteMappings];
  const warnings: string[] = [];

  if (!mapping) {
    warnings.push(`No mapping for component "${componentName}". Code passed through unchanged.`);
    return {
      svelteCode: reactCode,
      warnings,
      isSupported: false,
      fileExtension: 'svelte',
    };
  }

  let svelteCode = reactCode;

  // E5-C5: Strip React runtime imports
  const stripped = stripReactImports(svelteCode);
  svelteCode = stripped.code;
  if (stripped.hadReact) {
    warnings.push('Removed React runtime imports from generated Svelte code.');
  }

  // E5-C3: Check for Svelte 5 runes (must not appear)
  const svelte5Runes = /\$(state|derived|effect|props|bindable|rune)/;
  if (svelte5Runes.test(svelteCode)) {
    warnings.push('Svelte 5 rune syntax detected. Code will be converted to Svelte 4 compatible syntax.');
    svelteCode = svelteCode.replace(/\$(\w+)/g, (_m, rune) => {
      // Convert $state → let, $derived → $:, $effect → onMount/svelte:onmount
      if (rune === 'state') return 'let';
      if (rune === 'derived') return '$:';
      if (rune === 'effect') return '// svelte:action needed';
      return rune;
    });
  }

  // Apply component-specific event mappings FIRST (before generic replacements)
  // This ensures e.g. onChange → bind:value (for Input) before onChange → on:change
  for (const [reactEvent, svelteEvent] of Object.entries(mapping.events)) {
    svelteCode = svelteCode.replace(
      new RegExp(`\\b${reactEvent}\\s*=`,'g'),
      `${svelteEvent}=`
    );
  }

  // Apply component-specific prop mappings
  for (const [reactProp, svelteProp] of Object.entries(mapping.props)) {
    if (svelteProp !== reactProp) {
      svelteCode = svelteCode.replace(
        new RegExp(`\\b${reactProp}\\s*=`,'g'),
        `${svelteProp}=`
      );
    }
  }

  // Apply generic pattern replacements
  for (const [pattern, replacement] of PATTERN_REPLACEMENTS) {
    svelteCode = svelteCode.replace(pattern, replacement);
  }

  // Transform style objects
  svelteCode = transformStyleObjects(svelteCode);

  // Transform children to slot
  svelteCode = transformChildren(svelteCode, componentName);

  // Warn about self-closing tags that Svelte can't handle
  if (/<(Input|Text)[^>]*\/\s*>/.test(svelteCode)) {
    warnings.push('Self-closing tags may need conversion for Svelte 4.');
  }

  return {
    svelteCode,
    warnings,
    isSupported: warnings.filter(w => !w.includes('No mapping')).length === 0,
    fileExtension: 'svelte',
  };
}

/**
 * Generate a complete Svelte 4 SFC from React code
 * E5-C3: Output must be Svelte 4 compatible
 */
export function generateSvelteSFC(
  reactCode: string,
  componentName: string,
  props: string[] = []
): string {
  const { svelteCode, warnings } = reactComponentToSvelte(reactCode, componentName);

  const exportProps = props.length > 0
    ? `export let ${props.join(': any; ')}: any;`
    : '';

  const warningComment = warnings.length > 0
    ? `\n  // ⚠️ Warnings: ${warnings.join('; ')}`
    : '';

  return `<script lang="ts">
${exportProps}${warningComment}
</script>

<svelte:head>
  <!-- Auto-converted from React to Svelte 4 -->
</svelte:head>

${svelteCode}

<style scoped>
/* Component styles */
</style>
`;
}
