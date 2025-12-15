import { describe, expect, test } from 'vitest'
import { JsonArray, jsonStreamStringifyBytes } from '../../src/index.js'

describe('JSON stream end-to-end tests', () => {
    test('should chunk and parse large JSON data correctly', async () => {
        const LARGE_SIZE = 100 * 1000 // 100,000 items

        const veryLargeArray = Array.from({ length: LARGE_SIZE }, (_, i) => ({
            index: i,
            data: `Item ${i} with some additional text to make it larger`,
            values: [i, i * 2, i * 3, i * 4, i * 5],
        }))

        async function* byteStream() {
            yield* jsonStreamStringifyBytes(veryLargeArray, null, 0, {
                stringChunkSize: 1024, // 1 KB chunks
            })
        }

        const reader = new JsonArray(byteStream())
        reader.maxBufferSize = 200
        const items: unknown[] = []

        for await (const item of reader) {
            items.push(await item.readAsync())
        }

        expect(items[0]).toEqual({
            index: 0,
            data: 'Item 0 with some additional text to make it larger',
            values: [0, 0, 0, 0, 0],
        })
        expect(items.length).toBe(LARGE_SIZE)
    })
})
