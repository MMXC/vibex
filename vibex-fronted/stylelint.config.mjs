/**
 * stylelint configuration
 *
 * E2: CSS build quality gate
 * - no-invalid-position-declaration: catch orphaned CSS properties
 *
 * Excludes: *.min.css (third-party minified CSS)
 */

export default {
  rules: {
    // E2: Detect orphaned CSS properties (not inside any rule)
    'no-invalid-position-declaration': true,
  },
  ignoreFiles: ['**/*.min.css'],
};
