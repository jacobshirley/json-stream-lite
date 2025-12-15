[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonObjectMember

# Type Alias: JsonObjectMember\<T\>

> **JsonObjectMember**\<`T`\> = `{ [K in keyof T]: { key: JsonString<Extract<K, string>>; value: JsonValue<T[K]> } }`\[keyof `T`\]

Type representing the members of a JSON object as key-value pairs.
Each member consists of a key of type K and a value of type T[K].

## Type Parameters

### T

`T` _extends_ `object`
