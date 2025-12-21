[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / ByteStream

# Type Alias: ByteStream

> **ByteStream** = `AsyncIterable`\<[`StreamInput`](StreamInput.md)\> \| `Iterable`\<[`StreamInput`](StreamInput.md)\> \| `ReadableStream`\<[`StreamInput`](StreamInput.md)\>

An async iterable stream of JSON input that can be consumed incrementally.
Supports strings, numbers, arrays of numbers, or Uint8Arrays as stream items.
