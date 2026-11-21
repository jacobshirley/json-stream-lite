import { describe, it, expect } from 'vitest'
import { JsonArray, JsonObject, JsonValue } from '../../src/index.js'

const BOM = [0xef, 0xbb, 0xbf]
const encoder = new TextEncoder()

const chunked = (bytes: number[], size: number) =>
    (async function* () {
        for (let i = 0; i < bytes.length; i += size)
            yield new Uint8Array(bytes.slice(i, i + size))
    })()

describe('byte order mark', () => {
    it('ignores a leading byte order mark', () => {
        expect(new JsonObject('﻿{"a":1}').read()).toEqual({ a: 1 })
        expect(new JsonValue('﻿[1,2]').readValue()).toEqual([1, 2])

        const fed = new JsonArray()
        fed.feed(new Uint8Array([...BOM, ...encoder.encode('[1]')]))
        fed.eof = true
        expect(fed.read()).toEqual([1])
    })

    it('ignores one split across chunks', async () => {
        const bytes = [...BOM, ...encoder.encode('{"a":"é"}')]
        for (const size of [1, 2, 3, 4, 100]) {
            const object = new JsonObject(chunked(bytes, size))
            expect(await object.readAsync()).toEqual({ a: 'é' })
        }
    })

    it('leaves input without one untouched', async () => {
        expect(new JsonValue('1').readValue()).toBe(1)
        expect(new JsonValue('""').readValue()).toBe('')
        expect(new JsonValue('"é"').readValue()).toBe('é')
        const bytes = [...encoder.encode('"é"')]
        expect(await new JsonValue(chunked(bytes, 1)).readValueAsync()).toBe(
            'é',
        )
    })

    it('only ignores it at the very start', () => {
        expect(() => new JsonValue('[1,﻿2]').readValue()).toThrow()
        expect(new JsonValue('"﻿"').readValue()).toBe('﻿')
    })
})
