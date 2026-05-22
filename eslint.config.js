import config from 'eslint-config-mourner';

export default [
    ...config,
    {
        files: ['**/*.js', 'bin/pbf'],
        rules: {
            'no-empty': 0,
            'no-cond-assign': 0
        }
    },
    {
        files: ['test/fixtures/*.js'],
        rules: {
            camelcase: 0,
            '@stylistic/quotes': 0,
            '@stylistic/semi': 0,
            '@stylistic/brace-style': 0,
            'no-unused-vars': 0
        }
    }
];
