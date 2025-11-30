/**
 * JSON Stringify Example
 *
 * This example demonstrates how to convert JavaScript objects to JSON
 * in a streaming fashion, which is useful for large objects.
 */

import { jsonStreamStringify, jsonStreamStringifyBytes } from 'json-stream-lite'

// Example 1: Basic stringify
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
// Note: The replacer function transforms the root value before stringification
console.log('\n=== Example 4: With Replacer Function ===')
const numbers = { a: 1, b: 2, c: 3 }

const replacer = (key: string, value: any) => {
    // Transform objects by doubling all number values
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const transformed: Record<string, any> = {}
        for (const [k, v] of Object.entries(value)) {
            transformed[k] = typeof v === 'number' ? v * 2 : v
        }
        return transformed
    }
    return value
}

console.log('Original object:', numbers)
console.log('Stringified with replacer (numbers doubled):')
const transformed = Array.from(jsonStreamStringify(numbers, replacer, 2)).join(
    '',
)
console.log(transformed)
// Output: {"a":2,"b":4,"c":6}

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
