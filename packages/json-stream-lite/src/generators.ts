import { JsonKeyValuePair } from "./json-key-value-pair";
import { JsonKeyValueParser } from "./json-parser";
import { stringToBytes } from "./utils";

/**
 * Synchronous generator that parses JSON and yields key-value pairs.
 *
 * Nested objects and arrays are flattened using dot-notation for object keys
 * and bracket-notation for array indices.
 *
 * @param bytes - JSON input as a string or iterable of byte values
 * @returns A generator yielding {@link JsonKeyValuePair} objects
 *
 * @example
 * ```typescript
 * const json = '{"name": "Alice", "age": 30}'
 * for (const pair of jsonKeyValueParser(json)) {
 *     console.log(`${pair.key}: ${pair.value}`)
 * }
 * // Output:
 * // name: Alice
 * // age: 30
 * ```
 *
 * @example
 * ```typescript
 * // Nested objects use dot-notation
 * const nested = '{"user": {"name": "Bob"}}'
 * for (const pair of jsonKeyValueParser(nested)) {
 *     console.log(pair.key) // "user.name"
 * }
 * ```
 */
export function* jsonKeyValueParser(
  bytes: Iterable<number> | string,
): Generator<JsonKeyValuePair> {
  if (typeof bytes === "string") {
    bytes = stringToBytes(bytes);
  }

  const parser = new JsonKeyValueParser();

  for (const byte of bytes) {
    parser.feed(byte);
  }

  yield* parser.parseNext();
}

/**
 * Asynchronous generator that parses JSON from streams and yields key-value pairs.
 *
 * Supports various input types including strings, async iterables, and ReadableStreams.
 * Nested objects and arrays are flattened using dot-notation for object keys
 * and bracket-notation for array indices.
 *
 * @param bytes - JSON input as a string, iterable, async iterable, or ReadableStream
 * @returns An async generator yielding {@link JsonKeyValuePair} objects
 *
 * @example
 * ```typescript
 * // Parse from fetch response
 * const response = await fetch('https://api.example.com/data.json')
 * for await (const pair of jsonKeyValueParserAsync(response.body)) {
 *     console.log(`${pair.key}: ${pair.value}`)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Parse from async generator
 * async function* streamBytes() {
 *     for (const char of '{"key": "value"}') {
 *         yield char.charCodeAt(0)
 *     }
 * }
 * for await (const pair of jsonKeyValueParserAsync(streamBytes())) {
 *     console.log(pair)
 * }
 * ```
 */
export async function* jsonKeyValueParserAsync(
  bytes:
    | Iterable<number>
    | AsyncIterable<number>
    | string
    | ReadableStream<number>
    | ReadableStream<Uint8Array>
    | ReadableStream<string>,
): AsyncGenerator<JsonKeyValuePair> {
  if (typeof bytes === "string") {
    bytes = stringToBytes(bytes);
  }

  const parser = new JsonKeyValueParser();

  if (bytes instanceof ReadableStream) {
    const reader = bytes.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value instanceof Uint8Array) {
        for (const byte of value) {
          parser.feed(byte);
        }
      } else if (typeof value === "string") {
        const byteArray = stringToBytes(value);
        for (const byte of byteArray) {
          parser.feed(byte);
        }
      } else {
        parser.feed(value);
      }
    }
    yield* parser.parseNext();
    return;
  }

  for await (const byte of bytes) {
    parser.feed(byte);
  }

  yield* parser.parseNext();
}
