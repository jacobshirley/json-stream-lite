import { describe, expect, test } from 'vitest'
import {
    JsonKeyValuePair,
    jsonKeyValueParser,
    jsonKeyValueParserAsync,
} from '../../src/index.js'
import { stringToBytes } from '../../src/utils.js'

describe('JSON streaming with generators', () => {
    test('should parse key-value pairs', () => {
        const jsonString = '{"name":"Alice","age":30}'
        const pairs: JsonKeyValuePair[] = []

        for (const jsonPair of jsonKeyValueParser(jsonString)) {
            pairs.push(jsonPair)
        }

        expect(pairs).toEqual([
            ['name', 'Alice'],
            ['age', 30],
        ])
    })

    test('should parse key-values pairs (async generator)', async () => {
        const jsonString = '{"city":"Wonderland","population":1000}'
        const pairs: JsonKeyValuePair[] = []

        for await (const jsonPair of jsonKeyValueParserAsync(
            (async function* () {
                for (const char of jsonString) {
                    yield char.charCodeAt(0)
                }
            })(),
        )) {
            pairs.push(jsonPair)
        }

        expect(pairs).toEqual([
            ['city', 'Wonderland'],
            ['population', 1000],
        ])
    })

    test('should parse key-value pairs from ReadableStream', async () => {
        const jsonString = '{"country":"Narnia","area":50000}'
        const stream = new ReadableStream<number>({
            start(controller) {
                for (const char of jsonString) {
                    controller.enqueue(char.charCodeAt(0))
                }
                controller.close()
            },
        })

        const pairs: JsonKeyValuePair[] = []

        for await (const jsonPair of jsonKeyValueParserAsync(stream)) {
            pairs.push(jsonPair)
        }

        expect(pairs).toEqual([
            ['country', 'Narnia'],
            ['area', 50000],
        ])
    })

    test('should parse key-value pairs via fetch stream', async () => {
        const url = 'https://jsonplaceholder.typicode.com/todos/1'
        const response = await fetch(url)

        if (!response.body) {
            throw new Error('No response body')
        }

        const pairs: JsonKeyValuePair[] = []

        for await (const jsonPair of jsonKeyValueParserAsync(response.body)) {
            pairs.push(jsonPair)
        }

        expect(pairs).toEqual([
            ['userId', 1],
            ['id', 1],
            ['title', 'delectus aut autem'],
            ['completed', false],
        ])
    })

    test('should incrementally parse JSON objects', async () => {
        const json = '{"a":1,"b":2}'
        const expectedPairs: JsonKeyValuePair[] = [
            ['a', 1],
            ['b', 2],
        ]
        const pairs: JsonKeyValuePair[] = []

        async function* byteStream() {
            for (const byte of stringToBytes(json)) {
                yield byte
            }
        }

        for await (const jsonPair of jsonKeyValueParserAsync(byteStream())) {
            pairs.push(jsonPair)
        }

        expect(pairs).toEqual(expectedPairs)
    })
})
