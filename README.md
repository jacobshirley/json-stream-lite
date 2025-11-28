# JSON-Stream-Lite

A lightweight, streaming JSON parser for JavaScript and TypeScript that processes JSON incrementally and yields key-value pairs as they are parsed.

[![npm version](https://badge.fury.io/js/json-stream-lite.svg)](https://badge.fury.io/js/json-stream-lite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Incremental Parsing**: Process JSON byte-by-byte as data streams in, without waiting for the complete document
- **Memory Efficient**: Handle large JSON files without loading them entirely into memory
- **Streaming Support**: Works with `ReadableStream`, `fetch` responses, async iterables, and strings
- **Flat Key-Value Output**: Nested structures are flattened using dot-notation paths (e.g., `obj.nested.key`)
- **TypeScript Support**: Full TypeScript support with type definitions included
- **Zero Dependencies**: No external runtime dependencies

## Installation

```bash
# Using npm
npm install json-stream-lite

# Using pnpm
pnpm add json-stream-lite

# Using yarn
yarn add json-stream-lite
```

## Quick Start

### Basic Usage

```typescript
import { jsonKeyValueParser, JsonKeyValuePair } from "json-stream-lite";

const jsonString = '{"name": "Alice", "age": 30}';

for (const pair of jsonKeyValueParser(jsonString)) {
  console.log(`${pair.key}: ${pair.value}`);
}

// Output:
// name: Alice
// age: 30
```

### Streaming from Fetch

```typescript
import { jsonKeyValueParserAsync, JsonKeyValuePair } from "json-stream-lite";

async function processApiResponse() {
  const response = await fetch("https://api.example.com/data.json");

  if (!response.body) {
    throw new Error("No response body");
  }

  for await (const pair of jsonKeyValueParserAsync(response.body)) {
    console.log(`${pair.key}: ${pair.value}`);
  }
}
```

### Nested Objects and Arrays

The parser flattens nested structures using dot-notation for objects and bracket-notation for arrays:

```typescript
import { jsonKeyValueParser } from "json-stream-lite";

const json = '{"user": {"name": "Bob", "tags": ["admin", "active"]}}';

for (const pair of jsonKeyValueParser(json)) {
  console.log(`${pair.key}: ${pair.value}`);
}

// Output:
// user.name: Bob
// user.tags[0]: admin
// user.tags[1]: active
```

## API Reference

### `jsonKeyValueParser(input)`

Synchronous generator that parses JSON and yields key-value pairs.

**Parameters:**

- `input`: `string | Iterable<number>` - JSON string or iterable of byte values

**Returns:** `Generator<JsonKeyValuePair>`

### `jsonKeyValueParserAsync(input)`

Asynchronous generator that parses JSON from streams and yields key-value pairs.

**Parameters:**

- `input`: `string | Iterable<number> | AsyncIterable<number> | ReadableStream<number> | ReadableStream<Uint8Array> | ReadableStream<string>`

**Returns:** `AsyncGenerator<JsonKeyValuePair>`

### `JsonKeyValueParser`

Low-level incremental parser class for more control over the parsing process.

```typescript
import { JsonKeyValueParser } from "json-stream-lite";

const parser = new JsonKeyValueParser();

// Feed bytes incrementally
parser.feed(byte1, byte2, byte3);

// Get parsed key-value pairs
for (const pair of parser.parseNext()) {
  console.log(pair);
}
```

### `JsonKeyValuePair`

Class representing a parsed key-value pair.

**Properties:**

- `key`: `string` - The path to the value (e.g., `"user.name"` or `"items[0]"`)
- `value`: `JsonPrimitive` - The parsed value (`string | number | boolean | null`)

## Use Cases

- **Processing Large JSON Files**: Parse gigabyte-sized JSON files without memory issues
- **Real-time Data Processing**: Handle streaming API responses as they arrive
- **Log Processing**: Process newline-delimited JSON (NDJSON) logs
- **ETL Pipelines**: Transform JSON data on-the-fly without buffering

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
