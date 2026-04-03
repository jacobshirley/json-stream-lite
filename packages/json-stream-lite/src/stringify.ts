import { stringToBytes } from './utils.js'

/**
 * Comment entry for JSONC stringification.
 */
export type JsoncStringifyComment =
    | string
    | { text: string; style?: 'line' | 'block' }

/**
 * Options for JSON streaming stringification.
 */
export type JsonStreamStringifyOptions = {
    /** Maximum size of string chunks when yielding formatted strings */
    stringChunkSize?: number
    /** Enable JSONC output (trailing commas after last items) */
    jsonc?: boolean
    /** Comments to emit, keyed by dot-notation path. Only emitted when indent > 0. */
    comments?: Record<string, JsoncStringifyComment | JsoncStringifyComment[]>
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
        const charCode = str.charCodeAt(i)

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
                // Escape control characters (0x00-0x1F) as \uXXXX
                if (charCode < 0x20) {
                    parts.push('\\u' + charCode.toString(16).padStart(4, '0'))
                } else {
                    parts.push(char)
                }
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
 * Yields comment string(s) for a given path from the comments map.
 */
function* emitComments(
    path: string,
    options: JsonStreamStringifyOptions | undefined,
    indentStr: string,
): Generator<string> {
    if (!options?.comments || !options.comments[path]) return
    const entries = options.comments[path]
    const list = Array.isArray(entries) ? entries : [entries]
    for (const entry of list) {
        const text = typeof entry === 'string' ? entry : entry.text
        const style =
            typeof entry === 'string' ? 'line' : (entry.style ?? 'line')
        if (style === 'line') {
            yield `${indentStr}// ${text}\n`
        } else {
            yield `${indentStr}/* ${text} */\n`
        }
    }
}

/**
 * Internal recursive function that stringifies a value with depth tracking.
 * Handles all JSON types including primitives, arrays, and objects.
 *
 * @param value - The value to stringify
 * @param replacer - Optional replacer function for value transformation
 * @param indent - Number of spaces for indentation (0 for compact)
 * @param currentDepth - Current nesting depth for indentation
 * @param start - Indicates if this is the start of the stringification
 * @param options - Stringification options
 * @param currentPath - Current dot-notation path for comment matching
 * @yields String chunks representing the JSON output
 */
function* jsonStreamStringifyWithDepth(
    value: unknown,
    replacer?: any,
    indent: number = 0,
    currentDepth: number = 0,
    start: boolean = true,
    options?: JsonStreamStringifyOptions,
    currentPath: string = '',
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

    // If this is the first call and indenting, add initial indentation
    if (start && indent > 0 && currentDepth > 0) {
        yield ' '.repeat(indent * currentDepth)
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
        const len = value.length
        const valueIndent = indent * (currentDepth + 1)
        const valueIndentStr = indent > 0 ? ' '.repeat(valueIndent) : ''
        const isJsonc = options?.jsonc === true

        yield '['

        for (let i = 0; i < len; i++) {
            const next = value[i]
            const isLast = i === len - 1

            if (i > 0) {
                yield ','
            }

            if (indent > 0) {
                yield '\n'
                const itemPath = currentPath ? `${currentPath}[${i}]` : `[${i}]`
                yield* emitComments(itemPath, options, valueIndentStr)
                yield valueIndentStr
            }

            if (shouldIgnore(next)) {
                yield 'null'
                if (isLast && isJsonc) yield ','
                continue
            }

            const itemPath = currentPath ? `${currentPath}[${i}]` : `[${i}]`
            yield* jsonStreamStringifyWithDepth(
                next,
                replacer,
                indent > 0 ? indent : 0,
                currentDepth + 1,
                false,
                options,
                itemPath,
            )

            if (isLast && isJsonc) yield ','
        }

        if (indent > 0 && len > 0) {
            yield '\n' + ' '.repeat(indent * currentDepth)
        }

        yield ']'
    } else if (typeof value === 'object') {
        const keys = Object.keys(value as Record<string, unknown>)
        const len = keys.length
        const valueIndent = indent * (currentDepth + 1)
        const valueIndentStr = indent > 0 ? ' '.repeat(valueIndent) : ''
        const isJsonc = options?.jsonc === true
        let count = 0
        // Count non-ignored keys for trailing comma logic
        const validKeys = keys.filter(
            (k) => !shouldIgnore((value as Record<string, unknown>)[k]),
        )
        const totalValid = validKeys.length

        yield '{'

        for (let i = 0; i < len; i++) {
            const key = keys[i]

            const next = (value as Record<string, unknown>)[key]

            if (shouldIgnore(next)) {
                continue
            }

            if (count > 0) {
                yield ','
            }

            const memberPath = currentPath ? `${currentPath}.${key}` : key

            if (indent > 0) {
                yield '\n'
                yield* emitComments(memberPath, options, valueIndentStr)
                yield valueIndentStr
            }

            yield* formatString(key, options?.stringChunkSize)
            yield `:${indent > 0 ? ' ' : ''}`
            yield* jsonStreamStringifyWithDepth(
                next,
                replacer,
                indent > 0 ? indent : 0,
                currentDepth + 1,
                false,
                options,
                memberPath,
            )

            count++

            if (count === totalValid && isJsonc) yield ','
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
    return jsonStreamStringifyWithDepth(
        value,
        replacer,
        indent,
        0,
        true,
        options,
    )
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

export async function* jsonStreamStringifyAsync(
    value: AsyncIterable<unknown> | Iterable<unknown>,
    replacer?: any,
    indent: number = 0,
    options?: JsonStreamStringifyOptions,
): AsyncGenerator<string> {
    yield '['
    if (indent > 0) yield '\n'

    let isFirst = true
    for await (const item of value) {
        const stringGenerator = jsonStreamStringifyWithDepth(
            item,
            replacer,
            indent,
            1,
            true,
            options,
        )

        if (!isFirst) {
            yield ','

            if (indent > 0) yield '\n'
        } else {
            isFirst = false
        }

        for (const chunk of stringGenerator) {
            yield chunk
        }
    }
    if (indent > 0) yield '\n'
    yield ']'
}

export async function* jsonStreamStringifyBytesAsync(
    value: AsyncIterable<unknown> | Iterable<unknown>,
    replacer?: any,
    indent: number = 0,
    options?: JsonStreamStringifyOptions,
): AsyncGenerator<Uint8Array> {
    for await (const chunk of jsonStreamStringifyAsync(
        value,
        replacer,
        indent,
        options,
    )) {
        yield stringToBytes(chunk)
    }
}
