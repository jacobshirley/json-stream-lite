import { describe, it, expect } from 'vitest'
import {
    JsonLines,
    jsonLinesStringify,
    jsonLinesStringifyAsync,
    jsonLinesStringifyBytes,
} from '../../src/index.js'

const doc = '{"a":1}\n[1,2]\n"hi"\n\n42\ntrue\nnull\n'
const expected = [{ a: 1 }, [1, 2], 'hi', 42, true, null]
const text = [...jsonLinesStringify(expected)].join('')

describe('JsonLines', () => {
    it('reads all lines', () => {
        expect(new JsonLines(doc).read()).toEqual(expected)
    })

    it('iterates lazily without trailing newline and with CRLF', () => {
        const out: unknown[] = []
        for (const v of new JsonLines('{"a":1}\r\n{"a":2}'))
            out.push(v.readValue())
        expect(out).toEqual([{ a: 1 }, { a: 2 }])
    })

    it('handles empty input', () => {
        expect(new JsonLines('').read()).toEqual([])
        expect(new JsonLines('\n\n').read()).toEqual([])
    })

    it('streams async across arbitrary chunk boundaries', async () => {
        for (const size of [1, 2, 3, 5, 100]) {
            async function* chunks() {
                for (let i = 0; i < doc.length; i += size)
                    yield doc.slice(i, i + size)
            }
            const out: unknown[] = []
            for await (const v of new JsonLines(chunks())) {
                out.push(await v.readValueAsync())
            }
            expect(out).toEqual(expected)
        }
    })

    it('stringifies to JSONL', async () => {
        expect(text).toBe('{"a":1}\n[1,2]\n"hi"\n42\ntrue\nnull\n')
        let s = ''
        for await (const c of jsonLinesStringifyAsync(expected)) s += c
        expect(s).toBe(text)
        expect([...jsonLinesStringifyBytes([1])][0]).toBeInstanceOf(Uint8Array)
    })

    it('round-trips', () => {
        expect(new JsonLines(text).read()).toEqual(expected)
    })
})
