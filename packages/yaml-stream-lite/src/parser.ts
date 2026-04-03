import { ByteBuffer } from './byte-buffer.js'
import {
    yamlStreamStringify,
    yamlStreamStringifyAsync,
    yamlStreamStringifyBytes,
    yamlStreamStringifyBytesAsync,
    YamlStreamStringifyOptions,
} from './stringify.js'
import { ByteStream, YamlKeyValuePair, StreamInput } from './types.js'
import { bytesToString } from './utils.js'

// ─── Byte constants ──────────────────────────────────────────────────────────

const B = {
    space: 32,
    tab: 9,
    cr: 13,
    lf: 10,
    hash: 35, // #
    dash: 45, // -
    dot: 46, // .
    colon: 58, // :
    comma: 44, // ,
    pipe: 124, // |
    gt: 62, // >
    singleQuote: 39, // '
    doubleQuote: 34, // "
    backslash: 92, // \
    leftBrace: 123, // {
    rightBrace: 125, // }
    leftSquare: 91, // [
    rightSquare: 93, // ]
    question: 63, // ?
    tilde: 126, // ~
    plus: 43, // +
    zero: 48,
    nine: 57,
    n: 110,
    t: 116,
    b: 98,
    f: 102,
    r: 114,
    u: 117,
    a: 97,
    e: 101,
    x: 120,
    U: 85,
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isDigit(byte: number | null): boolean {
    return byte !== null && byte >= B.zero && byte <= B.nine
}

/**
 * Measure leading spaces at the current buffer position without consuming.
 * Returns the number of spaces (tabs are not allowed for YAML indentation).
 */
function measureIndent(buffer: ByteBuffer): number {
    let count = 0
    while (buffer.peek(count) === B.space) {
        count++
    }
    return count
}

/**
 * Skip blank lines and full-line comments. Stops when we reach a line that
 * has non-comment content (or EOF). Does NOT consume the content of that line.
 */
function skipBlanksAndComments(buffer: ByteBuffer): void {
    while (true) {
        const byte = buffer.peek()
        if (byte === null) return

        // skip CR/LF
        if (byte === B.lf) {
            buffer.next()
            continue
        }
        if (byte === B.cr) {
            buffer.next()
            if (buffer.peek() === B.lf) buffer.next()
            continue
        }

        // measure indent, then check if rest is comment or empty
        const indent = measureIndent(buffer)
        const after = buffer.peek(indent)

        if (after === null || after === B.lf || after === B.cr) {
            // blank line — consume it
            for (let i = 0; i < indent; i++) buffer.next()
            continue
        }

        if (after === B.hash) {
            // comment line — consume indent + comment content
            for (let i = 0; i < indent; i++) buffer.next()
            skipToEndOfLine(buffer)
            continue
        }

        // we're at a line with real content — stop
        return
    }
}

function skipToEndOfLine(buffer: ByteBuffer): void {
    while (true) {
        const byte = buffer.peek()
        if (byte === null) return
        if (byte === B.lf) {
            buffer.next()
            return
        }
        if (byte === B.cr) {
            buffer.next()
            if (buffer.peek() === B.lf) buffer.next()
            return
        }
        buffer.next()
    }
}

function skipInlineWhitespace(buffer: ByteBuffer): void {
    while (true) {
        const byte = buffer.peek()
        if (byte === B.space || byte === B.tab) {
            buffer.next()
        } else {
            return
        }
    }
}

function skipInlineComment(buffer: ByteBuffer): void {
    skipInlineWhitespace(buffer)
    if (buffer.peek() === B.hash) {
        skipToEndOfLine(buffer)
    }
}

function isAtNewlineOrEof(buffer: ByteBuffer): boolean {
    const byte = buffer.peek()
    return byte === null || byte === B.lf || byte === B.cr
}

function consumeNewline(buffer: ByteBuffer): void {
    const byte = buffer.peek()
    if (byte === B.lf) {
        buffer.next()
        return
    }
    if (byte === B.cr) {
        buffer.next()
        if (buffer.peek() === B.lf) buffer.next()
    }
}

/**
 * Check if we're at a `---` or `...` document marker at column 0.
 */
function isDocumentMarker(buffer: ByteBuffer): 'start' | 'end' | false {
    const b0 = buffer.peek(0)
    const b1 = buffer.peek(1)
    const b2 = buffer.peek(2)
    const b3 = buffer.peek(3)

    const afterOk =
        b3 === null ||
        b3 === B.lf ||
        b3 === B.cr ||
        b3 === B.space ||
        b3 === B.tab

    if (b0 === B.dash && b1 === B.dash && b2 === B.dash && afterOk)
        return 'start'
    if (b0 === B.dot && b1 === B.dot && b2 === B.dot && afterOk) return 'end'
    return false
}

// ─── Plain scalar type inference ─────────────────────────────────────────────

function inferScalarType(raw: string): string | number | boolean | null {
    // null
    if (
        raw === 'null' ||
        raw === 'Null' ||
        raw === 'NULL' ||
        raw === '~' ||
        raw === ''
    ) {
        return null
    }
    // boolean
    if (raw === 'true' || raw === 'True' || raw === 'TRUE') return true
    if (raw === 'false' || raw === 'False' || raw === 'FALSE') return false
    // special floats
    if (raw === '.inf' || raw === '.Inf' || raw === '.INF') return Infinity
    if (raw === '-.inf' || raw === '-.Inf' || raw === '-.INF') return -Infinity
    if (raw === '+.inf' || raw === '+.Inf' || raw === '+.INF') return Infinity
    if (raw === '.nan' || raw === '.NaN' || raw === '.NAN') return NaN
    // integer (decimal)
    if (/^[-+]?[0-9]+$/.test(raw)) return Number(raw)
    // integer (octal 0o)
    if (/^0o[0-7]+$/i.test(raw)) return parseInt(raw.slice(2), 8)
    // integer (hex 0x)
    if (/^0x[0-9a-fA-F]+$/i.test(raw)) return parseInt(raw.slice(2), 16)
    // float
    if (
        /^[-+]?(\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE][-+]?[0-9]+)?$/.test(raw) &&
        raw !== ''
    ) {
        const n = Number(raw)
        if (!isNaN(n)) return n
    }
    // string
    return raw
}

// ─── Flow-style helpers ──────────────────────────────────────────────────────

function skipFlowWhitespace(buffer: ByteBuffer): void {
    while (true) {
        const byte = buffer.peek()
        if (
            byte === B.space ||
            byte === B.tab ||
            byte === B.lf ||
            byte === B.cr
        ) {
            buffer.next()
        } else if (byte === B.hash) {
            // skip comment in flow context
            skipToEndOfLine(buffer)
        } else {
            return
        }
    }
}

function isFlowIndicator(byte: number | null): boolean {
    return byte === B.comma || byte === B.rightBrace || byte === B.rightSquare
}

// ─── YamlEntity (abstract base) ─────────────────────────────────────────────

export abstract class YamlEntity<T> {
    consumed: boolean = false
    protected buffer: ByteBuffer

    constructor(buffer?: ByteBuffer | ByteStream) {
        this.buffer =
            buffer instanceof ByteBuffer ? buffer : new ByteBuffer(buffer)
    }

    set eof(value: boolean) {
        this.buffer.eof = value
    }
    set allowBufferToBeExceeded(value: boolean) {
        this.buffer.allowBufferToBeExceeded = value
    }
    set maxBufferSize(size: number) {
        this.buffer.maxBufferSize = size
    }
    get bufferLength(): number {
        return this.buffer.length
    }
    get entityType() {
        return this.constructor.name
    }

    feed(...input: StreamInput[]): void {
        for (const item of input) this.buffer.feed(item)
    }

    protected abstract parse(): T

    protected skipWhitespace(): void {
        while (true) {
            const byte = this.buffer.peek()
            if (
                byte === B.space ||
                byte === B.tab ||
                byte === B.lf ||
                byte === B.cr
            ) {
                this.buffer.next()
            } else {
                return
            }
        }
    }

    read(): T {
        if (this.consumed)
            throw new Error('YAML entity has already been consumed.')
        const result = this.parse()
        this.consumed = true
        if (this.buffer.canCompact()) this.buffer.compact()
        return result
    }

    async readAsync(): Promise<T> {
        if (this.consumed)
            throw new Error('YAML entity has already been consumed.')
        while (!this.buffer.atEof()) {
            const res = this.tryParse(() => this.read())
            if (res !== undefined) return res
            await this.buffer.readStreamAsync()
        }
        return this.read()
    }

    consume(): void {
        if (!this.consumed) this.read()
    }

    async consumeAsync(): Promise<void> {
        if (!this.consumed) await this.readAsync()
    }

    tryParse<R = this>(cb: (entity: this) => R): R | undefined {
        this.buffer.locked = true
        return this.buffer.resetOnFail(
            () => {
                const res = cb(this)
                this.buffer.locked = false
                return res
            },
            () => {
                this.buffer.locked = false
            },
        )
    }

    static stringify(
        value: unknown,
        options?: YamlStreamStringifyOptions,
    ): Generator<string> {
        return yamlStreamStringify(value, options)
    }

    static stringifyBytes(
        value: unknown,
        options?: YamlStreamStringifyOptions,
    ): Generator<Uint8Array> {
        return yamlStreamStringifyBytes(value, options)
    }

    static stringifyAsync(
        value: AsyncIterable<unknown> | Iterable<unknown>,
        options?: YamlStreamStringifyOptions,
    ): AsyncGenerator<string> {
        return yamlStreamStringifyAsync(value, options)
    }

    static stringifyBytesAsync(
        value: AsyncIterable<unknown> | Iterable<unknown>,
        options?: YamlStreamStringifyOptions,
    ): AsyncGenerator<Uint8Array> {
        return yamlStreamStringifyBytesAsync(value, options)
    }
}

// ─── YamlComment ─────────────────────────────────────────────────────────────

export class YamlComment extends YamlEntity<string> {
    protected parse(): string {
        skipInlineWhitespace(this.buffer)
        if (this.buffer.peek() !== B.hash) return ''
        this.buffer.next() // consume #
        // optional space after #
        if (this.buffer.peek() === B.space) this.buffer.next()
        const bytes: number[] = []
        while (true) {
            const byte = this.buffer.peek()
            if (byte === null || byte === B.lf || byte === B.cr) break
            bytes.push(this.buffer.next())
        }
        return bytesToString(new Uint8Array(bytes))
    }
}

// ─── YamlScalar ──────────────────────────────────────────────────────────────

export type YamlScalarStyle =
    | 'plain'
    | 'single-quoted'
    | 'double-quoted'
    | 'literal'
    | 'folded'

export class YamlScalar extends YamlEntity<string | number | boolean | null> {
    public scalarStyle: YamlScalarStyle = 'plain'
    private parentIndent: number
    private inFlow: boolean

    constructor(
        buffer?: ByteBuffer | ByteStream,
        parentIndent: number = -1,
        inFlow: boolean = false,
    ) {
        super(buffer)
        this.parentIndent = parentIndent
        this.inFlow = inFlow
    }

    protected parse(): string | number | boolean | null {
        const byte = this.buffer.peek()

        if (byte === B.doubleQuote) {
            this.scalarStyle = 'double-quoted'
            return this.parseDoubleQuoted()
        }
        if (byte === B.singleQuote) {
            this.scalarStyle = 'single-quoted'
            return this.parseSingleQuoted()
        }
        if (byte === B.pipe) {
            this.scalarStyle = 'literal'
            return this.parseBlockScalar(false)
        }
        if (byte === B.gt) {
            this.scalarStyle = 'folded'
            return this.parseBlockScalar(true)
        }

        this.scalarStyle = 'plain'
        return this.parsePlain()
    }

    /**
     * Yields the raw string content as byte chunks (for quoted scalars).
     */
    *streamBytes(chunkSize: number = 1024): Generator<Uint8Array> {
        const str = this.read()
        const strVal = String(str ?? '')
        const encoder = new TextEncoder()
        const bytes = encoder.encode(strVal)
        for (let i = 0; i < bytes.length; i += chunkSize) {
            yield bytes.slice(i, i + chunkSize)
        }
    }

    async *streamBytesAsync(
        chunkSize: number = 1024,
    ): AsyncGenerator<Uint8Array> {
        while (!this.buffer.atEof()) {
            const stream = this.streamBytes(chunkSize)
            while (true) {
                const next = this.tryParse(() => stream.next())
                if (next === undefined) {
                    await this.buffer.readStreamAsync()
                    break
                }
                if (next.done) return
                yield next.value
            }
        }
    }

    // ── Double-quoted string ──

    private parseDoubleQuoted(): string {
        this.buffer.next() // consume opening "
        const bytes: number[] = []

        while (this.buffer.peek() !== B.doubleQuote) {
            const byte = this.buffer.next()
            if (byte === B.backslash) {
                const esc = this.buffer.next()
                switch (esc) {
                    case B.doubleQuote:
                        bytes.push(B.doubleQuote)
                        break
                    case B.backslash:
                        bytes.push(B.backslash)
                        break
                    case B.n:
                        bytes.push(B.lf)
                        break
                    case B.t:
                        bytes.push(B.tab)
                        break
                    case B.r:
                        bytes.push(B.cr)
                        break
                    case B.b:
                        bytes.push(8)
                        break // backspace
                    case B.f:
                        bytes.push(12)
                        break // form feed
                    case 48:
                        bytes.push(0)
                        break // \0
                    case B.a:
                        bytes.push(7)
                        break // bell
                    case B.e:
                        bytes.push(27)
                        break // escape
                    case B.x: {
                        // \xNN
                        const h1 = this.buffer.next()
                        const h2 = this.buffer.next()
                        const code = parseInt(String.fromCharCode(h1, h2), 16)
                        if (code < 0x80) {
                            bytes.push(code)
                        } else {
                            const enc = new TextEncoder().encode(
                                String.fromCharCode(code),
                            )
                            bytes.push(...enc)
                        }
                        break
                    }
                    case B.u: {
                        // \uNNNN
                        const hex = [
                            this.buffer.next(),
                            this.buffer.next(),
                            this.buffer.next(),
                            this.buffer.next(),
                        ]
                        const code = parseInt(String.fromCharCode(...hex), 16)
                        const enc = new TextEncoder().encode(
                            String.fromCodePoint(code),
                        )
                        bytes.push(...enc)
                        break
                    }
                    case B.U: {
                        // \UNNNNNNNN
                        const hex = []
                        for (let i = 0; i < 8; i++) hex.push(this.buffer.next())
                        const code = parseInt(String.fromCharCode(...hex), 16)
                        const enc = new TextEncoder().encode(
                            String.fromCodePoint(code),
                        )
                        bytes.push(...enc)
                        break
                    }
                    case B.lf: {
                        // line folding: skip subsequent whitespace
                        while (
                            this.buffer.peek() === B.space ||
                            this.buffer.peek() === B.tab
                        )
                            this.buffer.next()
                        break
                    }
                    case B.cr: {
                        if (this.buffer.peek() === B.lf) this.buffer.next()
                        while (
                            this.buffer.peek() === B.space ||
                            this.buffer.peek() === B.tab
                        )
                            this.buffer.next()
                        break
                    }
                    default:
                        bytes.push(esc)
                }
            } else {
                bytes.push(byte)
            }
        }

        this.buffer.next() // consume closing "
        return bytesToString(new Uint8Array(bytes))
    }

    // ── Single-quoted string ──

    private parseSingleQuoted(): string {
        this.buffer.next() // consume opening '
        const bytes: number[] = []

        while (true) {
            const byte = this.buffer.peek()
            if (byte === B.singleQuote) {
                this.buffer.next()
                // '' is an escaped single quote
                if (this.buffer.peek() === B.singleQuote) {
                    bytes.push(B.singleQuote)
                    this.buffer.next()
                } else {
                    break
                }
            } else {
                bytes.push(this.buffer.next())
            }
        }

        return bytesToString(new Uint8Array(bytes))
    }

    // ── Block scalar (literal | or folded >) ──

    private parseBlockScalar(fold: boolean): string {
        this.buffer.next() // consume | or >

        // Parse optional chomping indicator and explicit indent
        let chomping: 'strip' | 'keep' | 'clip' = 'clip'
        let explicitIndent = 0

        while (true) {
            const byte = this.buffer.peek()
            if (byte === B.dash) {
                chomping = 'strip'
                this.buffer.next()
            } else if (byte === B.plus) {
                chomping = 'keep'
                this.buffer.next()
            } else if (isDigit(byte)) {
                explicitIndent = byte! - B.zero
                this.buffer.next()
            } else break
        }

        // skip inline comment after indicator
        skipInlineComment(this.buffer)
        consumeNewline(this.buffer)

        // Determine content indent from first non-empty line
        let contentIndent =
            explicitIndent > 0 ? this.parentIndent + 1 + explicitIndent : 0
        const lines: string[] = []
        let trailingNewlines = 0

        while (true) {
            const byte = this.buffer.peek()
            if (byte === null) break

            // empty line
            if (byte === B.lf || byte === B.cr) {
                trailingNewlines++
                lines.push('')
                consumeNewline(this.buffer)
                continue
            }

            const lineIndent = measureIndent(this.buffer)

            // Auto-detect content indent from first content line
            if (contentIndent === 0 && lineIndent > this.parentIndent) {
                contentIndent = lineIndent
            }

            // If this line is less indented than content, we're done
            if (lineIndent < contentIndent) break

            // Check for document markers at column 0
            if (lineIndent === 0 && isDocumentMarker(this.buffer)) break

            // Consume indent
            for (let i = 0; i < lineIndent; i++) this.buffer.next()

            // Read rest of line
            const lineBytes: number[] = []
            while (true) {
                const b = this.buffer.peek()
                if (b === null || b === B.lf || b === B.cr) break
                lineBytes.push(this.buffer.next())
            }
            consumeNewline(this.buffer)

            // Extra indentation beyond contentIndent is preserved
            const extraIndent = lineIndent - contentIndent
            const prefix = ' '.repeat(extraIndent)

            trailingNewlines = 0
            lines.push(prefix + bytesToString(new Uint8Array(lineBytes)))
        }

        // Join lines based on fold mode
        let result: string
        if (fold) {
            // Folded: single newlines become spaces, double+ newlines become newlines
            const parts: string[] = []
            let current = ''
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                if (line === '') {
                    if (current) {
                        parts.push(current)
                        current = ''
                    }
                    parts.push('')
                } else if (line.startsWith(' ')) {
                    // More-indented lines are preserved literally
                    if (current) {
                        parts.push(current)
                        current = ''
                    }
                    parts.push(line)
                } else {
                    current = current ? current + ' ' + line : line
                }
            }
            if (current) parts.push(current)
            result = parts.join('\n')
        } else {
            result = lines.join('\n')
        }

        // Apply chomping
        if (chomping === 'strip') {
            result = result.replace(/\n+$/, '')
        } else if (chomping === 'clip') {
            result = result.replace(/\n+$/, '') + '\n'
        } else {
            // keep — add back trailing newlines
            result =
                result.replace(/\n+$/, '') + '\n'.repeat(trailingNewlines + 1)
        }

        return result
    }

    // ── Plain (unquoted) scalar ──

    private parsePlain(): string | number | boolean | null {
        const bytes: number[] = []
        let hasContent = false

        while (true) {
            const byte = this.buffer.peek()
            if (byte === null) break

            // newline or EOF ends a plain scalar in block context
            if (!this.inFlow && (byte === B.lf || byte === B.cr)) break

            // flow indicators end a plain scalar in flow context
            if (this.inFlow && isFlowIndicator(byte)) break

            // colon followed by whitespace/flow-indicator/EOF ends key portion
            if (byte === B.colon) {
                const after = this.buffer.peek(1)
                if (
                    after === null ||
                    after === B.space ||
                    after === B.tab ||
                    after === B.lf ||
                    after === B.cr ||
                    (this.inFlow && isFlowIndicator(after))
                ) {
                    break
                }
            }

            // # preceded by whitespace is a comment
            if (byte === B.hash && hasContent) {
                // check if prev byte was whitespace
                if (bytes.length > 0) {
                    const prev = bytes[bytes.length - 1]
                    if (prev === B.space || prev === B.tab) break
                }
            }

            // in flow context, also stop at : { } [ ]
            if (
                this.inFlow &&
                (byte === B.leftBrace ||
                    byte === B.rightBrace ||
                    byte === B.leftSquare ||
                    byte === B.rightSquare)
            )
                break

            bytes.push(this.buffer.next())
            hasContent = true
        }

        const raw = bytesToString(new Uint8Array(bytes)).trim()
        return inferScalarType(raw)
    }
}

// ─── YamlValue ───────────────────────────────────────────────────────────────

export type YamlValueType = YamlScalar | YamlMapping | YamlSequence

export class YamlValue<T = any> extends YamlEntity<YamlValueType> {
    private parentIndent: number
    private inFlow: boolean
    private inline: boolean
    private key?: YamlScalar
    private inner?: YamlValueType
    public hasReadValue: boolean = false

    constructor(
        buffer?: ByteBuffer | ByteStream,
        parentIndent: number = -1,
        inFlow: boolean = false,
        inline: boolean = false,
        key?: YamlScalar,
    ) {
        super(buffer)
        this.parentIndent = parentIndent
        this.inFlow = inFlow
        this.inline = inline
        this.key = key
    }

    protected parse(): YamlValueType {
        // If we have a key, consume it + the colon (like JsonValue does)
        if (this.key) {
            this.key.consume()
            skipInlineWhitespace(this.buffer)
            if (this.buffer.peek() === B.colon) {
                this.buffer.next() // consume :
            }
            skipInlineWhitespace(this.buffer)

            // Check if value is on next line
            const afterColon = this.buffer.peek()
            if (afterColon === B.hash) {
                skipToEndOfLine(this.buffer)
                this.inline = false
            } else if (
                afterColon === B.lf ||
                afterColon === B.cr ||
                afterColon === null
            ) {
                consumeNewline(this.buffer)
                this.inline = false
            } else {
                // Value is inline (same line as key)
                this.inline = true
            }
        }

        if (this.inFlow) {
            skipFlowWhitespace(this.buffer)
        } else if (!this.inline) {
            skipBlanksAndComments(this.buffer)
        }

        // In block context, peek past leading indent to find content byte
        let peekOffset = 0
        if (!this.inFlow && !this.inline) {
            peekOffset = measureIndent(this.buffer)
        }

        const byte = this.buffer.peek(peekOffset)

        // Flow collections
        if (byte === B.leftBrace) {
            return new YamlMapping(this.buffer, this.parentIndent, 'flow')
        }
        if (byte === B.leftSquare) {
            return new YamlSequence(this.buffer, this.parentIndent, 'flow')
        }

        // Block scalar indicators
        if (byte === B.pipe || byte === B.gt) {
            return new YamlScalar(this.buffer, this.parentIndent, false)
        }

        // Quoted scalars
        if (byte === B.doubleQuote || byte === B.singleQuote) {
            return new YamlScalar(this.buffer, this.parentIndent, this.inFlow)
        }

        // In flow context, everything else is a plain scalar
        if (this.inFlow) {
            return new YamlScalar(this.buffer, this.parentIndent, true)
        }

        // Block context: check for block sequence
        if (byte === B.dash) {
            const after = this.buffer.peek(1)
            if (
                after === B.space ||
                after === B.lf ||
                after === B.cr ||
                after === null
            ) {
                return new YamlSequence(
                    this.buffer,
                    this.parentIndent,
                    'block',
                    this.inline,
                )
            }
            // could be a negative number or plain string starting with -
            return new YamlScalar(this.buffer, this.parentIndent, false)
        }

        // Check if this is a block mapping by looking for "key:" pattern
        if (this.isBlockMappingStart()) {
            return new YamlMapping(
                this.buffer,
                this.parentIndent,
                'block',
                this.inline,
            )
        }

        // Plain scalar
        return new YamlScalar(this.buffer, this.parentIndent, false)
    }

    private isBlockMappingStart(): boolean {
        // Scan forward to see if there's a `: ` or `:\n` on this line
        let ahead = 0
        while (true) {
            const byte = this.buffer.peek(ahead)
            if (byte === null || byte === B.lf || byte === B.cr) return false

            if (byte === B.colon) {
                const after = this.buffer.peek(ahead + 1)
                if (
                    after === null ||
                    after === B.space ||
                    after === B.tab ||
                    after === B.lf ||
                    after === B.cr
                ) {
                    return true
                }
            }

            // If we hit a quoted string, skip over it
            if (byte === B.doubleQuote || byte === B.singleQuote) {
                ahead++
                const quote = byte
                while (true) {
                    const b = this.buffer.peek(ahead)
                    if (b === null) return false
                    if (b === quote) {
                        if (
                            quote === B.singleQuote &&
                            this.buffer.peek(ahead + 1) === B.singleQuote
                        ) {
                            ahead += 2
                            continue
                        }
                        ahead++
                        break
                    }
                    if (b === B.backslash && quote === B.doubleQuote) ahead++
                    ahead++
                }
                continue
            }

            ahead++
        }
    }

    read(): YamlValueType {
        if (this.inner) return this.inner
        this.inner = super.read()
        this.consumed = false
        this.hasReadValue = true
        return this.inner
    }

    readValue(): T {
        const entity = this.read()
        return entity.read() as T
    }

    async readValueAsync(): Promise<T> {
        const entity = await this.readAsync()
        return (await entity.readAsync()) as T
    }

    async readAsync(): Promise<YamlValueType> {
        if (this.inner) return this.inner
        this.inner = await super.readAsync()
        this.consumed = false
        return this.inner
    }

    consume(): void {
        if (this.inner && !this.inner.consumed) {
            this.inner.consume()
        } else {
            super.consume()
            this.inner?.consume()
        }
        this.consumed = true
    }

    async consumeAsync(): Promise<void> {
        if (this.inner && !this.inner.consumed) {
            await this.inner.consumeAsync()
        } else {
            await super.consumeAsync()
            await this.inner?.consumeAsync()
        }
        this.consumed = true
    }
}

// ─── YamlMapping ─────────────────────────────────────────────────────────────

export type YamlMappingMember = {
    key: YamlScalar
    value: YamlValue
}

export class YamlMapping extends YamlEntity<Record<string, unknown>> {
    private parentIndent: number
    private style: 'block' | 'flow'
    private inline: boolean

    constructor(
        buffer?: ByteBuffer | ByteStream,
        parentIndent: number = -1,
        style: 'block' | 'flow' = 'block',
        inline: boolean = false,
    ) {
        super(buffer)
        this.parentIndent = parentIndent
        this.style = style
        this.inline = inline
    }

    *members(): Generator<YamlMappingMember> {
        if (this.style === 'flow') {
            yield* this.flowMembers()
        } else {
            yield* this.blockMembers()
        }
    }

    private *flowMembers(): Generator<YamlMappingMember> {
        this.buffer.next() // consume {
        skipFlowWhitespace(this.buffer)

        if (this.buffer.peek() === B.rightBrace) {
            this.buffer.next()
            return
        }

        while (true) {
            skipFlowWhitespace(this.buffer)
            if (this.buffer.peek() === B.rightBrace) {
                this.buffer.next()
                return
            }

            // Parse key — don't read it, let YamlValue consume it
            const key = new YamlScalar(this.buffer, -1, true)
            // In flow context, YamlValue handles key consumption
            const value = new YamlValue(this.buffer, -1, true, false, key)

            yield { key, value }

            value.consume()

            skipFlowWhitespace(this.buffer)

            if (this.buffer.peek() === B.comma) {
                this.buffer.next()
                skipFlowWhitespace(this.buffer)
            }
        }
    }

    private *blockMembers(): Generator<YamlMappingMember> {
        let childIndent = -1
        let isFirstItem = true

        while (true) {
            // For inline first item (mid-line after "- "), skip indent checks
            if (isFirstItem && this.inline) {
                isFirstItem = false
                // We're mid-line. Parse key directly.
                const key = new YamlScalar(
                    this.buffer,
                    this.parentIndent,
                    false,
                )
                const value = new YamlValue(
                    this.buffer,
                    this.parentIndent,
                    false,
                    true,
                    key,
                )

                yield { key, value }
                value.consume()

                // Consume trailing inline comment + newline
                skipInlineComment(this.buffer)
                if (
                    this.buffer.peek() === B.lf ||
                    this.buffer.peek() === B.cr
                ) {
                    consumeNewline(this.buffer)
                }
                continue
            }

            isFirstItem = false
            skipBlanksAndComments(this.buffer)

            const byte = this.buffer.peek()
            if (byte === null) return

            const currentIndent = measureIndent(this.buffer)

            // Set child indent from first key (or second key if first was inline)
            if (childIndent === -1) {
                if (currentIndent <= this.parentIndent) return
                childIndent = currentIndent
            }

            // If we've de-indented, we're done
            if (currentIndent < childIndent) return
            if (currentIndent !== childIndent) return

            // Check for document markers
            if (currentIndent === 0 && isDocumentMarker(this.buffer)) return

            // Consume indent
            for (let i = 0; i < currentIndent; i++) this.buffer.next()

            // Parse key — don't read it, let YamlValue handle consumption
            const key = new YamlScalar(this.buffer, childIndent, false)
            const value = new YamlValue(
                this.buffer,
                childIndent,
                false,
                false,
                key,
            )

            yield { key, value }
            value.consume()

            // Consume trailing inline comment + newline
            skipInlineComment(this.buffer)
            if (this.buffer.peek() === B.lf || this.buffer.peek() === B.cr) {
                consumeNewline(this.buffer)
            }
        }
    }

    async *membersAsync(): AsyncGenerator<YamlMappingMember> {
        while (!this.buffer.atEof()) {
            const memberGen = this.members()
            let current: IteratorResult<YamlMappingMember> | undefined

            while (true) {
                current = this.tryParse(() => memberGen.next())
                if (current === undefined) break
                if (current.done) return
                yield current.value
                await current.value.value.consumeAsync()
            }

            await this.buffer.readStreamAsync()
        }
    }

    [Symbol.iterator]() {
        return this.members()
    }
    [Symbol.asyncIterator]() {
        return this.membersAsync()
    }

    protected parse(): Record<string, unknown> {
        const obj: Record<string, unknown> = {}
        for (const { key, value } of this.members()) {
            const k = String(key.read())
            obj[k] = value.readValue()
        }
        return obj
    }
}

// ─── YamlSequence ────────────────────────────────────────────────────────────

export class YamlSequence extends YamlEntity<unknown[]> {
    private parentIndent: number
    private style: 'block' | 'flow'
    private inline: boolean

    constructor(
        buffer?: ByteBuffer | ByteStream,
        parentIndent: number = -1,
        style: 'block' | 'flow' = 'block',
        inline: boolean = false,
    ) {
        super(buffer)
        this.parentIndent = parentIndent
        this.style = style
        this.inline = inline
    }

    *items(): Generator<YamlValue> {
        if (this.style === 'flow') {
            yield* this.flowItems()
        } else {
            yield* this.blockItems()
        }
    }

    private *flowItems(): Generator<YamlValue> {
        this.buffer.next() // consume [
        skipFlowWhitespace(this.buffer)

        if (this.buffer.peek() === B.rightSquare) {
            this.buffer.next()
            return
        }

        while (true) {
            skipFlowWhitespace(this.buffer)
            if (this.buffer.peek() === B.rightSquare) {
                this.buffer.next()
                return
            }

            const value = new YamlValue(this.buffer, -1, true)
            yield value
            value.consume()

            skipFlowWhitespace(this.buffer)

            if (this.buffer.peek() === B.comma) {
                this.buffer.next()
            }
        }
    }

    private *blockItems(): Generator<YamlValue> {
        let childIndent = -1
        let isFirstItem = true

        while (true) {
            // For inline first item (mid-line after "- "), handle the dash directly
            if (isFirstItem && this.inline) {
                isFirstItem = false

                // We're already past parent's "- ", now at the nested "- "
                if (this.buffer.peek() !== B.dash) return

                // Don't know childIndent yet — set it later from next line
                this.buffer.next() // consume -

                const afterDash = this.buffer.peek()
                if (afterDash === B.space || afterDash === B.tab) {
                    this.buffer.next()
                }

                skipInlineWhitespace(this.buffer)

                // Parse inline item value
                if (isAtNewlineOrEof(this.buffer)) {
                    consumeNewline(this.buffer)
                    const value = new YamlValue(
                        this.buffer,
                        this.parentIndent,
                        false,
                    )
                    yield value
                    value.consume()
                } else {
                    const value = new YamlValue(
                        this.buffer,
                        this.parentIndent,
                        false,
                        true,
                    )
                    yield value
                    value.consume()
                    skipInlineComment(this.buffer)
                    if (
                        this.buffer.peek() === B.lf ||
                        this.buffer.peek() === B.cr
                    ) {
                        consumeNewline(this.buffer)
                    }
                }
                continue
            }

            isFirstItem = false
            skipBlanksAndComments(this.buffer)

            const byte = this.buffer.peek()
            if (byte === null) return

            const currentIndent = measureIndent(this.buffer)

            // Set child indent from first dash at a new line
            if (childIndent === -1) {
                if (currentIndent <= this.parentIndent) return
                const dashByte = this.buffer.peek(currentIndent)
                if (dashByte !== B.dash) return
                childIndent = currentIndent
            }

            if (currentIndent < childIndent) return
            if (currentIndent !== childIndent) return

            // Check for document markers
            if (currentIndent === 0 && isDocumentMarker(this.buffer)) return

            // Verify it's a dash
            const dashCheck = this.buffer.peek(currentIndent)
            if (dashCheck !== B.dash) return

            // Consume indent + dash
            for (let i = 0; i < currentIndent; i++) this.buffer.next()
            this.buffer.next() // consume -

            // Must be followed by space, newline, or EOF
            const afterDash = this.buffer.peek()
            if (afterDash === B.space || afterDash === B.tab) {
                this.buffer.next()
            } else if (
                afterDash !== B.lf &&
                afterDash !== B.cr &&
                afterDash !== null
            ) {
                return
            }

            skipInlineWhitespace(this.buffer)

            const itemParentIndent = childIndent + 1

            if (isAtNewlineOrEof(this.buffer)) {
                consumeNewline(this.buffer)
                const value = new YamlValue(
                    this.buffer,
                    itemParentIndent,
                    false,
                )
                yield value
                value.consume()
            } else {
                const value = new YamlValue(
                    this.buffer,
                    itemParentIndent,
                    false,
                    true,
                )
                yield value
                value.consume()

                skipInlineComment(this.buffer)
                if (
                    this.buffer.peek() === B.lf ||
                    this.buffer.peek() === B.cr
                ) {
                    consumeNewline(this.buffer)
                }
            }
        }
    }

    async *itemsAsync(): AsyncGenerator<YamlValue> {
        while (!this.buffer.atEof()) {
            const itemGen = this.items()
            let current: IteratorResult<YamlValue> | undefined

            while (true) {
                current = this.tryParse(() => itemGen.next())
                if (current === undefined) break
                if (current.done) return
                yield current.value
                await current.value.consumeAsync()
            }

            await this.buffer.readStreamAsync()
        }
    }

    [Symbol.iterator]() {
        return this.items()
    }
    [Symbol.asyncIterator]() {
        return this.itemsAsync()
    }

    protected parse(): unknown[] {
        const arr: unknown[] = []
        for (const value of this) {
            arr.push(value.readValue())
        }
        return arr
    }
}

// ─── YamlDocument ────────────────────────────────────────────────────────────

export class YamlDocument extends YamlEntity<unknown> {
    protected parse(): unknown {
        skipBlanksAndComments(this.buffer)

        // Consume optional --- marker
        if (isDocumentMarker(this.buffer) === 'start') {
            this.buffer.next()
            this.buffer.next()
            this.buffer.next() // consume ---
            skipInlineComment(this.buffer)
            if (this.buffer.peek() === B.lf || this.buffer.peek() === B.cr) {
                consumeNewline(this.buffer)
            }
        }

        skipBlanksAndComments(this.buffer)

        // Check for empty document
        const byte = this.buffer.peek()
        if (byte === null) return null

        const marker = isDocumentMarker(this.buffer)
        if (marker === 'end' || marker === 'start') return null

        const value = new YamlValue(this.buffer, -1, false)
        const result = value.readValue()

        // Consume optional ... marker
        skipBlanksAndComments(this.buffer)
        if (isDocumentMarker(this.buffer) === 'end') {
            this.buffer.next()
            this.buffer.next()
            this.buffer.next()
            skipInlineComment(this.buffer)
            if (this.buffer.peek() === B.lf || this.buffer.peek() === B.cr) {
                consumeNewline(this.buffer)
            }
        }

        return result
    }
}

// ─── YamlStream (multi-document) ─────────────────────────────────────────────

export class YamlStream extends YamlEntity<unknown[]> {
    *documents(): Generator<YamlDocument> {
        while (true) {
            skipBlanksAndComments(this.buffer)
            if (this.buffer.peek() === null) return

            const doc = new YamlDocument(this.buffer)
            yield doc
            doc.consume()
        }
    }

    async *documentsAsync(): AsyncGenerator<YamlDocument> {
        while (!this.buffer.atEof()) {
            const gen = this.documents()
            while (true) {
                const result = this.tryParse(() => gen.next())
                if (result === undefined) break
                if (result.done) return
                yield result.value
                await result.value.consumeAsync()
            }
            await this.buffer.readStreamAsync()
        }
    }

    [Symbol.iterator]() {
        return this.documents()
    }
    [Symbol.asyncIterator]() {
        return this.documentsAsync()
    }

    protected parse(): unknown[] {
        const docs: unknown[] = []
        for (const doc of this.documents()) {
            docs.push(doc.read())
        }
        return docs
    }
}

// ─── YamlKeyValueParser ──────────────────────────────────────────────────────

export class YamlKeyValueParser extends YamlEntity<
    Generator<YamlKeyValuePair>
> {
    private container: YamlMapping | YamlSequence | YamlValue
    private parentKey?: string

    constructor(
        buffer?: ByteBuffer | ByteStream,
        container?: YamlMapping | YamlSequence | YamlValue,
        parentKey?: string,
    ) {
        super(buffer)
        this.container = container ?? new YamlValue(this.buffer, -1, false)
        this.parentKey = parentKey
    }

    *parse(): Generator<YamlKeyValuePair> {
        if (this.container instanceof YamlMapping) {
            for (const { key, value } of this.container) {
                const k = String(key.read())
                const entity = value.read()
                const finalKey = this.parentKey ? `${this.parentKey}.${k}` : k

                if (
                    entity instanceof YamlMapping ||
                    entity instanceof YamlSequence
                ) {
                    yield* new YamlKeyValueParser(
                        this.buffer,
                        entity,
                        finalKey,
                    ).parse()
                } else {
                    yield [finalKey, entity.read() as YamlKeyValuePair[1]]
                }
            }
        } else if (this.container instanceof YamlSequence) {
            let index = 0
            for (const valueEntity of this.container) {
                const entity = valueEntity.read()
                const finalKey = this.parentKey
                    ? `${this.parentKey}[${index}]`
                    : `[${index}]`

                if (
                    entity instanceof YamlMapping ||
                    entity instanceof YamlSequence
                ) {
                    yield* new YamlKeyValueParser(
                        this.buffer,
                        entity,
                        finalKey,
                    ).parse()
                } else {
                    yield [finalKey, entity.read() as YamlKeyValuePair[1]]
                }
                index++
            }
        } else if (this.container instanceof YamlValue) {
            const entity = this.container.read()

            if (
                !(entity instanceof YamlMapping) &&
                !(entity instanceof YamlSequence)
            ) {
                throw new Error(
                    `YamlValue does not contain a composite type. ${entity.entityType} found.`,
                )
            }

            yield* new YamlKeyValueParser(
                this.buffer,
                entity,
                this.parentKey,
            ).parse()
        }
    }

    async *parseAsync(): AsyncGenerator<YamlKeyValuePair> {
        while (!this.buffer.atEof()) {
            const gen = this.parse()
            let current: IteratorResult<YamlKeyValuePair> | undefined

            while (true) {
                current = this.tryParse(() => gen.next())
                if (current === undefined) break
                if (current.done) return
                yield current.value
            }

            await this.buffer.readStreamAsync()
        }
    }

    [Symbol.iterator]() {
        return this.parse()
    }
    [Symbol.asyncIterator]() {
        return this.parseAsync()
    }
}
