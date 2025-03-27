import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/load-balancer.esm.js',
            format: 'es',
            exports: 'named',
            inlineDynamicImports: true
        },
        {
            file: 'dist/load-balancer.umd.js',
            format: 'umd',
            name: 'LoadBalancer',
            exports: 'named',
            inlineDynamicImports: true
        }
    ],
    plugins: [
        nodeResolve(),
        commonjs(),
        babel({
            babelHelpers: 'bundled',
            presets: ['@babel/preset-env'],
            exclude: 'node_modules/**'
        }),
        terser()
    ]
};