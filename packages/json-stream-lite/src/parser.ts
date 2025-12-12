import { ByteBuffer } from './byte-buffer.js'
import { ByteStream, JsonKeyValuePair, JsonStreamInput } from './types.js'
import { bytesToNumber, bytesToString } from './utils.js'

/**
 * Map of character names to their byte values for JSON parsing.
 * Contains commonly used characters in JSON syntax.
 */
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

/**
 * Checks if a byte represents a whitespace character.
 *
 * @param byte - The byte to check
 * @returns True if the byte is a space, tab, carriage return, or line feed
 */
const isWhitespace = (byte: number | null): boolean => {
    return (
        byte === BYTE_MAP.space ||
        byte === BYTE_MAP.tab ||
        byte === BYTE_MAP.carriageReturn ||
        byte === BYTE_MAP.lineFeed
    )
}

/**
 * Checks if a byte represents a digit (0-9).
 *
 * @param byte - The byte to check
 * @returns True if the byte is a digit
 */
const isDigit = (byte: number | null): boolean => {
    return byte !== null && byte >= BYTE_MAP.zero && byte <= BYTE_MAP.nine
}

/**
 * Checks if a byte can start a JSON number (digit or minus sign).
 *
 * @param byte - The byte to check
 * @returns True if the byte can start a number
 */
const isNumberStart = (byte: number | null): boolean => {
    return (
        byte === BYTE_MAP.minus ||
        (byte !== null && byte >= BYTE_MAP.zero && byte <= BYTE_MAP.nine)
    )
}

/**
 * Checks if a byte is part of a numeric value (digit, dot, e, E, minus, or plus).
 *
 * @param byte - The byte to check
 * @returns True if the byte is part of a numeric representation
 */
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

/**
 * Abstract base class for all JSON entities.
 * Provides common functionality for parsing, reading, and consuming JSON values.
 *
 * @typeParam T - The type of value this entity represents
 */
export abstract class JsonEntity<T> {
    consumed: boolean = false

    protected buffer: ByteBuffer

    /**
     * Creates a new JSON entity.
     *
     * @param buffer - Optional ByteBuffer or ByteStream to read from
     */
    constructor(buffer?: ByteBuffer | ByteStream) {
        this.buffer =
            buffer instanceof ByteBuffer ? buffer : new ByteBuffer(buffer)
    }

    /**
     * Gets the type name of this entity.
     *
     * @returns The constructor name of this entity
     */
    get entityType() {
        return this.constructor.name
    }

    /**
     * Sets the maximum buffer size before compaction occurs.
     *
     * @param size - The maximum buffer size in bytes
     */
    set maxBufferSize(size: number) {
        this.buffer.maxBufferSize = size
    }

    /**
     * Gets the current length of the buffer.
     *
     * @returns The number of bytes in the buffer
     */
    get bufferLength(): number {
        return this.buffer.length
    }

    /**
     * Feeds input data into the buffer.
     *
     * @param input - One or more numbers or arrays of numbers to add to the buffer
     */
    feed(...input: JsonStreamInput[]): void {
        for (const item of input) {
            this.buffer.feed(item)
        }
    }

    /**
     * Abstract method that subclasses must implement to parse their specific type.
     *
     * @returns The parsed value of type T
     */
    protected abstract parse(): T

    /**
     * Skips whitespace characters in the buffer.
     */
    protected skipWhitespace(): void {
        while (isWhitespace(this.buffer.peek())) {
            this.buffer.next()
        }
    }

    /**
     * Reads and parses the entity, consuming it in the process.
     *
     * @returns The parsed value
     * @throws Error if the entity has already been consumed
     */
    read(): T {
        if (this.consumed) {
            throw new Error('JSON entity has already been consumed.')
        }

        const read = this.parse()
        this.consumed = true

        if (this.buffer.canCompact()) this.buffer.compact()

        return read
    }

    /**
     * Asynchronously reads and parses the entity from a stream.
     *
     * @returns A promise that resolves to the parsed value
     * @throws Error if the entity has already been consumed
     */
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

    /**
     * Consumes the entity by reading it if not already consumed.
     */
    consume(): void {
        if (!this.consumed) {
            this.read()
        }
    }

    /**
     * Asynchronously consumes the entity by reading it if not already consumed.
     */
    async consumeAsync(): Promise<void> {
        if (!this.consumed) {
            await this.readAsync()
        }
    }

    /**
     * Attempts to parse by executing a callback, reverting buffer state on failure.
     *
     * @typeParam T - The return type of the callback
     * @param cb - The callback function to execute
     * @returns The result of the callback, or undefined if parsing needs more data
     * @throws Error if the entity has already been consumed
     */
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

/**
 * Represents a JSON string value.
 * Parses and stores string data from the buffer.
 *
 * @typeParam T - The specific string type (defaults to string)
 */
export class JsonString<T extends string = string> extends JsonEntity<T> {
    /**
     * Parses a JSON string from the buffer.
     *
     * @returns The parsed string value
     */
    protected parse(): T {
        const bytes: number[] = []

        this.buffer.next() // consume opening quotes

        while (this.buffer.peek() !== BYTE_MAP.quotes) {
            bytes.push(this.buffer.next())
        }

        this.buffer.next() // consume closing quotes

        const result = bytesToString(new Uint8Array(bytes))
        return result as T
    }
}

/**
 * Represents a JSON number value.
 * Parses numeric data including integers, floats, and scientific notation.
 *
 * @typeParam T - The specific number type (defaults to number)
 */
export class JsonNumber<T extends number = number> extends JsonEntity<T> {
    /**
     * Parses a JSON number from the buffer.
     *
     * @returns The parsed number value
     */
    protected parse(): T {
        const numberBytes: number[] = []

        while (isNumeric(this.buffer.peek())) {
            numberBytes.push(this.buffer.next())
        }

        const result = bytesToNumber(new Uint8Array(numberBytes))
        return result as T
    }
}

/**
 * Represents a JSON boolean value (true or false).
 *
 * @typeParam T - The specific boolean type (defaults to boolean)
 */
export class JsonBoolean<T extends boolean = boolean> extends JsonEntity<T> {
    /**
     * Parses a JSON boolean from the buffer.
     *
     * @returns The parsed boolean value (true or false)
     */
    protected parse(): T {
        const next = this.buffer.next()

        if (next === BYTE_MAP.t) {
            this.buffer.expect(BYTE_MAP.r) // r
            this.buffer.expect(BYTE_MAP.u) // u
            this.buffer.expect(BYTE_MAP.e) // e
            return true as T
        } else {
            this.buffer.expect(BYTE_MAP.a) // a
            this.buffer.expect(BYTE_MAP.l) // l
            this.buffer.expect(BYTE_MAP.s) // s
            this.buffer.expect(BYTE_MAP.e) // e
            return false as T
        }
    }
}

/**
 * Represents a JSON null value.
 */
export class JsonNull extends JsonEntity<null> {
    /**
     * Parses a JSON null from the buffer.
     *
     * @returns null
     */
    protected parse(): null {
        this.buffer.expect(BYTE_MAP.n) // n
        this.buffer.expect(BYTE_MAP.u) // u
        this.buffer.expect(BYTE_MAP.l) // l
        this.buffer.expect(BYTE_MAP.l) // l
        return null
    }
}

/**
 * Union type representing all JSON primitive entity types.
 */
export type JsonPrimitiveType = JsonString | JsonNumber | JsonBoolean | JsonNull

/**
 * Union type representing any JSON value entity type (primitive, object, or array).
 *
 * @typeParam T - The expected type of the value
 */
export type JsonValueType<T = unknown> =
    | JsonPrimitiveType
    | JsonObject<T>
    | JsonArray<T>

/**
 * Represents any JSON value (primitive, object, or array).
 * Provides lazy evaluation and type detection for JSON values.
 *
 * @typeParam T - The expected type of the value
 * @typeParam K - The key type for object properties (defaults to string)
 */
export class JsonValue<
    T extends unknown = unknown,
    K extends string = string,
> extends JsonEntity<JsonValueType<T>> {
    private key?: JsonString<K>
    private value?: JsonValueType<T>

    /**
     * Creates a new JsonValue entity.
     *
     * @param buffer - Optional ByteBuffer or ByteStream to read from
     * @param key - Optional key associated with this value (for object members)
     */
    constructor(buffer?: ByteBuffer | ByteStream, key?: JsonString<K>) {
        super(buffer)
        this.key = key
    }

    /**
     * Parses the value, determining its type and creating the appropriate entity.
     *
     * @returns The parsed JSON entity (primitive, object, or array)
     */
    protected parse(): JsonValueType<T> {
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
            return new JsonObject<T>(this.buffer)
        } else if (next === BYTE_MAP.leftSquare) {
            return new JsonArray<T>(this.buffer)
        } else {
            throw new Error(
                'Unexpected token while parsing JSON value: ' +
                    String.fromCharCode(next ?? 0),
            )
        }
    }

    /**
     * Reads the value entity without reading its contents.
     * Allows for lazy evaluation of the actual value.
     *
     * @returns The JSON entity representing this value
     */
    read(): JsonValueType<T> {
        if (this.value) {
            return this.value
        }

        this.value = super.read()
        this.consumed = false
        return this.value
    }

    /**
     * Reads and fully evaluates the value.
     *
     * @returns The actual JavaScript value (string, number, boolean, null, object, or array)
     */
    readValue(): unknown {
        const value = this.read()
        return value.read()
    }

    /**
     * Asynchronously reads and fully evaluates the value.
     *
     * @returns A promise that resolves to the actual JavaScript value
     */
    async readValueAsync(): Promise<unknown> {
        const value = await this.readAsync()
        return await value.readAsync()
    }

    /**
     * Asynchronously reads the value entity from a stream.
     *
     * @returns A promise that resolves to the JSON entity representing this value
     */
    async readAsync(): Promise<JsonValueType<T>> {
        if (this.value) {
            return this.value
        }

        this.value = await super.readAsync()
        this.consumed = false
        return this.value
    }

    /**
     * Consumes the value, ensuring it is fully read.
     */
    consume(): void {
        if (this.value && !this.value.consumed) {
            this.value.consume()
        } else {
            super.consume()
        }
    }

    /**
     * Asynchronously consumes the value, ensuring it is fully read.
     */
    async consumeAsync(): Promise<void> {
        if (this.value && !this.value.consumed) {
            await this.value.consumeAsync()
        } else {
            await super.consumeAsync()
        }
    }
}

/**
 * Represents a JSON object.
 * Provides streaming access to object members (key-value pairs).
 *
 * @typeParam T - The expected type of the object
 */
export class JsonObject<T = unknown> extends JsonEntity<T> {
    /**
     * Generator that yields object members as key-value pairs.
     * Allows for streaming/incremental processing of large objects.
     *
     * @yields Object containing the key and value entities for each member
     */
    *members(): Generator<{
        key: JsonString<Extract<keyof T, string>>
        value: JsonValue<T>
    }> {
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

            const key = new JsonString<Extract<keyof T, string>>(this.buffer)
            const value = new JsonValue<T>(this.buffer, key)

            yield { key, value }

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

    /**
     * Async generator that yields object members from a stream.
     * Allows for asynchronous streaming/incremental processing.
     *
     * @yields Object containing the key and value entities for each member
     */
    async *membersAsync(): AsyncGenerator<{
        key: JsonString<Extract<keyof T, string>>
        value: JsonValue<T>
    }> {
        while (!this.buffer.atEof()) {
            await this.buffer.readStream()

            const memberGen = this.members()
            let currentMember:
                | IteratorResult<{
                      key: JsonString<Extract<keyof T, string>>
                      value: JsonValue<T>
                  }>
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
                await currentMember.value.key.consumeAsync()
                await currentMember.value.value.consumeAsync()
            }
        }
    }

    /**
     * Returns an iterator for object members.
     * Enables use of for...of loops on JsonObject.
     */
    [Symbol.iterator]() {
        return this.members()
    }

    /**
     * Returns an async iterator for object members.
     * Enables use of for await...of loops on JsonObject.
     */
    [Symbol.asyncIterator]() {
        return this.membersAsync()
    }

    /**
     * Parses the entire object into a JavaScript object.
     *
     * @returns The parsed object
     */
    protected parse(): T {
        const obj: any = {}

        for (const { key, value } of this.members()) {
            obj[key.read()] = value.read().read()
        }

        return obj
    }
}

/**
 * Represents a JSON array.
 * Provides streaming access to array items.
 *
 * @typeParam T - The expected type of array elements
 */
export class JsonArray<T = unknown> extends JsonEntity<T[]> {
    /**
     * Generator that yields array items.
     * Allows for streaming/incremental processing of large arrays.
     *
     * @yields Each item entity in the array
     */
    *items(): Generator<JsonValueType<T>> {
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

            const value = new JsonValue<T>(this.buffer).read()
            yield value

            if (!value.consumed) value.read()
            this.skipWhitespace()
        }

        this.buffer.expect(BYTE_MAP.rightSquare)
        this.consumed = true
    }

    /**
     * Async generator that yields array items from a stream.
     * Allows for asynchronous streaming/incremental processing.
     *
     * @yields Each item entity in the array
     */
    async *itemsAsync(): AsyncGenerator<JsonValueType<T>> {
        while (!this.buffer.atEof()) {
            await this.buffer.readStream()

            const itemGen = this.items()
            let currentItem: IteratorResult<JsonValueType<T>> | undefined =
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

    /**
     * Returns an iterator for array items.
     * Enables use of for...of loops on JsonArray.
     */
    [Symbol.iterator]() {
        return this.items()
    }

    /**
     * Returns an async iterator for array items.
     * Enables use of for await...of loops on JsonArray.
     */
    [Symbol.asyncIterator]() {
        return this.itemsAsync()
    }

    /**
     * Parses the entire array into a JavaScript array.
     *
     * @returns The parsed array
     */
    protected parse(): T[] {
        const values: T[] = []

        for (const value of this) {
            values.push(value.read() as T)
        }

        return values
    }
}

/**
 * Parser that flattens nested JSON structures into key-value pairs.
 * Useful for extracting specific values from complex JSON without parsing the entire structure.
 */
export class JsonKeyValueParser extends JsonEntity<
    Generator<JsonKeyValuePair>
> {
    private container: JsonObject | JsonArray | JsonValue
    private parentKey?: string

    /**
     * Creates a new key-value parser.
     *
     * @param buffer - Optional ByteBuffer or ByteStream to read from
     * @param container - The JSON container to parse (object, array, or value)
     * @param parentKey - The parent key for nested structures (used for dot notation)
     */
    constructor(
        buffer?: ByteBuffer | ByteStream,
        container?: JsonObject | JsonArray | JsonValue,
        parentKey?: string,
    ) {
        super(buffer)
        this.container = container ?? new JsonValue(this.buffer)
        this.parentKey = parentKey
    }

    /**
     * Generator that yields key-value pairs from the JSON structure.
     * Flattens nested objects and arrays using dot notation and array indices.
     *
     * @yields Key-value pairs as [key, value] tuples
     */
    *parse(): Generator<JsonKeyValuePair> {
        if (this.container instanceof JsonObject) {
            for (const { key: keyEntity, value: valueEntity } of this
                .container) {
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

    /**
     * Async generator that yields key-value pairs from a stream.
     *
     * @yields Key-value pairs as [key, value] tuples
     */
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

    /**
     * Returns an iterator for key-value pairs.
     * Enables use of for...of loops on JsonKeyValueParser.
     */
    [Symbol.iterator]() {
        return this.parse()
    }

    /**
     * Returns an async iterator for key-value pairs.
     * Enables use of for await...of loops on JsonKeyValueParser.
     */
    [Symbol.asyncIterator]() {
        return this.parseAsync()
    }
}
