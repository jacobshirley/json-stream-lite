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

// Characters that have meaning inside flow collections
const FLOW_INDICATORS = /[,\[\]{}]/

type ResolvedOptions = {
    indent: number
    defaultScalarStyle: 'plain' | 'single-quoted' | 'double-quoted'
    flowLevel: number
    sortKeys: boolean
    stringChunkSize: number
}

/**
 * Whether a multi-line string can be written as a literal block scalar
 * and read back unchanged.
 */
function canUseLiteralBlock(str: string): boolean {
    if (hasControlChars(str) || str.includes('\r')) return false
    // Block indentation is detected from the first line, so it must not
    // be empty or start with whitespace
    if (/^[\s]/.test(str)) return false
    // `|` keeps exactly one trailing newline; more would need `|+`
    if (str.endsWith('\n\n')) return false
    // Trailing whitespace on a line is easily mangled; quote instead
    if (/[ \t]\n|[ \t]$/.test(str)) return false
    return true
}

/**
 * Choose the best representation for a string scalar.
 */
function* formatScalar(
    str: string,
    depth: number,
    indentSize: number,
    defaultStyle: 'plain' | 'single-quoted' | 'double-quoted',
    inFlow: boolean,
): Generator<string> {
    // Multi-line strings: use literal block style where it round-trips
    if (str.includes('\n')) {
        if (!inFlow && canUseLiteralBlock(str)) {
            const indentStr = ' '.repeat(indentSize * Math.max(depth, 1))
            const endsWithNewline = str.endsWith('\n')
            const lines = (endsWithNewline ? str.slice(0, -1) : str).split('\n')

            yield endsWithNewline ? '|\n' : '|-\n'

            for (const line of lines) {
                yield (line === '' ? '' : indentStr + line) + '\n'
            }
            return
        }
        yield formatDoubleQuoted(str)
        return
    }

    // Control characters require double-quoting
    if (hasControlChars(str) || str.includes('\r')) {
        yield formatDoubleQuoted(str)
        return
    }

    // Plain scalar if safe
    if (!needsQuoting(str) && !(inFlow && FLOW_INDICATORS.test(str))) {
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

function formatKey(key: string, inFlow: boolean): string {
    return needsQuoting(key) ||
        hasControlChars(key) ||
        /[\n\r]/.test(key) ||
        (inFlow && FLOW_INDICATORS.test(key))
        ? formatDoubleQuoted(key)
        : key
}

function shouldIgnore(value: unknown): boolean {
    return typeof value === 'function' || typeof value === 'symbol'
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
 * Applies toJSON / toString conversions so the result is a primitive,
 * a plain array or a plain object.
 */
function resolveValue(value: unknown): unknown {
    while (value !== null && typeof value === 'object') {
        if (hasCustomToJSON(value)) {
            value = value.toJSON()
            continue
        }
        if (!Array.isArray(value) && hasCustomToString(value)) {
            return value.toString()
        }
        break
    }
    if (typeof value === 'bigint') return value.toString()
    return value
}

function objectKeys(
    obj: Record<string, unknown>,
    options: ResolvedOptions,
): string[] {
    let keys = Object.keys(obj)
    if (options.sortKeys) keys = keys.sort()
    return keys.filter((k) => obj[k] !== undefined && !shouldIgnore(obj[k]))
}

/**
 * Whether a (resolved) value is written as an indented block on the
 * following lines, rather than inline after `key: ` or `- `.
 */
function isBlockCollection(
    value: unknown,
    depth: number,
    options: ResolvedOptions,
): boolean {
    if (value === null || typeof value !== 'object') return false
    if (options.flowLevel >= 0 && depth >= options.flowLevel) return false
    if (Array.isArray(value)) return value.length > 0
    return objectKeys(value as Record<string, unknown>, options).length > 0
}

/**
 * Yields an inline value followed by exactly one newline.
 */
function* inlineLine(
    value: unknown,
    depth: number,
    options: ResolvedOptions,
): Generator<string> {
    let last = ''
    for (const chunk of yamlStringifyValue(value, depth, options, false)) {
        last = chunk
        yield chunk
    }
    if (!last.endsWith('\n')) yield '\n'
}

/**
 * Yields a block mapping entry or sequence item: `prefix` is everything
 * before the value (e.g. `  key:` or `- `).
 */
function* entry(
    prefix: string,
    value: unknown,
    childDepth: number,
    options: ResolvedOptions,
): Generator<string> {
    if (isBlockCollection(value, childDepth, options)) {
        yield prefix.trimEnd() + '\n'
        yield* yamlStringifyValue(value, childDepth, options, false)
    } else {
        yield prefix.endsWith(' ') ? prefix : prefix + ' '
        yield* inlineLine(value, childDepth, options)
    }
}

/**
 * Internal recursive stringifier. Block collections are written starting
 * at the indentation for `depth`, one line per entry, each ending in a
 * newline. Scalars and flow collections are written inline.
 */
function* yamlStringifyValue(
    value: unknown,
    depth: number,
    options: ResolvedOptions,
    inFlow: boolean,
): Generator<string> {
    value = resolveValue(value)

    if (value === undefined || value === null || shouldIgnore(value)) {
        yield 'null'
        return
    }

    if (typeof value === 'boolean') {
        yield value ? 'true' : 'false'
        return
    }

    if (typeof value === 'number') {
        if (value !== value) {
            yield '.nan'
        } else if (value === Infinity) {
            yield '.inf'
        } else if (value === -Infinity) {
            yield '-.inf'
        } else {
            yield value.toString()
        }
        return
    }

    if (typeof value === 'string') {
        yield* formatScalar(
            value,
            depth,
            options.indent,
            options.defaultScalarStyle,
            inFlow,
        )
        return
    }

    if (typeof value !== 'object') {
        yield* formatScalar(
            String(value),
            depth,
            options.indent,
            options.defaultScalarStyle,
            inFlow,
        )
        return
    }

    const useFlow = inFlow || !isBlockCollection(value, depth, options)
    const indentStr = ' '.repeat(options.indent * depth)

    if (Array.isArray(value)) {
        if (useFlow) {
            yield '['
            for (let i = 0; i < value.length; i++) {
                if (i > 0) yield ', '
                yield* yamlStringifyValue(value[i], depth + 1, options, true)
            }
            yield ']'
            return
        }

        for (const item of value) {
            const resolved = resolveValue(item)
            if (
                resolved !== null &&
                typeof resolved === 'object' &&
                !Array.isArray(resolved) &&
                isBlockCollection(resolved, depth + 1, options)
            ) {
                // Mapping as sequence item: first key goes on the same line
                // as the dash, the rest align with it
                const obj = resolved as Record<string, unknown>
                const keys = objectKeys(obj, options)
                const keyIndent = indentStr + '  '
                // Children of these keys must be indented past the key column
                const childDepth = Math.ceil(
                    (keyIndent.length + 1) / options.indent,
                )

                for (let j = 0; j < keys.length; j++) {
                    const k = keys[j]
                    yield* entry(
                        (j === 0 ? indentStr + '- ' : keyIndent) +
                            formatKey(k, false) +
                            ':',
                        obj[k],
                        childDepth,
                        options,
                    )
                }
            } else {
                yield* entry(indentStr + '- ', resolved, depth + 1, options)
            }
        }
        return
    }

    const obj = value as Record<string, unknown>
    const keys = objectKeys(obj, options)

    if (useFlow) {
        yield '{'
        for (let i = 0; i < keys.length; i++) {
            if (i > 0) yield ', '
            yield formatKey(keys[i], true) + ': '
            yield* yamlStringifyValue(obj[keys[i]], depth + 1, options, true)
        }
        yield '}'
        return
    }

    for (const k of keys) {
        yield* entry(
            indentStr + formatKey(k, false) + ':',
            obj[k],
            depth + 1,
            options,
        )
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

    yield* inlineLine(value, 0, opts)
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
