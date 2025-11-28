// Incremental parsing example

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
