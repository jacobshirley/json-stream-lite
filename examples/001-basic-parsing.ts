// Basic JSON parsing example

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
