# JSON-Stream-Lite Examples

This directory contains example scripts demonstrating how to use the JSON-Stream-Lite library.

## Basic JSON parsing example

```typescript
import { jsonKeyValueParser, JsonKeyValuePair } from "json-stream-lite";

/**
 * This example demonstrates the simplest way to parse JSON using
 * the json-stream-lite library with the jsonKeyValueParser generator.
 *
 * The parser flattens nested JSON structures into key-value pairs,
 * where keys use dot notation for nested objects and bracket notation
 * for arrays.
 */

// Example 1: Simple object
console.log("Example 1: Simple JSON Object");
console.log("==============================");

const simpleJson = '{"name": "Alice", "age": 30, "active": true}';
console.log(`Input: ${simpleJson}\n`);

for (const pair of jsonKeyValueParser(simpleJson)) {
  console.log(`  ${pair.key}: ${JSON.stringify(pair.value)}`);
}

// Example 2: Nested objects
console.log("\n\nExample 2: Nested Objects");
console.log("==========================");

const nestedJson =
  '{"user": {"name": "Bob", "address": {"city": "NYC", "zip": "10001"}}}';
console.log(`Input: ${nestedJson}\n`);

for (const pair of jsonKeyValueParser(nestedJson)) {
  console.log(`  ${pair.key}: ${JSON.stringify(pair.value)}`);
}

// Example 3: Arrays
console.log("\n\nExample 3: Arrays");
console.log("==================");

const arrayJson = '{"colors": ["red", "green", "blue"], "count": 3}';
console.log(`Input: ${arrayJson}\n`);

for (const pair of jsonKeyValueParser(arrayJson)) {
  console.log(`  ${pair.key}: ${JSON.stringify(pair.value)}`);
}

// Example 4: Complex nested structure
console.log("\n\nExample 4: Complex Nested Structure");
console.log("====================================");

const complexJson =
  '{"data": {"user": {"id": 1, "name": "Alice"}, "active": true}}';
console.log(`Input: ${complexJson}\n`);

for (const pair of jsonKeyValueParser(complexJson)) {
  console.log(`  ${pair.key}: ${JSON.stringify(pair.value)}`);
}

// Example 5: Collecting pairs into an array
console.log("\n\nExample 5: Collecting Pairs");
console.log("============================");

const json = '{"a": 1, "b": 2, "c": 3}';
const pairs: JsonKeyValuePair[] = [];

for (const pair of jsonKeyValueParser(json)) {
  pairs.push(pair);
}

console.log(`Input: ${json}`);
console.log(`Collected ${pairs.length} key-value pairs:`);
pairs.forEach((p, i) => console.log(`  [${i}] ${p.key} = ${p.value}`));
```

## Async streaming JSON parsing example

```typescript
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
```

## Using JsonKeyValueParser class directly

```typescript
import { JsonKeyValueParser, JsonKeyValuePair } from "json-stream-lite";

/**
 * This example demonstrates how to use the JsonKeyValueParser class
 * directly for more control over the parsing process.
 *
 * The class-based approach is useful when:
 * - You need to feed data incrementally
 * - You want to control when parsing occurs
 * - You need to handle partial/incomplete JSON
 */

// Helper function to convert string to bytes
function stringToBytes(str: string): number[] {
  return Array.from(new TextEncoder().encode(str));
}

// Example 1: Basic usage with feed and parseNext
console.log("Example 1: Basic Feed and Parse");
console.log("================================");

const parser1 = new JsonKeyValueParser();
const json1 = '{"name": "Alice", "score": 100}';

console.log(`Input: ${json1}\n`);

// Feed all bytes at once
parser1.feed(...stringToBytes(json1));

// Parse and collect results
for (const pair of parser1.parseNext()) {
  console.log(`  ${pair.key}: ${JSON.stringify(pair.value)}`);
}

// Example 2: Incremental feeding (byte by byte)
console.log("\n\nExample 2: Byte-by-Byte Feeding");
console.log("================================");

const parser2 = new JsonKeyValueParser();
const json2 = '{"a": 1, "b": 2, "c": 3}';

console.log(`Input: ${json2}`);
console.log("Feeding one byte at a time and parsing immediately:\n");

const pairs2: JsonKeyValuePair[] = [];
for (const byte of stringToBytes(json2)) {
  parser2.feed(byte);
  // Try to parse after each byte
  for (const pair of parser2.parseNext()) {
    pairs2.push(pair);
    console.log(`  Found pair: ${pair.key} = ${pair.value}`);
  }
}

console.log(`\nTotal pairs found: ${pairs2.length}`);

// Example 3: Chunk-based feeding
console.log("\n\nExample 3: Chunk-Based Feeding");
console.log("===============================");

const parser3 = new JsonKeyValueParser();
const json3 = '{"user": {"name": "Bob", "id": 42}, "active": true}';

// Split into chunks
const chunks = [
  '{"user": {"na',
  'me": "Bob", "',
  'id": 42}, "ac',
  'tive": true}',
];

console.log("Original JSON split into chunks:");
chunks.forEach((chunk, i) => console.log(`  Chunk ${i + 1}: "${chunk}"`));
console.log("\nProcessing chunks:\n");

const pairs3: JsonKeyValuePair[] = [];
for (let i = 0; i < chunks.length; i++) {
  console.log(`  Processing chunk ${i + 1}...`);
  parser3.feed(...stringToBytes(chunks[i]));

  // Check for completed pairs after each chunk
  for (const pair of parser3.parseNext()) {
    pairs3.push(pair);
    console.log(`    -> Parsed: ${pair.key} = ${JSON.stringify(pair.value)}`);
  }
}

console.log(`\nTotal pairs found: ${pairs3.length}`);

// Example 4: Handling different value types
console.log("\n\nExample 4: Different Value Types");
console.log("==================================");

const parser4 = new JsonKeyValueParser();
const json4 =
  '{"string": "hello", "number": 42.5, "bool": true, "nil": null, "negative": -10}';

console.log(`Input: ${json4}\n`);

parser4.feed(...stringToBytes(json4));

for (const pair of parser4.parseNext()) {
  const valueType = pair.value === null ? "null" : typeof pair.value;
  console.log(`  ${pair.key}: ${JSON.stringify(pair.value)} (${valueType})`);
}

// Example 5: Top-level arrays
console.log("\n\nExample 5: Top-Level Arrays");
console.log("============================");

const parser5 = new JsonKeyValueParser();
const json5 = '[{"id": 1}, {"id": 2}, {"id": 3}]';

console.log(`Input: ${json5}\n`);

parser5.feed(...stringToBytes(json5));

for (const pair of parser5.parseNext()) {
  console.log(`  ${pair.key}: ${JSON.stringify(pair.value)}`);
}
```

## Incremental parsing example

```typescript
import { JsonKeyValueParser, JsonKeyValuePair } from "json-stream-lite";

/**
 * This example demonstrates incremental JSON parsing, where data
 * arrives in chunks over time (simulating network streaming).
 *
 * The parser maintains internal state, allowing it to:
 * - Buffer incomplete data
 * - Resume parsing when more data arrives
 * - Emit key-value pairs as soon as they're complete
 */

// Helper function to convert string to bytes
function stringToBytes(str: string): number[] {
  return Array.from(new TextEncoder().encode(str));
}

// Simulate delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Example 1: Simulating network chunks
console.log("Example 1: Simulating Network Data Chunks");
console.log("==========================================");

async function simulateNetworkStream() {
  const parser = new JsonKeyValueParser();

  // Complete JSON that will arrive in chunks
  const fullJson =
    '{"response": {"status": "ok", "data": {"users": [{"name": "Alice"}, {"name": "Bob"}]}}}';

  // Simulate chunked delivery
  const chunkSize = 15;
  const chunks: string[] = [];
  for (let i = 0; i < fullJson.length; i += chunkSize) {
    chunks.push(fullJson.slice(i, i + chunkSize));
  }

  console.log("Full JSON:", fullJson);
  console.log(`\nDelivering in ${chunks.length} chunks:\n`);

  const allPairs: JsonKeyValuePair[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Chunk ${i + 1}: "${chunk}"`);

    // Feed chunk to parser
    parser.feed(...stringToBytes(chunk));

    // Try to extract any complete key-value pairs
    for (const pair of parser.parseNext()) {
      allPairs.push(pair);
      console.log(
        `  -> Extracted: ${pair.key} = ${JSON.stringify(pair.value)}`,
      );
    }

    // Simulate network delay
    await delay(100);
  }

  console.log(`\nTotal pairs extracted: ${allPairs.length}`);
  console.log("All pairs:");
  allPairs.forEach((p) =>
    console.log(`  ${p.key}: ${JSON.stringify(p.value)}`),
  );
}

await simulateNetworkStream();

// Example 2: Processing a stream of JSON objects
console.log("\n\nExample 2: Stream of JSON Objects");
console.log("===================================");

async function processJsonStream() {
  // Simulate a stream of separate JSON objects (like NDJSON)
  const jsonObjects = [
    '{"event": "start", "time": 0}',
    '{"event": "data", "value": 42}',
    '{"event": "end", "time": 100}',
  ];

  console.log("Processing stream of JSON objects:\n");

  for (const json of jsonObjects) {
    const parser = new JsonKeyValueParser();
    console.log(`Object: ${json}`);

    parser.feed(...stringToBytes(json));

    for (const pair of parser.parseNext()) {
      console.log(`  ${pair.key}: ${JSON.stringify(pair.value)}`);
    }

    await delay(50);
  }
}

await processJsonStream();

// Example 3: Real-time data processing pattern
console.log("\n\nExample 3: Real-Time Data Processing");
console.log("======================================");

async function realTimeProcessing() {
  const parser = new JsonKeyValueParser();

  // Simulate real-time sensor data with a simpler structure
  const sensorData = '{"sensor": "temp", "value": 22.5, "unit": "celsius"}';

  console.log("Simulating real-time sensor data arrival:\n");

  // Feed data character by character (extreme case)
  let pairsFound = 0;
  for (let i = 0; i < sensorData.length; i++) {
    const char = sensorData[i];
    parser.feed(char.charCodeAt(0));

    // Check for completed pairs
    for (const pair of parser.parseNext()) {
      pairsFound++;
      console.log(
        `[char ${i + 1}] New pair: ${pair.key} = ${JSON.stringify(pair.value)}`,
      );
    }
  }

  console.log(
    `\nProcessed ${sensorData.length} characters, found ${pairsFound} pairs`,
  );
}

await realTimeProcessing();

// Example 4: Handling incomplete data gracefully
console.log("\n\nExample 4: Handling Incomplete Data");
console.log("=====================================");

function handleIncompleteData() {
  const parser = new JsonKeyValueParser();

  // First batch of data (incomplete)
  const part1 = '{"message": "Hello';
  console.log(`First batch: "${part1}"`);

  parser.feed(...stringToBytes(part1));
  let count = 0;
  for (const pair of parser.parseNext()) {
    count++;
    console.log(`  Found: ${pair.key}`);
  }
  console.log(`  Pairs found so far: ${count}`);

  // Second batch completes the JSON
  const part2 = '", "complete": true}';
  console.log(`\nSecond batch: "${part2}"`);

  parser.feed(...stringToBytes(part2));
  for (const pair of parser.parseNext()) {
    count++;
    console.log(`  Found: ${pair.key} = ${JSON.stringify(pair.value)}`);
  }
  console.log(`  Total pairs: ${count}`);
}

handleIncompleteData();
```

## Practical use cases example

```typescript
import { jsonKeyValueParser, JsonKeyValuePair } from "json-stream-lite";

/**
 * This example demonstrates practical use cases for json-stream-lite
 * in real-world scenarios like configuration parsing, data filtering,
 * and transformation pipelines.
 */

// Example 1: Configuration file parsing
console.log("Example 1: Configuration Parsing");
console.log("=================================");

const configJson = `{
    "app": {
        "name": "MyApp",
        "version": "1.0.0",
        "debug": false
    },
    "database": {
        "host": "localhost",
        "port": 5432
    }
}`;

console.log("Parsing configuration file:\n");

// Build a flat configuration map
const config = new Map<string, string | number | boolean | null>();
for (const pair of jsonKeyValueParser(configJson)) {
  config.set(pair.key, pair.value);
  console.log(`  ${pair.key} = ${JSON.stringify(pair.value)}`);
}

console.log(`\nConfiguration entries: ${config.size}`);

// Access specific values
console.log("\nAccessing specific values:");
console.log(`  App name: ${config.get("app.name")}`);
console.log(`  Database host: ${config.get("database.host")}`);
console.log(`  Debug mode: ${config.get("app.debug")}`);

// Example 2: Path-based value extraction
console.log("\n\nExample 2: Path-Based Value Extraction");
console.log("========================================");

function getValueAtPath(json: string, targetPath: string): unknown | undefined {
  for (const pair of jsonKeyValueParser(json)) {
    if (pair.key === targetPath) {
      return pair.value;
    }
  }
  return undefined;
}

const apiResponse = `{
    "response": {
        "data": {
            "user": {
                "email": "user@example.com",
                "name": "John"
            }
        }
    }
}`;

console.log('Extracting value at path "response.data.user.email":');
const email = getValueAtPath(apiResponse, "response.data.user.email");
console.log(`  Result: ${email}`);

console.log('\nExtracting value at path "response.data.user.name":');
const name = getValueAtPath(apiResponse, "response.data.user.name");
console.log(`  Result: ${name}`);

// Example 3: Streaming data validation
console.log("\n\nExample 3: Streaming Data Validation");
console.log("======================================");

const dataToValidate = `{
    "name": "Product",
    "price": 49.99,
    "stock": 100,
    "category": "electronics"
}`;

console.log("Validating product data:\n");

interface ValidationRule {
  field: string;
  validate: (value: unknown) => boolean;
  message: string;
}

const rules: ValidationRule[] = [
  {
    field: "name",
    validate: (v) => typeof v === "string" && (v as string).length > 0,
    message: "Name must be a non-empty string",
  },
  {
    field: "price",
    validate: (v) => typeof v === "number" && (v as number) > 0,
    message: "Price must be a positive number",
  },
  {
    field: "stock",
    validate: (v) => typeof v === "number" && Number.isInteger(v as number),
    message: "Stock must be an integer",
  },
];

const errors: string[] = [];
const validated: Record<string, unknown> = {};

for (const pair of jsonKeyValueParser(dataToValidate)) {
  const rule = rules.find((r) => r.field === pair.key);
  if (rule) {
    if (rule.validate(pair.value)) {
      console.log(`  ✓ ${pair.key}: ${JSON.stringify(pair.value)}`);
      validated[pair.key] = pair.value;
    } else {
      console.log(`  ✗ ${pair.key}: ${rule.message}`);
      errors.push(rule.message);
    }
  } else {
    console.log(
      `  - ${pair.key}: ${JSON.stringify(pair.value)} (no validation)`,
    );
  }
}

console.log(`\nValidation ${errors.length === 0 ? "passed" : "failed"}!`);

// Example 4: Counting and summarizing values
console.log("\n\nExample 4: Counting and Summarizing");
console.log("=====================================");

const statsJson =
  '{"temperature": 22.5, "humidity": 65, "pressure": 1013, "windSpeed": 12.3}';

console.log(`Input: ${statsJson}\n`);

let numericCount = 0;
let sum = 0;
let max = -Infinity;
let maxKey = "";

for (const pair of jsonKeyValueParser(statsJson)) {
  if (typeof pair.value === "number") {
    numericCount++;
    sum += pair.value;
    if (pair.value > max) {
      max = pair.value;
      maxKey = pair.key;
    }
    console.log(`  ${pair.key}: ${pair.value}`);
  }
}

console.log(`\nSummary:`);
console.log(`  Numeric values: ${numericCount}`);
console.log(`  Sum: ${sum}`);
console.log(`  Average: ${(sum / numericCount).toFixed(2)}`);
console.log(`  Maximum: ${max} (${maxKey})`);

// Example 5: Building a simple object from key-value pairs
console.log("\n\nExample 5: Building Object from Key-Value Pairs");
console.log("=================================================");

const simpleJson = '{"firstName": "Jane", "lastName": "Doe", "age": 28}';
console.log(`Input: ${simpleJson}\n`);

const result: Record<string, string | number | boolean | null> = {};

for (const pair of jsonKeyValueParser(simpleJson)) {
  result[pair.key] = pair.value;
}

console.log("Reconstructed object:");
console.log(`  ${JSON.stringify(result, null, 2).split("\n").join("\n  ")}`);
```
