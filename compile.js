'use strict';

module.exports = compile;

function compile(proto) {
    var code = 'var exports = {};\n';
    code += compileRaw(proto) + '\n';
    code += 'return exports;\n';
    return new Function(code)();
}

compile.raw = compileRaw;

function compileRaw(proto, options) {
    var context = buildContext(proto, null);
    return '\'use strict\';\n' + writeContext(context, options || {});
}

function writeContext(ctx, options) {
    var code = '';
    if (ctx._proto.fields) code += writeMessage(ctx, options);
    if (ctx._proto.values) code += writeEnum(ctx, options);

    for (var i = 0; i < ctx._children.length; i++) {
        code += writeContext(ctx._children[i], options);
    }
    return code;
}

function writeMessage(ctx, options) {
    var name = ctx._name;
    var fields = ctx._proto.fields;

    var code = '\n// ' + name + ' ========================================\n\n';

    if (!options.noRead) {
        code += compileExport(ctx, options) + ' {};\n\n';

        code += name + '.read = function (pbf, end) {\n';
        code += '    return pbf.readFields(' + name + '._readField, ' + compileDest(ctx) + ', end);\n';
        code += '};\n';
        code += name + '._readField = function (tag, obj, pbf) {\n';

        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            var readCode = compileFieldRead(ctx, field);
            code += '    ' + (i ? 'else if' : 'if') +
                ' (tag === ' + field.tag + ') obj.' + field.name +
                (field.repeated && !field.options.packed ?
                    '.push(' + readCode + ')' : ' = ' + readCode) + ';\n';
        }
        code += '};\n';
    }

    if (!options.noWrite) {
        code += name + '.write = function (obj, pbf) {\n';
        var numRepeated = 0;
        for (i = 0; i < fields.length; i++) {
            field = fields[i];
            var writeCode = field.repeated && !field.options.packed ?
                compileRepeatedWrite(ctx, field, numRepeated++) :
                compileFieldWrite(ctx, field, field.name);
            code += '    if (obj.' + field.name + ' !== undefined) ' + writeCode + ';\n';
        }
        code += '};\n';
    }
    return code;
}

function writeEnum(ctx, options) {
    return '\n' + compileExport(ctx, options) + ' ' +
        JSON.stringify(ctx._proto.values, null, 4) + ';\n';
}

function compileExport(ctx, options) {
    var exportsVar = options.exports || 'exports';
    return (ctx._root ? 'var ' + ctx._name + ' = ' + exportsVar + '.' : '') + ctx._name + ' =';
}

function compileDest(ctx) {
    var props = [];
    for (var i = 0; i < ctx._proto.fields.length; i++) {
        var field = ctx._proto.fields[i];

        if (field.repeated && !field.options.packed)
            props.push(field.name + ': []');

        var type = ctx[field.type];

        if (type && type._proto.values && field.options.default !== undefined)
            props.push(field.name + ': ' + JSON.stringify(field.options.default));
    }
    return '{' + props.join(', ') + '}';
}

function compileFieldRead(ctx, field) {
    var type = ctx[field.type];
    if (type) {
        if (type._proto.fields) return type._name + '.read(pbf, pbf.readVarint() + pbf.pos)';
        if (type._proto.values) return 'pbf.readVarint()';
        throw new Error('Unexpected type: ' + type._name);
    }

    var prefix = 'pbf.read';
    if (field.options.packed) prefix += 'Packed';

    switch (field.type) {
    case 'string':   return prefix + 'String()';
    case 'float':    return prefix + 'Float()';
    case 'double':   return prefix + 'Double()';
    case 'bool':     return prefix + 'Boolean()';
    case 'enum':
    case 'uint32':
    case 'uint64':
    case 'int32':
    case 'int64':    return prefix + 'Varint()';
    case 'sint32':
    case 'sint64':   return prefix + 'SVarint()';
    case 'fixed32':  return prefix + 'Fixed32()';
    case 'fixed64':  return prefix + 'Fixed64()';
    case 'sfixed32': return prefix + 'SFixed32()';
    case 'sfixed64': return prefix + 'SFixed64()';
    case 'bytes':    return prefix + 'Bytes()';
    default:         throw new Error('Unexpected type: ' + field.type);
    }
}

function compileFieldWrite(ctx, field, name) {
    var prefix = 'pbf.write';
    if (field.options.packed) prefix += 'Packed';

    var postfix = (field.options.packed ? '' : 'Field') + '(' + field.tag + ', obj.' + name + ')';

    var type = ctx[field.type];
    if (type) {
        if (type._proto.fields) return prefix + 'Message(' + field.tag + ', ' + type._name + '.write, obj.' + name + ')';
        if (type._proto.values) return prefix + 'Varint' + postfix;
        throw new Error('Unexpected type: ' + type._name);
    }

    switch (field.type) {
    case 'string':   return prefix + 'String' + postfix;
    case 'float':    return prefix + 'Float' + postfix;
    case 'double':   return prefix + 'Double' + postfix;
    case 'bool':     return prefix + 'Boolean' + postfix;
    case 'enum':
    case 'uint32':
    case 'uint64':
    case 'int32':
    case 'int64':    return prefix + 'Varint' + postfix;
    case 'sint32':
    case 'sint64':   return prefix + 'SVarint' + postfix;
    case 'fixed32':  return prefix + 'Fixed32' + postfix;
    case 'fixed64':  return prefix + 'Fixed64' + postfix;
    case 'sfixed32': return prefix + 'SFixed32' + postfix;
    case 'sfixed64': return prefix + 'SFixed64' + postfix;
    case 'bytes':    return prefix + 'Bytes' + postfix;
    default:         throw new Error('Unexpected type: ' + field.type);
    }
}

function compileRepeatedWrite(ctx, field, numRepeated) {
    return 'for (' + (numRepeated ? '' : 'var ') +
        'i = 0; i < obj.' + field.name + '.length; i++) ' +
        compileFieldWrite(ctx, field, field.name + '[i]');
}

function buildContext(proto, parent) {
    var obj = Object.create(parent);
    obj._proto = proto;
    obj._children = [];

    if (parent) {
        parent[proto.name] = obj;

        if (parent._name) {
            obj._root = false;
            obj._name = parent._name + '.' + proto.name;
        } else {
            obj._root = true;
            obj._name = proto.name;
        }
    }

    for (var i = 0; proto.enums && i < proto.enums.length; i++) {
        obj._children.push(buildContext(proto.enums[i], obj));
    }

    for (i = 0; proto.messages && i < proto.messages.length; i++) {
        obj._children.push(buildContext(proto.messages[i], obj));
    }

    return obj;
}
