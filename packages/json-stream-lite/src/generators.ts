import { JsonKeyValuePair } from "./json-key-value-pair";
import { JsonKeyValueParser } from "./json-parser";
import { stringToBytes } from "./utils";

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
