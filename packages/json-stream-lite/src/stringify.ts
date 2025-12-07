const DEFAULT_CHUNK_SIZE = 1024 * 16 // 16KB

export type JsonStreamStringifyOptions = {
    chunkSize?: number
}

function* chunkStream(
    iterable: Iterable<string>,
    chunkSize: number,
): Generator<string> {
    let parts: string[] = []
    let currentSize = 0

    for (const chunk of iterable) {
        if (currentSize + chunk.length < chunkSize) {
            parts.push(chunk)
            currentSize += chunk.length
        } else {
            // Only concatenate when we need to yield
            const buffer = parts.join('') + chunk
            parts = []

            let offset = 0
            while (offset + chunkSize <= buffer.length) {
                yield buffer.slice(offset, offset + chunkSize)
                offset += chunkSize
            }

            const remainder = buffer.slice(offset)
            if (remainder) {
                parts = [remainder]
                currentSize = remainder.length
            } else {
                currentSize = 0
            }
        }
    }

    if (parts.length > 0) {
        yield parts.join('')
    }
}

function formatString(str: string): string {
    return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`
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
        (value as any).toString !== Object.prototype.toString
    )
}

function* jsonStreamStringifyWithDepth(
    value: unknown,
    replacer?: any,
    indent: number = 0,
    currentDepth: number = 0,
): Generator<string> {
    if (replacer) {
        value = replacer('', value)
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
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
        yield formatString(value)
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

            yield formatString(key)
            yield `:${indent > 0 ? ' ' : ''}`
            yield* jsonStreamStringifyWithDepth(
                next,
                replacer,
                indent > 0 ? indent : 0,
                currentDepth + 1,
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
    return chunkStream(
        jsonStreamStringifyWithDepth(value, replacer, indent, 0),
        options?.chunkSize ?? DEFAULT_CHUNK_SIZE,
    )
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

    const encoder = new TextEncoder()
    for (const chunk of stringGenerator) {
        yield encoder.encode(chunk)
    }
}
