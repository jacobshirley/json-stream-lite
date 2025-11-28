// Async Streaming - Parsing JSON from an async stream
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
