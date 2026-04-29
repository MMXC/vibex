"use strict";
/**
 * Design Compliance Checker
 *
 * Checks whether canvas flows/components follow design system rules:
 * - Color: no hardcoded hex/rgba values (must use CSS variables)
 * - Typography: no literal font-size/font-family (must use CSS variables)
 * - Spacing: values must be multiples of 4px (4px grid system)
 *
 * @module lib/prompts/designCompliance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDesignCompliance = checkDesignCompliance;
// =============================================================================
// Constants
// =============================================================================
/** Pattern: matches hardcoded hex colors (#rgb or #rrggbb) */
const HEX_COLOR_RE = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
/** Pattern: matches rgba() literals */
const RGBA_LITERAL_RE = /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)/g;
/** Pattern: matches CSS var() references (valid — CSS variable usage) */
const CSS_VAR_RE = /var\(--[^)]+\)/g;
/** Pattern: matches numeric values (for spacing check) */
const NUMERIC_VALUE_RE = /\b(\d+(?:\.\d+)?)(px|rem|em)?\b/g;
// =============================================================================
// Color Compliance
// =============================================================================
/**
 * Check if a string contains hardcoded color values.
 * CSS variables (var(--...)) are considered compliant.
 */
function checkColorCompliance(value, nodeId, nodeName, field) {
    if (typeof value !== 'string')
        return [];
    const issues = [];
    // Find hex colors
    const hexMatches = value.match(HEX_COLOR_RE) ?? [];
    for (const match of hexMatches) {
        // Skip transparent/none
        if (match === '#0000' || match === '#00000000' || match === '#000' || match === '#000000') {
            // Check if it's used as border or shadow color (acceptable in some contexts)
            // For simplicity, flag all hex colors — design system should use CSS variables
            issues.push({
                nodeId,
                nodeName,
                field: field ?? 'unknown',
                value: match,
                message: `Hardcoded hex color '${match}' found. Use CSS variable instead.`,
            });
        }
        else {
            issues.push({
                nodeId,
                nodeName,
                field: field ?? 'unknown',
                value: match,
                message: `Hardcoded hex color '${match}' found. Use CSS variable instead.`,
            });
        }
    }
    // Find rgba literals
    const rgbaMatches = value.match(RGBA_LITERAL_RE) ?? [];
    for (const match of rgbaMatches) {
        issues.push({
            nodeId,
            nodeName,
            field: field ?? 'unknown',
            value: match,
            message: `Hardcoded rgba color '${match}' found. Use CSS variable instead.`,
        });
    }
    return issues;
}
// =============================================================================
// Typography Compliance
// =============================================================================
/**
 * Check if a string contains hardcoded typography values.
 * CSS variables are considered compliant.
 */
function checkTypographyCompliance(value, nodeId, nodeName, field) {
    if (typeof value !== 'string')
        return [];
    const issues = [];
    // Common hardcoded font families
    const hardcodedFonts = [
        'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
        'sans-serif', 'serif', 'monospace', '"Segoe UI"', 'Roboto', 'Open Sans',
    ];
    for (const font of hardcodedFonts) {
        const fontRe = new RegExp(`['\"]?${font.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}['\"]?`, 'gi');
        if (fontRe.test(value)) {
            issues.push({
                nodeId,
                nodeName,
                field: field ?? 'unknown',
                value: font,
                message: `Hardcoded font family '${font}' found. Use CSS variable instead.`,
            });
        }
    }
    // Font size literals (e.g., "16px", "1.5rem") without var()
    const fontSizeRe = /(?:fontSize|font-size|fontSizeRem|font-size-rem)\s*[:=]\s*['"]?(\d+(?:\.\d+)?)(px|rem|em)['"]?/gi;
    let match;
    while ((match = fontSizeRe.exec(value)) !== null) {
        if (!value.substring(match.index, match.index + 50).includes('var(')) {
            issues.push({
                nodeId,
                nodeName,
                field: field ?? 'unknown',
                value: match[0],
                message: `Hardcoded font-size '${match[0]}' found. Use CSS variable instead.`,
            });
        }
    }
    return issues;
}
// =============================================================================
// Spacing Compliance
// =============================================================================
/**
 * Check if numeric spacing values are multiples of 4.
 * 4px grid system: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64...
 */
function checkSpacingCompliance(value, nodeId, nodeName, field) {
    if (typeof value !== 'number')
        return [];
    const issues = [];
    const spacingValue = value;
    // Exclude 0 (always valid) and values that are already multiples of 4
    if (spacingValue !== 0 && spacingValue % 4 !== 0) {
        // Find the nearest valid 4px grid value
        const nearest = Math.round(spacingValue / 4) * 4;
        issues.push({
            nodeId,
            nodeName,
            field: field ?? 'unknown',
            value: spacingValue,
            expectedMultiple: 4,
            message: `Spacing value ${spacingValue}px is not a multiple of 4. Use ${nearest}px instead.`,
        });
    }
    return issues;
}
/**
 * Recursively extract strings from an object for color/typography checks.
 */
function extractStrings(obj, nodeId, nodeName) {
    const results = [];
    if (obj === null || obj === undefined)
        return results;
    if (typeof obj === 'string') {
        results.push({ field: 'value', value: obj });
    }
    else if (typeof obj === 'number') {
        // Number — might be a spacing value
        results.push({ field: 'numeric', value: String(obj) });
    }
    else if (Array.isArray(obj)) {
        for (const item of obj) {
            results.push(...extractStrings(item, nodeId, nodeName));
        }
    }
    else if (typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
            if (typeof v === 'string') {
                results.push({ field: k, value: v });
            }
            else if (typeof v === 'number') {
                results.push({ field: k, value: String(v) });
            }
            else if (Array.isArray(v)) {
                results.push(...extractStrings(v, nodeId, nodeName));
            }
        }
    }
    return results;
}
// =============================================================================
// Main API
// =============================================================================
const DEFAULT_RULES = {
    checkColors: true,
    checkTypography: true,
    checkSpacing: true,
};
/**
 * Check design compliance for a flow or component.
 *
 * @param flow - The flow/component data to check
 * @param rules - Which rules to apply (default: all)
 * @returns ComplianceResult with pass/fail for each category
 */
function checkDesignCompliance(flow, rules = {}) {
    const r = { ...DEFAULT_RULES, ...rules };
    const nodeId = flow.id ?? 'unknown';
    const nodeName = flow.name;
    const colorIssues = [];
    const typographyIssues = [];
    const spacingIssues = [];
    const strings = extractStrings(flow, nodeId, nodeName);
    for (const { field, value } of strings) {
        if (typeof value === 'string') {
            if (r.checkColors) {
                colorIssues.push(...checkColorCompliance(value, nodeId, nodeName, field));
            }
            if (r.checkTypography) {
                typographyIssues.push(...checkTypographyCompliance(value, nodeId, nodeName, field));
            }
        }
    }
    // Check spacing on numeric values
    for (const { field, value } of strings) {
        const num = Number(value);
        if (!isNaN(num) && r.checkSpacing) {
            spacingIssues.push(...checkSpacingCompliance(num, nodeId, nodeName, field));
        }
    }
    return {
        colors: colorIssues.length === 0,
        colorIssues,
        typography: typographyIssues.length === 0,
        typographyIssues,
        spacing: spacingIssues.length === 0,
        spacingIssues,
    };
}
