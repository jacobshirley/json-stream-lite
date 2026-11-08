import { describe, expect, test } from 'vitest'
import {
    YamlDocument,
    YamlStream,
    yamlStreamStringify,
} from '../../src/index.js'

function stringify(
    value: unknown,
    options?: Parameters<typeof yamlStreamStringify>[1],
): string {
    return [...yamlStreamStringify(value, options)].join('')
}

function parse(yaml: string): unknown {
    const doc = new YamlDocument()
    doc.feed(yaml)
    doc.eof = true
    return doc.read()
}

const cases: [string, unknown][] = [
    ['null', null],
    ['true', true],
    ['false', false],
    ['integer', 42],
    ['negative float', -3.5],
    ['zero', 0],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['plain string', 'hello world'],
    ['empty string', ''],
    ['numeric string', '123'],
    ['float-like string', '1.5e3'],
    ['boolean-like string', 'true'],
    ['null-like string', 'null'],
    ['tilde string', '~'],
    ['string with colon-space', 'a: b'],
    ['string with trailing colon', 'key:'],
    ['string with hash', 'a #comment'],
    ['leading dash', '- item'],
    ['leading space', '  padded'],
    ['trailing space', 'padded  '],
    ['single quote', "it's"],
    ['double quote', 'say "hi"'],
    ['backslash', 'C:\\path\\to'],
    ['tab', 'a\tb'],
    ['control char', 'a\u0001b'],
    ['unicode', 'héllo 🌍'],
    ['multi-line', 'line1\nline2'],
    ['multi-line trailing newline', 'line1\nline2\n'],
    ['flow indicators', '[a, b] {c: d}'],
    ['empty array', []],
    ['empty object', {}],
    ['flat array', [1, 'two', true, null]],
    ['flat object', { a: 1, b: 'two', c: false, d: null }],
    ['nested object', { a: { b: { c: 1 } } }],
    ['array of objects', [{ a: 1, b: 2 }, { c: 3 }]],
    [
        'array of arrays',
        [
            [1, 2],
            [3, [4, 5]],
        ],
    ],
    ['object of arrays', { xs: [1, 2], ys: [] }],
    ['array of empty collections', [[], {}]],
    ['object in object in array', [{ a: { b: [1, { c: 'd' }] } }]],
    ['quoted keys', { 'a: b': 1, '': 2, '123': 3, true: 4, '- x': 5 }],
    ['multi-line in nested object', { a: { text: 'one\ntwo\n' } }],
    ['multi-line in array', ['one\ntwo', 'three']],
    ['multi-line in array of objects', [{ text: 'one\ntwo' }]],
    ['multi-line leading space', '  indented\nnext'],
    ['multi-line leading newline', '\nafter'],
    ['multi-line extra trailing newlines', 'a\n\n'],
    ['multi-line trailing spaces', 'a \nb'],
    ['multi-line blank middle line', 'a\n\nb'],
    ['multi-line carriage return', 'a\r\nb'],
    ['multi-line in flow', { a: ['x\ny'] }],
    ['multi-line key', { 'a\nb': 1 }],
    ['seq of seq of seq', [[[1, 2], []], [[3]]]],
    [
        'seq item mapping with nested values',
        [{ a: [1, 2], b: { c: 'd\ne' }, f: 1 }],
    ],
    [
        'realistic config',
        {
            name: 'app',
            version: '1.0.0',
            servers: [
                { host: 'a.example.com', port: 8080, tags: ['web', 'prod'] },
                { host: 'b.example.com', port: 8081, tags: [] },
            ],
            env: { DEBUG: 'false', RETRIES: '3' },
        },
    ],
]

describe('stringify → parse round-trip', () => {
    for (const [name, value] of cases) {
        test(name, () => {
            expect(parse(stringify(value))).toEqual(value)
        })
    }

    for (const indent of [2, 4]) {
        test(`indent ${indent}`, () => {
            const value = {
                a: [{ b: 1, c: [2, 3], d: { e: 'f' } }, [4, 5]],
                g: { h: [{ i: 'j' }] },
            }
            expect(parse(stringify(value, { indent }))).toEqual(value)
        })
    }

    test('skips undefined and function values like JSON.stringify', () => {
        expect(
            parse(
                stringify({ a: 1, b: undefined, c: () => 1, d: [undefined] }),
            ),
        ).toEqual({ a: 1, d: [null] })
    })

    test('uses toJSON', () => {
        const date = new Date('2026-01-02T03:04:05.000Z')
        expect(parse(stringify({ date, list: [date] }))).toEqual({
            date: date.toJSON(),
            list: [date.toJSON()],
        })
    })

    test('flow indicators in flow keys and values', () => {
        const value = { 'a,b': ['c]d', '{e}'] }
        expect(parse(stringify(value, { flowLevel: 0 }))).toEqual(value)
    })

    test('flowLevel', () => {
        const value = { a: { b: [1, 2], c: { d: 'e, f' } }, g: [{ h: 1 }] }
        expect(parse(stringify(value, { flowLevel: 1 }))).toEqual(value)
        expect(parse(stringify(value, { flowLevel: 0 }))).toEqual(value)
    })

    test('double-quoted default style', () => {
        const value = { a: 'x: y', b: "it's" }
        expect(
            parse(stringify(value, { defaultScalarStyle: 'double-quoted' })),
        ).toEqual(value)
    })

    test('output ends with a newline', () => {
        for (const [, value] of cases) {
            expect(stringify(value).endsWith('\n')).toBe(true)
        }
    })

    test('no trailing whitespace on any line', () => {
        for (const [name, value] of cases) {
            for (const line of stringify(value).split('\n')) {
                expect(line, name).toBe(line.trimEnd())
            }
        }
    })

    test('multi-document', async () => {
        const { yamlStreamStringifyAsync } = await import('../../src/index.js')
        const docs = [{ a: 1 }, [1, 2], 'text', null]
        let yaml = ''
        for await (const chunk of yamlStreamStringifyAsync(docs)) {
            yaml += chunk
        }
        const stream = new YamlStream()
        stream.feed(yaml)
        stream.eof = true
        expect(stream.read()).toEqual(docs)
    })
})

describe('stringify layout', () => {
    test('block literal is indented one level under its key', () => {
        expect(stringify({ a: { bio: 'one\ntwo\n' } })).toBe(
            'a:\n  bio: |\n    one\n    two\n',
        )
        expect(stringify(['one\ntwo'])).toBe('- |-\n  one\n  two\n')
        expect(stringify('one\ntwo')).toBe('|-\n  one\n  two\n')
    })

    test('flow and empty collections stay on the key line', () => {
        expect(
            stringify({ a: [], b: {}, c: { d: [1] } }, { flowLevel: 1 }),
        ).toBe('a: []\nb: {}\nc: {d: [1]}\n')
    })

    test('nested sequences', () => {
        expect(stringify([[1, 2], [3]])).toBe('-\n  - 1\n  - 2\n-\n  - 3\n')
    })
})
