/**
 * ESLint Rule: no-static-export
 * Prevents static export issues for dynamic routes
 *
 * Usage: Add to eslint.config.mjs:
 *   import noStaticExport from './eslint-rules/no-static-export.js'
 *   { rules: { 'no-static-export': 'error' } }
 */
// @ts-nocheck


module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent static export issues for dynamic routes',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowList: {
            type: 'array',
            items: { type: 'string' },
            description: 'Routes that are allowed to be statically exported',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      dynamicRoute: 'Dynamic route "{{ route }}" cannot be statically exported',
      noDefaultExport: 'Page must have a default export for Next.js',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const allowList = options.allowList || [];

    return {
      // Check for dynamic route directories
      Program(node) {
        const filename = context.getFilename();
        const sourceDir = context.getCwd();

        // Extract route from filename
        const route = filename
          .replace(sourceDir, '')
          .replace(/^\/src\/app/, '')
          .replace(/\/page\.(tsx|ts|jsx|js)$/, '')
          .replace(/\\/g, '/');

        // Skip non-page files
        if (!filename.includes('/page.')) return;

        // Check if route matches dynamic patterns
        const dynamicPatterns = [
          /\[[^\]]+\]/, // [id]
          /\[\.\.\.[^\]]+\]/, // [...slug]
          /\[\[[^\]]+\]\]/, // [[slug]]
        ];

        const isDynamic = dynamicPatterns.some((pattern) =>
          pattern.test(route)
        );

        // Check allowlist
        const isAllowed = allowList.some(
          (allowed) => route.startsWith(allowed) || route === allowed
        );

        if (isDynamic && !isAllowed) {
          context.report({
            node,
            messageId: 'dynamicRoute',
            data: { route },
          });
        }
      },
    };
  },
};
