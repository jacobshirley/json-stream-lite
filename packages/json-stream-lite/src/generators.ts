import { JsonKeyValuePair } from './json-key-value-pair'
import { JsonKeyValueParser } from './json-parser'

export function* jsonKeyValueParser(
    ...bytes: number[]
): Generator<JsonKeyValuePair> {
    const parser = new JsonKeyValueParser()

    for (const byte of bytes) {
        parser.feed(byte)
    }

    yield* parser.parseNext()
}

export async function* jsonKeyValueParserAsync(
    bytes: Iterable<number> | AsyncIterable<number>,
): AsyncGenerator<JsonKeyValuePair> {
    const parser = new JsonKeyValueParser()

    for await (const byte of bytes) {
        parser.feed(byte)
    }

    yield* parser.parseNext()
}
