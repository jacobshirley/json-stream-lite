[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / ByteStream

# Type Alias: ByteStream

> **ByteStream** = `AsyncIterable`\<[`JsonStreamInput`](JsonStreamInput.md)\> \| `Iterable`\<[`JsonStreamInput`](JsonStreamInput.md)\> \| `ReadableStream`\<[`JsonStreamInput`](JsonStreamInput.md)\>

An async iterable stream of JSON input that can be consumed incrementally.
Supports strings, numbers, arrays of numbers, or Uint8Arrays as stream items.
