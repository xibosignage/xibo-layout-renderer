// rollup.config.prod.ts
import type { InputOptions, OutputOptions, RollupOptions } from 'rollup';

import { nodeResolve as nodeResolvePlugin } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescriptPlugin from '@rollup/plugin-typescript';
import postCssPlugin from 'rollup-plugin-postcss';
import babelPlugin from '@rollup/plugin-babel';
import analyzerPlugin from 'rollup-plugin-analyzer';
import terserPlugin from '@rollup/plugin-terser';
import dtsPlugin from 'rollup-plugin-dts';
import path from 'path';

const libName = 'xibo-layout-renderer';
const outputPath = 'dist/';
const commonInputOptions: InputOptions = {
    input: 'src/index.ts',
    plugins: [
        nodeResolvePlugin({
            preferBuiltins: true,
            mainFields: ['module', 'main'],
            browser: true,
        }),
        commonjs({
          include: ['node_modules/**'],
          extensions: ['.js', '.ts'],
        }),
        babelPlugin({
            include: ['src/**', 'node_modules/nanoevents/**'],
            // extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts'],
            extensions: ['.js', '.ts'],
            passPerPreset: true,
            babelHelpers: 'bundled',
            presets: ['@babel/preset-env'],
        }),
        typescriptPlugin(),
        postCssPlugin({
          // all `*.css` files in src directory
          extract: path.resolve('dist/styles.css'),
        }),
        analyzerPlugin({
          summaryOnly: true,
        }),
    ],
};

const iifeCommonOutputOptions: OutputOptions = {
    name: 'XiboLayoutRenderer',
};

const config: RollupOptions[] = [
    {
        ...commonInputOptions,
        output: [
            {
                file: `${outputPath}${libName}.esm.js`,
                format: 'esm',
            }
        ],
    },
    {
        ...commonInputOptions,
        output: [
            {
                ...iifeCommonOutputOptions,
                file: `${outputPath}${libName}.js`,
                format: 'iife',
            },
            {
                ...iifeCommonOutputOptions,
                file: `${outputPath}${libName}.min.js`,
                format: 'iife',
                sourcemap: true,
                plugins: [
                    terserPlugin(),
                ],
            }
        ],
    },
    {
        ...commonInputOptions,
        plugins: [commonInputOptions.plugins],
        output: [
            {
                file: `${outputPath}${libName}.cjs.js`,
                format: 'cjs',
                sourcemap: true,
                exports: 'named',
            }
        ],
    },
    {
        ...commonInputOptions,
        plugins: [commonInputOptions.plugins, dtsPlugin()],
        output: [
            {
                file: `${outputPath}${libName}.d.ts`,
                format: 'esm',
            }
        ],
    }
];

export default config;
