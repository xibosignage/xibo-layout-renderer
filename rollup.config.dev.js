import typescriptPlugin from '@rollup/plugin-typescript';
import terserPlugin from '@rollup/plugin-terser';
import babelPlugin from '@rollup/plugin-babel';
import { nodeResolve as nodeResolvePlugin } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dtsPlugin from 'rollup-plugin-dts';
import analyzerPlugin from 'rollup-plugin-analyzer';
import servePlugin from 'rollup-plugin-serve';
import livereloadPlugin from 'rollup-plugin-livereload';
import postCssPlugin from 'rollup-plugin-postcss';
import path from 'path';

const outputPath = 'dist/xibo-layout-renderer';
const commonInputOptions = {
  input: 'src/xibo-layout-renderer.ts',
  plugins: [
    nodeResolvePlugin({
      mainFields: ['module', 'main'],
    }),
    commonjs({
      include: ['node_modules/**'],
    }),
    typescriptPlugin(),
    postCssPlugin({
      // all `*.css` files in src directory
      extract: path.resolve('dist/styles.css'),
    }),
    babelPlugin({
      exclude: 'node_modules/**',
      passPerPreset: true,
      babelHelpers: 'bundled',
    }),
    analyzerPlugin({
      summaryOnly: true,
    }),
    servePlugin({
      // Launch in browser (default: false)
      open: true,
      // Page to navigate to when opening the browser.
      openPage: '/index.html',
      // Folder to serve files from
      contentBase: ['public', 'dist'],
      // Options used in setting up server
      host: 'localhost',
      port: 8088,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }),
    // Automatic page refresh after any changes
    livereloadPlugin('public'),
  ],
  external: ['axios'],
};
const iifeCommonOutOptions = {
  name: 'XiboLayoutRenderer',
  sourcemap: true,
};

const config = [
  {
    ...commonInputOptions,
    output: [
      {
        file: `${outputPath}.esm.js`,
        format: 'esm',
        sourcemap: true,
      }
    ],
  },
  {
    ...commonInputOptions,
    output: [
      {
        ...iifeCommonOutOptions,
        file: `${outputPath}.js`,
        format: 'iife',
      },
      {
        ...iifeCommonOutOptions,
        file: `${outputPath}.min.js`,
        format: 'iife',
        plugins: [terserPlugin()],
      }
    ],
  },
  {
    ...commonInputOptions,
    output: [
      {
        file: `${outputPath}.cjs.js`,
        format: 'cjs',
        sourcemap: true,
      }
    ]
  },
  {
    ...commonInputOptions,
    plugins: [commonInputOptions.plugins, dtsPlugin()],
    output: [
      {
        file: `${outputPath}.d.ts`,
        format: 'esm',
        sourcemap: true,
      }
    ]
  }
];

export default config;
