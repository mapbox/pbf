import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const config = (file, plugins) => ({
    input: './index.js',
    output: {
        name: 'Pbf',
        format: 'umd',
        indent: false,
        file
    },
    plugins
});

export default [
    config('dist/pbf-dev.js', [resolve(), commonjs()]),
    config('dist/pbf.js', [resolve(), commonjs(), terser()])
];
