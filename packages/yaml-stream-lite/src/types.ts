/**
 * Union type representing valid stream input formats.
 */
export type StreamInput = string | number | number[] | Uint8Array

/**
 * An async iterable stream of YAML input that can be consumed incrementally.
 */
export type ByteStream =
    | AsyncIterable<StreamInput>
    | Iterable<StreamInput>
    | ReadableStream<StreamInput>

/**
 * Union type representing all YAML primitive value types.
 */
export type YamlPrimitive = string | number | boolean | null

/**
 * A tuple representing a flattened key-value pair from a YAML structure.
 */
export type YamlKeyValuePair = [string, YamlPrimitive]

/**
 * Options for configuring YAML parsing behavior.
 */
export type YamlParserOptions = {
    /** Enable multi-document parsing (--- / ...). */
    multiDocument?: boolean
}
