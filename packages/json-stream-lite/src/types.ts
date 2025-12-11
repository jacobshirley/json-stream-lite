/**
 * An async iterable stream of bytes that can be consumed incrementally.
 * Supports individual bytes, byte arrays, or Uint8Arrays.
 */
export type ByteStream = AsyncIterable<number | number[] | Uint8Array>

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
