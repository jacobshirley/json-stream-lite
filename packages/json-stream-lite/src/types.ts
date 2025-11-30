export type ByteStream = AsyncIterable<number | number[] | Uint8Array>;
export type JsonPrimitive = string | number | boolean | null;
export type JsonKeyValuePair = [string, JsonPrimitive];
