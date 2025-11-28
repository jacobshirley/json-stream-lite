// Fetch API - Parsing JSON from a fetch response stream
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
