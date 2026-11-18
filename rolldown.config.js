import {defineConfig} from 'rolldown';

export default defineConfig({
    input: './index.js',
    output: {
        name: 'Pbf',
        format: 'umd',
        file: 'dist/pbf.js',
        minify: true,
        generatedCode: {symbols: false}
    }
});
