import LoadBalancer from '../src/loadBalancer';

// 模拟服务器配置
const testServers = [
    {
        url: 'https://test1.api.example.com',
        region: 'test',
        weight: 1.0,
        meta: { description: 'Test Server 1' }
    },
    {
        url: 'https://test2.api.example.com',
        region: 'test',
        weight: 1.0,
        meta: { description: 'Test Server 2' }
    }
];

// 模拟fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
        headers: new Map([['content-type', 'application/json']])
    })
);

describe('LoadBalancer', () => {
    let lb;

    beforeEach(() => {
        fetch.mockClear();
        lb = LoadBalancer.getInstance(testServers);
    });

    afterEach(async () => {
        // 清除所有拦截器
        lb.requestInterceptors = [];
        lb.responseInterceptors = [];

        // 清理健康检查定时器
        if (lb.healthCheckTimer) {
            clearInterval(lb.healthCheckTimer);
        }

        // 确保所有异步操作完成
        await new Promise(resolve => setImmediate(resolve));
    });

    test('should be singleton', () => {
        const anotherInstance = LoadBalancer.getInstance();
        expect(anotherInstance).toBe(lb);
    });

    test('should make request to servers', async () => {
        const response = await lb.get('/test');
        expect(fetch).toHaveBeenCalled();
        expect(response.ok).toBe(true);
    });

    test('should work with request interceptor', async () => {
        lb.addRequestInterceptor(options => ({
            ...options,
            headers: { 'X-Test': 'true' }
        }));

        await lb.get('/test');
        const call = fetch.mock.calls[0][1];
        expect(call.headers['X-Test']).toBe('true');
    });

    test('should work with response interceptor', async () => {
        lb.addResponseInterceptor(response => ({
            ...response,
            intercepted: true
        }));

        const response = await lb.get('/test');
        expect(response.intercepted).toBe(true);
    });
});
