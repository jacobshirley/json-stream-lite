import { stringToBytes } from './utils.js'

export type JsonStreamStringifyOptions = {
    stringChunkSize?: number
}

function* formatString(
    str: string,
    chunkSize: number = 1024,
): Iterable<string> {
    const formatted = `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`

    let i = 0
    const len = formatted.length

    if (len === 0) {
        yield '""'
        return
    }

    while (i < len) {
        const chunk = formatted.slice(i, i + chunkSize)
        yield chunk
        i += chunkSize
    }
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

            if (next === undefined) {
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
            if (next === undefined) {
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
