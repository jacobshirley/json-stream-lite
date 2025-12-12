[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / jsonKeyValueParserAsync

# Function: jsonKeyValueParserAsync()

> **jsonKeyValueParserAsync**(`bytes`): `AsyncGenerator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md)\>

Asynchronously parses JSON input from various sources and yields key-value pairs.
Supports streaming from async iterables and ReadableStreams for memory-efficient parsing.

## Parameters

### bytes

The JSON input as bytes, string, or stream

`string` | `Iterable`\<`number`, `any`, `any`\> | `AsyncIterable`\<`number`, `any`, `any`\> | `ReadableStream`\<`number`\> | `ReadableStream`\<`Uint8Array`\<`ArrayBufferLike`\>\> | `ReadableStream`\<`string`\>

## Returns

`AsyncGenerator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md)\>

## Yields

Key-value pairs as [key, value] tuples

## Example

```typescript
const stream = fs.createReadStream('large.json')
for await (const [key, value] of jsonKeyValueParserAsync(stream)) {
    console.log(`${key}: ${value}`)
}
```
