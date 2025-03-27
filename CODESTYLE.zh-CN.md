# 代码规范指南

## 1. 代码风格

### 1.1 缩进

- 使用 2 个空格缩进
- 禁止使用 Tab

### 1.2 行宽

- 每行不超过 100 个字符
- 超长表达式应合理换行

### 1.3 命名约定

```javascript
// 类名使用PascalCase
class LoadBalancer {}

// 变量和函数使用camelCase
const serverList = [];
function selectOptimalServer() {}

// 常量使用UPPER_CASE
const MAX_RETRY_COUNT = 3;

// 私有成员使用_前缀
this._healthCheckInterval = 5000;
```

## 2. 注释规范

### 2.1 文件头注释

```javascript
/**
 * 智能负载均衡器核心模块
 * @module loadBalancer
 * @author team
 * @version 1.0.0
 */
```

### 2.2 方法注释

```javascript
/**
 * 选择最优服务节点
 * @param {Object} options - 选择参数
 * @param {boolean} options.forceRefresh - 是否强制刷新节点状态
 * @returns {string} 最优服务节点URL
 * @throws {Error} 当无可用节点时抛出
 */
function selectOptimalServer(options) {}
```

## 3. 提交规范

### 3.1 Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 3.2 类型说明

| 类型     | 说明                   |
| -------- | ---------------------- |
| feat     | 新增功能               |
| fix      | 修复 bug               |
| docs     | 文档变更               |
| style    | 代码格式变更           |
| refactor | 代码重构               |
| test     | 测试相关               |
| chore    | 构建过程或辅助工具变更 |

## 4. 其他要求

- 禁止提交 console.log 调试代码
- 新功能必须包含单元测试
- 修改必须通过现有测试套件

[English Version](CODESTYLE.md)
