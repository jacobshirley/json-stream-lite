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

    it('writes one line per value, even for non-JSON values', () => {
        const out = [...jsonLinesStringify([1, undefined, () => 1, 'a\nb'])]
        expect(out.join('')).toBe('1\nnull\nnull\n"a\\nb"\n')
    })

    it('rejects malformed lines', async () => {
        expect(() => new JsonLines('{"a":1}\nxyz\n').read()).toThrow()
        expect(() => new JsonLines('{"a":1}\n{"a":').read()).toThrow()
        async function* chunks() {
            yield '{"a":1}\n{"a"'
            yield ':'
        }
        await expect(new JsonLines(chunks()).readAsync()).rejects.toThrow()
    })

    it('strict mode enforces the JSON Lines format', async () => {
        const strict = (input: string) => {
            const lines = new JsonLines(input)
            lines.strict = true
            return lines.read()
        }
        expect(strict('1\n{"a":2}\n')).toEqual([1, { a: 2 }])
        expect(strict('1\r\n {"a":2} ')).toEqual([1, { a: 2 }])
        expect(strict('')).toEqual([])
        expect(strict(text)).toEqual(expected)
        expect(() => strict('1\n\n2\n')).toThrow(/Blank line/)
        expect(() => strict('\n1\n')).toThrow(/Blank line/)
        expect(() => strict('1\n\n')).toThrow(/Blank line/)
        expect(() => strict('1\n \n2')).toThrow(/Blank line/)
        expect(() => strict('{"a":1}{"a":2}')).toThrow(/Multiple values/)
        expect(() => strict('1 2')).toThrow(/Multiple values/)

        const stream = (input: string) => {
            async function* chunks() {
                yield* input
            }
            const lines = new JsonLines(chunks())
            lines.strict = true
            return lines.readAsync()
        }
        expect(await stream(text)).toEqual(expected)
        await expect(stream('1\n\n2\n')).rejects.toThrow(/Blank line/)
        await expect(stream('[1] [2]')).rejects.toThrow(/Multiple values/)
    })

    it('never writes JSONC, so each line stays valid JSON', () => {
        const out = [...jsonLinesStringify([{ a: [1] }], null, { jsonc: true })]
        expect(out.join('')).toBe('{"a":[1]}\n')
    })

    it('round-trips', () => {
        expect(new JsonLines(text).read()).toEqual(expected)
    })
})
