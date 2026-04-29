import { logger } from '../logger.js';

describe('E7-S2 StructuredLogger', () => {
  let logs: string[] = [];
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;

  beforeEach(() => {
    logs = [];
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation((msg) => {
      logs.push(msg as string);
    });
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation((msg) => {
      logs.push(msg as string);
    });
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('E7-S2: should output JSON format with timestamp', () => {
    logger.info('test message');
    expect(logs.length).toBe(1);
    const entry = JSON.parse(logs[0]);
    expect(entry.timestamp).toBeDefined();
    expect(entry.level).toBe('info');
    expect(entry.service).toBe('vibex-mcp-server');
    expect(entry.version).toBe('0.1.0');
  });

  it('E7-S2: should include tool/duration/success fields via logToolCall', () => {
    logger.logToolCall('health_check', 150, true);
    const entry = JSON.parse(logs[0]);
    expect(entry.tool).toBe('health_check');
    expect(entry.duration).toBe(150);
    expect(entry.success).toBe(true);
    expect(entry.level).toBe('info');
  });

  it('E7-S2: should log failed tool calls with success=false', () => {
    logger.logToolCall('createProject', 50, false);
    const entry = JSON.parse(logs[0]);
    expect(entry.tool).toBe('createProject');
    expect(entry.duration).toBe(50);
    expect(entry.success).toBe(false);
  });

  it('should include message field', () => {
    logger.info('hello world', { extra: 'data' });
    const entry = JSON.parse(logs[0]);
    expect(entry.message).toBe('hello world');
    expect(entry.extra).toBe('data');
  });

  it('should support debug/warn/error levels', () => {
    logger.warn('warning message');
    logger.error('error message');
    const warnEntry = JSON.parse(logs[0]);
    const errorEntry = JSON.parse(logs[1]);
    expect(warnEntry.level).toBe('warn');
    expect(errorEntry.level).toBe('error');
  });

  it('E7-S2: should redact sensitive fields (token/password/secret/key/auth)', () => {
    logger.info('login attempt', {
      token: 'secret-token-123',
      password: 'myPassword',
      user_secret: 'hidden',
      apiKey: 'sk-abc',
      authHeader: 'Bearer xyz',
      public: 'safe-value',
    });
    const entry = JSON.parse(logs[0]);
    expect(entry.token).toBe('[REDACTED]');
    expect(entry.password).toBe('[REDACTED]');
    expect(entry.user_secret).toBe('[REDACTED]');
    expect(entry.apiKey).toBe('[REDACTED]');
    expect(entry.authHeader).toBe('[REDACTED]');
    expect(entry.public).toBe('safe-value');
  });

  it('E7-S2: should redact nested sensitive fields', () => {
    logger.info('user update', {
      user: { password: 'secret123', name: 'Alice' },
      api_key: 'sk-key',
    });
    const entry = JSON.parse(logs[0]);
    expect(entry.user.password).toBe('[REDACTED]');
    expect(entry.user.name).toBe('Alice');
    expect(entry.api_key).toBe('[REDACTED]');
  });
});
