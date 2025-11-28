// Using JsonKeyValueParser class directly

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
