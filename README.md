# Browser-Side Load Balancer

[![npm version](https://img.shields.io/npm/v/smart-load-balancer.svg)](https://www.npmjs.com/package/smart-load-balancer)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Size](https://img.shields.io/badge/size-15KB-blue)

[简体中文](README.zh-CN.md)

A high-performance, configurable JavaScript network request load balancer for browser environments, featuring intelligent routing, health checks, and real-time monitoring.

## Project Background

Modern web applications often need to communicate with multiple backend service endpoints. As applications scale and users become globally distributed, efficiently selecting the optimal service endpoint becomes crucial for improving application performance. Traditional client-side load balancing solutions are typically deployed server-side, while browser environments lack similar intelligent routing mechanisms.

This project aims to build a load balancing solution that runs in the browser environment, intelligently selecting optimal service endpoints to improve application response times, enhance fault tolerance, and provide comprehensive monitoring metrics.

## Design Goals

1. **Performance First**: Select optimal endpoints through real-time performance evaluation
2. **High Reliability**: Built-in circuit breaking and automatic failover
3. **Intelligent Routing**: Supports weighted distribution and region-aware routing
4. **Observability**: Provides detailed performance monitoring metrics
5. **Non-Invasive**: Compatible with existing fetch API, easy to integrate
6. **Lightweight**: Zero production dependencies, minimal code footprint
7. **Efficient**: Core code only 15KB, no external dependencies
8. **Easy Integration**: Simple API design for quick adoption in existing projects

## Core Features

### Intelligent Routing

- Automatically selects optimal endpoints based on real-time performance data
- Supports server weight configuration
- Region-aware routing (optimized based on user geographic location)

### Health Management

- Regular health checks
- Circuit breaking (automatically isolates failing nodes)
- Retry and automatic failover

### Performance Optimization

- Exponential backoff retry strategy
- Optimized health check requests (HEAD method)
- Request deduplication and cache control

### Monitoring Metrics

- Real-time server status monitoring
- Request success rate statistics
- Latency percentile calculations
- Endpoint-level performance analysis

### Extensibility

- Pluggable interceptor system
- Custom scoring algorithms
- Flexible configuration system

## Core Algorithm

The load balancer uses a multi-dimensional scoring algorithm to select optimal service endpoints:

```
Server Score =
  (Latency Score × Latency Weight) +
  (Success Rate Score × Success Rate Weight) +
  (Server Weight × Weight Factor) +
  (Region Match Score × Region Weight)
```

Where:

- **Latency Score**: Calculated as the inverse of historical request latency (lower latency = higher score)
- **Success Rate Score**: Based on historical request success rate
- **Region Match Score**: Based on match between user location and server region

## Installation

Install via npm:

```bash
npm install smart-load-balancer
```

Or use directly via CDN:

```html
<script src="https://unpkg.com/smart-load-balancer@latest/dist/index.min.js"></script>
```

## Quick Start

### Basic Usage

```javascript
import LoadBalancer from "smart-load-balancer";

// Configure server list
const servers = [
  "https://api1.example.com",
  "https://api2.example.com",
  "https://api3.example.com",
];

// Create load balancer instance
const lb = LoadBalancer.getInstance(servers);

// Make requests
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

### Initialization with Configuration

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

## Advanced Usage

### Custom Interceptors

```javascript
// Request interceptor - add auth header
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

// Response interceptor - unified JSON handling
lb.addResponseInterceptor(async (response) => {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const data = await response.json();
    return { ...response, data };
  }
  return response;
});

// Error interceptor - unified error format
lb.addErrorInterceptor((error) => {
  console.error("Request failed:", error);
  throw new Error(`API request failed: ${error.message}`);
});
```

### Custom Scoring Algorithm

```javascript
const config = {
  scoringWeights: {
    latency: 0.7, // Increase latency weight
    successRate: 0.2,
    serverWeight: 0.1,
    region: 0.3, // Enable regional routing
  },
};
```

### Dynamic Configuration Updates

```javascript
// Runtime configuration update
lb.updateConfig({
  healthCheckInterval: 60000,
  circuitBreakerThreshold: 3,
});
```

## Monitoring

### Get Server Status

```javascript
const stats = lb.getServerStats();
console.table(stats);
```

Example output:

| URL                             | Region  | Weight | Health   | Success Rate | Avg Latency |
| ------------------------------- | ------- | ------ | -------- | ------------ | ----------- |
| https://us-west.api.example.com | us-west | 1.2    | healthy  | 0.98         | 124ms       |
| https://eu.api.example.com      | europe  | 1.0    | degraded | 0.82         | 236ms       |

### Get Performance Metrics

```javascript
const metrics = lb.getPerformanceMetrics();
console.log("Total requests:", metrics.requests);
console.log("Success rate:", metrics.successRate);
console.log("Average latency:", metrics.avgLatency);
```

### Get User Location

```javascript
const location = lb.getUserLocation();
console.log("User location:", location.country, location.region);
```

## Core API

### `LoadBalancer.getInstance(servers, config)`

Get singleton load balancer instance

**Parameters**:

- `servers`: (Array) Server list, can be array of strings or objects
- `config`: (Object) Optional configuration object

**Example**:

```javascript
// Simple configuration
const lb1 = LoadBalancer.getInstance([
  "https://api1.example.com",
  "https://api2.example.com",
]);

// Advanced configuration
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

Core method for making requests

**Parameters**:

- `path`: (String) Request path
- `options`: (Object) fetch request options
- `attempt`: (Number) Internal retry count

**Returns**: Promise<Response>

**Example**:

```javascript
lb.request("/api/data", {
  method: "POST",
  body: JSON.stringify({ key: "value" }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## Convenience Methods

### `get(path, options)`

Make GET request

**Example**:

```javascript
lb.get("/api/users")
  .then((res) => res.json())
  .then((users) => console.log(users));
```

### `post(path, body, options)`

Make POST request

**Example**:

```javascript
lb.post("/api/users", { name: "John" })
  .then((res) => res.json())
  .then((result) => console.log(result));
```

## Configuration Management

### `updateConfig(newConfig)`

Update load balancer configuration

**Parameters**:

- `newConfig`: (Object) New configuration object

**Example**:

```javascript
lb.updateConfig({
  healthCheckInterval: 60000,
  maxRetryAttempts: 5,
});
```

## Interceptor API

### `addRequestInterceptor(interceptor)`

Add request interceptor

**Parameters**:

- `interceptor`: (Function) Interceptor function

**Example**:

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

Add response interceptor

**Example**:

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

Add error interceptor

**Example**:

```javascript
lb.addErrorInterceptor((error) => {
  Sentry.captureException(error);
  throw error;
});
```

## Monitoring API

### `getServerStats()`

Get server status statistics

**Returns**: Array<Object>

**Example**:

```javascript
const stats = lb.getServerStats();
stats.forEach((server) => {
  console.log(`${server.url} - ${server.health}`);
});
```

### `getPerformanceMetrics()`

Get performance metrics

**Example**:

```javascript
const metrics = lb.getPerformanceMetrics();
console.log("Average latency:", metrics.avgLatency);
console.log("Success rate:", metrics.successRate);
```

### `getUserLocation()`

Get detected user location

**Example**:

```javascript
const location = lb.getUserLocation();
console.log("User country:", location.country);
```

## Lifecycle Management

### `destroy()`

Destroy load balancer instance

**Example**:

```javascript
// Call during application teardown
window.addEventListener("beforeunload", () => {
  lb.destroy();
});
```

## Complete Configuration Options

| Option                        | Type    | Default   | Description                 |
| ----------------------------- | ------- | --------- | --------------------------- |
| `healthCheckEndpoint`         | String  | `/health` | Health check endpoint       |
| `healthCheckTimeout`          | Number  | `3000`    | Health check timeout(ms)    |
| `healthCheckInterval`         | Number  | `60000`   | Health check interval(ms)   |
| `healthCheckMethod`           | String  | `HEAD`    | Health check method         |
| `maxRetryAttempts`            | Number  | `3`       | Max retry attempts          |
| `initialRetryDelay`           | Number  | `1000`    | Initial retry delay(ms)     |
| `maxRetryDelay`               | Number  | `30000`   | Max retry delay(ms)         |
| `circuitBreakerThreshold`     | Number  | `5`       | Circuit breaker threshold   |
| `circuitBreakerTimeout`       | Number  | `30000`   | Circuit breaker timeout(ms) |
| `enableRegionalRouting`       | Boolean | `false`   | Enable regional routing     |
| `scoringWeights.latency`      | Number  | `0.6`     | Latency score weight        |
| `scoringWeights.successRate`  | Number  | `0.3`     | Success rate score weight   |
| `scoringWeights.serverWeight` | Number  | `0.1`     | Server weight factor        |
| `scoringWeights.region`       | Number  | `0.2`     | Region score weight         |
| `defaultRequestOptions`       | Object  | `{}`      | Default request options     |

## Complete Example

```javascript
import LoadBalancer from "smart-load-balancer";

// 1. Initialization
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

// 2. Add interceptors
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

// 3. Make requests
async function getUserProfile(userId) {
  try {
    const response = await lb.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw error;
  }
}

// 4. Monitoring
setInterval(() => {
  console.table(lb.getServerStats());
}, 60000);
```

## Event System (Advanced)

The load balancer also provides an event subscription mechanism:

```javascript
// Subscribe to server change events
lb.on("serverChanged", (newServer, oldServer) => {
  console.log(`Switched from ${oldServer} to ${newServer}`);
});

// Subscribe to health check events
lb.on("healthCheck", (results) => {
  results.forEach((result) => {
    console.log(`${result.url}: ${result.healthy ? "healthy" : "unhealthy"}`);
  });
});

// Available events:
// - 'initialized': Initialization complete
// - 'serverChanged': Server changed
// - 'healthCheck': Health check completed
// - 'requestStart': Request started
// - 'requestSuccess': Request succeeded
// - 'requestError': Request failed
// - 'circuitBreakerOpen': Circuit breaker opened
// - 'circuitBreakerClose': Circuit breaker closed
```

## Notes

1. **Singleton Pattern**: Ensure the application uses a single instance
2. **Error Handling**: Recommended to add global error interceptors
3. **Performance Monitoring**: Recommended to regularly collect metrics in production
4. **Health Checks**: Adjust frequency based on business requirements
5. **Regional Routing**: Requires explicit server region configuration

## Best Practices

1. **Initialization Timing**: Initialize as early as possible during app startup
2. **Interceptor Order**: Note that interceptor addition order affects execution order
3. **Configuration Tuning**: Adjust timeout and retry parameters based on actual network conditions
4. **Monitoring Integration**: Integrate performance metrics with existing monitoring systems
5. **Progressive Adoption**: Start with non-critical interfaces when first adopting

## Contributing

We welcome contributions of all kinds:

1. **Report Issues**: Report bugs or suggest improvements via GitHub Issues
2. **Code Contributions**: Submit Pull Requests to fix issues or implement features
3. **Documentation Improvements**: Help improve documentation or translations
4. **Test Coverage**: Add test cases to improve code quality

### Development Guide

1. Clone repository:
   ```bash
   git clone https://github.com/d86e/smart-load-balancer.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Build project:
   ```bash
   npm run build
   ```

- [Code Style Guide](CODESTYLE.md)
- [Testing Guide](TESTING.md)

## License

This project is open source under the [MIT License](https://opensource.org/licenses/MIT), see [LICENSE](LICENSE).
