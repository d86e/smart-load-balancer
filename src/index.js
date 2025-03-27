/**
 * @file Main entry point for the load balancer package
 * @module load-balancer
 */

import LoadBalancer from './loadBalancer.js';

// Polyfill fetch for Node.js environment
if (typeof globalThis.fetch === 'undefined') {
    try {
        globalThis.fetch = require('node-fetch');
    } catch (err) {
        console.warn('node-fetch is required for Node.js environment');
    }
}

/**
 * Creates a new LoadBalancer instance or returns existing one
 * @param {Array<string>} serverUrls - Array of server URLs
 * @param {Object} [config={}] - Configuration options
 * @returns {LoadBalancer} Load balancer instance
 */
export function createLoadBalancer(serverUrls, config = {}) {
    return new LoadBalancer(serverUrls, config);
}

// Export LoadBalancer class
export { LoadBalancer };