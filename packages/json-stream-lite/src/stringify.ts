import { stringToBytes } from './utils.js'

export type JsonStreamStringifyOptions = {
    stringChunkSize?: number
}

function* formatString(
    str: string,
    chunkSize: number = 1024,
): Iterable<string> {
    if (str.length === 0) {
        yield '""'
        return
    }
    const parts = ['"']
    for (let i = 0; i < str.length; i++) {
        const char = str[i]
        switch (char) {
            case '\\':
                parts.push('\\\\')
                break
            case '"':
                parts.push('\\"')
                break
            case '\n':
                parts.push('\\n')
                break
            case '\r':
                parts.push('\\r')
                break
            case '\t':
                parts.push('\\t')
                break
            default:
                parts.push(char)
        }
    }
    parts.push('"')
    const formatted = parts.join('')
    let i = 0
    const len = formatted.length

    while (i < len) {
        const chunk = formatted.slice(i, i + chunkSize)
        yield chunk
        i += chunkSize
    }
}

function shouldIgnore(value: unknown): boolean {
    return typeof value === 'function' || value === undefined
}

function hasCustomToJsonFunction(
    value: object,
): value is { toJSON: () => unknown } {
    return 'toJSON' in value && typeof (value as any).toJSON === 'function'
}

function hasCustomToStringFunction(
    value: object,
): value is { toString: () => string } {
    return (
        'toString' in value &&
        typeof (value as any).toString === 'function' &&
        (value as any).toString !== Object.prototype.toString &&
        (value as any).toString !== Array.prototype.toString
    )
}

function* jsonStreamStringifyWithDepth(
    value: unknown,
    replacer?: any,
    indent: number = 0,
    currentDepth: number = 0,
    options?: JsonStreamStringifyOptions,
): Generator<string> {
    if (replacer) {
        value = replacer('', value)
    }

    if (value && typeof value === 'object') {
        if (hasCustomToJsonFunction(value)) {
            value = value.toJSON()
        } else if (hasCustomToStringFunction(value)) {
            value = value.toString()
        }
    }

    if (value === null) {
        yield 'null'
    } else if (typeof value === 'boolean') {
        yield value ? 'true' : 'false'
    } else if (typeof value === 'number') {
        yield Number.isFinite(value) ? value.toString() : 'null'
    } else if (typeof value === 'string') {
        yield* formatString(value, options?.stringChunkSize)
    } else if (Array.isArray(value)) {
        yield '['

        const len = value.length
        const valueIndent = indent * (currentDepth + 1)

        for (let i = 0; i < len; i++) {
            const next = value[i]

            if (i > 0) {
                yield ','
            }

            if (indent > 0) {
                yield '\n' + ' '.repeat(valueIndent)
            }

            if (shouldIgnore(next)) {
                yield 'null'
                continue
            }

            yield* jsonStreamStringifyWithDepth(
                next,
                replacer,
                indent > 0 ? indent : 0,
                currentDepth + 1,
                options,
            )
        }

        if (indent > 0 && len > 0) {
            yield '\n' + ' '.repeat(indent * currentDepth)
        }

        yield ']'
    } else if (typeof value === 'object') {
        yield '{'

        const keys = Object.keys(value as Record<string, unknown>)
        const len = keys.length
        const valueIndent = indent * (currentDepth + 1)
        let count = 0

        for (let i = 0; i < len; i++) {
            const key = keys[i]

            const next = (value as Record<string, unknown>)[key]

            if (shouldIgnore(next)) {
                continue
            }

            if (count > 0) {
                yield ','
            }

            if (indent > 0) {
                yield '\n' + ' '.repeat(valueIndent)
            }

            yield* formatString(key, options?.stringChunkSize)
            yield `:${indent > 0 ? ' ' : ''}`
            yield* jsonStreamStringifyWithDepth(
                next,
                replacer,
                indent > 0 ? indent : 0,
                currentDepth + 1,
                options,
            )

            count++
        }

        if (indent > 0 && len > 0) {
            yield '\n' + ' '.repeat(indent * currentDepth)
        }

        yield '}'
    }
}

export function jsonStreamStringify(
    value: unknown,
    replacer?: any,
    indent: number = 0,
    options?: JsonStreamStringifyOptions,
): Generator<string> {
    return jsonStreamStringifyWithDepth(value, replacer, indent, 0, options)
}

export function* jsonStreamStringifyBytes(
    value: unknown,
    replacer?: any,
    indent: number = 0,
    options?: JsonStreamStringifyOptions,
): Generator<Uint8Array> {
    const stringGenerator = jsonStreamStringify(
        value,
        replacer,
        indent,
        options,
    )

    for (const chunk of stringGenerator) {
        yield stringToBytes(chunk)
    }
}
