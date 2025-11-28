import { describe, expect, test } from 'vitest'
import {
    JsonKeyValuePair,
    jsonKeyValueParser,
    jsonKeyValueParserAsync,
} from '../../src'

describe('JSON streaming with generators', () => {
    test('should parse key-value pairs', () => {
        const jsonString = '{"name":"Alice","age":30}'
        const pairs: JsonKeyValuePair[] = []

        for (const jsonPair of jsonKeyValueParser(jsonString)) {
            pairs.push(jsonPair)
        }

        expect(pairs).toEqual([
            new JsonKeyValuePair('name', 'Alice'),
            new JsonKeyValuePair('age', 30),
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
            new JsonKeyValuePair('city', 'Wonderland'),
            new JsonKeyValuePair('population', 1000),
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
            new JsonKeyValuePair('country', 'Narnia'),
            new JsonKeyValuePair('area', 50000),
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
            new JsonKeyValuePair('userId', 1),
            new JsonKeyValuePair('id', 1),
            new JsonKeyValuePair('title', 'delectus aut autem'),
            new JsonKeyValuePair('completed', false),
        ])
    })
})
