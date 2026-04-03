import { describe, expect, it } from 'vitest'
import {
    YamlEntity,
    yamlStreamStringify,
    yamlStreamStringifyAsync,
} from '../../src/index.js'

function stringify(
    value: unknown,
    options?: Parameters<typeof yamlStreamStringify>[1],
): string {
    return Array.from(yamlStreamStringify(value, options)).join('')
}

describe('yamlStreamStringify', () => {
    describe('scalars', () => {
        it('stringifies null', () => {
            expect(stringify(null)).toBe('null')
        })

        it('stringifies undefined as null', () => {
            expect(stringify(undefined)).toBe('null')
        })

        it('stringifies true', () => {
            expect(stringify(true)).toBe('true')
        })

        it('stringifies false', () => {
            expect(stringify(false)).toBe('false')
        })

        it('stringifies integer', () => {
            expect(stringify(42)).toBe('42')
        })

        it('stringifies float', () => {
            expect(stringify(3.14)).toBe('3.14')
        })

        it('stringifies NaN', () => {
            expect(stringify(NaN)).toBe('.nan')
        })

        it('stringifies Infinity', () => {
            expect(stringify(Infinity)).toBe('.inf')
        })

        it('stringifies -Infinity', () => {
            expect(stringify(-Infinity)).toBe('-.inf')
        })

        it('stringifies plain string', () => {
            expect(stringify('hello')).toBe('hello')
        })

        it('quotes string that looks like boolean', () => {
            const result = stringify('true')
            expect(result).toContain("'true'")
        })

        it('quotes string that looks like null', () => {
            const result = stringify('null')
            expect(result).toContain("'null'")
        })

        it('quotes empty string', () => {
            const result = stringify('')
            expect(result).toMatch(/^['"]/)
        })

        it('quotes string with special characters', () => {
            const result = stringify('key: value')
            expect(result).toMatch(/^['"]/)
        })

        it('double-quotes string with control characters', () => {
            const result = stringify('line1\nline2')
            // multiline strings use block scalar style
            expect(result).toContain('line1')
            expect(result).toContain('line2')
        })
    })

    describe('arrays', () => {
        it('stringifies empty array', () => {
            expect(stringify([])).toBe('[]')
        })

        it('stringifies simple array in block style', () => {
            const result = stringify([1, 2, 3])
            expect(result).toContain('- 1')
            expect(result).toContain('- 2')
            expect(result).toContain('- 3')
        })

        it('stringifies array in flow style', () => {
            const result = stringify([1, 2, 3], { flowLevel: 0 })
            expect(result).toBe('[1, 2, 3]')
        })
    })

    describe('objects', () => {
        it('stringifies empty object', () => {
            expect(stringify({})).toBe('{}')
        })

        it('stringifies simple object in block style', () => {
            const result = stringify({ name: 'John', age: 30 })
            expect(result).toContain('name: John')
            expect(result).toContain('age: 30')
        })

        it('stringifies object in flow style', () => {
            const result = stringify({ a: 1, b: 2 }, { flowLevel: 0 })
            expect(result).toBe('{a: 1, b: 2}')
        })

        it('stringifies nested object', () => {
            const result = stringify({ user: { name: 'Alice', age: 25 } })
            expect(result).toContain('user:')
            expect(result).toContain('  name: Alice')
            expect(result).toContain('  age: 25')
        })

        it('sorts keys when sortKeys is true', () => {
            const result = stringify({ c: 3, a: 1, b: 2 }, { sortKeys: true })
            const aPos = result.indexOf('a:')
            const bPos = result.indexOf('b:')
            const cPos = result.indexOf('c:')
            expect(aPos).toBeLessThan(bPos)
            expect(bPos).toBeLessThan(cPos)
        })
    })

    describe('complex structures', () => {
        it('stringifies array of objects', () => {
            const data = [
                { name: 'Alice', age: 25 },
                { name: 'Bob', age: 30 },
            ]
            const result = stringify(data)
            expect(result).toContain('- name: Alice')
            expect(result).toContain('- name: Bob')
        })

        it('stringifies object with array value', () => {
            const result = stringify({ items: [1, 2, 3] })
            expect(result).toContain('items:')
            expect(result).toContain('  - 1')
        })

        it('skips functions in objects', () => {
            const result = stringify({ a: 1, fn: () => {} })
            expect(result).toContain('a: 1')
            expect(result).not.toContain('fn')
        })

        it('handles toJSON method', () => {
            const obj = { toJSON: () => ({ x: 1 }) }
            const result = stringify(obj)
            expect(result).toContain('x: 1')
        })
    })

    describe('static stringify methods', () => {
        it('YamlEntity.stringify works', () => {
            const chunks = Array.from(YamlEntity.stringify({ a: 1 }))
            expect(chunks.join('')).toContain('a: 1')
        })
    })
})

describe('yamlStreamStringifyAsync', () => {
    it('stringifies async iterable as multi-document', async () => {
        async function* gen() {
            yield { name: 'doc1' }
            yield { name: 'doc2' }
        }
        const chunks: string[] = []
        for await (const chunk of yamlStreamStringifyAsync(gen())) {
            chunks.push(chunk)
        }
        const result = chunks.join('')
        expect(result).toContain('name: doc1')
        expect(result).toContain('---')
        expect(result).toContain('name: doc2')
    })
})
