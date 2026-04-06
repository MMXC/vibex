/**
 * Diagnosis API Service Tests
 */

// Mock the entire module before importing
vi.mock('@/lib/api-config', () => ({
  API_CONFIG: { baseURL: 'http://localhost:3000' },
}));

vi.mock('axios', () => {
  const mockPost = vi.fn();
  return {
    __esModule: true,
    default: {
      interceptors: {
        request: { use: jest.fn(() => ({ eject: vi.fn() })) },
        response: { use: jest.fn(() => ({ eject: vi.fn() })) },
      },
      create: jest.fn(() => ({
        interceptors: {
          request: { use: jest.fn(() => ({ eject: vi.fn() })) },
          response: { use: jest.fn(() => ({ eject: vi.fn() })) },
        },
        post: mockPost,
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      })),
      mockPost,
    },
  };
});

import axios from 'axios';
import { analyzeRequirement, optimizeRequirement } from './index';

const mockAxios = axios as any;

describe('Diagnosis Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeRequirement', () => {
    it('should analyze requirement successfully', async () => {
      const mockResult = {
        overallScore: 85,
        grade: 'A',
        scores: { completeness: 90, clarity: 80, consistency: 85, feasibility: 85 },
        identifiedDomains: [],
        missingInfo: [],
        suggestions: [],
        similarCases: [],
      };

      mockAxios.mockPost.mockResolvedValue({
        data: { success: true, result: mockResult, cached: false },
      });

      const result = await analyzeRequirement('Test requirement');
      expect(result.overallScore).toBe(85);
      expect(result.grade).toBe('A');
    });

    it('should throw error when analysis fails', async () => {
      mockAxios.mockPost.mockResolvedValue({
        data: { success: false, error: 'Analysis failed', cached: false },
      });

      await expect(analyzeRequirement('Test')).rejects.toThrow('Analysis failed');
    });
  });

  describe('optimizeRequirement', () => {
    const mockDiagnosis = {
      overallScore: 50,
      grade: 'C',
      scores: { completeness: 50, clarity: 50, consistency: 50, feasibility: 50 },
      identifiedDomains: [{ name: 'User', confidence: 0.8, keywords: [], completeness: 0.6, missingFunctions: [] }],
      missingInfo: [],
      suggestions: [],
      similarCases: [],
    };

    it('should optimize requirement successfully', async () => {
      mockAxios.mockPost.mockResolvedValue({
        data: { success: true, optimizedText: 'optimized', diff: { original: 'a', optimized: 'b', changes: [] } },
      });

      const result = await optimizeRequirement('text', mockDiagnosis as any);
      expect(result.optimizedText).toBe('optimized');
    });

    it('should throw error when optimization fails', async () => {
      mockAxios.mockPost.mockResolvedValue({
        data: { success: false, error: 'Optimization failed' },
      });

      await expect(optimizeRequirement('text', mockDiagnosis as any)).rejects.toThrow('Optimization failed');
    });
  });
});
