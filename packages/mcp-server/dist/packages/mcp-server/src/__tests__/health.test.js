import { performHealthCheck } from '../health.js';
describe('E7-S1 Health Check', () => {
    it('E7-S1: should return status/version/uptime/timestamp fields', async () => {
        const result = await performHealthCheck();
        expect(result.status).toBeDefined();
        expect(['healthy', 'degraded', 'unhealthy']).toContain(result.status);
        expect(result.version).toBe('0.1.0');
        expect(result.uptime).toBeGreaterThanOrEqual(0);
        expect(result.timestamp).toBeDefined();
        expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });
    it('E7-S1: should include connectedClients field', async () => {
        const result = await performHealthCheck();
        expect(result.connectedClients).toBe(1); // stdio: single client
    });
    it('E7-S1: should list registered tools', async () => {
        const result = await performHealthCheck();
        expect(result.tools).toBeDefined();
        expect(result.tools.registered).toBeGreaterThan(0);
        expect(Array.isArray(result.tools.names)).toBe(true);
        expect(result.tools.names).toContain('health_check');
    });
    it('E7-S1: should include health checks array', async () => {
        const result = await performHealthCheck();
        expect(Array.isArray(result.checks)).toBe(true);
        expect(result.checks.length).toBeGreaterThan(0);
        const checkNames = result.checks.map((c) => c.name);
        expect(checkNames).toContain('server_running');
        expect(checkNames).toContain('tools_registered');
    });
    it('E7-S1: should mark checks as pass when healthy', async () => {
        const result = await performHealthCheck();
        const failed = result.checks.filter((c) => c.status === 'fail');
        expect(result.status).toBe('healthy');
        expect(failed.length).toBe(0);
    });
});
