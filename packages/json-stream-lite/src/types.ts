export type JsonStreamInput = string | number | number[] | Uint8Array
export type ByteStream = AsyncIterable<JsonStreamInput>
export type JsonPrimitive = string | number | boolean | null
export type JsonKeyValuePair = [string, JsonPrimitive]
