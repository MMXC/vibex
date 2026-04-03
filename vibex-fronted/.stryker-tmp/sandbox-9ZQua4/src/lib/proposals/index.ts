/**
 * Proposals Library — Parse and validate agent proposal markdown files.
 */
// @ts-nocheck


export { parseProposalsFile, listProposals } from './parser';
export type { Proposal, ParseResult, ListResult } from './parser';
export { validateProposals } from './validator';
export type { ValidationError, ValidationResult } from './validator';
