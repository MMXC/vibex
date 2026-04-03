// @ts-nocheck
import {
  unwrapData,
  unwrapField,
  unwrapFieldOrSelf,
} from '../../src/services/api/unwrappers';

describe('unwrappers', () => {
  describe('unwrapData', () => {
    it('should return data from wrapped response', () => {
      const wrapped = { data: { id: 1, name: 'test' } };
      const result = unwrapData<{ id: number; name: string }>(wrapped);
      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should return original when not wrapped', () => {
      const unwrapped = { id: 1, name: 'test' };
      const result = unwrapData<{ id: number; name: string }>(unwrapped);
      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should return null as null', () => {
      const result = unwrapData<null>(null);
      expect(result).toBeNull();
    });

    it('should return undefined as undefined', () => {
      const result = unwrapData<undefined>(undefined);
      expect(result).toBeUndefined();
    });

    it('should handle array wrapped in data', () => {
      const wrapped = { data: [1, 2, 3] };
      const result = unwrapData<number[]>(wrapped);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle string response', () => {
      const result = unwrapData<string>('hello');
      expect(result).toBe('hello');
    });

    it('should handle primitive number', () => {
      const result = unwrapData<number>(42);
      expect(result).toBe(42);
    });

    it('should return original if data field is undefined', () => {
      const obj = { foo: 'bar' };
      const result = unwrapData<{ foo: string }>(obj);
      expect(result).toEqual({ foo: 'bar' });
    });
  });

  describe('unwrapField', () => {
    it('should return field directly from response', () => {
      const response = { agents: [{ id: '1' }, { id: '2' }] };
      const result = unwrapField<Array<{ id: string }>>(response, 'agents');
      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    });

    it('should return field from nested data object', () => {
      const response = { data: { agents: [{ id: '1' }] } };
      const result = unwrapField<Array<{ id: string }>>(response, 'agents');
      expect(result).toEqual([{ id: '1' }]);
    });

    it('should return original response when field not found', () => {
      const response = { items: ['a', 'b'] };
      const result = unwrapField<string[]>(response, 'agents');
      expect(result).toEqual(response);
    });

    it('should return original response when data is not object', () => {
      const response = 'string response';
      const result = unwrapField<string[]>(response, 'agents');
      expect(result).toBe('string response');
    });

    it('should handle null response', () => {
      const result = unwrapField<string[]>(null, 'agents');
      expect(result).toBeNull();
    });

    it('should handle undefined response', () => {
      const result = unwrapField<string[]>(undefined, 'agents');
      expect(result).toBeUndefined();
    });

    it('should handle nested data without target field', () => {
      const response = { data: { items: [1, 2] } };
      const result = unwrapField<number[]>(response, 'agents');
      expect(result).toEqual({ data: { items: [1, 2] } });
    });

    it('should unwrap users field from nested data', () => {
      const response = { data: { users: [{ name: 'Alice' }] } };
      const result = unwrapField<Array<{ name: string }>>(response, 'users');
      expect(result).toEqual([{ name: 'Alice' }]);
    });
  });

  describe('unwrapFieldOrSelf', () => {
    it('should return field when found', () => {
      const response = { data: { items: ['a', 'b'] } };
      const result = unwrapFieldOrSelf<string[]>(response, 'items');
      expect(result).toEqual(['a', 'b']);
    });

    it('should return original response when field not found', () => {
      const response = { foo: 'bar' };
      const result = unwrapFieldOrSelf<{ foo: string }>(response, 'baz');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return original when no data wrapper', () => {
      const response = 'plain string';
      const result = unwrapFieldOrSelf<string>(response, 'field');
      expect(result).toBe('plain string');
    });

    it('should return array directly', () => {
      const response = { items: [1, 2, 3] };
      const result = unwrapFieldOrSelf<number[]>(response, 'items');
      expect(result).toEqual([1, 2, 3]);
    });
  });
});
