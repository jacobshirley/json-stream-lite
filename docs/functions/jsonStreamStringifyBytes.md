[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / jsonStreamStringifyBytes

# Function: jsonStreamStringifyBytes()

> **jsonStreamStringifyBytes**(`value`, `replacer?`, `indent?`, `options?`): `Generator`\<`Uint8Array`\<`ArrayBufferLike`\>\>

Converts a JavaScript value to JSON format, yielding Uint8Array byte chunks.
Provides memory-efficient streaming stringification with binary output.

## Parameters

### value

`unknown`

The value to stringify

### replacer?

`any`

Optional replacer function or array for filtering/transforming values

### indent?

`number` = `0`

Number of spaces for indentation (0 for compact output)

### options?

[`JsonStreamStringifyOptions`](../type-aliases/JsonStreamStringifyOptions.md)

Additional stringification options

## Returns

`Generator`\<`Uint8Array`\<`ArrayBufferLike`\>\>

Generator yielding JSON as Uint8Array chunks

## Example

```typescript
const data = { name: 'John', age: 30 }
for (const chunk of jsonStreamStringifyBytes(data)) {
    await stream.write(chunk)
}
```
