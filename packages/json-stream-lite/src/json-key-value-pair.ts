/**
 * Type representing JSON primitive values.
 * Includes string, number, boolean, and null.
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * Represents a key-value pair extracted from parsed JSON.
 *
 * The key is a path string using dot-notation for nested objects
 * and bracket-notation for array indices.
 *
 * @example
 * ```typescript
 * // For JSON: {"user": {"name": "Alice"}}
 * // Yields: JsonKeyValuePair { key: "user.name", value: "Alice" }
 *
 * // For JSON: {"items": [1, 2, 3]}
 * // Yields:
 * // JsonKeyValuePair { key: "items[0]", value: 1 }
 * // JsonKeyValuePair { key: "items[1]", value: 2 }
 * // JsonKeyValuePair { key: "items[2]", value: 3 }
 * ```
 */
export class JsonKeyValuePair {
  /**
   * The path to the value in the JSON structure.
   * Uses dot-notation for object keys (e.g., "user.name") and
   * bracket-notation for array indices (e.g., "items[0]").
   */
  key: string;

  /**
   * The primitive value at this path.
   * Can be a string, number, boolean, or null.
   */
  value: JsonPrimitive;

  /**
   * Creates a new JsonKeyValuePair.
   *
   * @param key - The path to the value in the JSON structure
   * @param value - The primitive value at this path
   */
  constructor(key: string, value: JsonPrimitive) {
    this.key = key;
    this.value = value;
  }
}
