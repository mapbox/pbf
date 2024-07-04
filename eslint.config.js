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
        files: ['bench/*.js'],
        rules: {
            camelcase: 0,
            '@stylistic/js/quotes': 0,
            '@stylistic/js/semi': 0,
            'no-unused-vars': 0
        }
    }
];
