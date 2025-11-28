import { JsonKeyValuePair } from "./json-key-value-pair";
import { JsonKeyValueParser } from "./json-parser";

export function * jsonKeyValueParser(bytes: Iterable<number>): Generator<JsonKeyValuePair> {
    const parser = new JsonKeyValueParser()
    parser.feed(...bytes)
    yield* parser.parseNext()
}