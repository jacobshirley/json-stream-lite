import { stringToBytes } from './utils.js'

/**
 * Options for JSON streaming stringification.
 */
export type JsonStreamStringifyOptions = {
    /** Maximum size of string chunks when yielding formatted strings */
    stringChunkSize?: number
}

/**
 * Formats a string value for JSON output, escaping special characters.
 * Yields the formatted string in chunks for memory efficiency.
 *
 * @param str - The string to format
 * @param chunkSize - Maximum size of each yielded chunk (default: 1024)
 * @yields Formatted string chunks with proper JSON escaping
 */
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
            case '\b':
                parts.push('\\b')
                break
            case '\f':
                parts.push('\\f')
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

/**
 * Determines if a value should be ignored during stringification.
 * Functions and undefined values are not valid in JSON.
 *
 * @param value - The value to check
 * @returns True if the value should be ignored
 */
function shouldIgnore(value: unknown): boolean {
    return typeof value === 'function' || value === undefined
}

/**
 * Type guard to check if an object has a custom toJSON method.
 *
 * @param value - The object to check
 * @returns True if the object has a toJSON method
 */
function hasCustomToJsonFunction(
    value: object,
): value is { toJSON: () => unknown } {
    return 'toJSON' in value && typeof (value as any).toJSON === 'function'
}

/**
 * Type guard to check if an object has a custom toString method.
 * Excludes default Object and Array toString methods.
 *
 * @param value - The object to check
 * @returns True if the object has a custom toString method
 */
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

/**
 * Internal recursive function that stringifies a value with depth tracking.
 * Handles all JSON types including primitives, arrays, and objects.
 *
 * @param value - The value to stringify
 * @param replacer - Optional replacer function for value transformation
 * @param indent - Number of spaces for indentation (0 for compact)
 * @param currentDepth - Current nesting depth for indentation
 * @param options - Stringification options
 * @yields String chunks representing the JSON output
 */
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

/**
 * Converts a JavaScript value to JSON format, yielding string chunks.
 * Provides memory-efficient streaming stringification for large objects.
 *
 * @param value - The value to stringify
 * @param replacer - Optional replacer function or array for filtering/transforming values
 * @param indent - Number of spaces for indentation (0 for compact output)
 * @param options - Additional stringification options
 * @returns Generator yielding JSON string chunks
 *
 * @example
 * ```typescript
 * const data = { name: "John", age: 30 };
 * for (const chunk of jsonStreamStringify(data)) {
 *   process.stdout.write(chunk);
 * }
 * ```
 */
export function jsonStreamStringify(
    value: unknown,
    replacer?: any,
    indent: number = 0,
    options?: JsonStreamStringifyOptions,
): Generator<string> {
    return jsonStreamStringifyWithDepth(value, replacer, indent, 0, options)
}

/**
 * Converts a JavaScript value to JSON format, yielding Uint8Array byte chunks.
 * Provides memory-efficient streaming stringification with binary output.
 *
 * @param value - The value to stringify
 * @param replacer - Optional replacer function or array for filtering/transforming values
 * @param indent - Number of spaces for indentation (0 for compact output)
 * @param options - Additional stringification options
 * @returns Generator yielding JSON as Uint8Array chunks
 *
 * @example
 * ```typescript
 * const data = { name: "John", age: 30 };
 * for (const chunk of jsonStreamStringifyBytes(data)) {
 *   await stream.write(chunk);
 * }
 * ```
 */
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
