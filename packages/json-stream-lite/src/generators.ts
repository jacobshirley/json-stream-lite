import { JsonKeyValuePair } from "./types";
import { JsonKeyValueParser } from "./parser";
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

  yield* parser.parse();
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

  async function* byteStream(): AsyncGenerator<number> {
    if (typeof bytes === "string") {
      yield* stringToBytes(bytes);
    } else if (bytes instanceof ReadableStream) {
      const reader = bytes.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value instanceof Uint8Array) {
          yield* value;
        } else if (typeof value === "string") {
          yield* stringToBytes(value);
        } else {
          yield value;
        }
      }
    } else if (Symbol.asyncIterator in bytes) {
      for await (const byte of bytes) {
        yield byte;
      }
    } else {
      for (const byte of bytes) {
        yield byte;
      }
    }
  }

  const parser = new JsonKeyValueParser(byteStream());

  yield* parser.parseAsync();
}
