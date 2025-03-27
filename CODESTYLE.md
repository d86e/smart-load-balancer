# Code Style Guide

## 1. Code Style

### 1.1 Indentation

- Use 2 spaces for indentation
- Tabs are prohibited

### 1.2 Line Length

- Maximum 100 characters per line
- Break long expressions appropriately

### 1.3 Naming Conventions

```javascript
// Class names use PascalCase
class LoadBalancer {}

// Variables and functions use camelCase
const serverList = [];
function selectOptimalServer() {}

// Constants use UPPER_CASE
const MAX_RETRY_COUNT = 3;

// Private members use _ prefix
this._healthCheckInterval = 5000;
```

## 2. Comment Standards

### 2.1 File Header Comments

```javascript
/**
 * Smart Load Balancer Core Module
 * @module loadBalancer
 * @author team
 * @version 1.0.0
 */
```

### 2.2 Method Comments

```javascript
/**
 * Select optimal server node
 * @param {Object} options - Selection parameters
 * @param {boolean} options.forceRefresh - Whether to force refresh node status
 * @returns {string} Optimal server URL
 * @throws {Error} When no available nodes
 */
function selectOptimalServer(options) {}
```

## 3. Commit Standards

### 3.1 Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 3.2 Type Explanation

| Type     | Description                   |
| -------- | ----------------------------- |
| feat     | New feature                   |
| fix      | Bug fix                       |
| docs     | Documentation changes         |
| style    | Code formatting changes       |
| refactor | Code refactoring              |
| test     | Test related                  |
| chore    | Build process or tool changes |

## 4. Other Requirements

- No console.log debug code in commits
- New features must include unit tests
- Changes must pass existing test suite

[中文版本](CODESTYLE.zh-CN.md)
