/**
 * Union type representing valid JSON stream input formats.
 */
export type JsonStreamInput = string | number | number[] | Uint8Array

/**
 * An async iterable stream of JSON input that can be consumed incrementally.
 * Supports strings, numbers, arrays of numbers, or Uint8Arrays as stream items.
 */
export type ByteStream =
    | AsyncIterable<JsonStreamInput>
    | Iterable<JsonStreamInput>
    | ReadableStream<JsonStreamInput>

/**
 * Union type representing all JSON primitive value types.
 */
export type JsonPrimitive = string | number | boolean | null

/**
 * A tuple representing a flattened key-value pair from a JSON structure.
 * The key is a string (potentially with dot notation for nested properties)
 * and the value is a JSON primitive.
 */
export type JsonKeyValuePair = [string, JsonPrimitive]
