/**
 * Diagnosis API Service Tests
 * 
 * Note: These tests cover the exported types and interfaces.
 * The actual API calls require network/mock setup that is complex.
 * We test the interface exports here.
 */

import {
  DiagnosisResult,
  IdentifiedDomain,
  MissingInfo,
  Suggestion,
  SimilarCase,
  DiffResult,
  AnalyzeRequest,
  AnalyzeResponse,
  OptimizeRequest,
  OptimizeResponse,
} from '../index';

describe('Diagnosis Types', () => {
  describe('DiagnosisResult', () => {
    it('should have correct shape', () => {
      const result: DiagnosisResult = {
        overallScore: 85,
        grade: 'B',
        scores: {
          completeness: 80,
          clarity: 90,
          consistency: 85,
          feasibility: 85,
        },
        identifiedDomains: [],
        missingInfo: [],
        suggestions: [],
        similarCases: [],
      };

      expect(result.overallScore).toBe(85);
      expect(result.grade).toBe('B');
    });

    it('should accept cached flag', () => {
      const result: DiagnosisResult = {
        overallScore: 85,
        grade: 'B',
        scores: {
          completeness: 80,
          clarity: 90,
          consistency: 85,
          feasibility: 85,
        },
        identifiedDomains: [],
        missingInfo: [],
        suggestions: [],
        similarCases: [],
        cached: true,
      };

      expect(result.cached).toBe(true);
    });
  });

  describe('IdentifiedDomain', () => {
    it('should have correct shape', () => {
      const domain: IdentifiedDomain = {
        name: 'User',
        confidence: 0.9,
        keywords: ['user', 'account'],
        completeness: 0.8,
        missingFunctions: ['delete'],
      };

      expect(domain.name).toBe('User');
      expect(domain.confidence).toBe(0.9);
    });
  });

  describe('MissingInfo', () => {
    it('should accept all importance levels', () => {
      const missingHigh: MissingInfo = {
        domain: 'User',
        item: 'email',
        importance: 'high',
        suggestion: 'Add email field',
      };

      const missingMedium: MissingInfo = {
        domain: 'User',
        item: 'bio',
        importance: 'medium',
        suggestion: 'Add bio field',
      };

      const missingLow: MissingInfo = {
        domain: 'User',
        item: 'avatar',
        importance: 'low',
        suggestion: 'Add avatar field',
      };

      expect(missingHigh.importance).toBe('high');
      expect(missingMedium.importance).toBe('medium');
      expect(missingLow.importance).toBe('low');
    });
  });

  describe('Suggestion', () => {
    it('should accept all suggestion types', () => {
      const addSuggestion: Suggestion = {
        type: 'add',
        target: 'User',
        description: 'Add new field',
      };

      const modifySuggestion: Suggestion = {
        type: 'modify',
        target: 'User',
        description: 'Modify existing field',
      };

      const clarifySuggestion: Suggestion = {
        type: 'clarify',
        target: 'User',
        description: 'Clarify requirements',
      };

      expect(addSuggestion.type).toBe('add');
      expect(modifySuggestion.type).toBe('modify');
      expect(clarifySuggestion.type).toBe('clarify');
    });
  });

  describe('DiffResult', () => {
    it('should have correct shape', () => {
      const diff: DiffResult = {
        original: 'original text',
        optimized: 'optimized text',
        changes: [
          {
            type: 'added',
            original: '',
            optimized: 'new line',
            position: { start: 0, end: 10 },
          },
        ],
      };

      expect(diff.changes[0].type).toBe('added');
    });
  });
});
