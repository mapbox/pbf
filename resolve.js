import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
// @ts-expect-error untyped package
import parse from 'protocol-buffers-schema';

/**
 * Reads and parses a .proto file, merging in messages and enums from all the files it imports (directly or
 * transitively). Import paths are resolved relative to the importing file.
 * @param {string | URL} filename
 */
export function resolve(filename) {
    const root = filename instanceof URL ? fileURLToPath(filename) : filename;
    const seen = new Set([path.resolve(root)]);

    /** @param {string} file */
    function read(file) {
        const schema = parse(fs.readFileSync(file, 'utf8'));
        for (const dep of schema.imports) {
            const depFile = path.resolve(path.dirname(file), dep);
            if (seen.has(depFile)) continue;
            seen.add(depFile);
            const {messages, enums} = read(depFile);
            schema.messages.push(...messages);
            schema.enums.push(...enums);
        }
        return schema;
    }

    return read(root);
}
