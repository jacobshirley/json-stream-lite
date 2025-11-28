// ReadableStream - Parsing from a ReadableStream
import { jsonKeyValueParserAsync, JsonKeyValuePair } from "json-stream-lite";

async function main() {
  const jsonString = '{"country": "Narnia", "area": 50000, "magical": true}';

  // Create a ReadableStream from the JSON string
  const stream = new ReadableStream<number>({
    start(controller) {
      for (const char of jsonString) {
        controller.enqueue(char.charCodeAt(0));
      }
      controller.close();
    },
  });

  console.log("Parsing from ReadableStream:");
  const pairs: JsonKeyValuePair[] = [];

  for await (const pair of jsonKeyValueParserAsync(stream)) {
    pairs.push(pair);
    console.log(`  ${pair.key}: ${pair.value}`);
  }

  console.log("\nTotal pairs:", pairs.length);
}

main();
