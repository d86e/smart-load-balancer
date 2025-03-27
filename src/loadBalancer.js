// LoadBalancer.js

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
    // 健康检查配置
    healthCheckEndpoint: '/health',
    healthCheckTimeout: 3000,
    healthCheckInterval: 60000,
    healthCheckMethod: 'HEAD',

    // 重试配置
    maxRetryAttempts: 3,
    initialRetryDelay: 1000,
    maxRetryDelay: 30000,

    // 熔断配置
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 30000,

    // 区域路由
    enableRegionalRouting: false,

    // 评分算法权重
    scoringWeights: {
        latency: 0.6,      // 延迟权重
        successRate: 0.3,  // 成功率权重
        serverWeight: 0.1, // 服务器权重
        region: 0.2        // 区域权重
    },

    // 默认请求配置
    defaultRequestOptions: {
        headers: {
            'Content-Type': 'application/json',
            'X-Request-Source': 'LoadBalancer'
        }
    }
};

/**
 * 性能指标收集器
 */
class PerformanceMetrics {
    constructor() {
        this.metrics = {
            requests: 0,
            successes: 0,
            failures: 0,
            totalLatency: 0,
            byEndpoint: new Map()
        };
    }

    recordRequest(url, path, success, latency) {
        this.metrics.requests++;
        if (success) {
            this.metrics.successes++;
            this.metrics.totalLatency += latency;
        } else {
            this.metrics.failures++;
        }

        // 按端点统计
        if (!this.metrics.byEndpoint.has(path)) {
            this.metrics.byEndpoint.set(path, {
                requests: 0,
                successes: 0,
                failures: 0,
                totalLatency: 0,
                lastLatency: 0
            });
        }

        const endpointStats = this.metrics.byEndpoint.get(path);
        endpointStats.requests++;
        endpointStats.lastLatency = latency;

        if (success) {
            endpointStats.successes++;
            endpointStats.totalLatency += latency;
        } else {
            endpointStats.failures++;
        }
    }

    getMetrics() {
        const avgLatency = this.metrics.requests > 0
            ? this.metrics.totalLatency / this.metrics.successes
            : 0;

        return {
            ...this.metrics,
            avgLatency,
            successRate: this.metrics.requests > 0
                ? this.metrics.successes / this.metrics.requests
                : 1,
            byEndpoint: Array.from(this.metrics.byEndpoint.entries()).map(([path, stats]) => ({
                path,
                ...stats,
                avgLatency: stats.successes > 0 ? stats.totalLatency / stats.successes : 0,
                successRate: stats.requests > 0 ? stats.successes / stats.requests : 1
            }))
        };
    }
}

/**
 * 负载均衡器主类
 */
class LoadBalancer {
    constructor(servers, config = {}) {
        if (LoadBalancer.instance) {
            return LoadBalancer.instance;
        }

        // 合并配置
        this.config = { ...DEFAULT_CONFIG, ...config };

        // 初始化服务器列表
        this.servers = this._normalizeServers(servers);

        // 状态管理
        this.serverStats = new Map();
        this.currentServer = null;
        this.retryCount = 0;
        this.healthCheckTimer = null;
        this.userLocation = null;
        this.metrics = new PerformanceMetrics();

        // 拦截器
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.errorInterceptors = [];

        // 初始化
        this._initializeServerStats();
        this._startHealthChecks();
        this._detectUserLocation();

        // 确保单例
        LoadBalancer.instance = this;
    }

    // 规范化服务器配置
    _normalizeServers(servers) {
        return servers.map(server => {
            if (typeof server === 'string') {
                return {
                    url: server,
                    region: 'global',
                    weight: 1,
                    meta: {}
                };
            }

            return {
                url: server.url,
                region: server.region || 'global',
                weight: server.weight || 1,
                meta: server.meta || {}
            };
        });
    }

    // 初始化服务器状态
    _initializeServerStats() {
        this.servers.forEach(server => {
            this.serverStats.set(server.url, {
                requests: 0,
                successes: 0,
                failures: 0,
                totalLatency: 0,
                lastError: null,
                lastResponseTime: null,
                circuitBreaker: {
                    activated: false,
                    activatedAt: 0,
                    failureCount: 0
                },
                health: 'unknown' // 'healthy', 'degraded', 'unhealthy'
            });
        });
    }

    // 启动健康检查
    _startHealthChecks() {
        // 立即执行一次健康检查
        this._performHealthChecks();

        // 设置定时检查
        this.healthCheckTimer = setInterval(() => {
            this._performHealthChecks();
        }, this.config.healthCheckInterval);

        // 页面卸载时清理
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.destroy());
        }
    }

    // 执行健康检查
    async _performHealthChecks() {
        const checks = this.servers.map(server => {
            const stats = this.serverStats.get(server.url);

            // 跳过熔断期的服务器
            if (stats.circuitBreaker.activated) {
                const now = Date.now();
                const elapsed = now - stats.circuitBreaker.activatedAt;
                if (elapsed < this.config.circuitBreakerTimeout) {
                    return Promise.resolve();
                }
                // 熔断超时，重置状态
                stats.circuitBreaker.activated = false;
                stats.circuitBreaker.activatedAt = 0;
                stats.circuitBreaker.failureCount = 0;
            }

            return this._testServer(server.url);
        });

        await Promise.allSettled(checks);
        this._selectOptimalServer();
    }

    // 测试服务器
    async _testServer(url) {
        const startTime = performance.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, this.config.healthCheckTimeout);

        try {
            const testUrl = `${url}${this.config.healthCheckEndpoint}`;
            const options = {
                method: this.config.healthCheckMethod,
                signal: controller.signal,
                ...this._applyRequestInterceptors({})
            };

            const response = await fetch(testUrl, options);
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const latency = performance.now() - startTime;
            this._updateServerStats(url, { success: true, latency });

            return { url, latency };
        } catch (error) {
            clearTimeout(timeoutId);
            this._updateServerStats(url, {
                success: false,
                error: error.message
            });
            throw error;
        }
    }

    // 更新服务器状态
    _updateServerStats(url, { success, latency, error }) {
        const stats = this.serverStats.get(url);
        if (!stats) return;

        stats.requests++;
        stats.lastResponseTime = Date.now();

        if (success) {
            stats.successes++;
            stats.totalLatency += latency;
            stats.lastError = null;

            // 重置熔断失败计数
            if (stats.circuitBreaker.failureCount > 0) {
                stats.circuitBreaker.failureCount = 0;
            }

            // 更新健康状态
            const successRate = stats.successes / stats.requests;
            if (successRate > 0.9) {
                stats.health = 'healthy';
            } else if (successRate > 0.7) {
                stats.health = 'degraded';
            } else {
                stats.health = 'unhealthy';
            }
        } else {
            stats.failures++;
            stats.lastError = error;
            stats.circuitBreaker.failureCount++;

            // 检查是否需要熔断
            if (stats.circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
                stats.circuitBreaker.activated = true;
                stats.circuitBreaker.activatedAt = Date.now();
                stats.health = 'unhealthy';
            }
        }

        this.serverStats.set(url, stats);
    }

    // 选择最优服务器
    _selectOptimalServer() {
        let bestServer = null;
        let bestScore = -Infinity;

        for (const server of this.servers) {
            const stats = this.serverStats.get(server.url);
            if (!stats || stats.circuitBreaker.activated) continue;

            // 计算服务器得分
            const score = this._calculateServerScore(server, stats);

            if (score > bestScore) {
                bestScore = score;
                bestServer = server.url;
            }
        }

        if (bestServer) {
            console.log(`Selected optimal server: ${bestServer} (score: ${bestScore.toFixed(2)})`);
            this.currentServer = bestServer;
            this.retryCount = 0;
        } else {
            console.warn('No healthy servers available');
            this.currentServer = null;
        }
    }

    // 计算服务器得分
    _calculateServerScore(server, stats) {
        const weights = this.config.scoringWeights;

        // 1. 延迟得分 (越低越好)
        const avgLatency = stats.successes > 0
            ? stats.totalLatency / stats.successes
            : Infinity;
        const latencyScore = avgLatency > 0
            ? 1 / avgLatency
            : 1;

        // 2. 成功率得分
        const successRate = stats.requests > 0
            ? stats.successes / stats.requests
            : 1;

        // 3. 服务器权重
        const weightScore = server.weight;

        // 4. 区域得分 (如果启用)
        let regionScore = 0;
        if (this.config.enableRegionalRouting && this.userLocation) {
            regionScore = this._calculateRegionScore(server.region);
        }

        // 综合得分
        return (
            latencyScore * weights.latency +
            successRate * weights.successRate +
            weightScore * weights.serverWeight +
            regionScore * weights.region
        );
    }

    // 计算区域得分
    _calculateRegionScore(serverRegion) {
        const userRegion = this.userLocation?.region?.toLowerCase();
        const userCountry = this.userLocation?.country?.toLowerCase();
        const sRegion = serverRegion.toLowerCase();

        // 精确匹配区域 (如 "us-west")
        if (sRegion === userRegion) return 1.0;

        // 部分匹配 (如 "us-west" 和 "us")
        if (userRegion && sRegion.startsWith(userRegion)) return 0.8;

        // 国家匹配
        if (sRegion === userCountry) return 0.6;

        // 大陆级别匹配 (如 "europe")
        const continentMatch = this._checkContinentMatch(sRegion, userCountry);
        if (continentMatch) return 0.4;

        // 全球服务器
        if (sRegion === 'global') return 0.2;

        return 0;
    }

    // 检测大陆匹配
    _checkContinentMatch(serverRegion, userCountry) {
        // 简化的大陆匹配逻辑
        const continents = {
            europe: ['de', 'fr', 'it', 'es', 'uk'],
            asia: ['cn', 'jp', 'kr', 'in', 'sg'],
            northamerica: ['us', 'ca', 'mx'],
            southamerica: ['br', 'ar', 'cl']
        };

        for (const [continent, countries] of Object.entries(continents)) {
            if (serverRegion.includes(continent) && countries.includes(userCountry)) {
                return true;
            }
        }

        return false;
    }

    // 检测用户地理位置
    async _detectUserLocation() {
        if (!this.config.enableRegionalRouting) return;

        try {
            // 使用IP API获取用户大致位置
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            this.userLocation = {
                ip: data.ip,
                country: data.country,
                countryName: data.country_name,
                region: data.region,
                city: data.city,
                latitude: data.latitude,
                longitude: data.longitude
            };
        } catch (error) {
            console.warn('Failed to detect user location:', error);
            this.userLocation = {
                country: 'unknown',
                region: 'unknown'
            };
        }
    }

    // 请求拦截器
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
        return this;
    }

    // 响应拦截器
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
        return this;
    }

    // 错误拦截器
    addErrorInterceptor(interceptor) {
        this.errorInterceptors.push(interceptor);
        return this;
    }

    // 应用请求拦截器
    _applyRequestInterceptors(options) {
        return this.requestInterceptors.reduce((acc, interceptor) => {
            const result = interceptor(acc);
            return result !== undefined ? result : acc;
        }, options);
    }

    // 应用响应拦截器
    async _applyResponseInterceptors(response) {
        return this.responseInterceptors.reduce(async (accPromise, interceptor) => {
            const acc = await accPromise;
            const result = interceptor(acc);
            return result !== undefined ? result : acc;
        }, Promise.resolve(response));
    }

    // 应用错误拦截器
    async _applyErrorInterceptors(error) {
        return this.errorInterceptors.reduce(async (accPromise, interceptor) => {
            try {
                const acc = await accPromise;
                const result = interceptor(acc);
                return result !== undefined ? result : acc;
            } catch (e) {
                return e;
            }
        }, Promise.resolve(error));
    }

    // 核心请求方法 (带指数退避重试)
    async request(path, options = {}, attempt = 0) {
        // 如果没有当前服务器，先初始化
        if (!this.currentServer && attempt === 0) {
            await this._performHealthChecks();
        }

        // 检查是否有可用服务器
        if (!this.currentServer) {
            throw new Error('No available servers');
        }

        const serverUrl = this.currentServer;
        const startTime = performance.now();

        try {
            // 构建完整URL
            const url = `${serverUrl}${path}`;

            // 合并请求选项
            const mergedOptions = {
                ...this.config.defaultRequestOptions,
                ...options
            };

            // 应用请求拦截器
            const finalOptions = this._applyRequestInterceptors(mergedOptions);

            // 发送请求
            let response = await fetch(url, finalOptions);

            // 记录性能指标
            const latency = performance.now() - startTime;
            this.metrics.recordRequest(serverUrl, path, true, latency);
            this._updateServerStats(serverUrl, { success: true, latency });

            // 应用响应拦截器
            response = await this._applyResponseInterceptors(response);

            return response;
        } catch (error) {
            // 记录性能指标
            const latency = performance.now() - startTime;
            this.metrics.recordRequest(serverUrl, path, false, latency);
            this._updateServerStats(serverUrl, {
                success: false,
                error: error.message,
                latency
            });

            // 应用错误拦截器
            const processedError = await this._applyErrorInterceptors(error);

            // 检查是否需要重试
            if (attempt < this.config.maxRetryAttempts) {
                this.retryCount++;

                // 如果连续失败多次，重新选择服务器
                if (this.retryCount >= this.config.maxRetryAttempts) {
                    console.warn(`Server ${serverUrl} failed ${this.retryCount} times, selecting new server`);
                    await this._performHealthChecks();
                }

                // 指数退避延迟
                const delay = Math.min(
                    this.config.initialRetryDelay * Math.pow(2, attempt),
                    this.config.maxRetryDelay
                );

                await new Promise(resolve => setTimeout(resolve, delay));
                return this.request(path, options, attempt + 1);
            }

            throw processedError;
        }
    }

    // 便捷方法: GET
    async get(path, options = {}) {
        return this.request(path, {
            method: 'GET',
            ...options
        });
    }

    // 便捷方法: POST
    async post(path, body, options = {}) {
        return this.request(path, {
            method: 'POST',
            body: JSON.stringify(body),
            ...options
        });
    }

    // 其他HTTP方法...

    // 获取服务器状态
    getServerStats() {
        return Array.from(this.serverStats.entries()).map(([url, stats]) => {
            const server = this.servers.find(s => s.url === url);
            return {
                url,
                region: server?.region || 'unknown',
                weight: server?.weight || 1,
                ...stats,
                avgLatency: stats.successes > 0 ? stats.totalLatency / stats.successes : 0,
                successRate: stats.requests > 0 ? stats.successes / stats.requests : 1,
                lastUpdated: new Date(stats.lastResponseTime).toISOString(),
                circuitBreaker: {
                    ...stats.circuitBreaker,
                    activatedAt: stats.circuitBreaker.activatedAt
                        ? new Date(stats.circuitBreaker.activatedAt).toISOString()
                        : null
                }
            };
        });
    }

    // 获取性能指标
    getPerformanceMetrics() {
        return this.metrics.getMetrics();
    }

    // 获取用户位置
    getUserLocation() {
        return this.userLocation;
    }

    // 更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };

        // 如果健康检查间隔变化，重启定时器
        if (newConfig.healthCheckInterval) {
            clearInterval(this.healthCheckTimer);
            this._startHealthChecks();
        }
    }

    // 销毁实例
    destroy() {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
        this.serverStats.clear();
        this.currentServer = null;
        LoadBalancer.instance = null;
    }

    // 静态方法获取实例 (单例模式)
    static getInstance(servers, config) {
        if (!LoadBalancer.instance) {
            LoadBalancer.instance = new LoadBalancer(servers, config);
        }
        return LoadBalancer.instance;
    }
}

// 确保单例
LoadBalancer.instance = null;

export default LoadBalancer;