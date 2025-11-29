// Async streaming JSON parsing example

import { jsonKeyValueParserAsync, JsonKeyValuePair } from "json-stream-lite";

/**
 * This example demonstrates how to use the async generator
 * jsonKeyValueParserAsync for parsing JSON data from asynchronous sources.
 *
 * This is particularly useful when processing data from:
 * - Async iterables
 * - Streams
 * - Network responses
 */

// Example 1: Parsing from an async generator
console.log("Example 1: Async Generator Source");
console.log("==================================");

const jsonString =
  '{"city": "Wonderland", "population": 1000, "magical": true}';
console.log(`Input: ${jsonString}\n`);

// Create an async generator that yields bytes one at a time
async function* byteGenerator(str: string): AsyncGenerator<number> {
  for (const char of str) {
    yield char.charCodeAt(0);
  }
}

const pairs1: JsonKeyValuePair[] = [];
for await (const pair of jsonKeyValueParserAsync(byteGenerator(jsonString))) {
  pairs1.push(pair);
  console.log(`  Received: ${pair.key} = ${JSON.stringify(pair.value)}`);
}

// Example 2: Parsing from a ReadableStream
console.log("\n\nExample 2: ReadableStream Source");
console.log("=================================");

const streamJson = '{"items": [1, 2, 3], "total": 3}';
console.log(`Input: ${streamJson}\n`);

// Create a ReadableStream that chunks the data
const stream = new ReadableStream<Uint8Array>({
  start(controller) {
    const encoder = new TextEncoder();
    // Simulate chunked data by splitting into parts
    const parts = ['{"items": [1, ', "2, 3], ", '"total": 3}'];
    for (const part of parts) {
      controller.enqueue(encoder.encode(part));
    }
    controller.close();
  },
});

const pairs2: JsonKeyValuePair[] = [];
for await (const pair of jsonKeyValueParserAsync(stream)) {
  pairs2.push(pair);
  console.log(`  Received: ${pair.key} = ${JSON.stringify(pair.value)}`);
}

// Example 3: Simulating slow data arrival
console.log("\n\nExample 3: Simulating Slow Data Arrival");
console.log("=========================================");

const slowJson = '{"status": "complete", "value": 42}';
console.log(`Input: ${slowJson}`);
console.log("(simulating 50ms delay between chunks)\n");

async function* slowByteGenerator(str: string): AsyncGenerator<number> {
  const chunkSize = 10;
  for (let i = 0; i < str.length; i += chunkSize) {
    const chunk = str.slice(i, i + chunkSize);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log(`  [Received chunk: "${chunk}"]`);
    for (const char of chunk) {
      yield char.charCodeAt(0);
    }
  }
}

const startTime = Date.now();
const pairs3: JsonKeyValuePair[] = [];
for await (const pair of jsonKeyValueParserAsync(slowByteGenerator(slowJson))) {
  pairs3.push(pair);
  console.log(`  Parsed: ${pair.key} = ${JSON.stringify(pair.value)}`);
}
console.log(`\n  Total time: ${Date.now() - startTime}ms`);

// Example 4: Processing large arrays incrementally
console.log("\n\nExample 4: Large Array Processing");
console.log("===================================");

// Generate a JSON array with many items
const items = Array.from({ length: 10 }, (_, i) => `"item${i}"`);
const largeArrayJson = `{"results": [${items.join(",")}]}`;
console.log(`Input: Array with ${items.length} items\n`);

let count = 0;
for await (const pair of jsonKeyValueParserAsync(largeArrayJson)) {
  count++;
  console.log(`  [${count}] ${pair.key} = ${JSON.stringify(pair.value)}`);
}
console.log(`\n  Total pairs: ${count}`);
