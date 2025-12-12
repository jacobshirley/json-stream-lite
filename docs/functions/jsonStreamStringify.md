[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / jsonStreamStringify

# Function: jsonStreamStringify()

> **jsonStreamStringify**(`value`, `replacer?`, `indent?`, `options?`): `Generator`\<`string`\>

Converts a JavaScript value to JSON format, yielding string chunks.
Provides memory-efficient streaming stringification for large objects.

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

`Generator`\<`string`\>

Generator yielding JSON string chunks

## Example

```typescript
const data = { name: 'John', age: 30 }
for (const chunk of jsonStreamStringify(data)) {
    process.stdout.write(chunk)
}
```
