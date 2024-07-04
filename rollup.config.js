import terser from '@rollup/plugin-terser';

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
    config('dist/pbf-dev.js', []),
    config('dist/pbf.js', [terser()])
];
