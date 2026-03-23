/**
 * Proposal Validator Tests (T1.2)
 * PRD Acceptance: expect(validate()).toReturn({ valid: boolean, errors: [...] })
 */

import { validateProposals, ValidationResult } from './validator';
import type { Proposal } from './parser';

describe('Proposal Validator (T1.2)', () => {
  const validProposal: Proposal = {
    id: 'DEV-1',
    agent: 'dev',
    date: '20260323',
    title: 'TypeScript Type Safety Improvement',
    description: 'Add strict TypeScript mode to reduce runtime errors',
    improvement: 'Use strict: true in tsconfig',
    benefit: 'Reduce runtime errors by 50%',
    effort: 'M',
    priority: 'P1',
    tags: ['typescript', 'quality'],
    raw: '...',
  };

  describe('validateProposals', () => {
    it('should return valid result for valid proposals', () => {
      const result = validateProposals([validProposal]);
      // T1.2 acceptance: expect(validate()).toReturn({ valid: boolean, errors: [...] })
      expect(result).toMatchObject({
        valid: true,
        total: 1,
        validCount: 1,
        invalidCount: 0,
        errors: [],
      });
    });

    it('should mark valid proposals as valid', () => {
      const result = validateProposals([validProposal]);
      expect(result.valid).toBe(true);
      expect(result.validCount).toBe(1);
      expect(result.invalidCount).toBe(0);
    });

    it('should return no errors for valid proposals', () => {
      const result = validateProposals([validProposal]);
      const errorErrors = result.errors.filter((e) => e.severity === 'error');
      expect(errorErrors).toHaveLength(0);
    });

    it('should detect missing title', () => {
      const proposal: Proposal = { ...validProposal, title: '' };
      const result = validateProposals([proposal]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('should detect missing description', () => {
      const proposal: Proposal = { ...validProposal, description: '' };
      const result = validateProposals([proposal]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'description')).toBe(true);
    });

    it('should detect missing priority', () => {
      const proposal: Proposal = { ...validProposal, priority: '' };
      const result = validateProposals([proposal]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'priority')).toBe(true);
    });

    it('should detect invalid priority values', () => {
      const proposal: Proposal = { ...validProposal, priority: 'P5' };
      const result = validateProposals([proposal]);
      expect(result.errors.some((e) => e.field === 'priority' && e.message.includes('P5'))).toBe(true);
    });

    it('should warn on unusual effort values', () => {
      const proposal: Proposal = { ...validProposal, effort: 'unknown' };
      const result = validateProposals([proposal]);
      expect(result.errors.some((e) => e.field === 'effort' && e.severity === 'warning')).toBe(true);
    });

    it('should accept valid effort values', () => {
      for (const effort of ['S', 'M', 'L', 'XL', '1d', '2d', '1w']) {
        const proposal: Proposal = { ...validProposal, effort };
        const result = validateProposals([proposal]);
        const effortErrors = result.errors.filter(
          (e) => e.field === 'effort' && e.severity === 'error'
        );
        expect(effortErrors).toHaveLength(0);
      }
    });

    it('should detect title too short', () => {
      const proposal: Proposal = { ...validProposal, title: 'Hi' };
      const result = validateProposals([proposal]);
      expect(result.errors.some((e) => e.field === 'title' && e.message.includes('too short'))).toBe(true);
    });

    it('should detect title too long', () => {
      const proposal: Proposal = { ...validProposal, title: 'A'.repeat(201) };
      const result = validateProposals([proposal]);
      expect(result.errors.some((e) => e.field === 'title' && e.message.includes('too long'))).toBe(true);
    });

    it('should detect description too short', () => {
      const proposal: Proposal = { ...validProposal, description: 'Short' };
      const result = validateProposals([proposal]);
      expect(result.errors.some((e) => e.field === 'description' && e.message.includes('too short'))).toBe(true);
    });

    it('should warn on too many tags', () => {
      const proposal: Proposal = {
        ...validProposal,
        tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
      };
      const result = validateProposals([proposal]);
      expect(result.errors.some((e) => e.field === 'tags' && e.message.includes('Too many'))).toBe(true);
    });

    it('should handle empty proposal list', () => {
      const result = validateProposals([]);
      expect(result.valid).toBe(true);
      expect(result.total).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle mixed valid and invalid proposals', () => {
      const invalid: Proposal = { ...validProposal, title: '' };
      const result = validateProposals([validProposal, invalid]);
      expect(result.total).toBe(2);
      expect(result.validCount).toBe(1);
      expect(result.invalidCount).toBe(1);
      expect(result.valid).toBe(false);
    });

    it('should include proposalId in all errors', () => {
      const proposal: Proposal = { ...validProposal, title: '' };
      const result = validateProposals([proposal]);
      for (const error of result.errors) {
        expect(error.proposalId).toBe('DEV-1');
      }
    });

    it('should distinguish error vs warning severity', () => {
      const proposal: Proposal = {
        ...validProposal,
        title: '',
        effort: 'unknown',
      };
      const result = validateProposals([proposal]);
      const errorSeverity = result.errors.filter((e) => e.severity === 'error');
      const warnSeverity = result.errors.filter((e) => e.severity === 'warning');
      expect(errorSeverity.length).toBeGreaterThan(0);
      expect(warnSeverity.length).toBeGreaterThan(0);
    });
  });

  describe('PRD Acceptance (T1.2)', () => {
    it('should return { valid: boolean, errors: [...] } format', () => {
      const result = validateProposals([validProposal]);
      // T1.2 acceptance: expect(validate()).toReturn({ valid: boolean, errors: [...] })
      expect(result).toMatchObject({
        valid: true,
        total: 1,
        validCount: 1,
        invalidCount: 0,
        errors: [],
      });
    });

    it('should return errors array structure for invalid proposals', () => {
      const invalid: Proposal = { ...validProposal, title: '' };
      const result = validateProposals([invalid]);
      // T1.2 acceptance: errors array should contain structured error objects
      expect(result).toMatchObject({
        valid: false,
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
            proposalId: expect.any(String),
            severity: expect.stringMatching(/^(error|warning)$/),
          }),
        ]),
      });
    });

    it('should return correct total count', () => {
      const result = validateProposals([validProposal, validProposal]);
      expect(result.total).toBe(2);
    });

    it('should calculate validCount and invalidCount correctly', () => {
      const result = validateProposals([validProposal]);
      expect(result.validCount + result.invalidCount).toBe(result.total);
    });
  });
});
