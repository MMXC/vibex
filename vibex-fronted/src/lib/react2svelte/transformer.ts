/**
 * React JSX → Svelte 4 SFC transformer
 * Performs basic code transformations for component conversion
 */

import {
  React2SvelteMappings,
  type ReactComponentName,
} from './mappings';

export interface TransformResult {
  /** Transformed Svelte SFC code */
  svelteCode: string;
  /** Transformation warnings */
  warnings: string[];
  /** Whether transformation was fully supported */
  isSupported: boolean;
}

/**
 * Common React → Svelte pattern replacements
 */
const PATTERN_REPLACEMENTS: Array<[RegExp, string]> = [
  // JSX comments
  [/\{[\/*][\s\S]*?[\/*]\}/g, ''],

  // className → class
  [/\bclassName\s*=/g, 'class='],

  // Event handlers: onClick → on:click, onChange → on:change, etc.
  [/\bonClick\s*=/g, 'on:click='],
  [/\bonChange\s*=/g, 'on:change='],
  [/\bonInput\s*=/g, 'on:input='],
  [/\bonSubmit\s*=/g, 'on:submit='],
  [/\bonKeyDown\s*=/g, 'on:keydown='],
  [/\bonKeyUp\s*=/g, 'on:keyup='],
  [/\bonFocus\s*=/g, 'on:focus='],
  [/\bonBlur\s*=/g, 'on:blur='],
  [/\bonMouseEnter\s*=/g, 'on:mouseenter='],
  [/\bonMouseLeave\s*=/g, 'on:mouseleave='],

  // React specific imports
  [/import\s+React.*?;/g, ''],
  [/import\s+\{[^}]*\}\s+from\s+'react';/g, ''],

  // Fragment shorthand
  [/<>\s*/g, ''],
  [/\s*<\/\s*>/g, ''],
];

/**
 * Transform React JSX code to Svelte
 *
 * This handles basic patterns. Production use would require a proper AST-based transformation.
 */
export function transformReactToSvelte(
  reactCode: string,
  componentName: ReactComponentName | string
): TransformResult {
  const mapping = React2SvelteMappings[componentName as keyof typeof React2SvelteMappings];
  const warnings: string[] = [];

  if (!mapping) {
    warnings.push(
      `No mapping for component "${componentName}". Code passed through unchanged.`
    );
    return {
      svelteCode: reactCode,
      warnings,
      isSupported: false,
    };
  }

  let svelteCode = reactCode;

  // Apply pattern replacements
  for (const [pattern, replacement] of PATTERN_REPLACEMENTS) {
    svelteCode = svelteCode.replace(pattern, replacement);
  }

  // Apply component-specific prop mappings
  for (const [reactProp, svelteProp] of Object.entries(mapping.props)) {
    if (svelteProp.startsWith('on:')) {
      // Event handler
      svelteCode = svelteCode.replace(
        new RegExp(`\\b${reactProp}\\s*=`, 'g'),
        `${svelteProp}=`
      );
    } else if (
      'binding' in mapping &&
      (mapping as { binding?: string }).binding === 'bind:value' &&
      reactProp === 'value'
    ) {
      // Svelte bind:value directive - value={v} → bind:value={v}
      svelteCode = svelteCode.replace(
        new RegExp(`\\bvalue\\s*=\\{`, 'g'),
        'bind:value={'
      );
    } else {
      // Regular prop rename
      svelteCode = svelteCode.replace(
        new RegExp(`\\b${reactProp}\\s*=`, 'g'),
        `${svelteProp}=`
      );
    }
  }

  // Handle eventMappings for components with non-standard event names
  if ('eventMappings' in mapping && mapping.eventMappings) {
    for (const [reactEvent, svelteEvent] of Object.entries(
      mapping.eventMappings as Record<string, string>
    )) {
      svelteCode = svelteCode.replace(
        new RegExp(`\\b${reactEvent}\\s*=`, 'g'),
        `${svelteEvent}=`
      );
    }
  }

  // Warn about children → slot conversion if applicable
  if (mapping.children === '<slot />') {
    warnings.push(
      'React children prop converted to <slot />. Verify slot placement in generated SFC.'
    );
  }

  return {
    svelteCode,
    warnings,
    isSupported: true,
  };
}

/**
 * Generate a complete Svelte Single File Component (SFC) from React JSX
 */
export function generateSvelteSFC(
  reactCode: string,
  componentName: ReactComponentName
): string {
  const { svelteCode, warnings } = transformReactToSvelte(reactCode, componentName);

  const warningComment =
    warnings.length > 0
      ? `\n<!-- ⚠️ Warnings: ${warnings.join('; ')} -->`
      : '';

  return `<!-- Auto-converted from React to Svelte 4 -->
<!-- Component: ${componentName}${warningComment} -->
<script lang="ts">
// Component logic here
// React props → Svelte props (passed via <component {...props} />)
</script>

<template>
${svelteCode}
</template>

<style scoped>
/* Component styles scoped to this component */
</style>
`;
}

/**
 * Convert a React component string to Svelte SFC
 * Main entry point for the transformer
 */
export function reactComponentToSvelte(
  reactCode: string,
  componentName: ReactComponentName
): string {
  return generateSvelteSFC(reactCode, componentName);
}
