[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonStreamStringifyOptions

# Type Alias: JsonStreamStringifyOptions

> **JsonStreamStringifyOptions** = `object`

Options for JSON streaming stringification.

## Properties

### comments?

> `optional` **comments**: `Record`\<`string`, [`JsoncStringifyComment`](JsoncStringifyComment.md) \| [`JsoncStringifyComment`](JsoncStringifyComment.md)[]\>

Comments to emit, keyed by dot-notation path. Only emitted when indent > 0.

---

### jsonc?

> `optional` **jsonc**: `boolean`

Enable JSONC output (trailing commas after last items)

---

### stringChunkSize?

> `optional` **stringChunkSize**: `number`

Maximum size of string chunks when yielding formatted strings
