import { stringToBytes } from './utils.js'

/**
 * Options for YAML streaming stringification.
 */
export type YamlStreamStringifyOptions = {
    /** Maximum size of string chunks when yielding formatted strings */
    stringChunkSize?: number
    /** Spaces per indent level (default: 2) */
    indent?: number
    /** Default scalar style for strings */
    defaultScalarStyle?: 'plain' | 'single-quoted' | 'double-quoted'
    /** Depth at which to switch to flow style (-1 = never, default: -1) */
    flowLevel?: number
    /** Sort object keys alphabetically */
    sortKeys?: boolean
}

// Characters that force quoting in a plain scalar
const NEEDS_QUOTING =
    /^[\s\-?:,\[\]{}#&*!|>'"%@`]|[:\s]$|: |[\n\r\t]|^(true|false|null|True|False|Null|TRUE|FALSE|NULL|~|\.inf|\.Inf|\.INF|-.inf|-.Inf|-.INF|\+\.inf|\+\.Inf|\+\.INF|\.nan|\.NaN|\.NAN)$/

// Looks like a number
const LOOKS_NUMERIC =
    /^[-+]?(\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE][-+]?[0-9]+)?$|^0x[0-9a-fA-F]+$|^0o[0-7]+$/

function needsQuoting(str: string): boolean {
    if (str === '') return true
    if (NEEDS_QUOTING.test(str)) return true
    if (LOOKS_NUMERIC.test(str)) return true
    // Check for special chars that would be misinterpreted
    if (str.includes(': ') || str.includes(' #')) return true
    return false
}

function hasControlChars(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i)
        if (code < 0x20 && code !== 0x0a && code !== 0x0d && code !== 0x09)
            return true
    }
    return false
}

/**
 * Format a string as a YAML double-quoted scalar with proper escaping.
 */
function formatDoubleQuoted(str: string): string {
    const parts = ['"']
    for (let i = 0; i < str.length; i++) {
        const char = str[i]
        const code = str.charCodeAt(i)
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
            case '\0':
                parts.push('\\0')
                break
            default:
                if (code < 0x20) {
                    parts.push('\\x' + code.toString(16).padStart(2, '0'))
                } else {
                    parts.push(char)
                }
        }
    }
    parts.push('"')
    return parts.join('')
}

function formatSingleQuoted(str: string): string {
    return "'" + str.replace(/'/g, "''") + "'"
}

/**
 * Choose the best representation for a string scalar.
 */
function* formatScalar(
    str: string,
    depth: number,
    indentSize: number,
    defaultStyle: 'plain' | 'single-quoted' | 'double-quoted',
): Generator<string> {
    // Multi-line strings: use literal block style if no control chars
    if (str.includes('\n') && !hasControlChars(str) && depth >= 0) {
        const indentStr = ' '.repeat(indentSize * (depth + 1))
        const lines = str.split('\n')

        // Check if it ends with a newline
        const endsWithNewline = str.endsWith('\n')
        const contentLines = endsWithNewline ? lines.slice(0, -1) : lines

        if (endsWithNewline) {
            yield '|\n'
        } else {
            yield '|-\n'
        }

        for (const line of contentLines) {
            yield indentStr + line + '\n'
        }
        return
    }

    // Control characters require double-quoting
    if (hasControlChars(str)) {
        yield formatDoubleQuoted(str)
        return
    }

    // Plain scalar if safe
    if (!needsQuoting(str)) {
        yield str
        return
    }

    // Use preferred style
    if (defaultStyle === 'double-quoted' || str.includes("'")) {
        yield formatDoubleQuoted(str)
    } else {
        yield formatSingleQuoted(str)
    }
}

function shouldIgnore(value: unknown): boolean {
    return typeof value === 'function'
}

function hasCustomToJSON(value: object): value is { toJSON: () => unknown } {
    return 'toJSON' in value && typeof (value as any).toJSON === 'function'
}

function hasCustomToString(value: object): value is { toString: () => string } {
    return (
        'toString' in value &&
        typeof (value as any).toString === 'function' &&
        (value as any).toString !== Object.prototype.toString &&
        (value as any).toString !== Array.prototype.toString
    )
}

/**
 * Internal recursive stringifier.
 */
function* yamlStringifyValue(
    value: unknown,
    depth: number,
    options: Required<{
        indent: number
        defaultScalarStyle: 'plain' | 'single-quoted' | 'double-quoted'
        flowLevel: number
        sortKeys: boolean
        stringChunkSize: number
    }>,
    inline: boolean = false,
): Generator<string> {
    const useFlow = options.flowLevel >= 0 && depth >= options.flowLevel
    const indentStr = ' '.repeat(options.indent * depth)
    const childIndentStr = ' '.repeat(options.indent * (depth + 1))

    if (value === undefined || value === null) {
        yield 'null'
        return
    }

    if (typeof value === 'object') {
        if (hasCustomToJSON(value)) {
            value = value.toJSON()
            yield* yamlStringifyValue(value, depth, options, inline)
            return
        }
        if (hasCustomToString(value)) {
            value = value.toString()
        }
    }

    if (typeof value === 'boolean') {
        yield value ? 'true' : 'false'
        return
    }

    if (typeof value === 'number') {
        if (value !== value) {
            yield '.nan'
            return
        } // NaN
        if (value === Infinity) {
            yield '.inf'
            return
        }
        if (value === -Infinity) {
            yield '-.inf'
            return
        }
        yield value.toString()
        return
    }

    if (typeof value === 'string') {
        yield* formatScalar(
            value,
            depth,
            options.indent,
            options.defaultScalarStyle,
        )
        return
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            yield '[]'
            return
        }

        if (useFlow) {
            yield '['
            for (let i = 0; i < value.length; i++) {
                if (i > 0) yield ', '
                yield* yamlStringifyValue(value[i], depth + 1, options, true)
            }
            yield ']'
            return
        }

        // Block sequence
        for (let i = 0; i < value.length; i++) {
            const item = value[i]
            if (shouldIgnore(item)) continue

            if (!inline && i > 0) {
                // items already get newlines from the recursion
            }

            const prefix = inline && i === 0 ? '- ' : indentStr + '- '

            if (
                item !== null &&
                typeof item === 'object' &&
                !Array.isArray(item)
            ) {
                // Mapping as sequence item: first key goes on same line as dash
                const obj = item as Record<string, unknown>
                let keys = Object.keys(obj)
                if (options.sortKeys) keys = keys.sort()
                const validKeys = keys.filter((k) => !shouldIgnore(obj[k]))

                if (validKeys.length === 0) {
                    yield prefix + '{}\n'
                    continue
                }

                for (let j = 0; j < validKeys.length; j++) {
                    const k = validKeys[j]
                    const v = obj[k]
                    const keyStr = needsQuoting(k) ? formatDoubleQuoted(k) : k

                    if (j === 0) {
                        yield prefix + keyStr + ':'
                    } else {
                        yield indentStr + '  ' + keyStr + ':'
                    }

                    if (v !== null && typeof v === 'object') {
                        yield '\n'
                        yield* yamlStringifyValue(v, depth + 2, options, false)
                    } else {
                        yield ' '
                        yield* yamlStringifyValue(v, depth + 2, options, true)
                        yield '\n'
                    }
                }
            } else if (Array.isArray(item)) {
                yield prefix + '\n'
                yield* yamlStringifyValue(item, depth + 1, options, false)
            } else {
                yield prefix
                yield* yamlStringifyValue(item, depth + 1, options, true)
                yield '\n'
            }
        }
        return
    }

    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>
        let keys = Object.keys(obj)
        if (options.sortKeys) keys = keys.sort()
        const validKeys = keys.filter((k) => !shouldIgnore(obj[k]))

        if (validKeys.length === 0) {
            yield '{}'
            return
        }

        if (useFlow) {
            yield '{'
            let first = true
            for (const k of validKeys) {
                if (!first) yield ', '
                first = false
                const keyStr = needsQuoting(k) ? formatDoubleQuoted(k) : k
                yield keyStr + ': '
                yield* yamlStringifyValue(obj[k], depth + 1, options, true)
            }
            yield '}'
            return
        }

        // Block mapping
        for (let i = 0; i < validKeys.length; i++) {
            const k = validKeys[i]
            const v = obj[k]
            const keyStr = needsQuoting(k) ? formatDoubleQuoted(k) : k
            const prefix = inline && i === 0 ? '' : indentStr

            yield prefix + keyStr + ':'

            if (v !== null && typeof v === 'object') {
                yield '\n'
                yield* yamlStringifyValue(v, depth + 1, options, false)
            } else {
                yield ' '
                yield* yamlStringifyValue(v, depth + 1, options, true)
                yield '\n'
            }
        }
        return
    }
}

/**
 * Converts a JavaScript value to YAML format, yielding string chunks.
 */
export function* yamlStreamStringify(
    value: unknown,
    options?: YamlStreamStringifyOptions,
): Generator<string> {
    const opts = {
        indent: options?.indent ?? 2,
        defaultScalarStyle: options?.defaultScalarStyle ?? ('plain' as const),
        flowLevel: options?.flowLevel ?? -1,
        sortKeys: options?.sortKeys ?? false,
        stringChunkSize: options?.stringChunkSize ?? 1024,
    }

    yield* yamlStringifyValue(value, 0, opts, false)
}

/**
 * Converts a JavaScript value to YAML format, yielding Uint8Array byte chunks.
 */
export function* yamlStreamStringifyBytes(
    value: unknown,
    options?: YamlStreamStringifyOptions,
): Generator<Uint8Array> {
    for (const chunk of yamlStreamStringify(value, options)) {
        yield stringToBytes(chunk)
    }
}

/**
 * Async YAML stringify for iterables — each item becomes a separate YAML document.
 */
export async function* yamlStreamStringifyAsync(
    value: AsyncIterable<unknown> | Iterable<unknown>,
    options?: YamlStreamStringifyOptions,
): AsyncGenerator<string> {
    let isFirst = true
    for await (const item of value) {
        if (!isFirst) {
            yield '---\n'
        }
        isFirst = false
        yield* yamlStreamStringify(item, options)
    }
}

/**
 * Async YAML stringify yielding byte chunks.
 */
export async function* yamlStreamStringifyBytesAsync(
    value: AsyncIterable<unknown> | Iterable<unknown>,
    options?: YamlStreamStringifyOptions,
): AsyncGenerator<Uint8Array> {
    for await (const chunk of yamlStreamStringifyAsync(value, options)) {
        yield stringToBytes(chunk)
    }
}
