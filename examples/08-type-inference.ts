// Type Inference Example
/**
 * This example demonstrates how the improved generic types provide better type inference
 * when working with JsonObject and JsonArray.
 */

import { JsonObject, JsonArray } from 'json-stream-lite'

// Helper to convert string to bytes
function stringToBytes(str: string): number[] {
    return Array.from(new TextEncoder().encode(str))
}

// Example 1: Typed object with specific structure
console.log('=== Example 1: Typed JSON Object ===')

type User = {
    name: string
    age: number
    active: boolean
}

const userJson = '{"name": "Alice", "age": 30, "active": true}'
const userParser = new JsonObject<User>()
userParser.feed(...stringToBytes(userJson))

console.log('Parsing typed user object:')
for (const { key, value } of userParser.members()) {
    const keyStr = key.read()
    const valueEntity = value.read()

    // With improved types, value is now JsonValue<string | number | boolean>
    // instead of JsonValue<User>, providing better type inference

    console.log(
        `  ${keyStr}: ${valueEntity.read()} (${valueEntity.constructor.name})`,
    )
}

// Example 2: Typed array with specific element type
console.log('\n=== Example 2: Typed JSON Array ===')

type Product = {
    id: number
    name: string
    price: number
}

const productsJson =
    '[{"id": 1, "name": "Widget", "price": 9.99}, {"id": 2, "name": "Gadget", "price": 19.99}]'
const productsParser = new JsonArray<Product>()
productsParser.feed(...stringToBytes(productsJson))

console.log('Parsing typed product array:')
for (const item of productsParser.items()) {
    // With proper typing, item is JsonValueType<Product>
    const product = item.read() as Product
    console.log(`  Product ${product.id}: ${product.name} - $${product.price}`)
}

// Example 3: Nested typed structures
console.log('\n=== Example 3: Nested Typed Structures ===')

type ApiResponse = {
    success: boolean
    data: {
        users: Array<{
            id: number
            username: string
        }>
    }
    count: number
}

const responseJson =
    '{"success": true, "data": {"users": [{"id": 1, "username": "alice"}, {"id": 2, "username": "bob"}]}, "count": 2}'
const responseParser = new JsonObject<ApiResponse>()
responseParser.feed(...stringToBytes(responseJson))

console.log('Parsing nested API response:')
const fullResponse = responseParser.read()
console.log(`  success: ${fullResponse.success}`)
console.log(`  count: ${fullResponse.count}`)
console.log(`  data.users:`)
for (const user of fullResponse.data.users) {
    console.log(`    - ${user.username} (id: ${user.id})`)
}

// Example 4: Primitive typed arrays
console.log('\n=== Example 4: Primitive Typed Arrays ===')

const numbersJson = '[10, 20, 30, 40, 50]'
const numbersParser = new JsonArray<number>()
numbersParser.feed(...stringToBytes(numbersJson))

console.log('Parsing typed number array:')
const numbers: number[] = []
for (const item of numbersParser.items()) {
    const num = item.read() as number
    numbers.push(num)
}
const sum = numbers.reduce((a, b) => a + b, 0)
console.log(`  Sum: ${sum}`)

const stringsJson = '["hello", "world", "from", "typed", "arrays"]'
const stringsParser = new JsonArray<string>()
stringsParser.feed(...stringToBytes(stringsJson))

console.log('\nParsing typed string array:')
const words: string[] = []
for (const item of stringsParser.items()) {
    const word = item.read() as string
    words.push(word)
}
const message = words.join(' ')
console.log(`  Message: ${message}`)
