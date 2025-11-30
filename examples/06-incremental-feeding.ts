/**
 * Incremental Feeding Example
 *
 * This example shows how to feed bytes into the parser incrementally,
 * which is useful when receiving data in chunks from a network or file.
 */

import { JsonObject, JsonArray } from 'json-stream-lite'

function stringToBytes(str: string): number[] {
    return Array.from(new TextEncoder().encode(str))
}

// Example 1: Feed bytes one at a time
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
