# JSON-Stream-Lite Examples

This directory contains example scripts demonstrating how to use the JSON-Stream-Lite library.

## Basic Parsing - Parsing a simple JSON string

```typescript
import { jsonKeyValueParser, JsonKeyValuePair } from "json-stream-lite";

const jsonString = '{"name": "Alice", "age": 30, "active": true}';
const pairs: JsonKeyValuePair[] = [];

for (const pair of jsonKeyValueParser(jsonString)) {
  pairs.push(pair);
  console.log(`${pair.key}: ${pair.value}`);
}

// Output:
// name: Alice
// age: 30
// active: true
```

## Nested Objects - Parsing JSON with nested objects and arrays

```typescript
import { jsonKeyValueParser } from "json-stream-lite";

const json = JSON.stringify({
  user: {
    name: "Bob",
    profile: {
      email: "bob@example.com",
      verified: true,
    },
  },
  tags: ["admin", "active"],
  metadata: {
    created: 1699999999,
    items: [{ id: 1 }, { id: 2 }],
  },
});

console.log("Parsing nested JSON:");
for (const pair of jsonKeyValueParser(json)) {
  console.log(`  ${pair.key}: ${pair.value}`);
}

// Output:
// Parsing nested JSON:
//   user.name: Bob
//   user.profile.email: bob@example.com
//   user.profile.verified: true
//   tags[0]: admin
//   tags[1]: active
//   metadata.created: 1699999999
//   metadata.items[0].id: 1
//   metadata.items[1].id: 2
```

## Async Streaming - Parsing JSON from an async stream

```typescript
import { jsonKeyValueParserAsync, JsonKeyValuePair } from "json-stream-lite";

// Simulate streaming data with an async generator
async function* simulateStream(json: string): AsyncGenerator<number> {
  for (const char of json) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10));
    yield char.charCodeAt(0);
  }
}

async function main() {
  const json = '{"city": "Wonderland", "population": 1000, "active": true}';

  console.log("Parsing from async stream:");
  const pairs: JsonKeyValuePair[] = [];

  for await (const pair of jsonKeyValueParserAsync(simulateStream(json))) {
    pairs.push(pair);
    console.log(`  Received: ${pair.key} = ${pair.value}`);
  }

  console.log("\nAll pairs:", pairs);
}

main();
```

## Fetch API - Parsing JSON from a fetch response stream

```typescript
import { jsonKeyValueParserAsync, JsonKeyValuePair } from "json-stream-lite";

async function fetchAndParse(url: string) {
  console.log(`Fetching: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  const pairs: JsonKeyValuePair[] = [];

  for await (const pair of jsonKeyValueParserAsync(response.body)) {
    pairs.push(pair);
    console.log(`  ${pair.key}: ${pair.value}`);
  }

  return pairs;
}

// Example usage with JSONPlaceholder API
fetchAndParse("https://jsonplaceholder.typicode.com/todos/1").then((pairs) => {
  console.log("\nParsed", pairs.length, "key-value pairs");
});
```

## ReadableStream - Parsing from a ReadableStream

```typescript
import { jsonKeyValueParserAsync, JsonKeyValuePair } from "json-stream-lite";

async function main() {
  const jsonString = '{"country": "Narnia", "area": 50000, "magical": true}';

  // Create a ReadableStream from the JSON string
  const stream = new ReadableStream<number>({
    start(controller) {
      for (const char of jsonString) {
        controller.enqueue(char.charCodeAt(0));
      }
      controller.close();
    },
  });

  console.log("Parsing from ReadableStream:");
  const pairs: JsonKeyValuePair[] = [];

  for await (const pair of jsonKeyValueParserAsync(stream)) {
    pairs.push(pair);
    console.log(`  ${pair.key}: ${pair.value}`);
  }

  console.log("\nTotal pairs:", pairs.length);
}

main();
```

## Incremental Parser - Using the low-level parser for fine-grained control

```typescript
import { JsonKeyValueParser, JsonKeyValuePair } from "json-stream-lite";

// The low-level parser allows feeding bytes incrementally
const parser = new JsonKeyValueParser();

const json = '{"status": "ok", "data": {"id": 123, "items": [1, 2, 3]}}';
const bytes = new TextEncoder().encode(json);

console.log("Feeding bytes incrementally:");

const allPairs: JsonKeyValuePair[] = [];

// Feed bytes one at a time and process results as they become available
for (const byte of bytes) {
  parser.feed(byte);

  // Try to parse after each byte (yields as soon as complete pairs are ready)
  for (const pair of parser.parseNext()) {
    allPairs.push(pair);
    console.log(`  Parsed: ${pair.key} = ${pair.value}`);
  }
}

console.log("\nAll parsed pairs:");
for (const pair of allPairs) {
  console.log(`  ${pair.key}: ${pair.value}`);
}

// Output:
// Feeding bytes incrementally:
//   Parsed: status = ok
//   Parsed: data.id = 123
//   Parsed: data.items[0] = 1
//   Parsed: data.items[1] = 2
//   Parsed: data.items[2] = 3
//
// All parsed pairs:
//   status: ok
//   data.id: 123
//   data.items[0]: 1
//   data.items[1]: 2
//   data.items[2]: 3
```

## Top-Level Arrays - Parsing JSON arrays at the root level

```typescript
import { jsonKeyValueParser } from "json-stream-lite";

// Arrays at the root level use bracket notation for indices
const jsonArray = JSON.stringify([
  { name: "Alice", role: "admin" },
  { name: "Bob", role: "user" },
  { name: "Charlie", role: "guest" },
]);

console.log("Parsing top-level array:");
for (const pair of jsonKeyValueParser(jsonArray)) {
  console.log(`  ${pair.key}: ${pair.value}`);
}

// Output:
// Parsing top-level array:
//   [0].name: Alice
//   [0].role: admin
//   [1].name: Bob
//   [1].role: user
//   [2].name: Charlie
//   [2].role: guest
```
