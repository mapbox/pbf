import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
// @ts-expect-error untyped package
import parse from 'protocol-buffers-schema';

/** @param {string | URL} p */
const toPath = p => p instanceof URL ? fileURLToPath(p) : p;

/**
 * Reads and parses a .proto file, merging in messages and enums from all the files it imports (directly or
 * transitively). Imports are looked up relative to the importing file, then in each of the include paths.
 * @param {string | URL} filename
 * @param {{paths?: (string | URL)[]}} [options] Include paths (like protoc's `-I`); the default is the
 * current working directory.
 */
export function resolve(filename, {paths = ['.']} = {}) {
    const root = path.resolve(toPath(filename));
    const includeDirs = paths.map(p => path.resolve(toPath(p)));
    const seen = new Set([root]);

    /** @param {string} file */
    function read(file) {
        const schema = parse(fs.readFileSync(file, 'utf8'));
        for (const dep of schema.imports) {
            const depFile = find(dep, file);
            if (seen.has(depFile)) continue;
            seen.add(depFile);
            const {messages, enums} = read(depFile);
            schema.messages.push(...messages);
            schema.enums.push(...enums);
        }
        return schema;
    }

    /**
     * @param {string} dep
     * @param {string} from
     */
    function find(dep, from) {
        const dirs = [path.dirname(from), ...includeDirs];
        for (const dir of dirs) {
            const file = path.resolve(dir, dep);
            if (fs.existsSync(file)) return file;
        }
        throw new Error(`Import "${dep}" in ${from} not found in: ${[...new Set(dirs)].join(', ')}`);
    }

    return read(root);
}
