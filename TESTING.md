# Testing Guide

## 1. Testing Framework

- Testing framework: Jest
- Coverage tool: Istanbul
- Assertion library: Built-in expect

## 2. Test Structure

### 2.1 File Naming

```
test/
  ├── unit/       # Unit tests
  │   └── *.test.js
  ├── integration/ # Integration tests
  │   └── *.test.js
  └── e2e/        # End-to-end tests
      └── *.test.js
```

### 2.2 Test Case Structure

```javascript
describe("LoadBalancer", () => {
  let lb;

  beforeEach(() => {
    lb = new LoadBalancer(config);
  });

  describe("#selectOptimalServer", () => {
    it("should return server with highest score", () => {
      // Test code
    });

    it("should throw error when no available servers", () => {
      // Test code
    });
  });
});
```

## 3. Testing Standards

### 3.1 Coverage Requirements

| Metric    | Minimum Requirement |
| --------- | ------------------- |
| Statement | 90%                 |
| Branch    | 85%                 |
| Function  | 95%                 |
| Line      | 90%                 |

### 3.2 Mocking Standards

```javascript
// Using Jest mock
jest.mock("../src/healthCheck", () => ({
  check: jest.fn().mockResolvedValue(true),
}));

// Manual mock
const mockServer = {
  url: "http://mock.server",
  isHealthy: true,
};
```

## 4. Running Tests

### 4.1 Run All Tests

```bash
npm test
```

### 4.2 Run Specific Tests

```bash
npm test -- -t "selectOptimalServer"
```

### 4.3 Generate Coverage Report

```bash
npm test -- --coverage
```

## 5. Best Practices

1. Each test case should focus on one functionality
2. Use descriptive test names
3. Avoid testing implementation details
4. Tests should include:
   - Happy path testing
   - Edge case testing
   - Error path testing
5. Test data should be independent and repeatable

[中文版本](TESTING.zh-CN.md)
