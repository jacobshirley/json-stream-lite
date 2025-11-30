# JSON-Stream-Lite Examples

This directory contains example scripts demonstrating how to use the JSON-Stream-Lite library.

## Helper to convert string to bytes

```typescript
function stringToBytes(str: string): number[] {
    return Array.from(new TextEncoder().encode(str))
}

// Example 1: Parse a simple object
console.log('=== Example 1: Parse Simple Object ===')
const simpleJson = '{"name": "Alice", "age": 30, "active": true}'
const simpleParser = new JsonObject()
simpleParser.feed(...stringToBytes(simpleJson))

const simpleResult = simpleParser.read()
console.log('Result:', simpleResult)
// Output: { name: 'Alice', age: 30, active: true }

// Example 2: Parse an array
console.log('\n=== Example 2: Parse Array ===')
const arrayJson = '[1, 2, 3, 4, 5]'
const arrayParser = new JsonArray()
arrayParser.feed(...stringToBytes(arrayJson))

const arrayResult = arrayParser.read()
console.log('Result:', arrayResult)
// Output: [1, 2, 3, 4, 5]

// Example 3: Parse nested structure
console.log('\n=== Example 3: Parse Nested Structure ===')
const nestedJson =
    '{"user": {"name": "Bob", "scores": [95, 87, 92]}, "verified": true}'
const nestedParser = new JsonObject()
nestedParser.feed(...stringToBytes(nestedJson))

const nestedResult = nestedParser.read()
console.log('Result:', JSON.stringify(nestedResult, null, 2))

// Example 4: Parse using JsonValue (auto-detects type)
console.log('\n=== Example 4: Auto-detect Type with JsonValue ===')
const valueParser = new JsonValue()
valueParser.feed(...stringToBytes('{"status": "ok"}'))

const valueEntity = valueParser.read()
console.log('Entity type:', valueEntity.constructor.name) // JsonObject
const value = valueEntity.read()
console.log('Result:', value)
```

## Example 1: Stream through object members

```typescript
console.log('=== Example 1: Stream Object Members ===')
const userJson =
    '{"id": 123, "name": "Alice", "email": "alice@example.com", "age": 30}'
const userParser = new JsonObject()
userParser.feed(...stringToBytes(userJson))

console.log('Processing members one by one:')
for (const [keyEntity, valueEntity] of userParser.members()) {
    const key = keyEntity.read()
    const value = valueEntity.read().read()
    console.log(`  ${key}: ${value} (${typeof value})`)
}

// Example 2: Stream through array items
console.log('\n=== Example 2: Stream Array Items ===')
import { JsonArray } from 'json-stream-lite'

const numbersJson = '[10, 20, 30, 40, 50]'
const numbersParser = new JsonArray()
numbersParser.feed(...stringToBytes(numbersJson))

console.log('Processing items one by one:')
let sum = 0
for (const item of numbersParser.items()) {
    const value = item.read() as number
    sum += value
    console.log(`  Current value: ${value}, Running sum: ${sum}`)
}
console.log(`Final sum: ${sum}`)

// Example 3: Selective processing
console.log('\n=== Example 3: Selective Processing ===')
const dataJson =
    '{"header": "Report", "data": [1, 2, 3, 4, 5], "footer": "End"}'
const dataParser = new JsonObject()
dataParser.feed(...stringToBytes(dataJson))

console.log('Only processing the "data" field:')
for (const [keyEntity, valueEntity] of dataParser.members()) {
    const key = keyEntity.read()

    if (key === 'data') {
        const value = valueEntity.read()
        if (value instanceof JsonArray) {
            const items = []
            for (const item of value.items()) {
                items.push(item.read())
            }
            console.log(`  Found data array with ${items.length} items:`, items)
        }
    } else {
        // Skip other fields by just consuming them
        valueEntity.consume()
        console.log(`  Skipped field: ${key}`)
    }
}

// Example 4: Early termination
console.log('\n=== Example 4: Early Termination ===')
const largeJson = '{"a": 1, "b": 2, "c": 3, "target": 999, "d": 4, "e": 5}'
const searchParser = new JsonObject()
searchParser.feed(...stringToBytes(largeJson))

console.log('Searching for "target" field:')
for (const [keyEntity, valueEntity] of searchParser.members()) {
    const key = keyEntity.read()

    if (key === 'target') {
        const value = valueEntity.read().read()
        console.log(`  Found target: ${value}`)
        break // Stop processing once we found what we need
    } else {
        valueEntity.consume()
        console.log(`  Checked field: ${key}`)
    }
}
console.log("Early exit - didn't process remaining fields")
```

## Example 1: Flatten a simple nested object

```typescript
console.log('=== Example 1: Simple Nested Object ===')
const simpleNested = '{"user": {"name": "Alice", "age": 30}}'

console.log('Input:', simpleNested)
console.log('Flattened:')
for (const [key, value] of jsonKeyValueParser(simpleNested)) {
    console.log(`  ${key} = ${value}`)
}
// Output:
//   user.name = Alice
//   user.age = 30

// Example 2: Flatten object with arrays
console.log('\n=== Example 2: Object with Arrays ===')
const withArrays = '{"user": {"name": "Bob", "scores": [95, 87, 92]}}'

console.log('Input:', withArrays)
console.log('Flattened:')
for (const [key, value] of jsonKeyValueParser(withArrays)) {
    console.log(`  ${key} = ${value}`)
}
// Output:
//   user.name = Bob
//   user.scores[0] = 95
//   user.scores[1] = 87
//   user.scores[2] = 92

// Example 3: Complex nested structure
console.log('\n=== Example 3: Complex Nested Structure ===')
const complex = JSON.stringify({
    company: {
        name: 'TechCorp',
        departments: [
            {
                name: 'Engineering',
                employees: [
                    { id: 1, name: 'Alice' },
                    { id: 2, name: 'Bob' },
                ],
            },
        ],
    },
})

console.log('Input:', complex)
console.log('Flattened:')
for (const [key, value] of jsonKeyValueParser(complex)) {
    console.log(`  ${key} = ${value}`)
}

// Example 4: Extract specific values
console.log('\n=== Example 4: Extract Specific Values ===')
const config = JSON.stringify({
    database: {
        host: 'localhost',
        port: 5432,
        credentials: {
            username: 'admin',
            password: 'secret123',
        },
    },
    cache: {
        enabled: true,
        ttl: 3600,
    },
})

console.log('Extracting only database-related configs:')
for (const [key, value] of jsonKeyValueParser(config)) {
    if (key.startsWith('database.')) {
        console.log(`  ${key} = ${value}`)
    }
}

// Example 5: Build a flat object
console.log('\n=== Example 5: Build Flat Object from JSON ===')
const source = '{"a": {"b": {"c": 1}}, "x": {"y": 2}}'
const flatObject: Record<string, any> = {}

for (const [key, value] of jsonKeyValueParser(source)) {
    flatObject[key] = value
}

console.log('Original:', source)
console.log('Flat object:', flatObject)
console.log('Access nested value:', flatObject['a.b.c']) // 1

// Example 6: Array-only structure
console.log('\n=== Example 6: Array Structure ===')
const arrayStructure = '[[1, 2], [3, 4], [5, 6]]'

console.log('Input:', arrayStructure)
console.log('Flattened:')
for (const [key, value] of jsonKeyValueParser(arrayStructure)) {
    console.log(`  ${key} = ${value}`)
}
// Output:
//   [0][0] = 1
//   [0][1] = 2
//   [1][0] = 3
//   [1][1] = 4
//   [2][0] = 5
//   [2][1] = 6
```

## Helper to simulate an async byte stream

```typescript
async function* createAsyncByteStream(
    json: string,
    chunkSize: number = 10,
): AsyncGenerator<number> {
    const bytes = new TextEncoder().encode(json)

    for (let i = 0; i < bytes.length; i += chunkSize) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 10))

        const chunk = bytes.slice(i, i + chunkSize)
        yield* chunk
    }
}

// Example 1: Parse object from async stream
console.log('=== Example 1: Parse Object from Async Stream ===')
async function parseAsyncObject() {
    const json = '{"name": "Alice", "age": 30, "city": "NYC"}'
    const stream = createAsyncByteStream(json)

    const parser = new JsonObject(stream)

    console.log('Streaming members asynchronously:')
    for await (const [keyEntity, valueEntity] of parser) {
        const key = keyEntity.read()
        const value = await valueEntity.readValueAsync()
        console.log(`  ${key}: ${value}`)
    }
}

await parseAsyncObject()

// Example 2: Parse array from async stream
console.log('\n=== Example 2: Parse Array from Async Stream ===')
async function parseAsyncArray() {
    const json = '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'
    const stream = createAsyncByteStream(json, 5)

    const parser = new JsonArray(stream)

    console.log('Processing items as they arrive:')
    let sum = 0
    for await (const item of parser) {
        const value = await item.readAsync()
        sum += value as number
        console.log(`  Received: ${value}, Running sum: ${sum}`)
    }
    console.log(`Final sum: ${sum}`)
}

await parseAsyncArray()

// Example 3: Async key-value extraction
console.log('\n=== Example 3: Async Key-Value Extraction ===')
async function asyncKeyValueExtraction() {
    const json = JSON.stringify({
        user: {
            profile: {
                name: 'Bob',
                email: 'bob@example.com',
            },
            scores: [85, 90, 95],
        },
    })

    const stream = createAsyncByteStream(json, 15)

    console.log('Extracting key-value pairs asynchronously:')
    for await (const [key, value] of jsonKeyValueParserAsync(stream)) {
        console.log(`  ${key} = ${value}`)
    }
}

await asyncKeyValueExtraction()

// Example 4: Simulated HTTP response
console.log('\n=== Example 4: Simulated HTTP Response ===')
async function processHttpResponse() {
    // Simulate fetching JSON from an API
    const responseData = JSON.stringify({
        status: 'success',
        data: {
            users: [
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob' },
                { id: 3, name: 'Charlie' },
            ],
        },
    })

    const stream = createAsyncByteStream(responseData, 20)
    const parser = new JsonObject(stream)

    console.log('Processing HTTP response:')
    for await (const [keyEntity, valueEntity] of parser) {
        const key = keyEntity.read()

        if (key === 'data') {
            console.log(`  Found ${key} field:`)
            const dataValue = await valueEntity.readAsync()
            const dataObj = dataValue as JsonObject

            for await (const [dataKey, dataValueEntity] of dataObj) {
                const dataKeyStr = dataKey.read()
                if (dataKeyStr === 'users') {
                    console.log(`    Found users array:`)
                    const usersValue = await dataValueEntity.readAsync()
                    const usersArray = usersValue as JsonArray

                    let count = 0
                    for await (const user of usersArray) {
                        const userData = await user.readAsync()
                        console.log(`      User ${++count}:`, userData)
                    }
                }
            }
        } else {
            const value = await valueEntity.readValueAsync()
            console.log(`  ${key}: ${value}`)
        }
    }
}

await processHttpResponse()

// Example 5: Handle large dataset with async processing
console.log('\n=== Example 5: Process Large Dataset ===')
async function processLargeDataset() {
    // Simulate a large dataset
    const records = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        value: Math.random() * 100,
    }))

    const json = JSON.stringify({ records })
    const stream = createAsyncByteStream(json, 50)

    const parser = new JsonObject(stream)

    console.log('Processing large dataset:')
    let recordCount = 0
    let totalValue = 0

    for await (const [keyEntity, valueEntity] of parser) {
        const key = keyEntity.read()

        if (key === 'records') {
            const value = await valueEntity.readAsync()
            const array = value as JsonArray

            for await (const item of array) {
                const record = (await item.readAsync()) as any
                recordCount++
                totalValue += record.value
            }
        }
    }

    console.log(`  Processed ${recordCount} records`)
    console.log(`  Average value: ${(totalValue / recordCount).toFixed(2)}`)
}

await processLargeDataset()

console.log('\n=== All async examples completed ===')
```

## Example 1: Basic stringify

```typescript
console.log('=== Example 1: Basic Stringify ===')
const simpleObj = {
    name: 'Alice',
    age: 30,
    active: true,
    balance: null,
}

console.log('Original object:', simpleObj)
console.log('Stringified (compact):')
const compact = Array.from(jsonStreamStringify(simpleObj)).join('')
console.log(compact)

console.log('\nStringified (pretty-printed):')
const pretty = Array.from(jsonStreamStringify(simpleObj, null, 2)).join('')
console.log(pretty)

// Example 2: Stringify with chunking
console.log('\n=== Example 2: Stringify with Chunking ===')
const largeString = 'x'.repeat(100)
const objWithLargeString = { data: largeString }

console.log('Object with 100-char string, chunked at 30 bytes:')
let chunkCount = 0
for (const chunk of jsonStreamStringify(objWithLargeString, null, 0, {
    stringChunkSize: 30,
})) {
    console.log(
        `  Chunk ${++chunkCount}: "${chunk.substring(0, 40)}${chunk.length > 40 ? '...' : ''}" (${chunk.length} chars)`,
    )
}

// Example 3: Stringify nested structures
console.log('\n=== Example 3: Nested Structures ===')
const nested = {
    user: {
        name: 'Bob',
        profile: {
            email: 'bob@example.com',
            age: 25,
        },
    },
    scores: [95, 87, 92],
    metadata: {
        created: '2025-01-01',
        updated: '2025-11-30',
    },
}

console.log('Nested object stringified:')
const nestedJson = Array.from(jsonStreamStringify(nested, null, 2)).join('')
console.log(nestedJson)

// Example 4: Using a replacer function
console.log('\n=== Example 4: With Replacer Function ===')
const withSecrets = {
    username: 'alice',
    password: 'secret123',
    apiKey: 'key-12345',
    public: 'visible data',
}

const replacer = (key: string, value: any) => {
    if (key === 'password' || key === 'apiKey') {
        return '***REDACTED***'
    }
    return value
}

console.log('Original object:', withSecrets)
console.log('Stringified with replacer:')
const redacted = Array.from(jsonStreamStringify(withSecrets, replacer, 2)).join(
    '',
)
console.log(redacted)

// Example 5: Stringify to bytes
console.log('\n=== Example 5: Stringify to Bytes ===')
const dataObj = { message: 'Hello', count: 42 }

console.log('Converting to byte arrays:')
let totalBytes = 0
for (const bytes of jsonStreamStringifyBytes(dataObj)) {
    totalBytes += bytes.length
    console.log(
        `  Chunk: ${bytes.length} bytes - [${Array.from(bytes.slice(0, 20)).join(', ')}${bytes.length > 20 ? '...' : ''}]`,
    )
}
console.log(`Total bytes: ${totalBytes}`)

// Example 6: Stream large array
console.log('\n=== Example 6: Stream Large Array ===')
const largeArray = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    value: Math.random(),
}))

console.log(`Streaming array with ${largeArray.length} objects:`)
let streamedChunks = 0
for (const chunk of jsonStreamStringify(largeArray, null, 0)) {
    streamedChunks++
    // In a real scenario, you might write each chunk to a file or network stream
}
console.log(`Generated ${streamedChunks} chunks`)
console.log(
    'First 200 chars:',
    Array.from(jsonStreamStringify(largeArray)).join('').substring(0, 200) +
        '...',
)

// Example 7: Special values
console.log('\n=== Example 7: Special Values ===')
const specialValues = {
    normal: 42,
    infinity: Infinity,
    negInfinity: -Infinity,
    notANumber: NaN,
    undef: undefined,
    nul: null,
    emptyArray: [],
    emptyObject: {},
}

console.log('Object with special values:')
const specialJson = Array.from(
    jsonStreamStringify(specialValues, null, 2),
).join('')
console.log(specialJson)
console.log(
    '\nNote: Infinity, -Infinity, and NaN become null (JSON standard behavior)',
)
console.log(
    'Note: undefined properties are omitted in objects, become null in arrays',
)

// Example 8: Comparison with JSON.stringify
console.log('\n=== Example 8: Verify Output Matches JSON.stringify ===')
const testObj = {
    a: 1,
    b: 'text',
    c: [1, 2, 3],
    d: { nested: true },
    e: null,
}

const streamResult = Array.from(jsonStreamStringify(testObj, null, 2)).join('')
const standardResult = JSON.stringify(testObj, null, 2)

console.log('Output matches JSON.stringify:', streamResult === standardResult)
console.log('Stream result:', streamResult)
```

## Example 1: Feed bytes one at a time

```typescript
console.log('=== Example 1: Feed Bytes One at a Time ===')
const json1 = '{"name": "Alice"}'
const parser1 = new JsonObject()

console.log('Feeding bytes individually:')
const bytes1 = stringToBytes(json1)
for (let i = 0; i < bytes1.length; i++) {
    parser1.feed(bytes1[i])
    console.log(
        `  Fed ${i + 1}/${bytes1.length} bytes: "${String.fromCharCode(bytes1[i])}"`,
    )
}

const result1 = parser1.read()
console.log('Result:', result1)

// Example 2: Feed in chunks
console.log('\n=== Example 2: Feed in Chunks ===')
const json2 = '{"id": 123, "active": true, "score": 95.5}'
const parser2 = new JsonObject()

const bytes2 = stringToBytes(json2)
const chunkSize = 10

console.log(`Feeding in chunks of ${chunkSize}:`)
for (let i = 0; i < bytes2.length; i += chunkSize) {
    const chunk = bytes2.slice(i, i + chunkSize)
    parser2.feed(...chunk)

    const chunkStr = new TextDecoder().decode(new Uint8Array(chunk))
    console.log(`  Chunk ${Math.floor(i / chunkSize) + 1}: "${chunkStr}"`)
}

const result2 = parser2.read()
console.log('Result:', result2)

// Example 3: Feed as you parse (streaming members)
console.log('\n=== Example 3: Feed Then Parse Members ===')
const json3 = '{"a": 1, "b": 2, "c": 3}'
const parser3 = new JsonObject()

// Feed all at once
parser3.feed(...stringToBytes(json3))

console.log('Parsing members after feeding:')
for (const [keyEntity, valueEntity] of parser3.members()) {
    const key = keyEntity.read()
    const value = valueEntity.read().read()
    console.log(`  ${key}: ${value}`)
}

// Example 4: Try parse pattern - checking if we have enough data
console.log('\n=== Example 4: Try Parse Pattern ===')
const json4 = '{"complete": true}'
const parser4 = new JsonObject()
const bytes4 = stringToBytes(json4)

console.log('Feeding incrementally and checking if parseable:')
for (let i = 0; i < bytes4.length; i++) {
    parser4.feed(bytes4[i])

    const result = parser4.tryParse((p) => {
        return p.read()
    })

    if (result !== undefined) {
        console.log(`  ✓ Successfully parsed after ${i + 1} bytes:`, result)
        break
    } else {
        console.log(`  ✗ Not enough data after ${i + 1} bytes`)
    }
}

// Example 5: Feeding array incrementally
console.log('\n=== Example 5: Array Incremental Feeding ===')
const json5 = '[10, 20, 30, 40, 50]'
const parser5 = new JsonArray()

console.log('Feeding array in small chunks:')
const bytes5 = stringToBytes(json5)
const feedSize = 5

for (let i = 0; i < bytes5.length; i += feedSize) {
    const chunk = bytes5.slice(i, i + feedSize)
    parser5.feed(...chunk)
    console.log(
        `  Fed chunk: "${new TextDecoder().decode(new Uint8Array(chunk))}"`,
    )
}

console.log('Parsing items:')
for (const item of parser5.items()) {
    console.log(`  Item: ${item.read()}`)
}

// Example 6: Simulating network chunks
console.log('\n=== Example 6: Simulating Network Chunks ===')
const networkData = JSON.stringify({
    status: 'ok',
    data: {
        users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
        ],
    },
})

const parser6 = new JsonObject()

// Simulate receiving data in irregular chunks (like network packets)
const chunkSizes = [15, 8, 25, 12, 30, 1000] // Last chunk larger than remaining data
const bytes6 = stringToBytes(networkData)
let position = 0

console.log('Simulating network packet arrival:')
for (const size of chunkSizes) {
    if (position >= bytes6.length) break

    const chunk = bytes6.slice(position, position + size)
    parser6.feed(...chunk)

    const chunkText = new TextDecoder().decode(new Uint8Array(chunk))
    console.log(
        `  Packet ${chunkSizes.indexOf(size) + 1}: ${chunk.length} bytes - "${chunkText.substring(0, 30)}${chunkText.length > 30 ? '...' : ''}"`,
    )

    position += size
}

const result6 = parser6.read()
console.log('Parsed result:', JSON.stringify(result6, null, 2))

// Example 7: Feeding with mixed types
console.log('\n=== Example 7: Feed with Arrays and Individual Bytes ===')
const json7 = '{"mixed": "feeding"}'
const parser7 = new JsonObject()

// Can feed individual bytes or arrays
parser7.feed(123) // {
parser7.feed([34, 109, 105, 120, 101, 100, 34]) // "mixed"
parser7.feed(58) // :
parser7.feed([32, 34]) // space and "
parser7.feed(...[102, 101, 101, 100, 105, 110, 103]) // feeding
parser7.feed(34, 125) // " and }

const result7 = parser7.read()
console.log('Result:', result7)
console.log('Note: Can feed bytes individually, as arrays, or spread arrays')
```

## Scenario 1: Processing a configuration file

```typescript
console.log('=== Scenario 1: Configuration File Processing ===')
function processConfig() {
    const configJson = JSON.stringify({
        database: {
            host: 'localhost',
            port: 5432,
            pool: { min: 2, max: 10 },
        },
        api: {
            port: 8080,
            timeout: 30000,
        },
        features: {
            analytics: true,
            debugging: false,
        },
    })

    console.log('Extracting all configuration values:')
    const config: Record<string, any> = {}

    for (const [key, value] of jsonKeyValueParser(configJson)) {
        config[key] = value
    }

    // Access nested values easily
    console.log('  Database host:', config['database.host'])
    console.log('  Database pool max:', config['database.pool.max'])
    console.log('  API port:', config['api.port'])
    console.log('  Analytics enabled:', config['features.analytics'])
}

processConfig()

// Scenario 2: Log file analysis
console.log('\n=== Scenario 2: Log File Analysis ===')
function analyzeLogEntries() {
    const logEntries = JSON.stringify({
        logs: [
            {
                timestamp: '2025-11-30T10:00:00Z',
                level: 'ERROR',
                message: 'Connection failed',
            },
            {
                timestamp: '2025-11-30T10:01:00Z',
                level: 'INFO',
                message: 'Retry successful',
            },
            {
                timestamp: '2025-11-30T10:02:00Z',
                level: 'ERROR',
                message: 'Timeout',
            },
            {
                timestamp: '2025-11-30T10:03:00Z',
                level: 'WARN',
                message: 'High memory usage',
            },
        ],
    })

    const parser = new JsonObject()
    parser.feed(...stringToBytes(logEntries))

    const stats = { ERROR: 0, INFO: 0, WARN: 0 }

    console.log('Analyzing log entries:')
    for (const [keyEntity, valueEntity] of parser.members()) {
        const key = keyEntity.read()

        if (key === 'logs') {
            const logsValue = valueEntity.read()
            if (logsValue instanceof JsonArray) {
                for (const logEntry of logsValue.items()) {
                    const entry = logEntry.read() as any
                    stats[entry.level as keyof typeof stats]++

                    if (entry.level === 'ERROR') {
                        console.log(
                            `  ERROR at ${entry.timestamp}: ${entry.message}`,
                        )
                    }
                }
            }
        }
    }

    console.log('\nLog Statistics:')
    console.log(`  Errors: ${stats.ERROR}`)
    console.log(`  Warnings: ${stats.WARN}`)
    console.log(`  Info: ${stats.INFO}`)
}

analyzeLogEntries()

// Scenario 3: API response transformation
console.log('\n=== Scenario 3: API Response Transformation ===')
function transformApiResponse() {
    const apiResponse = JSON.stringify({
        status: 'success',
        data: {
            users: [
                { id: 1, firstName: 'Alice', lastName: 'Smith', age: 30 },
                { id: 2, firstName: 'Bob', lastName: 'Jones', age: 25 },
            ],
        },
    })

    const parser = new JsonObject()
    parser.feed(...stringToBytes(apiResponse))

    const transformedUsers: any[] = []

    console.log('Transforming API response:')
    for (const [keyEntity, valueEntity] of parser.members()) {
        const key = keyEntity.read()

        if (key === 'data') {
            const dataValue = valueEntity.read() as JsonObject
            for (const [
                dataKeyEntity,
                dataValueEntity,
            ] of dataValue.members()) {
                const dataKey = dataKeyEntity.read()

                if (dataKey === 'users') {
                    const usersValue = dataValueEntity.read() as JsonArray
                    for (const userEntity of usersValue.items()) {
                        const user = userEntity.read() as any
                        // Transform: combine firstName and lastName
                        transformedUsers.push({
                            id: user.id,
                            fullName: `${user.firstName} ${user.lastName}`,
                            age: user.age,
                        })
                    }
                }
            }
        }
    }

    console.log('Transformed users:', transformedUsers)
}

transformApiResponse()

// Scenario 4: Data validation
console.log('\n=== Scenario 4: Data Validation ===')
function validateData() {
    const userData = JSON.stringify({
        users: [
            { id: 1, email: 'alice@example.com', age: 30 },
            { id: 2, email: 'invalid-email', age: 25 },
            { id: 3, email: 'bob@example.com', age: -5 }, // Invalid age
            { id: 4, email: 'charlie@example.com', age: 35 },
        ],
    })

    const parser = new JsonObject()
    parser.feed(...stringToBytes(userData))

    const errors: string[] = []

    console.log('Validating user data:')
    for (const [keyEntity, valueEntity] of parser.members()) {
        const key = keyEntity.read()

        if (key === 'users') {
            const usersValue = valueEntity.read() as JsonArray
            let index = 0

            for (const userEntity of usersValue.items()) {
                const user = userEntity.read() as any

                // Validate email
                if (!user.email.includes('@')) {
                    errors.push(`User ${user.id}: Invalid email format`)
                }

                // Validate age
                if (user.age < 0 || user.age > 120) {
                    errors.push(`User ${user.id}: Invalid age (${user.age})`)
                }

                index++
            }
        }
    }

    if (errors.length > 0) {
        console.log('Validation errors found:')
        errors.forEach((err) => console.log(`  ✗ ${err}`))
    } else {
        console.log('✓ All data valid')
    }
}

validateData()

// Scenario 5: Generating a CSV export
console.log('\n=== Scenario 5: Generate CSV from JSON ===')
function jsonToCsv() {
    const data = [
        { id: 1, name: 'Alice', department: 'Engineering', salary: 95000 },
        { id: 2, name: 'Bob', department: 'Sales', salary: 85000 },
        { id: 3, name: 'Charlie', department: 'Engineering', salary: 90000 },
    ]

    console.log('Converting JSON array to CSV:')

    // Headers
    const headers = Object.keys(data[0])
    console.log(headers.join(','))

    // Process each record
    const parser = new JsonArray()
    parser.feed(...stringToBytes(JSON.stringify(data)))

    for (const item of parser.items()) {
        const record = item.read() as any
        const row = headers.map((h) => record[h]).join(',')
        console.log(row)
    }
}

jsonToCsv()

// Scenario 6: Filtering large datasets
console.log('\n=== Scenario 6: Filter Large Dataset ===')
function filterLargeDataset() {
    // Simulate a large dataset of transactions
    const transactions = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        amount: Math.floor(Math.random() * 1000),
        type: i % 3 === 0 ? 'refund' : 'payment',
        date: '2025-11-30',
    }))

    const parser = new JsonArray()
    parser.feed(...stringToBytes(JSON.stringify(transactions)))

    console.log('Filtering for high-value payments (>500):')
    let totalFiltered = 0
    let sumFiltered = 0

    for (const item of parser.items()) {
        const tx = item.read() as any

        if (tx.type === 'payment' && tx.amount > 500) {
            console.log(`  Transaction ${tx.id}: $${tx.amount}`)
            totalFiltered++
            sumFiltered += tx.amount
        }
    }

    console.log(
        `\nFound ${totalFiltered} transactions totaling $${sumFiltered}`,
    )
}

filterLargeDataset()

// Scenario 7: Building a report
console.log('\n=== Scenario 7: Generate Report ===')
function generateReport() {
    const salesData = {
        period: 'Q4 2025',
        regions: [
            { name: 'North', sales: 125000, target: 100000 },
            { name: 'South', sales: 95000, target: 100000 },
            { name: 'East', sales: 110000, target: 100000 },
            { name: 'West', sales: 88000, target: 100000 },
        ],
    }

    const parser = new JsonObject()
    parser.feed(...stringToBytes(JSON.stringify(salesData)))

    console.log('Sales Report:')

    for (const [keyEntity, valueEntity] of parser.members()) {
        const key = keyEntity.read()

        if (key === 'period') {
            console.log(`Period: ${valueEntity.read().read()}`)
            console.log('─'.repeat(50))
        } else if (key === 'regions') {
            const regionsValue = valueEntity.read() as JsonArray
            let totalSales = 0
            let totalTarget = 0

            for (const regionEntity of regionsValue.items()) {
                const region = regionEntity.read() as any
                totalSales += region.sales
                totalTarget += region.target

                const performance = (
                    (region.sales / region.target) *
                    100
                ).toFixed(1)
                const status = region.sales >= region.target ? '✓' : '✗'

                console.log(
                    `${status} ${region.name.padEnd(10)} Sales: $${region.sales.toLocaleString().padStart(10)} (${performance}% of target)`,
                )
            }

            console.log('─'.repeat(50))
            console.log(`Total Sales: $${totalSales.toLocaleString()}`)
            console.log(`Total Target: $${totalTarget.toLocaleString()}`)
            console.log(
                `Overall Performance: ${((totalSales / totalTarget) * 100).toFixed(1)}%`,
            )
        }
    }
}

generateReport()

console.log('\n=== All scenarios completed ===')
```
