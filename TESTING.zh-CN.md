# 测试指南

## 1. 测试框架

- 使用 Jest 作为测试框架
- 覆盖率工具：Istanbul
- 断言库：内置 expect

## 2. 测试结构

### 2.1 文件命名

```
test/
  ├── unit/       # 单元测试
  │   └── *.test.js
  ├── integration/ # 集成测试
  │   └── *.test.js
  └── e2e/        # 端到端测试
      └── *.test.js
```

### 2.2 测试用例结构

```javascript
describe("LoadBalancer", () => {
  let lb;

  beforeEach(() => {
    lb = new LoadBalancer(config);
  });

  describe("#selectOptimalServer", () => {
    it("应返回评分最高的服务器", () => {
      // 测试代码
    });

    it("无可用服务器时应抛出错误", () => {
      // 测试代码
    });
  });
});
```

## 3. 测试规范

### 3.1 覆盖率要求

| 指标       | 最低要求 |
| ---------- | -------- |
| 语句覆盖率 | 90%      |
| 分支覆盖率 | 85%      |
| 函数覆盖率 | 95%      |
| 行覆盖率   | 90%      |

### 3.2 Mock 规范

```javascript
// 使用Jest mock
jest.mock("../src/healthCheck", () => ({
  check: jest.fn().mockResolvedValue(true),
}));

// 手动mock
const mockServer = {
  url: "http://mock.server",
  isHealthy: true,
};
```

## 4. 测试运行

### 4.1 运行全部测试

```bash
npm test
```

### 4.2 运行特定测试

```bash
npm test -- -t "selectOptimalServer"
```

### 4.3 生成覆盖率报告

```bash
npm test -- --coverage
```

## 5. 最佳实践

1. 每个测试用例只测试一个功能点
2. 使用描述性的测试名称
3. 避免测试实现细节
4. 测试应包括：
   - 正常路径测试
   - 边界条件测试
   - 错误路径测试
5. 测试数据应独立且可重复

[English Version](TESTING.md)
