**json-stream-lite**

---

# json-stream-lite

A lightweight, memory-efficient streaming JSON parser and stringifier for JavaScript and TypeScript. Process large JSON files without loading them entirely into memory.

## Features

- 🚀 **Stream parsing**: Parse JSON incrementally as data arrives
- 💾 **Memory efficient**: Process large JSON files without loading them entirely into memory
- 🔄 **Bidirectional**: Both parse and stringify JSON in streaming fashion
- 🎯 **Type-safe**: Full TypeScript support with comprehensive type definitions
- 🔌 **Flexible input**: Support for sync/async iterables, ReadableStreams, strings, and byte arrays
- 🎨 **Key-value extraction**: Flatten nested JSON structures into key-value pairs
- ⚡ **Zero dependencies**: Minimal footprint with no external runtime dependencies

## Installation

```bash
npm install json-stream-lite
```

```bash
pnpm add json-stream-lite
```

```bash
yarn add json-stream-lite
```

## Quick Start

### Parsing JSON

#### Parse a complete JSON object incrementally

```typescript
import { JsonObject } from 'json-stream-lite'

const json = '{"name": "Alice", "age": 30, "active": true}'
const parser = new JsonObject()

// Feed bytes into the parser
parser.feed(...new TextEncoder().encode(json))

// Read the complete object
const result = parser.read()
console.log(result) // { name: 'Alice', age: 30, active: true }
```

#### Stream through object members

```typescript
import { JsonObject } from 'json-stream-lite'

const json = '{"name": "Alice", "age": 30, "city": "NYC"}'
const parser = new JsonObject()
parser.feed(...new TextEncoder().encode(json))

// Iterate through key-value pairs without loading the entire object
for (const [keyEntity, valueEntity] of parser.members()) {
    const key = keyEntity.read()
    const value = valueEntity.read().read()
    console.log(`${key}: ${value}`)
}
// Output:
// name: Alice
// age: 30
// city: NYC
```

#### Parse JSON arrays incrementally

```typescript
import { JsonArray } from 'json-stream-lite'

const json = '[1, 2, 3, 4, 5]'
const parser = new JsonArray()
parser.feed(...new TextEncoder().encode(json))

// Process each item individually
for (const item of parser.items()) {
    console.log(item.read())
}
// Output: 1, 2, 3, 4, 5
```

### Async Streaming

Process JSON from async sources like HTTP responses or file streams:

```typescript
import { JsonObject } from 'json-stream-lite'

async function processStream(stream: ReadableStream<Uint8Array>) {
    const parser = new JsonObject(stream)

    // Asynchronously iterate through members
    for await (const [keyEntity, valueEntity] of parser.membersAsync()) {
        const key = keyEntity.read()
        const value = await valueEntity.readValueAsync()
        console.log(`${key}: ${value}`)
    }
}

// Example with fetch
const response = await fetch('https://api.example.com/data.json')
await processStream(response.body!)
```

### Key-Value Extraction

Flatten nested JSON structures into dot-notation key-value pairs:

```typescript
import { jsonKeyValueParser } from 'json-stream-lite'

const json = '{"user": {"name": "Alice", "scores": [95, 87, 92]}}'

for (const [key, value] of jsonKeyValueParser(json)) {
    console.log(`${key} = ${value}`)
}
// Output:
// user.name = Alice
// user.scores[0] = 95
// user.scores[1] = 87
// user.scores[2] = 92
```

#### Async key-value extraction

```typescript
import { jsonKeyValueParserAsync } from 'json-stream-lite'

async function extractKeyValues(stream: ReadableStream) {
    for await (const [key, value] of jsonKeyValueParserAsync(stream)) {
        console.log(`${key} = ${value}`)
    }
}
```

### Stringifying JSON

Convert JavaScript objects to JSON strings in a streaming fashion:

```typescript
import { jsonStreamStringify } from 'json-stream-lite'

const data = {
    name: 'Alice',
    scores: [95, 87, 92],
    metadata: { verified: true },
}

// Generate JSON in chunks
for (const chunk of jsonStreamStringify(data, null, 2)) {
    process.stdout.write(chunk)
}
```

#### Stringify to bytes

```typescript
import { jsonStreamStringifyBytes } from 'json-stream-lite'

const data = { name: 'Alice', age: 30 }

for (const bytes of jsonStreamStringifyBytes(data)) {
    // bytes is a Uint8Array
    await writeToFile(bytes)
}
```

#### Control chunk size

```typescript
import { jsonStreamStringify } from 'json-stream-lite'

const data = { longString: 'x'.repeat(10000) }

// Control how strings are chunked (default: 1024 bytes)
for (const chunk of jsonStreamStringify(data, null, 0, {
    stringChunkSize: 512,
})) {
    console.log(chunk.length) // Chunks will be ~512 bytes
}
```

## API Reference

### Parser Classes

#### `JsonValue`

Represents any JSON value. Automatically detects the type and returns the appropriate entity.

```typescript
import { JsonValue } from 'json-stream-lite'

const parser = new JsonValue()
parser.feed(...bytes)
const valueEntity = parser.read() // Returns JsonString, JsonNumber, etc.
const actualValue = valueEntity.read()
```

#### `JsonObject`

Parses JSON objects.

```typescript
class JsonObject<T = unknown> extends JsonEntity<T>

// Methods
members(): Generator<[JsonString, JsonValue]>
membersAsync(): AsyncGenerator<[JsonString, JsonValue]>
read(): T
readAsync(): Promise<T>
```

#### `JsonArray`

Parses JSON arrays.

```typescript
class JsonArray<T = unknown> extends JsonEntity<T[]>

// Methods
items(): Generator<JsonValueType>
itemsAsync(): AsyncGenerator<JsonValueType>
read(): T[]
readAsync(): Promise<T[]>
```

#### `JsonString`, `JsonNumber`, `JsonBoolean`, `JsonNull`

Parse primitive JSON values.

```typescript
const str = new JsonString()
str.feed(...bytes)
console.log(str.read()) // Returns a string

const num = new JsonNumber()
num.feed(...bytes)
console.log(num.read()) // Returns a number
```

#### `JsonKeyValueParser`

Flattens nested JSON into key-value pairs.

```typescript
class JsonKeyValueParser extends JsonEntity<Generator<JsonKeyValuePair>>

// Methods
parse(): Generator<[string, JsonPrimitive]>
parseAsync(): AsyncGenerator<[string, JsonPrimitive]>
```

### Base Class: `JsonEntity`

All parser classes extend `JsonEntity<T>`:

```typescript
// Properties
consumed: boolean
bufferLength: number
maxBufferSize: number

// Methods
feed(...input: (number | number[])[]): void
read(): T
readAsync(): Promise<T>
consume(): void
consumeAsync(): Promise<void>
tryParse<T>(cb: (entity: this) => T): T | undefined
```

### Generator Functions

#### `jsonKeyValueParser(bytes: Iterable<number> | string)`

Synchronously parse JSON into key-value pairs.

```typescript
import { jsonKeyValueParser } from 'json-stream-lite'

for (const [key, value] of jsonKeyValueParser('{"a": 1, "b": [2, 3]}')) {
    console.log(key, value)
}
// a 1
// b[0] 2
// b[1] 3
```

#### `jsonKeyValueParserAsync(bytes: AsyncIterable<number> | ReadableStream | string)`

Asynchronously parse JSON into key-value pairs.

```typescript
import { jsonKeyValueParserAsync } from 'json-stream-lite'

for await (const [key, value] of jsonKeyValueParserAsync(stream)) {
    console.log(key, value)
}
```

### Stringify Functions

#### `jsonStreamStringify(value, replacer?, indent?, options?)`

Generate JSON string chunks.

```typescript
function jsonStreamStringify(
    value: unknown,
    replacer?: any,
    indent?: number,
    options?: JsonStreamStringifyOptions,
): Generator<string>

interface JsonStreamStringifyOptions {
    stringChunkSize?: number // Default: 1024
}
```

**Parameters:**

- `value`: The value to stringify
- `replacer`: Optional replacer function called on each value (with empty key at the root) during stringification
- `indent`: Number of spaces for indentation (0 for compact)
- `options.stringChunkSize`: Maximum size of string chunks in bytes

#### `jsonStreamStringifyBytes(value, replacer?, indent?, options?)`

Generate JSON as Uint8Array chunks.

```typescript
function jsonStreamStringifyBytes(
    value: unknown,
    replacer?: any,
    indent?: number,
    options?: JsonStreamStringifyOptions,
): Generator<Uint8Array>
```

## Advanced Usage

### Processing Large Files

```typescript
import { createReadStream } from 'fs'
import { JsonObject } from 'json-stream-lite'

async function processLargeFile(filePath: string) {
    const stream = createReadStream(filePath)
    const parser = new JsonObject(stream)

    for await (const [keyEntity, valueEntity] of parser) {
        const key = keyEntity.read()
        const value = await valueEntity.readValueAsync()

        // Process each key-value pair without loading entire file
        await processRecord(key, value)
    }
}
```

### Handling Nested Structures

```typescript
import { JsonObject, JsonArray } from 'json-stream-lite'

const json = '{"users": [{"name": "Alice"}, {"name": "Bob"}]}'
const parser = new JsonObject()
parser.feed(...new TextEncoder().encode(json))

for (const [keyEntity, valueEntity] of parser) {
    const key = keyEntity.read()
    const value = valueEntity.read()

    if (key === 'users' && value instanceof JsonArray) {
        for (const userEntity of value.items()) {
            const user = userEntity.read()
            console.log(user) // Each user object
        }
    }
}
```

### Incremental Feeding

```typescript
import { JsonObject } from 'json-stream-lite'

const parser = new JsonObject()

// Feed data incrementally as it arrives
parser.feed(123) // {
parser.feed(34, 110, 97, 109, 101, 34) // "name"
parser.feed(58, 34, 65, 108, 105, 99, 101, 34) // :"Alice"
parser.feed(125) // }

const result = parser.read()
console.log(result) // { name: 'Alice' }
```

## Use Cases

### 1. Processing API Responses

```typescript
async function processApiResponse(url: string) {
    const response = await fetch(url)
    const parser = new JsonObject(response.body!)

    for await (const [keyEntity, valueEntity] of parser.membersAsync()) {
        const key = keyEntity.read()
        const value = await valueEntity.readValueAsync()
        console.log(`Processing ${key}:`, value)
    }
}
```

### 2. Log File Analysis

```typescript
import { jsonKeyValueParserAsync } from 'json-stream-lite'

async function analyzeLogFile(stream: ReadableStream) {
    const metrics: Record<string, number> = {}

    for await (const [key, value] of jsonKeyValueParserAsync(stream)) {
        if (typeof value === 'number') {
            metrics[key] = (metrics[key] || 0) + value
        }
    }

    return metrics
}
```

### 3. Generating Large JSON Files

```typescript
import { jsonStreamStringifyBytes } from 'json-stream-lite'
import { createWriteStream } from 'fs'

async function generateLargeFile(data: unknown, outputPath: string) {
    const writeStream = createWriteStream(outputPath)

    for (const chunk of jsonStreamStringifyBytes(data, null, 2)) {
        writeStream.write(chunk)
    }

    writeStream.end()
}
```

### 4. Database Export

```typescript
import { jsonStreamStringify } from 'json-stream-lite'

async function* exportDatabase(query: string) {
    const records = await db.query(query)

    for (const chunk of jsonStreamStringify(records, null, 2)) {
        yield chunk
    }
}

// Stream to client
app.get('/export', async (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    for await (const chunk of exportDatabase('SELECT * FROM users')) {
        res.write(chunk)
    }
    res.end()
})
```

## Performance Tips

1. **Use async methods** for I/O-bound operations
2. **Set appropriate buffer limits** with `maxBufferSize`
3. **Stream member-by-member** instead of calling `read()` on large objects
4. **Control chunk size** in stringify operations for optimal throughput
5. **Avoid reading entire objects** when you only need specific fields

## Browser Support

Works in all modern browsers and Node.js environments that support:

- ES2015+ features
- Generators and async generators
- TextEncoder/TextDecoder (for string conversion)
- ReadableStream (for stream processing)

## TypeScript Support

Full TypeScript definitions included. All types are exported:

```typescript
import type {
    JsonPrimitive,
    JsonKeyValuePair,
    JsonValueType,
    JsonPrimitiveType,
    JsonStreamStringifyOptions,
} from 'json-stream-lite'
```

## License

MIT

## Contributing

Contributions welcome! Please ensure:

- All tests pass: `pnpm test`
- Code compiles: `pnpm compile`
- Coverage maintained: `pnpm test -- --coverage`

## Related Projects

- [json-stream](https://www.npmjs.com/package/json-stream) - Alternative streaming JSON parser
- [stream-json](https://www.npmjs.com/package/stream-json) - Node.js streaming JSON parser
- [jsonparse](https://www.npmjs.com/package/jsonparse) - Pure JavaScript streaming JSON parser
