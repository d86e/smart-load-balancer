import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2';

const entries = [
    {
        input: 'src/index.js',
        outputPrefix: 'index',
        minify: true
    },
    {
        input: 'src/loadBalancer.js',
        outputPrefix: 'loadBalancer'
    }
];

export default entries.map(entry => {
    const external = ['loadBalancer.js'];
    return {
        input: entry.input,
        output: entry.outputPrefix === 'index' ? [
            {
                file: `dist/${entry.outputPrefix}.js`,
                format: 'umd',
                name: 'LoadBalancer',
                exports: 'named',
                sourcemap: true
            },
            {
                file: `dist/${entry.outputPrefix}.min.js`,
                format: 'umd',
                name: 'LoadBalancer',
                exports: 'named',
                sourcemap: true,
                plugins: [terser()]
            }
        ] : [
            {
                file: `dist/${entry.outputPrefix}.esm.js`,
                format: 'es',
                exports: 'named',
                sourcemap: true
            },
            {
                file: `dist/${entry.outputPrefix}.umd.js`,
                format: 'umd',
                name: 'LoadBalancer',
                exports: 'named',
                sourcemap: true
            },
            {
                file: `dist/${entry.outputPrefix}.browser.js`,
                format: 'iife',
                name: 'LoadBalancer',
                exports: 'named',
                sourcemap: true
            }
        ],
        plugins: [
            nodeResolve(),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
                useTsconfigDeclarationDir: true,
                tsconfigOverride: {
                    compilerOptions: {
                        declaration: true,
                        declarationDir: 'dist',
                        emitDeclarationOnly: true
                    }
                },
                check: false
            }),
            babel({
                babelHelpers: 'bundled',
                presets: ['@babel/preset-env'],
                exclude: 'node_modules/**'
            }),
            terser()
        ],
        external
    };
});