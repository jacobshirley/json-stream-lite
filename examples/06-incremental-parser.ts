// Incremental Parser - Using the low-level parser for fine-grained control
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
