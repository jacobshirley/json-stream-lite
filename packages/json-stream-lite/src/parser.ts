import { ByteBuffer } from './byte-buffer.js'
import { ByteStream, JsonKeyValuePair } from './types.js'
import { bytesToNumber, bytesToString } from './utils.js'

const BYTE_MAP = {
    quotes: 34,
    a: 97,
    n: 110,
    t: 116,
    f: 102,
    u: 117,
    r: 114,
    l: 108,
    s: 115,
    zero: 48,
    nine: 57,
    minus: 45,
    dot: 46,
    plus: 43,
    e: 101,
    E: 69,
    space: 32,
    tab: 9,
    carriageReturn: 13,
    lineFeed: 10,
    leftBrace: 123,
    rightBrace: 125,
    leftSquare: 91,
    rightSquare: 93,
    comma: 44,
    colon: 58,
}

const isWhitespace = (byte: number | null): boolean => {
    return (
        byte === BYTE_MAP.space ||
        byte === BYTE_MAP.tab ||
        byte === BYTE_MAP.carriageReturn ||
        byte === BYTE_MAP.lineFeed
    )
}

const isDigit = (byte: number | null): boolean => {
    return byte !== null && byte >= BYTE_MAP.zero && byte <= BYTE_MAP.nine
}

const isNumberStart = (byte: number | null): boolean => {
    return (
        byte === BYTE_MAP.minus ||
        (byte !== null && byte >= BYTE_MAP.zero && byte <= BYTE_MAP.nine)
    )
}

const isNumeric = (byte: number | null): boolean => {
    return (
        isDigit(byte) ||
        byte === BYTE_MAP.dot || // .
        byte === BYTE_MAP.e || // e
        byte === BYTE_MAP.E || // E
        byte === BYTE_MAP.minus || // -
        byte === BYTE_MAP.plus // +
    )
}

export abstract class JsonEntity<T> {
    consumed: boolean = false

    protected buffer: ByteBuffer

    constructor(buffer?: ByteBuffer | ByteStream) {
        this.buffer =
            buffer instanceof ByteBuffer ? buffer : new ByteBuffer(buffer)
    }

    get entityType() {
        return this.constructor.name
    }

    set maxBufferSize(size: number) {
        this.buffer.maxBufferSize = size
    }

    get bufferLength(): number {
        return this.buffer.length
    }

    feed(...input: (number | number[])[]): void {
        for (const item of input) {
            this.buffer.feed(item)
        }
    }

    protected abstract parse(): T

    protected skipWhitespace(): void {
        while (isWhitespace(this.buffer.peek())) {
            this.buffer.next()
        }
    }

    read(): T {
        if (this.consumed) {
            throw new Error('JSON entity has already been consumed.')
        }

        const read = this.parse()
        this.consumed = true

        if (this.buffer.canCompact()) this.buffer.compact()

        return read
    }

    async readAsync(): Promise<T> {
        if (this.consumed) {
            throw new Error('JSON entity has already been consumed.')
        }

        while (!this.buffer.atEof()) {
            await this.buffer.readStream()
            const res = this.tryParse(() => this.read())
            if (res !== undefined) {
                return res
            }
        }

        return this.read()
    }

    consume(): void {
        if (!this.consumed) {
            this.read()
        }
    }

    async consumeAsync(): Promise<void> {
        if (!this.consumed) {
            await this.readAsync()
        }
    }

    tryParse<T = this>(cb: (entity: this) => T): T | undefined {
        if (this.consumed) {
            throw new Error('JSON entity has already been consumed.')
        }

        this.buffer.locked = true
        return this.buffer.resetOnFail(
            () => {
                const res = cb(this)
                this.buffer.locked = false
                return res
            },
            (e) => {
                this.buffer.locked = false
            },
        )
    }
}

export class JsonString extends JsonEntity<string> {
    protected parse(): string {
        const bytes: number[] = []

        this.buffer.next() // consume opening quotes

        while (this.buffer.peek() !== BYTE_MAP.quotes) {
            bytes.push(this.buffer.next())
        }

        this.buffer.next() // consume closing quotes

        const result = bytesToString(new Uint8Array(bytes))
        return result
    }
}

export class JsonNumber extends JsonEntity<number> {
    protected parse(): number {
        const numberBytes: number[] = []

        while (isNumeric(this.buffer.peek())) {
            numberBytes.push(this.buffer.next())
        }

        const result = bytesToNumber(new Uint8Array(numberBytes))
        return result
    }
}

export class JsonBoolean extends JsonEntity<boolean> {
    protected parse(): boolean {
        const next = this.buffer.next()

        if (next === BYTE_MAP.t) {
            this.buffer.expect(BYTE_MAP.r) // r
            this.buffer.expect(BYTE_MAP.u) // u
            this.buffer.expect(BYTE_MAP.e) // e
            return true
        } else {
            this.buffer.expect(BYTE_MAP.a) // a
            this.buffer.expect(BYTE_MAP.l) // l
            this.buffer.expect(BYTE_MAP.s) // s
            this.buffer.expect(BYTE_MAP.e) // e
            return false
        }
    }
}

export class JsonNull extends JsonEntity<null> {
    protected parse(): null {
        this.buffer.expect(BYTE_MAP.n) // n
        this.buffer.expect(BYTE_MAP.u) // u
        this.buffer.expect(BYTE_MAP.l) // l
        this.buffer.expect(BYTE_MAP.l) // l
        return null
    }
}

export type JsonPrimitiveType = JsonString | JsonNumber | JsonBoolean | JsonNull
export type JsonValueType = JsonPrimitiveType | JsonObject | JsonArray

export class JsonValue extends JsonEntity<JsonValueType> {
    private key?: JsonString
    private value?: JsonValueType

    constructor(buffer?: ByteBuffer | ByteStream, key?: JsonString) {
        super(buffer)
        this.key = key
    }

    protected parse(): JsonValueType {
        this.key?.consume()

        this.skipWhitespace()
        if (this.buffer.peek() === BYTE_MAP.colon) {
            this.buffer.next() // consume :
            this.skipWhitespace()
        }

        if (this.buffer.peek() === BYTE_MAP.comma) {
            this.buffer.next() // consume ,
            this.skipWhitespace()
        }

        const next = this.buffer.peek()

        if (next === BYTE_MAP.quotes) {
            return new JsonString(this.buffer)
        } else if (isNumberStart(next)) {
            return new JsonNumber(this.buffer)
        } else if (next === BYTE_MAP.t || next === BYTE_MAP.f) {
            return new JsonBoolean(this.buffer)
        } else if (next === BYTE_MAP.n) {
            return new JsonNull(this.buffer)
        } else if (next === BYTE_MAP.leftBrace) {
            return new JsonObject(this.buffer)
        } else if (next === BYTE_MAP.leftSquare) {
            return new JsonArray(this.buffer)
        } else {
            throw new Error(
                'Unexpected token while parsing JSON value: ' +
                    String.fromCharCode(next ?? 0),
            )
        }
    }

    read(): JsonValueType {
        if (this.value) {
            return this.value
        }

        this.value = super.read()
        this.consumed = false
        return this.value
    }

    readValue(): unknown {
        const value = this.read()
        return value.read()
    }

    async readValueAsync(): Promise<unknown> {
        const value = await this.readAsync()
        return await value.readAsync()
    }

    async readAsync(): Promise<JsonValueType> {
        if (this.value) {
            return this.value
        }

        this.value = await super.readAsync()
        this.consumed = false
        return this.value
    }

    consume(): void {
        if (this.value && !this.value.consumed) {
            this.value.consume()
        } else {
            super.consume()
        }
    }

    async consumeAsync(): Promise<void> {
        if (this.value && !this.value.consumed) {
            await this.value.consumeAsync()
        } else {
            await super.consumeAsync()
        }
    }
}

export class JsonObject<T = unknown> extends JsonEntity<T> {
    *members(): Generator<[JsonString, JsonValue]> {
        this.skipWhitespace()

        if (this.buffer.peek() === BYTE_MAP.leftBrace) {
            this.buffer.next() // consume {
        }

        this.skipWhitespace()

        if (this.buffer.peek() === BYTE_MAP.rightBrace) {
            this.buffer.next() // consume }
            return []
        }

        while (this.buffer.peek() !== BYTE_MAP.rightBrace) {
            this.skipWhitespace()

            if (this.buffer.peek() === BYTE_MAP.comma) {
                this.buffer.next() // consume ,
                this.skipWhitespace()
            }

            const key = new JsonString(this.buffer)
            const value = new JsonValue(this.buffer, key)

            yield [key, value]

            key.consume()
            value.consume()

            this.skipWhitespace()

            if (this.buffer.peek() === BYTE_MAP.comma) {
                this.buffer.next() // consume ,
                this.skipWhitespace()
            }
        }

        this.buffer.expect(BYTE_MAP.rightBrace)
        this.consumed = true
    }

    async *membersAsync(): AsyncGenerator<[JsonString, JsonValue]> {
        while (!this.buffer.atEof()) {
            await this.buffer.readStream()

            const memberGen = this.members()
            let currentMember:
                | IteratorResult<[JsonString, JsonValue]>
                | undefined = undefined

            while (true) {
                currentMember = this.tryParse(() => memberGen.next())
                if (currentMember === undefined) {
                    break // Need more data
                }
                if (currentMember.done) {
                    return // No more members
                }
                yield currentMember.value

                // Make sure to consume the key and value asynchronously
                await currentMember.value[0].consumeAsync()
                await currentMember.value[1].consumeAsync()
            }
        }
    }

    [Symbol.iterator]() {
        return this.members()
    }

    [Symbol.asyncIterator]() {
        return this.membersAsync()
    }

    protected parse(): T {
        const obj: any = {}

        for (const [key, value] of this.members()) {
            obj[key.read()] = value.read().read()
        }

        return obj
    }
}

export class JsonArray<T = unknown> extends JsonEntity<T[]> {
    *items(): Generator<JsonValueType> {
        this.skipWhitespace()
        if (this.buffer.peek() === BYTE_MAP.leftSquare) {
            this.buffer.next() // consume [
        }
        this.skipWhitespace()

        if (this.buffer.peek() === BYTE_MAP.rightSquare) {
            this.buffer.next() // consume ]
            return []
        }

        while (this.buffer.peek() !== BYTE_MAP.rightSquare) {
            this.skipWhitespace()
            if (this.buffer.peek() === BYTE_MAP.comma) {
                this.buffer.next() // consume ,
                this.skipWhitespace()
            }

            const value = new JsonValue(this.buffer).read()
            yield value

            if (!value.consumed) value.read()
            this.skipWhitespace()
        }

        this.buffer.expect(BYTE_MAP.rightSquare)
        this.consumed = true
    }

    async *itemsAsync(): AsyncGenerator<JsonValueType> {
        while (!this.buffer.atEof()) {
            await this.buffer.readStream()

            const itemGen = this.items()
            let currentItem: IteratorResult<JsonValueType> | undefined =
                undefined

            while (true) {
                currentItem = this.tryParse(() => itemGen.next())
                if (currentItem === undefined) {
                    break // Need more data
                }
                if (currentItem.done) {
                    return // No more items
                }
                yield currentItem.value

                await currentItem.value.consumeAsync()
            }
        }
    }

    [Symbol.iterator]() {
        return this.items()
    }

    [Symbol.asyncIterator]() {
        return this.itemsAsync()
    }

    protected parse(): T[] {
        const values: T[] = []

        for (const value of this.items()) {
            values.push(value.read() as T)
        }

        return values
    }
}

export class JsonKeyValueParser extends JsonEntity<
    Generator<JsonKeyValuePair>
> {
    private container: JsonObject | JsonArray | JsonValue
    private parentKey?: string

    constructor(
        buffer?: ByteBuffer | ByteStream,
        container?: JsonObject | JsonArray | JsonValue,
        parentKey?: string,
    ) {
        super(buffer)
        this.container = container ?? new JsonValue(this.buffer)
        this.parentKey = parentKey
    }

    *parse(): Generator<JsonKeyValuePair> {
        if (this.container instanceof JsonObject) {
            for (const [keyEntity, valueEntity] of this.container) {
                const key = keyEntity.read()
                const value = valueEntity.read()

                const finalKey = this.parentKey
                    ? `${this.parentKey}.${key}`
                    : key

                if (value instanceof JsonArray || value instanceof JsonObject) {
                    yield* new JsonKeyValueParser(
                        this.buffer,
                        value,
                        finalKey,
                    ).parse()
                } else {
                    yield [finalKey, value.read()]
                }
            }
        } else if (this.container instanceof JsonArray) {
            let index = 0

            for (const valueEntity of this.container) {
                const value = valueEntity
                const finalKey = this.parentKey
                    ? `${this.parentKey}[${index}]`
                    : `[${index}]`

                if (value instanceof JsonArray || value instanceof JsonObject) {
                    yield* new JsonKeyValueParser(
                        this.buffer,
                        value,
                        finalKey,
                    ).parse()
                } else {
                    yield [finalKey, value.read()]
                }
                index++
            }
        } else if (this.container instanceof JsonValue) {
            const value = this.container.read()

            if (
                !(value instanceof JsonArray) &&
                !(value instanceof JsonObject)
            ) {
                throw new Error(
                    `JsonValue does not contain a composite type. ${value.entityType} found.`,
                )
            }

            yield* new JsonKeyValueParser(
                this.buffer,
                value,
                this.parentKey,
            ).parse()
        }
    }

    async *parseAsync(): AsyncGenerator<JsonKeyValuePair> {
        while (!this.buffer.atEof()) {
            await this.buffer.readStream()
            const parserGen = this.parse()

            let currentPair: IteratorResult<JsonKeyValuePair> | undefined =
                undefined

            while (true) {
                currentPair = this.tryParse(() => parserGen.next())
                if (currentPair === undefined) {
                    break // Need more data
                }
                if (currentPair.done) {
                    return // No more pairs
                }
                yield currentPair.value
            }
        }
    }

    [Symbol.iterator]() {
        return this.parse()
    }

    [Symbol.asyncIterator]() {
        return this.parseAsync()
    }
}
