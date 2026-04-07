/**
 * Retry Service Tests
 */
// @ts-nocheck


import { retry, DEFAULT_RETRY_CONFIG } from '@/services/api/retry';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('RetryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('execute', () => {
    it('should return result on first successful attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retry.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const retryableError = new Error('Network error');
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      Object.defineProperty(retryableError, 'response', { value: { status: 503 } });

      const fn = jest
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      const resultPromise = retry.execute(fn);
      
      // Fast-forward through delay
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw immediately on non-retryable error', async () => {
      const nonRetryableError = new Error('Bad request');
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      Object.defineProperty(nonRetryableError, 'response', { value: { status: 400 } });

      const fn = jest.fn().mockRejectedValue(nonRetryableError);

      await expect(retry.execute(fn)).rejects.toThrow('Bad request');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use custom config', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      await retry.execute(fn, { maxRetries: 5, baseDelay: 500 });

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('isRetryable', () => {
    it('should return true for network errors (no response)', () => {
      const error = new Error('Network Error');
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      Object.defineProperty(error, 'response', { value: undefined });

      expect(retry.isRetryable(error)).toBe(true);
    });

    it('should return true for 500 status code', () => {
      const error = new Error('Internal Server Error');
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      Object.defineProperty(error, 'response', { value: { status: 500 } });

      expect(retry.isRetryable(error)).toBe(true);
    });

    it('should return true for 503 status code', () => {
      const error = new Error('Service Unavailable');
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      Object.defineProperty(error, 'response', { value: { status: 503 } });

      expect(retry.isRetryable(error)).toBe(true);
    });

    it('should return false for 400 status code', () => {
      const error = new Error('Bad Request');
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      Object.defineProperty(error, 'response', { value: { status: 400 } });

      expect(retry.isRetryable(error)).toBe(false);
    });

    it('should return false for 401 status code', () => {
      const error = new Error('Unauthorized');
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      Object.defineProperty(error, 'response', { value: { status: 401 } });

      expect(retry.isRetryable(error)).toBe(false);
    });

    it('should return false for non-axios errors', () => {
      const error = new Error('Generic error');
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);

      expect(retry.isRetryable(error)).toBe(false);
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.baseDelay).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.retryableStatusCodes).toContain(500);
      expect(DEFAULT_RETRY_CONFIG.retryableStatusCodes).toContain(503);
    });
  });
});