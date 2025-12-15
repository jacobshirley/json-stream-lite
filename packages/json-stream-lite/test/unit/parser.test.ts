import { describe, it, expect } from 'vitest'
import {
    JsonArray,
    JsonKeyValueParser,
    JsonObject,
    JsonString,
    JsonValue,
} from '../../src/index.js'
import { stringToBytes } from '../../src/utils.js'
import { ByteBuffer } from '../../src/byte-buffer.js'

type KeyValue = { key: string; value: any }

describe('JSON parsing', () => {
    it('should break down a simple JSON object', () => {
        const json = '{"key": "value"}'
        const object = new JsonObject()

        object.maxBufferSize = 2 // Small buffer to force chunked processing
        object.feed(json)

        const pairs: KeyValue[] = []

        for (const { key: keyEntity, value: valueEntity } of object.members()) {
            const key = keyEntity.read()
            const value = valueEntity.readValue()

            pairs.push({ key, value })
        }

        expect(pairs).toEqual([{ key: 'key', value: 'value' }])
    })

    it('should handle various primitive values', () => {
        const json =
            '{"str": "hello", "num": 123, "bool": true, "nullVal": null}'
        const object = new JsonObject()

        object.feed(...stringToBytes(json))
        const keyValuePairs: KeyValue[] = []

        for (const { key: keyEntity, value: valueEntity } of object.members()) {
            const key = keyEntity.read()
            const value = valueEntity.read().read()

            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([
            {
                key: 'str',
                value: 'hello',
            },
            {
                key: 'num',
                value: 123,
            },
            {
                key: 'bool',
                value: true,
            },
            {
                key: 'nullVal',
                value: null,
            },
        ])
    })

    it('should ignore whitespace between keyValuePairs', () => {
        const json = '{   "key1"  :  "value1" ,  "key2" : 42  }'
        const object = new JsonObject()

        object.feed(...stringToBytes(json))
        const keyValuePairs: KeyValue[] = []

        for (const { key: keyEntity, value: valueEntity } of object.members()) {
            const key = keyEntity.read()
            const value = valueEntity.read().read()

            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([
            { key: 'key1', value: 'value1' },
            { key: 'key2', value: 42 },
        ])
    })

    it('should handle empty JSON objects', () => {
        const json = '{}'
        const object = new JsonObject()

        object.feed(...stringToBytes(json))
        const keyValuePairs: KeyValue[] = []

        for (const { key: keyEntity, value: valueEntity } of object.members()) {
            const key = keyEntity.read()
            const value = valueEntity.read().read()

            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([])
    })

    it('should handle arrays', () => {
        const json = '{"arr": [1, "two", false]}'
        const object = new JsonObject()

        object.feed(...stringToBytes(json))
        const keyValuePairs: KeyValue[] = []

        for (const { key: keyEntity, value: valueEntity } of object.members()) {
            const key = keyEntity.read()
            const value = valueEntity.read().read()

            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([
            { key: 'arr', value: [1, 'two', false] },
        ])
    })

    it('should handle streaming arrays', () => {
        const json = '{"numbers": [10, 20, 30, 40, 50]}'
        const bytes = stringToBytes(json)
        const jsonValue = new JsonValue()
        const keyValuePairs: KeyValue[] = []

        for (const byte of bytes) {
            jsonValue.feed(byte)
            jsonValue.tryParse((value) => {
                keyValuePairs.length = 0

                const jsonObject = value.read()

                if (!(jsonObject instanceof JsonObject))
                    throw new Error('Not a JSON object')

                for (const {
                    key: keyEntity,
                    value: valueEntity,
                } of jsonObject.members()) {
                    const key = keyEntity.read()
                    const value = valueEntity.read()

                    if (!(value instanceof JsonArray)) {
                        throw new Error('Expected a JsonArray')
                    }

                    const array: number[] = []

                    for (const itemEntity of value.items()) {
                        const itemValue = itemEntity.read()

                        array.push(itemValue as number)
                    }

                    keyValuePairs.push({ key, value: array })
                }
            })
        }

        expect(keyValuePairs).toEqual([
            { key: 'numbers', value: [10, 20, 30, 40, 50] },
        ])
    })

    it('should handle streaming arrays with types', () => {
        const json = '{"numbers": [10, 20, 30, 40, 50]}'
        const jsonValue = new JsonValue<{
            numbers: number[]
        }>(json)

        const keyValuePairs: KeyValue[] = []
        const jsonObject = jsonValue.read()

        for (const {
            key: keyEntity,
            value: valueEntity,
        } of jsonObject.members()) {
            const key = keyEntity.read()
            const value = valueEntity.read()
            const array: number[] = []

            for (const itemEntity of value.items()) {
                const itemValue = itemEntity.read()

                array.push(itemValue)
            }

            keyValuePairs.push({ key, value: array })
        }

        expect(keyValuePairs).toEqual([
            { key: 'numbers', value: [10, 20, 30, 40, 50] },
        ])
    })

    it('should handle sub objects (only top-level key-value pairs are returned)', () => {
        const json =
            '{"outerKey": {"innerKey": "innerValue"}, "anotherKey": 99}'
        const object = new JsonObject<{
            outerKey: {
                innerKey: 'test'
                subObjecT: {
                    subKey: string
                }
            }
            innerKey: string
            anotherKey: number
        }>()
        object.feed(...stringToBytes(json))
        const keyValuePairs: KeyValue[] = []

        for (const { key, value } of object) {
            const keyString = key.read()
            const valueObj = value.read()

            if (valueObj instanceof JsonObject) {
                for (const { key, value } of valueObj) {
                    const read = key.read()
                    const readValue = value.readValue()

                    read === 'innerKey'
                    readValue === 'test'
                    //@ts-expect-error Confirm that the type narrowing works correctly
                    read === 'something-else'
                    //@ts-expect-error Confirm that the type narrowing works correctly
                    readValue === 'something-else'

                    keyValuePairs.push({
                        key: read,
                        value: readValue,
                    })
                }
            }

            keyValuePairs.push({
                key: keyString,
                value: valueObj.consumed ? {} : valueObj.read(),
            })
        }

        expect(keyValuePairs).toEqual([
            {
                key: 'innerKey',
                value: 'innerValue',
            },
            {
                key: 'outerKey',
                value: {},
            },
            {
                key: 'anotherKey',
                value: 99,
            },
        ])
    })

    it('should handle arrays', () => {
        const json = '{"arrayKey": [1, 2, 3], "simpleKey": "simpleValue"}'
        const object = new JsonObject()

        object.feed(...stringToBytes(json))
        const output = object.read()

        expect(output).toEqual(JSON.parse(json))
    })

    it('should handle top-level arrays', () => {
        const json = '[{"key1": "value1"}, {"key2": "value2"}]'
        const object = new JsonArray()

        object.feed(...stringToBytes(json))
        const output = object.read()

        expect(output).toEqual(JSON.parse(json))
    })

    it('should handle nested arrays and objects', async () => {
        const json =
            '{"obj": {"arr": [true, false, null, [null], {"key": "value"}]}, "num": 42, "nullable": null}'

        const object = new JsonObject(
            (async function* () {
                for (const byte of stringToBytes(json)) {
                    yield byte
                }
            })(),
        )

        object.maxBufferSize = 2 // Small buffer to force chunked processing

        let output: any
        for await (const { key, value } of object) {
            const keyv = await key.readAsync()
            const valuev = await value.readValueAsync()

            output = output || {}
            output[keyv] = valuev
        }

        expect(output).toEqual(JSON.parse(json))
        expect(object.bufferLength).toBeLessThanOrEqual(2)
    })

    it('should process JSON objects in parts', () => {
        const jsonParts = [
            '{"part1": "value1", ',
            '"part2": 2, ',
            '"part3": [1, 2, 3]}',
        ]
        const object = new JsonObject()

        let output: any
        for (const part of jsonParts) {
            for (const byte of stringToBytes(part)) {
                object.feed(byte)
                object.tryParse(() => {
                    output = object.read()
                })
            }
        }

        expect(output).toEqual({
            part1: 'value1',
            part2: 2,
            part3: [1, 2, 3],
        })
    })

    it('should process JSON objects in async mode', async () => {
        const jsonParts = ['{"country": "Narnia", ', '"area": 50000}']

        const stream = (async function* () {
            for (const part of jsonParts) {
                for (const byte of stringToBytes(part)) {
                    yield byte
                }
                // Simulate async delay
                await new Promise((resolve) => setTimeout(resolve, 10))
            }
        })()

        const object = new JsonObject(stream)
        object.maxBufferSize = 2 // Small buffer to force chunked processing
        let output: any

        for await (const { key, value } of object) {
            const keyv = await key.readAsync()
            const valuev = await (await value.readAsync()).readAsync()

            output = output || {}
            output[keyv] = valuev
        }

        expect(output).toEqual({
            country: 'Narnia',
            area: 50000,
        })
    })

    it('should process JSON arrays in async mode', async () => {
        const jsonParts = [
            '{"country": "Narnia", ',
            '"arr": [{"key": "value"}, 2]}',
        ]

        const stream = (async function* () {
            for (const part of jsonParts) {
                for (const byte of stringToBytes(part)) {
                    yield byte
                }
                // Simulate async delay
                await new Promise((resolve) => setTimeout(resolve, 10))
            }
        })()

        const object = new JsonObject<{
            country: string
            arr: { key: string } | number
        }>(stream)
        object.maxBufferSize = 2 // Small buffer to force chunked processing
        let output: any = []

        for await (const { key, value } of object) {
            const keyv = await key.readAsync()

            //@ts-expect-error Confirm that the type narrowing works correctly
            keyv === 'something_else'

            if (keyv === 'arr') {
                const valuev = await value.readAsync()
                if (valuev instanceof JsonArray) {
                    for await (const item of valuev) {
                        output.push(await item.readAsync())
                    }
                }
            }
        }

        expect(output).toEqual([
            {
                key: 'value',
            },
            2,
        ])
    })

    it('should allow efficient memory usage for large JSON objects', () => {
        const json = JSON.stringify({
            a: 1,
            b: {
                nested: { c: [1, 2, 3, 4, 5] },
            },
            c: 3,
        })

        const buffer = new ByteBuffer()
        buffer.maxBufferSize = 10 // Small buffer to force chunked processing
        let object = new JsonObject(buffer)
        let output: any

        for (const byte of stringToBytes(json)) {
            if (output) {
                break
            }

            object.feed(byte)
            object.tryParse(() => {
                for (const { key: keyEntity, value: valueEntity } of object) {
                    const key = keyEntity.read()
                    const value = valueEntity.read()

                    if (key === 'b' && value instanceof JsonObject) {
                        output = value.read()
                        break
                    }
                }
            })
        }

        // expect(buffer.length).toBeLessThan(10) // Ensure buffer size is controlled
        expect(output).toEqual({ nested: { c: [1, 2, 3, 4, 5] } })
    })

    it('should be able to feed in strings', () => {
        const json = '"Hello, World!"'
        const jsonValue = new JsonValue()
        jsonValue.feed(json)
        const value = jsonValue.read().read()

        expect(value).toBe('Hello, World!')
    })

    it('should be able to feed in strings in async mode', async () => {
        const json = (async function* () {
            yield '"Hello, World!"'
        })()

        const jsonValue = new JsonValue(json)
        const value = await jsonValue.readValueAsync()

        expect(value).toBe('Hello, World!')
    })

    it('should support a standard Iterable as a byte stream', () => {
        function* byteStream() {
            const json = '{"key": "value"}'
            for (const byte of stringToBytes(json)) {
                yield byte
            }
        }

        const object = new JsonObject(byteStream())
        object.maxBufferSize = 2 // Small buffer to force chunked processing
        const keyValuePairs: KeyValue[] = []

        for (const { key: keyEntity, value: valueEntity } of object) {
            const key = keyEntity.read()
            const value = valueEntity.read().read()

            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([{ key: 'key', value: 'value' }])
    })

    it('should support ReadableStream as a byte stream', async () => {
        const json = '{"key": "value"}'
        const byteStream = new ReadableStream({
            start(controller) {
                for (const byte of stringToBytes(json)) {
                    controller.enqueue(new Uint8Array([byte]))
                }
                controller.close()
            },
        })

        const object = new JsonObject(byteStream)
        object.maxBufferSize = 2 // Small buffer to force chunked processing
        const keyValuePairs: KeyValue[] = []

        for await (const { key: keyEntity, value: valueEntity } of object) {
            const key = await keyEntity.readAsync()
            const value = await (await valueEntity.readAsync()).readAsync()

            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([{ key: 'key', value: 'value' }])
    })

    it('should not be allowed to exceed buffer size when configured', () => {
        const json = '{"key": "value"}'
        const object = new JsonObject()
        object.maxBufferSize = 5 // Small buffer to force buffer size exceeded
        object.allowBufferToBeExceeded = false // Disable exceeding buffer

        expect(() => {
            object.feed(...stringToBytes(json))
        }).toThrow('Buffer size exceeded maximum limit')
    })

    it('should handle whitespace in strings', async () => {
        const json =
            '{" key with spaces ": "   value with spaces   ", "array": [ " spaced item ", "another spaced item" ]}'
        const object = new JsonObject(
            (async function* () {
                for (const byte of stringToBytes(json)) {
                    yield byte
                }
            })(),
        )
        object.maxBufferSize = 2
        const keyValuePairs: KeyValue[] = []

        for await (const { key: keyEntity, value: valueEntity } of object) {
            const key = await keyEntity.readAsync()
            const value = await valueEntity.readValueAsync()
            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([
            { key: ' key with spaces ', value: '   value with spaces   ' },
            { key: 'array', value: [' spaced item ', 'another spaced item'] },
        ])
    })

    it('should be able to parse escaped characters in strings', () => {
        const json = '"\\"Line1\\nLine2\\tTabbed\\\\\\"\\b"'
        const jsonValue = new JsonValue<string>()
        jsonValue.feed(...stringToBytes(json))
        const value = jsonValue.readValue()

        expect(value).toBe('"Line1\nLine2\tTabbed\\"\b')
    })

    it('should be able to stream strings', () => {
        const jsonValue = new JsonString('"Streaming String Example"')
        const parts: string[] = []

        for (const chunk of jsonValue.stream(1)) {
            parts.push(chunk)
        }

        expect(parts.join('')).toBe('Streaming String Example')
    })

    it('should be able to stream strings in async mode', async () => {
        const jsonValue = new JsonString(
            (async function* () {
                const str = '"Async Streaming String Example"'
                for (const char of str) {
                    yield char
                }
            })(),
        )
        jsonValue.maxBufferSize = 2
        const parts: string[] = []

        for await (const chunk of jsonValue.streamAsync(2)) {
            parts.push(chunk)
        }

        expect(parts.join('')).toBe('Async Streaming String Example')
        expect(parts).toEqual([
            'As',
            'yn',
            'c ',
            'St',
            're',
            'am',
            'in',
            'g ',
            'St',
            'ri',
            'ng',
            ' E',
            'xa',
            'mp',
            'le',
        ])
    })
})

describe('JSON key value parser', () => {
    it('should parse key value pairs from a JsonObject', () => {
        const json = '{"name": "Alice", "age": 30, "isMember": true}'
        const parser = new JsonKeyValueParser()
        parser.feed(...stringToBytes(json))
        const keyValuePairs: KeyValue[] = []

        for (const [key, value] of parser) {
            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([
            { key: 'name', value: 'Alice' },
            { key: 'age', value: 30 },
            { key: 'isMember', value: true },
        ])
    })

    it('should parse key value pairs from a JsonObject', async () => {
        const json = '{"name": "Alice", "age": 30, "isMember": true}'
        async function* byteStream() {
            for (const byte of stringToBytes(json)) {
                yield byte
            }
            await new Promise((resolve) => setTimeout(resolve, 10))
        }

        const parser = new JsonKeyValueParser(byteStream())
        parser.maxBufferSize = 2 // Small buffer to force chunked processing
        const keyValuePairs: KeyValue[] = []

        for await (const [key, value] of parser) {
            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([
            { key: 'name', value: 'Alice' },
            { key: 'age', value: 30 },
            { key: 'isMember', value: true },
        ])

        expect(parser.bufferLength).toBeLessThanOrEqual(2)
    })

    it('should parse key value pairs from a nested JsonObject', () => {
        const json =
            '{"user": {"id": 1, "details": {"name": "Bob", "email": "test@test.com"}}}'
        const parser = new JsonKeyValueParser()
        parser.feed(...stringToBytes(json))
        const keyValuePairs: KeyValue[] = []

        for (const [key, value] of parser) {
            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([
            { key: 'user.id', value: 1 },
            { key: 'user.details.name', value: 'Bob' },
            { key: 'user.details.email', value: 'test@test.com' },
        ])
    })

    it('should parse key value pairs from a JsonArray', () => {
        const json = '[{"item": "A"}, {"item": "B"}, {"item": "C"}]'
        const parser = new JsonKeyValueParser()
        parser.feed(...stringToBytes(json))

        const keyValuePairs: KeyValue[] = []

        for (const [key, value] of parser) {
            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([
            { key: '[0].item', value: 'A' },
            { key: '[1].item', value: 'B' },
            { key: '[2].item', value: 'C' },
        ])
    })

    it('should parse key value pairs from a nested JsonArray', () => {
        const json = '[{"data": [1, 2]}, {"data": [3, 4]}]'
        const parser = new JsonKeyValueParser()
        parser.feed(...stringToBytes(json))
        const keyValuePairs: KeyValue[] = []

        for (const [key, value] of parser) {
            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([
            { key: '[0].data[0]', value: 1 },
            { key: '[0].data[1]', value: 2 },
            { key: '[1].data[0]', value: 3 },
            { key: '[1].data[1]', value: 4 },
        ])
    })

    it('should handle empty JsonObject', () => {
        const json = '{}'
        const parser = new JsonKeyValueParser()
        parser.feed(...stringToBytes(json))

        const keyValuePairs: KeyValue[] = []

        for (const [key, value] of parser) {
            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([])
    })

    it('should handle empty JsonArray', () => {
        const json = '[]'
        const parser = new JsonKeyValueParser()
        parser.feed(...stringToBytes(json))

        const keyValuePairs: KeyValue[] = []

        for (const [key, value] of parser) {
            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([])
    })

    it('should handle mixed nested structures', () => {
        const json =
            '{"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}], "count": 2}'

        const parser = new JsonKeyValueParser()
        parser.feed(...stringToBytes(json))
        const keyValuePairs: KeyValue[] = []

        for (const [key, value] of parser) {
            keyValuePairs.push({ key, value })
        }

        expect(keyValuePairs).toEqual([
            { key: 'users[0].id', value: 1 },
            { key: 'users[0].name', value: 'Alice' },
            { key: 'users[1].id', value: 2 },
            { key: 'users[1].name', value: 'Bob' },
            { key: 'count', value: 2 },
        ])
    })

    it('should error if JsonValue does not contain composite type', () => {
        const json = '"Just a string"'
        const parser = new JsonKeyValueParser()
        parser.feed(...stringToBytes(json))
        const keyValuePairs: KeyValue[] = []

        expect(() => {
            for (const [key, value] of parser) {
                keyValuePairs.push({ key, value })
            }
        }).toThrow(
            'JsonValue does not contain a composite type. JsonString found.',
        )
    })
})
