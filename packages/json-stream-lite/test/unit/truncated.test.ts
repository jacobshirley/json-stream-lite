import { describe, it, expect } from 'vitest'
import { JsonString, JsonValue } from '../../src/index.js'

const chunked = (input: string, size: number) =>
    (async function* () {
        for (let i = 0; i < input.length; i += size)
            yield input.slice(i, i + size)
    })()

describe('truncated input', () => {
    const truncated = [
        '"abc',
        '{"a":"b',
        '{"a":"b"',
        '{"a":1',
        '{"a":1,',
        '{',
        '[1,2',
        '["a',
        'tru',
        '{"a":"x\\',
        '"\\u00',
    ]

    for (const input of truncated) {
        it(`rejects ${input}`, async () => {
            expect(() => new JsonValue(input).readValue()).toThrow(Error)
            expect(() => new JsonValue(input).readValue()).not.toThrow(
                RangeError,
            )
            await expect(
                new JsonValue(chunked(input, 2)).readValueAsync(),
            ).rejects.toThrow(Error)
        })
    }

    it('names the unterminated construct', () => {
        expect(() => new JsonValue('"abc').readValue()).toThrow(
            /Unterminated string/,
        )
        expect(() => new JsonValue('{"a":1').readValue()).toThrow(
            /Unterminated object/,
        )
    })

    it('streams a string whose closing quote starts a new chunk', async () => {
        for (const size of [1, 2, 3, 4, 5]) {
            for (const chunkSize of [1, 2, 3, 4]) {
                const string = new JsonString(chunked('"abcdef"', size))
                let out = ''
                for await (const chunk of string.streamAsync(chunkSize)) {
                    out += chunk
                }
                expect(out).toBe('abcdef')
            }
        }
    })
})
