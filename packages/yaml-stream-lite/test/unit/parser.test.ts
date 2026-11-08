import { describe, it, expect } from 'vitest'
import {
    YamlScalar,
    YamlMapping,
    YamlSequence,
    YamlValue,
    YamlDocument,
    YamlStream,
    YamlKeyValueParser,
} from '../../src/index.js'

describe('YamlScalar', () => {
    it('parses plain string', () => {
        const s = new YamlScalar()
        s.feed('hello')
        s.eof = true
        expect(s.read()).toBe('hello')
    })

    it('parses plain integer', () => {
        const s = new YamlScalar()
        s.feed('42')
        s.eof = true
        expect(s.read()).toBe(42)
    })

    it('parses plain negative integer', () => {
        const s = new YamlScalar()
        s.feed('-7')
        s.eof = true
        expect(s.read()).toBe(-7)
    })

    it('parses plain float', () => {
        const s = new YamlScalar()
        s.feed('3.14')
        s.eof = true
        expect(s.read()).toBe(3.14)
    })

    it('parses plain boolean true', () => {
        const s = new YamlScalar()
        s.feed('true')
        s.eof = true
        expect(s.read()).toBe(true)
    })

    it('parses plain boolean false', () => {
        const s = new YamlScalar()
        s.feed('false')
        s.eof = true
        expect(s.read()).toBe(false)
    })

    it('parses null', () => {
        const s = new YamlScalar()
        s.feed('null')
        s.eof = true
        expect(s.read()).toBe(null)
    })

    it('parses tilde as null', () => {
        const s = new YamlScalar()
        s.feed('~')
        s.eof = true
        expect(s.read()).toBe(null)
    })

    it('parses .inf', () => {
        const s = new YamlScalar()
        s.feed('.inf')
        s.eof = true
        expect(s.read()).toBe(Infinity)
    })

    it('parses -.inf', () => {
        const s = new YamlScalar()
        s.feed('-.inf')
        s.eof = true
        expect(s.read()).toBe(-Infinity)
    })

    it('parses .nan', () => {
        const s = new YamlScalar()
        s.feed('.nan')
        s.eof = true
        expect(s.read()).toBeNaN()
    })

    it('parses hex integer', () => {
        const s = new YamlScalar()
        s.feed('0xFF')
        s.eof = true
        expect(s.read()).toBe(255)
    })

    it('parses octal integer', () => {
        const s = new YamlScalar()
        s.feed('0o77')
        s.eof = true
        expect(s.read()).toBe(63)
    })

    it('parses double-quoted string', () => {
        const s = new YamlScalar()
        s.feed('"hello world"')
        s.eof = true
        expect(s.read()).toBe('hello world')
    })

    it('parses double-quoted string with escapes', () => {
        const s = new YamlScalar()
        s.feed('"line1\\nline2\\ttab"')
        s.eof = true
        expect(s.read()).toBe('line1\nline2\ttab')
    })

    it('parses double-quoted string with unicode escape', () => {
        const s = new YamlScalar()
        s.feed('"\\u0041"')
        s.eof = true
        expect(s.read()).toBe('A')
    })

    it('parses single-quoted string', () => {
        const s = new YamlScalar()
        s.feed("'hello world'")
        s.eof = true
        expect(s.read()).toBe('hello world')
    })

    it('parses single-quoted string with escaped quote', () => {
        const s = new YamlScalar()
        s.feed("'it''s a test'")
        s.eof = true
        expect(s.read()).toBe("it's a test")
    })
})

describe('YamlMapping', () => {
    it('parses simple block mapping', () => {
        const m = new YamlMapping()
        m.feed('name: John\nage: 30\n')
        m.eof = true
        expect(m.read()).toEqual({ name: 'John', age: 30 })
    })

    it('parses nested block mapping', () => {
        const m = new YamlMapping()
        m.feed('user:\n  name: Alice\n  age: 25\n')
        m.eof = true
        expect(m.read()).toEqual({ user: { name: 'Alice', age: 25 } })
    })

    it('parses flow mapping', () => {
        const m = new YamlMapping(undefined, -1, 'flow')
        m.feed('{name: John, age: 30}')
        m.eof = true
        expect(m.read()).toEqual({ name: 'John', age: 30 })
    })

    it('parses empty flow mapping', () => {
        const m = new YamlMapping(undefined, -1, 'flow')
        m.feed('{}')
        m.eof = true
        expect(m.read()).toEqual({})
    })

    it('parses mapping with quoted keys', () => {
        const m = new YamlMapping()
        m.feed('"key with spaces": value\n')
        m.eof = true
        expect(m.read()).toEqual({ 'key with spaces': 'value' })
    })

    it('parses mapping with boolean and null values', () => {
        const m = new YamlMapping()
        m.feed('active: true\ndeleted: false\ndata: null\n')
        m.eof = true
        expect(m.read()).toEqual({ active: true, deleted: false, data: null })
    })

    it('parses mapping with block value on next line', () => {
        const m = new YamlMapping()
        m.feed('items:\n  - one\n  - two\n')
        m.eof = true
        expect(m.read()).toEqual({ items: ['one', 'two'] })
    })

    it('iterates members lazily', () => {
        const m = new YamlMapping()
        m.feed('a: 1\nb: 2\nc: 3\n')
        m.eof = true

        const keys: string[] = []
        const values: unknown[] = []
        for (const { key, value } of m) {
            keys.push(String(key.read()))
            values.push(value.readValue())
        }
        expect(keys).toEqual(['a', 'b', 'c'])
        expect(values).toEqual([1, 2, 3])
    })
})

describe('YamlSequence', () => {
    it('parses simple block sequence', () => {
        const s = new YamlSequence()
        s.feed('- one\n- two\n- three\n')
        s.eof = true
        expect(s.read()).toEqual(['one', 'two', 'three'])
    })

    it('parses block sequence with numbers', () => {
        const s = new YamlSequence()
        s.feed('- 1\n- 2\n- 3\n')
        s.eof = true
        expect(s.read()).toEqual([1, 2, 3])
    })

    it('parses flow sequence', () => {
        const s = new YamlSequence(undefined, -1, 'flow')
        s.feed('[1, 2, 3]')
        s.eof = true
        expect(s.read()).toEqual([1, 2, 3])
    })

    it('parses empty flow sequence', () => {
        const s = new YamlSequence(undefined, -1, 'flow')
        s.feed('[]')
        s.eof = true
        expect(s.read()).toEqual([])
    })

    it('parses nested block sequence', () => {
        const s = new YamlSequence()
        s.feed('- - a\n  - b\n- - c\n  - d\n')
        s.eof = true
        expect(s.read()).toEqual([
            ['a', 'b'],
            ['c', 'd'],
        ])
    })

    it('parses sequence of mappings', () => {
        const s = new YamlSequence()
        s.feed('- name: Alice\n  age: 25\n- name: Bob\n  age: 30\n')
        s.eof = true
        expect(s.read()).toEqual([
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 30 },
        ])
    })

    it('iterates items lazily', () => {
        const s = new YamlSequence()
        s.feed('- a\n- b\n- c\n')
        s.eof = true

        const values: unknown[] = []
        for (const item of s) {
            values.push(item.readValue())
        }
        expect(values).toEqual(['a', 'b', 'c'])
    })
})

describe('YamlValue', () => {
    it('auto-detects flow mapping', () => {
        const v = new YamlValue()
        v.feed('{a: 1}')
        v.eof = true
        expect(v.readValue()).toEqual({ a: 1 })
    })

    it('auto-detects flow sequence', () => {
        const v = new YamlValue()
        v.feed('[1, 2, 3]')
        v.eof = true
        expect(v.readValue()).toEqual([1, 2, 3])
    })

    it('auto-detects block mapping', () => {
        const v = new YamlValue()
        v.feed('name: John\nage: 30\n')
        v.eof = true
        expect(v.readValue()).toEqual({ name: 'John', age: 30 })
    })

    it('auto-detects block sequence', () => {
        const v = new YamlValue()
        v.feed('- one\n- two\n')
        v.eof = true
        expect(v.readValue()).toEqual(['one', 'two'])
    })

    it('auto-detects plain scalar', () => {
        const v = new YamlValue()
        v.feed('hello')
        v.eof = true
        expect(v.readValue()).toBe('hello')
    })

    it('auto-detects quoted scalar', () => {
        const v = new YamlValue()
        v.feed('"hello"')
        v.eof = true
        expect(v.readValue()).toBe('hello')
    })
})

describe('YamlDocument', () => {
    it('parses document without markers', () => {
        const d = new YamlDocument()
        d.feed('name: John\nage: 30\n')
        d.eof = true
        expect(d.read()).toEqual({ name: 'John', age: 30 })
    })

    it('parses document with --- marker', () => {
        const d = new YamlDocument()
        d.feed('---\nname: John\n')
        d.eof = true
        expect(d.read()).toEqual({ name: 'John' })
    })

    it('parses document with ... marker', () => {
        const d = new YamlDocument()
        d.feed('name: John\n...\n')
        d.eof = true
        expect(d.read()).toEqual({ name: 'John' })
    })
})

describe('YamlStream', () => {
    it('parses multiple documents', () => {
        const s = new YamlStream()
        s.feed('---\nname: Alice\n---\nname: Bob\n')
        s.eof = true
        expect(s.read()).toEqual([{ name: 'Alice' }, { name: 'Bob' }])
    })

    it('parses multiple documents with ... separator', () => {
        const s = new YamlStream()
        s.feed('name: Alice\n...\n---\nname: Bob\n')
        s.eof = true
        expect(s.read()).toEqual([{ name: 'Alice' }, { name: 'Bob' }])
    })
})

describe('YamlKeyValueParser', () => {
    it('flattens nested mapping', () => {
        const p = new YamlKeyValueParser()
        p.feed('user:\n  name: John\n  age: 30\n')
        p.eof = true

        const pairs: [string, unknown][] = []
        for (const pair of p.parse()) {
            pairs.push(pair)
        }
        expect(pairs).toEqual([
            ['user.name', 'John'],
            ['user.age', 30],
        ])
    })

    it('flattens sequence with indices', () => {
        const p = new YamlKeyValueParser()
        p.feed('- a\n- b\n- c\n')
        p.eof = true

        const pairs: [string, unknown][] = []
        for (const pair of p.parse()) {
            pairs.push(pair)
        }
        expect(pairs).toEqual([
            ['[0]', 'a'],
            ['[1]', 'b'],
            ['[2]', 'c'],
        ])
    })
})

describe('block scalars', () => {
    it('parses literal block scalar', () => {
        const v = new YamlValue()
        v.feed('key: |\n  line1\n  line2\n')
        v.eof = true
        const result = v.readValue() as Record<string, string>
        expect(result.key).toBe('line1\nline2\n')
    })

    it('parses literal block scalar with strip chomping', () => {
        const v = new YamlValue()
        v.feed('key: |-\n  line1\n  line2\n')
        v.eof = true
        const result = v.readValue() as Record<string, string>
        expect(result.key).toBe('line1\nline2')
    })

    it('parses folded block scalar', () => {
        const v = new YamlValue()
        v.feed('key: >\n  line1\n  line2\n')
        v.eof = true
        const result = v.readValue() as Record<string, string>
        expect(result.key).toBe('line1 line2\n')
    })

    it('parses folded block scalar with strip chomping', () => {
        const v = new YamlValue()
        v.feed('key: >-\n  line1\n  line2\n')
        v.eof = true
        const result = v.readValue() as Record<string, string>
        expect(result.key).toBe('line1 line2')
    })
})

describe('comments', () => {
    it('ignores inline comments', () => {
        const m = new YamlMapping()
        m.feed('name: John # a comment\nage: 30\n')
        m.eof = true
        expect(m.read()).toEqual({ name: 'John', age: 30 })
    })

    it('ignores full-line comments', () => {
        const m = new YamlMapping()
        m.feed('# This is a comment\nname: John\n# Another comment\nage: 30\n')
        m.eof = true
        expect(m.read()).toEqual({ name: 'John', age: 30 })
    })
})

describe('mixed block/flow', () => {
    it('parses block mapping with flow sequence value', () => {
        const m = new YamlMapping()
        m.feed('colors: [red, green, blue]\ncount: 3\n')
        m.eof = true
        expect(m.read()).toEqual({ colors: ['red', 'green', 'blue'], count: 3 })
    })

    it('parses block mapping with flow mapping value', () => {
        const m = new YamlMapping()
        m.feed('point: {x: 1, y: 2}\n')
        m.eof = true
        expect(m.read()).toEqual({ point: { x: 1, y: 2 } })
    })

    it('parses multi-line flow mapping value', () => {
        const yaml = 'obj: {\nfield: {\ntest: true\n}\n}\n'
        const m = new YamlMapping()
        m.feed(yaml)
        m.eof = true
        expect(m.read()).toEqual({
            obj: { field: { test: true } },
        })
    })

    it('parses multi-line flow sequence value', () => {
        const yaml = 'items: [\n1,\n2,\n3\n]\n'
        const m = new YamlMapping()
        m.feed(yaml)
        m.eof = true
        expect(m.read()).toEqual({ items: [1, 2, 3] })
    })

    it('parses complex nested structure', () => {
        const yaml = [
            'name: Project',
            'version: 1.0',
            'authors:',
            '  - name: Alice',
            '    email: alice@example.com',
            '  - name: Bob',
            '    email: bob@example.com',
            'tags: [open-source, typescript]',
            '',
        ].join('\n')

        const m = new YamlMapping()
        m.feed(yaml)
        m.eof = true
        expect(m.read()).toEqual({
            name: 'Project',
            version: 1.0,
            authors: [
                { name: 'Alice', email: 'alice@example.com' },
                { name: 'Bob', email: 'bob@example.com' },
            ],
            tags: ['open-source', 'typescript'],
        })
    })
})

describe('invalid/inconsistent indentation', () => {
    it('stops parsing mapping on unexpected de-indent', () => {
        const m = new YamlMapping()
        m.feed('  a: 1\nb: 2\n')
        m.eof = true
        expect(m.read()).toEqual({ a: 1 })
    })

    it('stops parsing sequence on unexpected de-indent', () => {
        const s = new YamlSequence()
        s.feed('  - 1\n  - 2\n- 3\n')
        s.eof = true
        expect(s.read()).toEqual([1, 2])
    })

    it('handles over-indented value gracefully', () => {
        const m = new YamlMapping()
        m.feed('a:\n      deep: 1\n')
        m.eof = true
        expect(m.read()).toEqual({ a: { deep: 1 } })
    })

    it('does not crash on empty lines with varying whitespace', () => {
        const m = new YamlMapping()
        m.feed('a: 1\n   \n  \n\nb: 2\n')
        m.eof = true
        expect(m.read()).toEqual({ a: 1, b: 2 })
    })

    it('handles mixed indent levels in sequence items', () => {
        const s = new YamlSequence()
        s.feed('- a\n  - b\n')
        s.eof = true
        const result = s.read()
        expect(result.length).toBe(1)
    })
})
