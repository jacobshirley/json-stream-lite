// Top-Level Arrays - Parsing JSON arrays at the root level
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
