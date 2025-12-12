import { JsonKeyValuePair } from './types.js'
import { JsonKeyValueParser } from './parser.js'
import { stringToBytes } from './utils.js'

/**
 * Parses JSON input and yields key-value pairs for all primitive values.
 * Flattens nested structures using dot notation and array indices.
 *
 * @param bytes - The JSON input as bytes or string
 * @yields Key-value pairs as [key, value] tuples
 *
 * @example
 * ```typescript
 * const json = '{"user": {"name": "John", "age": 30}}';
 * for (const [key, value] of jsonKeyValueParser(json)) {
 *   console.log(`${key}: ${value}`);
 *   // Output: "user.name: John", "user.age: 30"
 * }
 * ```
 */
export function* jsonKeyValueParser(
    bytes: Iterable<number> | string,
): Generator<JsonKeyValuePair> {
    if (typeof bytes === 'string') {
        bytes = stringToBytes(bytes)
    }

    const parser = new JsonKeyValueParser()

    for (const byte of bytes) {
        parser.feed(byte)
    }

    yield* parser.parse()
}

/**
 * Asynchronously parses JSON input from various sources and yields key-value pairs.
 * Supports streaming from async iterables and ReadableStreams for memory-efficient parsing.
 *
 * @param bytes - The JSON input as bytes, string, or stream
 * @yields Key-value pairs as [key, value] tuples
 *
 * @example
 * ```typescript
 * const stream = fs.createReadStream('large.json');
 * for await (const [key, value] of jsonKeyValueParserAsync(stream)) {
 *   console.log(`${key}: ${value}`);
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
    if (typeof bytes === 'string') {
        bytes = stringToBytes(bytes)
    }

    async function* byteStream(): AsyncGenerator<number> {
        if (typeof bytes === 'string') {
            yield* stringToBytes(bytes)
        } else if (bytes instanceof ReadableStream) {
            const reader = bytes.getReader()

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                if (value instanceof Uint8Array) {
                    yield* value
                } else if (typeof value === 'string') {
                    yield* stringToBytes(value)
                } else {
                    yield value
                }
            }
        } else if (Symbol.asyncIterator in bytes) {
            for await (const byte of bytes) {
                yield byte
            }
        } else {
            for (const byte of bytes) {
                yield byte
            }
        }
    }

    const parser = new JsonKeyValueParser(byteStream())

    yield* parser.parseAsync()
}
