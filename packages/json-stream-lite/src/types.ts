/**
 * Union type representing valid stream input formats.
 */
export type StreamInput = string | number | number[] | Uint8Array

/**
 * An async iterable stream of JSON input that can be consumed incrementally.
 * Supports strings, numbers, arrays of numbers, or Uint8Arrays as stream items.
 */
export type ByteStream =
    | AsyncIterable<StreamInput>
    | Iterable<StreamInput>
    | ReadableStream<StreamInput>

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

/**
 * Options for configuring JSON parsing behavior.
 */
export type JsonParserOptions = {
    /** Enable JSONC (JSON with Comments) parsing. Allows // and /* * / comments. */
    jsonc?: boolean
    /** Enforce strict JSON parsing. When false, trailing commas are allowed. Default: true. */
    strict?: boolean
}
