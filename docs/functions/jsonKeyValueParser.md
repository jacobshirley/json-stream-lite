[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / jsonKeyValueParser

# Function: jsonKeyValueParser()

> **jsonKeyValueParser**(`bytes`): `Generator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md)\>

Parses JSON input and yields key-value pairs for all primitive values.
Flattens nested structures using dot notation and array indices.

## Parameters

### bytes

The JSON input as bytes or string

`string` | `Iterable`\<`number`, `any`, `any`\>

## Returns

`Generator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md)\>

## Yields

Key-value pairs as [key, value] tuples

## Example

```typescript
const json = '{"user": {"name": "John", "age": 30}}'
for (const [key, value] of jsonKeyValueParser(json)) {
    console.log(`${key}: ${value}`)
    // Output: "user.name: John", "user.age: 30"
}
```
