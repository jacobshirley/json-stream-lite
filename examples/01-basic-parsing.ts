/**
 * Basic JSON Parsing Example
 *
 * This example demonstrates how to parse a simple JSON object using json-stream-lite.
 */

import { JsonObject, JsonArray, JsonValue } from 'json-stream-lite'

// Helper to convert string to bytes
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
