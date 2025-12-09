// Key-Value Extraction Example
/**
 * This example demonstrates how to flatten nested JSON structures into
 * key-value pairs using dot notation and array indices.
 */

import { jsonKeyValueParser } from 'json-stream-lite'

// Example 1: Flatten a simple nested object
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
