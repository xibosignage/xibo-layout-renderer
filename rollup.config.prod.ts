/*
 * Copyright (C) 2025 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */

// rollup.config.prod.ts
import type { InputOptions, OutputOptions, RollupOptions } from 'rollup';

import {importMetaAssets} from "@web/rollup-plugin-import-meta-assets";
import { nodeResolve as nodeResolvePlugin } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescriptPlugin from '@rollup/plugin-typescript';
import postCssPlugin from 'rollup-plugin-postcss';
import babelPlugin from '@rollup/plugin-babel';
import analyzerPlugin from 'rollup-plugin-analyzer';
import terserPlugin from '@rollup/plugin-terser';
import imagePlugin from '@rollup/plugin-image';
import dtsPlugin from 'rollup-plugin-dts';
import nodePolyfillsPlugin from 'rollup-plugin-polyfill-node';
import path from 'path';

const libName = 'xibo-layout-renderer';
const outputPath = 'dist/';
const commonInputOptions: InputOptions = {
    input: 'src/index.ts',
    external: ['xibo-interactive-control', 'jquery'],
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
        nodePolyfillsPlugin(),
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
        imagePlugin(),
        importMetaAssets(),
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
                exports: 'named',
                sourcemap: true,
                globals: {
                    'jquery': '$',
                },
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
                exports: 'named',
                globals: {
                    'jquery': '$',
                },
            },
            {
                ...iifeCommonOutputOptions,
                file: `${outputPath}${libName}.min.js`,
                format: 'iife',
                sourcemap: true,
                exports: 'named',
                plugins: [
                    terserPlugin(),
                ],
                globals: {
                    'jquery': '$',
                },
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
