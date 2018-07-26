'use strict';
const fs = require('fs');
const path = require('path');
const test = require('tap').test;
const spawn = require('child_process').spawnSync;

test('Flow types', (t) => {
    const expected = fs.readFileSync(path.join(__dirname, '/fixtures/flow.expected.txt'), 'utf8');
    const result = spawn(path.join(__dirname, '../node_modules/.bin/flow'), [
        '--color=never',
        path.join(__dirname, '/fixtures/flow.input.js.flow')
    ], {encoding: 'utf8'});
    const actual = result.stdout;
    if (process.env.UPDATE) {
        fs.writeFileSync(path.join(__dirname, '/fixtures/flow.expected.txt'), actual);
    }
    t.deepEqual(actual, expected);
    t.end();
});


