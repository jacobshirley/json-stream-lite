/**
 * Async Streaming Example
 *
 * This example demonstrates how to process JSON from async sources
 * like streams, fetch responses, or async iterables.
 */

import {
  JsonObject,
  JsonArray,
  jsonKeyValueParserAsync,
} from "json-stream-lite";

// Helper to simulate an async byte stream
async function* createAsyncByteStream(
  json: string,
  chunkSize: number = 10,
): AsyncGenerator<number> {
  const bytes = new TextEncoder().encode(json);

  for (let i = 0; i < bytes.length; i += chunkSize) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    const chunk = bytes.slice(i, i + chunkSize);
    yield* chunk;
  }
}

// Example 1: Parse object from async stream
console.log("=== Example 1: Parse Object from Async Stream ===");
async function parseAsyncObject() {
  const json = '{"name": "Alice", "age": 30, "city": "NYC"}';
  const stream = createAsyncByteStream(json);

  const parser = new JsonObject(stream);

  console.log("Streaming members asynchronously:");
  for await (const [keyEntity, valueEntity] of parser) {
    const key = keyEntity.read();
    const value = await valueEntity.readValueAsync();
    console.log(`  ${key}: ${value}`);
  }
}

await parseAsyncObject();

// Example 2: Parse array from async stream
console.log("\n=== Example 2: Parse Array from Async Stream ===");
async function parseAsyncArray() {
  const json = "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]";
  const stream = createAsyncByteStream(json, 5);

  const parser = new JsonArray(stream);

  console.log("Processing items as they arrive:");
  let sum = 0;
  for await (const item of parser) {
    const value = await item.readAsync();
    sum += value as number;
    console.log(`  Received: ${value}, Running sum: ${sum}`);
  }
  console.log(`Final sum: ${sum}`);
}

await parseAsyncArray();

// Example 3: Async key-value extraction
console.log("\n=== Example 3: Async Key-Value Extraction ===");
async function asyncKeyValueExtraction() {
  const json = JSON.stringify({
    user: {
      profile: {
        name: "Bob",
        email: "bob@example.com",
      },
      scores: [85, 90, 95],
    },
  });

  const stream = createAsyncByteStream(json, 15);

  console.log("Extracting key-value pairs asynchronously:");
  for await (const [key, value] of jsonKeyValueParserAsync(stream)) {
    console.log(`  ${key} = ${value}`);
  }
}

await asyncKeyValueExtraction();

// Example 4: Simulated HTTP response
console.log("\n=== Example 4: Simulated HTTP Response ===");
async function processHttpResponse() {
  // Simulate fetching JSON from an API
  const responseData = JSON.stringify({
    status: "success",
    data: {
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
      ],
    },
  });

  const stream = createAsyncByteStream(responseData, 20);
  const parser = new JsonObject(stream);

  console.log("Processing HTTP response:");
  for await (const [keyEntity, valueEntity] of parser) {
    const key = keyEntity.read();

    if (key === "data") {
      console.log(`  Found ${key} field:`);
      const dataValue = await valueEntity.readAsync();
      const dataObj = dataValue as JsonObject;

      for await (const [dataKey, dataValueEntity] of dataObj) {
        const dataKeyStr = dataKey.read();
        if (dataKeyStr === "users") {
          console.log(`    Found users array:`);
          const usersValue = await dataValueEntity.readAsync();
          const usersArray = usersValue as JsonArray;

          let count = 0;
          for await (const user of usersArray) {
            const userData = await user.readAsync();
            console.log(`      User ${++count}:`, userData);
          }
        }
      }
    } else {
      const value = await valueEntity.readValueAsync();
      console.log(`  ${key}: ${value}`);
    }
  }
}

await processHttpResponse();

// Example 5: Handle large dataset with async processing
console.log("\n=== Example 5: Process Large Dataset ===");
async function processLargeDataset() {
  // Simulate a large dataset
  const records = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    value: Math.random() * 100,
  }));

  const json = JSON.stringify({ records });
  const stream = createAsyncByteStream(json, 50);

  const parser = new JsonObject(stream);

  console.log("Processing large dataset:");
  let recordCount = 0;
  let totalValue = 0;

  for await (const [keyEntity, valueEntity] of parser) {
    const key = keyEntity.read();

    if (key === "records") {
      const value = await valueEntity.readAsync();
      const array = value as JsonArray;

      for await (const item of array) {
        const record = (await item.readAsync()) as any;
        recordCount++;
        totalValue += record.value;
      }
    }
  }

  console.log(`  Processed ${recordCount} records`);
  console.log(`  Average value: ${(totalValue / recordCount).toFixed(2)}`);
}

await processLargeDataset();

console.log("\n=== All async examples completed ===");
