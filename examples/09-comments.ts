// JSON Comments (JSONC) Parsing Example
/**
 * This example demonstrates how to parse JSON with comments (JSONC format) using JsonComment.
 * Supports both single-line (//) and block (/* *\/) comments.
 */

import { JsonObject, JsonComment } from 'json-stream-lite'

// Helper to convert string to bytes
function stringToBytes(str: string): number[] {
    return Array.from(new TextEncoder().encode(str))
}

// Example 1: Parse single-line comments
console.log('=== Example 1: Single-line Comments ===')
const jsoncWithLineComments = `{
    // This is a name field
    // Another comment
    "name": "Alice",
    // Age in years
    "age": 30
}`

const parser1 = new JsonObject()
parser1.feed(...stringToBytes(jsoncWithLineComments))

// Access pre-comments for object members
for (const { key: keyEntity, value: valueEntity } of parser1) {
    // Get comments before the key
    const preComments = keyEntity.preCommentStrings

    const key = keyEntity.read()
    if (preComments.length > 0) {
        console.log(`Comment for "${key}":`, preComments.join(', '))
    }

    const value = valueEntity.readValue()
    console.log(`${key}: ${value}`)
}

// Example 2: Parse block comments
console.log('\n=== Example 2: Block Comments ===')
const jsoncWithBlockComments = `{
    /* 
     * User identification
     * Required field
     */
    "id": 123,
    /* Status flag */ "active": true
}`

const parser2 = new JsonObject()
parser2.feed(...stringToBytes(jsoncWithBlockComments))

for (const { key: keyEntity, value: valueEntity } of parser2) {
    const preComment = keyEntity.singlePreCommentString
    const key = keyEntity.read()

    if (preComment) {
        console.log(`Comment: ${preComment}`)
    }

    const value = valueEntity.readValue()
    console.log(`Key: ${key}, Value: ${value}`)
}

// Example 3: Direct JsonComment parsing
console.log('\n=== Example 3: Direct Comment Parsing ===')
const lineComment = '// This is a single-line comment\n'
const commentParser1 = new JsonComment()
commentParser1.feed(...stringToBytes(lineComment))
const comment1 = commentParser1.read()
console.log('Line comment:', comment1)
console.log('Comment style:', commentParser1.style) // 'line'

const blockComment = '/* This is a block comment */'
const commentParser2 = new JsonComment()
commentParser2.feed(...stringToBytes(blockComment))
const comment2 = commentParser2.read()
console.log('Block comment:', comment2)
console.log('Comment style:', commentParser2.style) // 'block'

// Example 4: Comments after values
console.log('\n=== Example 4: Post-value Comments ===')
const jsoncWithPostComments = `{
    "status": "ok" // Everything is fine
}`

const parser4 = new JsonObject()
parser4.feed(...stringToBytes(jsoncWithPostComments))

for (const { key: keyEntity, value: valueEntity } of parser4) {
    const key = keyEntity.read()
    const value = valueEntity.readValue()

    // Get comments after the value
    const postComments = valueEntity.postCommentStrings
    if (postComments.length > 0) {
        console.log(`${key}: ${value} // ${postComments.join(', ')}`)
    } else {
        console.log(`${key}: ${value}`)
    }
}

// Example 5: Mixed comments
console.log('\n=== Example 5: Mixed Comment Styles ===')
const jsoncMixed = `{
    // Configuration file
    "version": "1.0", /* semantic versioning */
    /* 
     * Environment settings
     */
    "env": "production" // current environment
}`

const parser5 = new JsonObject()
parser5.feed(...stringToBytes(jsoncMixed))

console.log('Parsing JSONC with mixed comment styles:')
for (const { key: keyEntity, value: valueEntity } of parser5) {
    const pre = keyEntity.preCommentStrings
    const key = keyEntity.read()
    const value = valueEntity.readValue()
    const post = valueEntity.postCommentStrings

    if (pre.length > 0) {
        console.log(`  [Pre] ${pre.join(' | ')}`)
    }
    console.log(`  ${key}: ${value}`)
    if (post.length > 0) {
        console.log(`  [Post] ${post.join(' | ')}`)
    }
}

console.log('\n✅ All comment parsing examples completed!')
