// Basic Parsing - Parsing a simple JSON string
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
