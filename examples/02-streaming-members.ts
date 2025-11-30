/**
 * Streaming Object Members Example
 *
 * This example shows how to iterate through object members without loading
 * the entire object into memory at once.
 */

import { JsonObject } from "json-stream-lite";

function stringToBytes(str: string): number[] {
  return Array.from(new TextEncoder().encode(str));
}

// Example 1: Stream through object members
console.log("=== Example 1: Stream Object Members ===");
const userJson =
  '{"id": 123, "name": "Alice", "email": "alice@example.com", "age": 30}';
const userParser = new JsonObject();
userParser.feed(...stringToBytes(userJson));

console.log("Processing members one by one:");
for (const [keyEntity, valueEntity] of userParser.members()) {
  const key = keyEntity.read();
  const value = valueEntity.read().read();
  console.log(`  ${key}: ${value} (${typeof value})`);
}

// Example 2: Stream through array items
console.log("\n=== Example 2: Stream Array Items ===");
import { JsonArray } from "json-stream-lite";

const numbersJson = "[10, 20, 30, 40, 50]";
const numbersParser = new JsonArray();
numbersParser.feed(...stringToBytes(numbersJson));

console.log("Processing items one by one:");
let sum = 0;
for (const item of numbersParser.items()) {
  const value = item.read() as number;
  sum += value;
  console.log(`  Current value: ${value}, Running sum: ${sum}`);
}
console.log(`Final sum: ${sum}`);

// Example 3: Selective processing
console.log("\n=== Example 3: Selective Processing ===");
const dataJson =
  '{"header": "Report", "data": [1, 2, 3, 4, 5], "footer": "End"}';
const dataParser = new JsonObject();
dataParser.feed(...stringToBytes(dataJson));

console.log('Only processing the "data" field:');
for (const [keyEntity, valueEntity] of dataParser.members()) {
  const key = keyEntity.read();

  if (key === "data") {
    const value = valueEntity.read();
    if (value instanceof JsonArray) {
      const items = [];
      for (const item of value.items()) {
        items.push(item.read());
      }
      console.log(`  Found data array with ${items.length} items:`, items);
    }
  } else {
    // Skip other fields by just consuming them
    valueEntity.consume();
    console.log(`  Skipped field: ${key}`);
  }
}

// Example 4: Early termination
console.log("\n=== Example 4: Early Termination ===");
const largeJson = '{"a": 1, "b": 2, "c": 3, "target": 999, "d": 4, "e": 5}';
const searchParser = new JsonObject();
searchParser.feed(...stringToBytes(largeJson));

console.log('Searching for "target" field:');
for (const [keyEntity, valueEntity] of searchParser.members()) {
  const key = keyEntity.read();

  if (key === "target") {
    const value = valueEntity.read().read();
    console.log(`  Found target: ${value}`);
    break; // Stop processing once we found what we need
  } else {
    valueEntity.consume();
    console.log(`  Checked field: ${key}`);
  }
}
console.log("Early exit - didn't process remaining fields");
