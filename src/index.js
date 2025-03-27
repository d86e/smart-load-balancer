import LoadBalancer from './loadBalancer.js';

(function () {
    // 检测模块系统
    const isBrowser = typeof window !== 'undefined';
    const isAMD = typeof define === 'function' && define.amd;
    const isCommonJS = typeof module === 'object' && typeof module.exports === 'object';

    // 根据环境导出
    if (isBrowser) {
        // 浏览器环境 - 挂载到window
        window.LoadBalancer = LoadBalancer;
    } else if (isAMD) {
        // AMD环境
        define([], () => LoadBalancer);
    } else if (isCommonJS) {
        // CommonJS环境
        module.exports = LoadBalancer;
    }
    // ESM环境默认支持
})();

export default LoadBalancer;