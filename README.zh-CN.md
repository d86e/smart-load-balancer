# 浏览器端负载均衡器

[![npm version](https://img.shields.io/npm/v/smart-load-balancer.svg)](https://www.npmjs.com/package/smart-load-balancer)
![构建状态](https://img.shields.io/badge/build-passing-brightgreen)
![许可证](https://img.shields.io/badge/license-MIT-blue)
![大小](https://img.shields.io/badge/size-15KB-blue)

[English](README.md)

一个高性能、可配置的浏览器端 JavaScript 网络请求负载均衡器，支持智能路由、健康检查和实时监控。

## 项目背景

现代 Web 应用常常需要与多个后端服务端点通信。随着应用规模的扩大和用户分布全球化，如何高效地选择最优服务端点成为提升应用性能的关键因素。传统的客户端负载均衡方案通常部署在服务端，而浏览器端缺乏类似的智能路由机制。

本项目的目标是构建一个运行在浏览器环境中的负载均衡解决方案，能够在客户端智能选择最优服务端点，提升应用响应速度，增强容错能力，同时提供丰富的监控指标。

## 设计目标

1. **性能优先**：通过实时性能评估选择最优服务端点
2. **高可靠性**：内置熔断机制和自动故障转移
3. **智能路由**：支持权重分配和区域感知路由
4. **可观测性**：提供详细的性能监控指标
5. **无侵入性**：与现有 fetch API 兼容，易于集成
6. **轻量级**：零生产依赖，精简代码体积
7. **轻量高效**：核心代码仅 15KB，无外部依赖
8. **易于集成**：简单 API 设计，快速接入现有项目

## 核心特性

### 智能路由

- 基于实时性能数据自动选择最优端点
- 支持服务器权重配置
- 区域感知路由（根据用户地理位置优化）

### 健康管理

- 定期健康检查
- 熔断机制（自动隔离故障节点）
- 失败重试与自动切换

### 性能优化

- 指数退避重试策略
- 健康检查请求优化（HEAD 方法）
- 请求去重与缓存控制

### 监控指标

- 实时服务器状态监控
- 请求成功率统计
- 延迟百分位计算
- 端点级性能分析

### 可扩展性

- 可插拔的拦截器系统
- 自定义评分算法
- 灵活的配置系统

## 核心算法

负载均衡器采用多维度评分算法选择最优服务端点：

```
服务器得分 =
  (延迟得分 × 延迟权重) +
  (成功率得分 × 成功率权重) +
  (服务器权重 × 权重因子) +
  (区域匹配得分 × 区域权重)
```

其中：

- **延迟得分**：基于历史请求延迟的倒数计算（延迟越低得分越高）
- **成功率得分**：基于历史请求成功率计算
- **区域匹配得分**：根据用户地理位置与服务器区域的匹配程度计算

## 安装方法

使用 npm 安装：

```bash
npm install smart-load-balancer
```

或通过 CDN 直接使用：

```html
<script src="https://unpkg.com/smart-load-balancer@latest/dist/index.min.js"></script>
```

## 快速开始

### 基本用法

```javascript
import LoadBalancer from "smart-load-balancer";

// 配置服务器列表
const servers = [
  "https://api1.example.com",
  "https://api2.example.com",
  "https://api3.example.com",
];

// 创建负载均衡器实例
const lb = LoadBalancer.getInstance(servers);

// 发起请求
async function fetchData() {
  try {
    const response = await lb.get("/api/data");
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Request failed:", error);
  }
}
```

### 带配置的初始化

```javascript
const servers = [
  {
    url: "https://us-west.api.example.com",
    region: "us-west",
    weight: 1.2,
  },
  {
    url: "https://eu.api.example.com",
    region: "europe",
    weight: 1.0,
  },
];

const config = {
  healthCheckInterval: 30000,
  enableRegionalRouting: true,
};

const lb = LoadBalancer.getInstance(servers, config);
```

## 高级用法

### 自定义拦截器

```javascript
// 请求拦截器 - 添加认证头
lb.addRequestInterceptor((options) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    return {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }
  return options;
});

// 响应拦截器 - 统一处理JSON
lb.addResponseInterceptor(async (response) => {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const data = await response.json();
    return { ...response, data };
  }
  return response;
});

// 错误拦截器 - 统一错误格式
lb.addErrorInterceptor((error) => {
  console.error("Request failed:", error);
  throw new Error(`API request failed: ${error.message}`);
});
```

### 自定义评分算法

```javascript
const config = {
  scoringWeights: {
    latency: 0.7, // 提高延迟权重
    successRate: 0.2,
    serverWeight: 0.1,
    region: 0.3, // 启用区域路由
  },
};
```

### 动态配置更新

```javascript
// 运行时更新配置
lb.updateConfig({
  healthCheckInterval: 60000,
  circuitBreakerThreshold: 3,
});
```

## 监控状态

### 获取服务器状态

```javascript
const stats = lb.getServerStats();
console.table(stats);
```

输出示例：

| URL                             | Region  | Weight | Health   | Success Rate | Avg Latency |
| ------------------------------- | ------- | ------ | -------- | ------------ | ----------- |
| https://us-west.api.example.com | us-west | 1.2    | healthy  | 0.98         | 124ms       |
| https://eu.api.example.com      | europe  | 1.0    | degraded | 0.82         | 236ms       |

### 获取性能指标

```javascript
const metrics = lb.getPerformanceMetrics();
console.log("Total requests:", metrics.requests);
console.log("Success rate:", metrics.successRate);
console.log("Average latency:", metrics.avgLatency);
```

### 获取用户位置

```javascript
const location = lb.getUserLocation();
console.log("User location:", location.country, location.region);
```

## 核心 API

### `LoadBalancer.getInstance(servers, config)`

获取负载均衡器单例实例

**参数**:

- `servers`: (Array) 服务器列表，可以是字符串数组或对象数组
- `config`: (Object) 可选配置对象

**示例**:

```javascript
// 简单配置
const lb1 = LoadBalancer.getInstance([
  "https://api1.example.com",
  "https://api2.example.com",
]);

// 高级配置
const lb2 = LoadBalancer.getInstance(
  [
    {
      url: "https://us-api.example.com",
      region: "us-west",
      weight: 1.2,
    },
  ],
  {
    healthCheckInterval: 30000,
  }
);
```

### `request(path, options, attempt)`

发起请求的核心方法

**参数**:

- `path`: (String) 请求路径
- `options`: (Object) fetch 请求选项
- `attempt`: (Number) 内部重试计数

**返回值**: Promise<Response>

**示例**:

```javascript
lb.request("/api/data", {
  method: "POST",
  body: JSON.stringify({ key: "value" }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## 便捷方法

### `get(path, options)`

发起 GET 请求

**示例**:

```javascript
lb.get("/api/users")
  .then((res) => res.json())
  .then((users) => console.log(users));
```

### `post(path, body, options)`

发起 POST 请求

**示例**:

```javascript
lb.post("/api/users", { name: "John" })
  .then((res) => res.json())
  .then((result) => console.log(result));
```

## 配置管理

### `updateConfig(newConfig)`

更新负载均衡器配置

**参数**:

- `newConfig`: (Object) 新的配置对象

**示例**:

```javascript
lb.updateConfig({
  healthCheckInterval: 60000,
  maxRetryAttempts: 5,
});
```

## 拦截器 API

### `addRequestInterceptor(interceptor)`

添加请求拦截器

**参数**:

- `interceptor`: (Function) 拦截器函数

**示例**:

```javascript
lb.addRequestInterceptor((options) => {
  console.log("Request options:", options);
  return {
    ...options,
    headers: {
      ...options.headers,
      "X-Trace-Id": generateTraceId(),
    },
  };
});
```

### `addResponseInterceptor(interceptor)`

添加响应拦截器

**示例**:

```javascript
lb.addResponseInterceptor(async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return response;
});
```

### `addErrorInterceptor(interceptor)`

添加错误拦截器

**示例**:

```javascript
lb.addErrorInterceptor((error) => {
  Sentry.captureException(error);
  throw error;
});
```

## 监控 API

### `getServerStats()`

获取服务器状态统计

**返回值**: Array<Object>

**示例**:

```javascript
const stats = lb.getServerStats();
stats.forEach((server) => {
  console.log(`${server.url} - ${server.health}`);
});
```

### `getPerformanceMetrics()`

获取性能指标

**示例**:

```javascript
const metrics = lb.getPerformanceMetrics();
console.log("Average latency:", metrics.avgLatency);
console.log("Success rate:", metrics.successRate);
```

### `getUserLocation()`

获取检测到的用户位置

**示例**:

```javascript
const location = lb.getUserLocation();
console.log("User country:", location.country);
```

## 生命周期管理

### `destroy()`

销毁负载均衡器实例

**示例**:

```javascript
// 在应用卸载时调用
window.addEventListener("beforeunload", () => {
  lb.destroy();
});
```

## 完整配置选项

| 选项                          | 类型    | 默认值    | 描述             |
| ----------------------------- | ------- | --------- | ---------------- |
| `healthCheckEndpoint`         | String  | `/health` | 健康检查端点     |
| `healthCheckTimeout`          | Number  | `3000`    | 健康检查超时(ms) |
| `healthCheckInterval`         | Number  | `60000`   | 健康检查间隔(ms) |
| `healthCheckMethod`           | String  | `HEAD`    | 健康检查方法     |
| `maxRetryAttempts`            | Number  | `3`       | 最大重试次数     |
| `initialRetryDelay`           | Number  | `1000`    | 初始重试延迟(ms) |
| `maxRetryDelay`               | Number  | `30000`   | 最大重试延迟(ms) |
| `circuitBreakerThreshold`     | Number  | `5`       | 熔断触发阈值     |
| `circuitBreakerTimeout`       | Number  | `30000`   | 熔断超时(ms)     |
| `enableRegionalRouting`       | Boolean | `false`   | 是否启用区域路由 |
| `scoringWeights.latency`      | Number  | `0.6`     | 延迟评分权重     |
| `scoringWeights.successRate`  | Number  | `0.3`     | 成功率评分权重   |
| `scoringWeights.serverWeight` | Number  | `0.1`     | 服务器权重因子   |
| `scoringWeights.region`       | Number  | `0.2`     | 区域评分权重     |
| `defaultRequestOptions`       | Object  | `{}`      | 默认请求选项     |

## 完整示例

```javascript
import LoadBalancer from "smart-load-balancer";

// 1. 初始化
const lb = LoadBalancer.getInstance(
  [
    {
      url: "https://us-api.example.com",
      region: "us-west",
      weight: 1.2,
    },
    {
      url: "https://eu-api.example.com",
      region: "europe",
      weight: 1.0,
    },
  ],
  {
    healthCheckInterval: 30000,
    enableRegionalRouting: true,
  }
);

// 2. 添加拦截器
lb.addRequestInterceptor((options) => {
  const token = localStorage.getItem("token");
  return token
    ? {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      }
    : options;
});

// 3. 发起请求
async function getUserProfile(userId) {
  try {
    const response = await lb.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw error;
  }
}

// 4. 监控
setInterval(() => {
  console.table(lb.getServerStats());
}, 60000);
```

## 事件系统 (高级)

负载均衡器还提供了事件订阅机制：

```javascript
// 订阅服务器切换事件
lb.on("serverChanged", (newServer, oldServer) => {
  console.log(`Switched from ${oldServer} to ${newServer}`);
});

// 订阅健康检查事件
lb.on("healthCheck", (results) => {
  results.forEach((result) => {
    console.log(`${result.url}: ${result.healthy ? "healthy" : "unhealthy"}`);
  });
});

// 可用事件列表:
// - 'initialized': 初始化完成
// - 'serverChanged': 服务器切换
// - 'healthCheck': 健康检查完成
// - 'requestStart': 请求开始
// - 'requestSuccess': 请求成功
// - 'requestError': 请求失败
// - 'circuitBreakerOpen': 熔断器打开
// - 'circuitBreakerClose': 熔断器关闭
```

## 注意事项

1. **单例模式**: 确保整个应用使用同一个实例
2. **错误处理**: 建议添加全局错误拦截器
3. **性能监控**: 生产环境建议定期收集性能指标
4. **健康检查**: 根据业务需求调整检查频率
5. **区域路由**: 需要用户明确配置服务器区域信息

## 最佳实践

1. **初始化时机**: 在应用启动时尽早初始化
2. **拦截器顺序**: 注意拦截器的添加顺序会影响执行顺序
3. **配置调优**: 根据实际网络环境调整超时和重试参数
4. **监控集成**: 将性能指标集成到现有监控系统
5. **渐进式启用**: 可以先从非关键接口开始试用

## 参与贡献

我们欢迎各种形式的贡献：

1. **报告问题**：通过 GitHub Issues 报告 bug 或提出改进建议
2. **代码贡献**：提交 Pull Request 修复问题或实现新功能
3. **文档改进**：帮助完善文档或翻译
4. **测试覆盖**：添加测试用例提高代码质量

### 开发指南

1. 克隆仓库：
   ```bash
   git clone https://github.com/d86e/smart-load-balancer.git
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 运行测试：
   ```bash
   npm test
   ```
4. 构建项目：
   ```bash
   npm run build
   ```

- [代码风格指南](CODESTYLE.md)
- [测试指南](TESTING.md)

## 开源协议

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源，详见[LICENSE](LICENSE)。
