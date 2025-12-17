import { describe, expect, it } from 'vitest'
import { jsonStreamStringify } from '../../src/index.js'

describe('JSON stream stringify', () => {
    it('should stringify a simple object', () => {
        const obj = { a: 1, b: 'text', c: true, d: null }
        const chunks = Array.from(
            jsonStreamStringify(obj, null, 2, {
                stringChunkSize: 1,
            }),
        )
        expect(chunks.length).toBe(35) // Expect multiple chunks due to stringChunkSize
        const result = chunks.join('')
        const expected = JSON.stringify(obj, null, 2)
        expect(result).toBe(expected)
    })

    it('should stringify a nested object', () => {
        const obj = { a: { b: { c: [1, 2, 3] } } }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify(obj)
        expect(result).toBe(expected)
    })

    it('should stringify an array of objects', () => {
        const arr = [{ x: 10 }, { y: 20 }, { z: 30 }]
        const result = Array.from(jsonStreamStringify(arr, null, 4)).join('')
        const expected = JSON.stringify(arr, null, 4)
        expect(result).toBe(expected)
    })

    it('should handle special characters in strings', () => {
        const obj = { text: 'Line1\nLine2\tTabbed\\Backslash\"Quote' }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify(obj)
        expect(result).toBe(expected)
    })

    it('should handle control characters with unicode escapes', () => {
        const obj = { company: '\x10' }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify(obj)
        expect(result).toBe(expected)
        expect(result).toBe('{"company":"\\u0010"}')
    })

    it('should stringify with a replacer function', () => {
        const obj = { a: 1, b: 2, c: 3 }
        const replacer = (key: string, value: any) =>
            typeof value === 'number' ? value * 2 : value
        const result = Array.from(jsonStreamStringify(obj, replacer)).join('')
        const expected = JSON.stringify(obj, replacer)
        expect(result).toBe(expected)
    })

    it('should handle empty objects and arrays', () => {
        const obj = { emptyObj: {}, emptyArr: [] }
        const result = Array.from(jsonStreamStringify(obj, null, 2)).join('')
        const expected = JSON.stringify(obj, null, 2)
        expect(result).toBe(expected)
    })

    it('should handle numbers like NaN and Infinity', () => {
        const obj = { a: NaN, b: Infinity, c: -Infinity, d: 42 }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify(obj)
        expect(result).toBe(expected)
    })

    it('should stringify boolean values correctly', () => {
        const obj = { truthy: true, falsy: false }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify(obj)
        expect(result).toBe(expected)
    })

    it('should handle deeply nested structures', () => {
        const obj = { a: { b: { c: { d: { e: [1, 2, { f: 'deep' }] } } } } }
        const result = Array.from(jsonStreamStringify(obj, null, 2)).join('')
        const expected = JSON.stringify(obj, null, 2)
        expect(result).toBe(expected)
    })

    it('should handle large arrays efficiently', () => {
        const arr = Array.from({ length: 1000 }, (_, i) => i)
        const result = Array.from(jsonStreamStringify(arr)).join('')
        const expected = JSON.stringify(arr)
        expect(result).toBe(expected)
    })

    it('should handle null and undefined values', () => {
        const obj = {
            a: undefined,
            b: null,
            c: undefined,
            d: null,
            arr: [undefined, null, undefined, null, undefined, undefined],
        }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify(obj)
        expect(result).toBe(expected)
    })

    it('should handle mixed data types in arrays', () => {
        const arr = [1, 'two', true, null, { a: 3 }, [4, 5]]
        const result = Array.from(jsonStreamStringify(arr, null, 2)).join('')
        const expected = JSON.stringify(arr, null, 2)
        expect(result).toBe(expected)
    })

    it('should handle special numeric values in arrays', () => {
        const arr = [NaN, Infinity, -Infinity, 42, -7, -0.34343e10]
        const result = Array.from(jsonStreamStringify(arr)).join('')
        const expected = JSON.stringify(arr)
        expect(result).toBe(expected)
    })

    it('should handle empty strings and zero values', () => {
        const obj = { emptyString: '', zero: 0, falseValue: false }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify(obj)
        expect(result).toBe(expected)
    })

    it('should handle objects with symbol keys by ignoring them', () => {
        const sym = Symbol('symKey')
        const obj: any = { a: 1, b: 2 }
        obj[sym] = 'symbolValue'
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify({ a: 1, b: 2 })
        expect(result).toBe(expected)
    })

    it(
        'should handle circular references by throwing an error',
        { timeout: 10000 },
        () => {
            const obj: any = { a: 1 }
            obj.self = obj
            expect(() => {
                Array.from(jsonStreamStringify(obj)).join('')
            }).toThrow()
        },
    )

    it('should handle large nested structures', () => {
        const createNestedObject = (depth: number): any => {
            if (depth === 0) return { value: 'end' }
            return { nested: createNestedObject(depth - 1) }
        }
        const obj = createNestedObject(100)
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify(obj)
        expect(result).toBe(expected)
    })

    it('should ignore functions in objects', () => {
        const obj: any = {
            a: 1,
            b: function () {
                return 'I am a function'
            },
            c: 3,
        }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify({ a: 1, c: 3 })
        expect(result).toBe(expected)
    })

    it('should use toJSON method if available', () => {
        const obj = {
            a: 1,
            b: 2,
            toJSON() {
                return { a: this.a }
            },
        }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify(obj)
        expect(result).toBe(expected)
    })

    it('should use custom toString methods', () => {
        const obj = {
            a: 1,
            b: {
                toString: () => {
                    return 'customString'
                },
            },
        }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify({
            a: 1,
            b: 'customString',
        })
        expect(result).toBe(expected)
    })

    it('should use both toJSON and toString methods correctly', () => {
        const obj = {
            a: 1,
            b: {
                toJSON() {
                    return { nested: 'value' }
                },
                toString() {
                    return 'shouldNotBeUsed'
                },
            },
        }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify({
            a: 1,
            b: { nested: 'value' },
        })
        expect(result).toBe(expected)
    })

    it('should allow custom toJSON on an array', () => {
        const arr: any = [1, 2, 3]
        arr.toJSON = function () {
            return ['a', 'b', 'c']
        }
        const result = Array.from(jsonStreamStringify(arr)).join('')
        const expected = JSON.stringify(arr)
        expect(result).toBe(expected)
    })

    it('should allow custom toString on an array', () => {
        const arr: any = [1, 2, 3]
        arr.toString = function () {
            return 'customArrayString'
        }
        const result = Array.from(jsonStreamStringify(arr)).join('')
        const expected = JSON.stringify('customArrayString')
        expect(result).toBe(expected)
    })

    it('should use toString inside toJSON', () => {
        const obj = {
            a: 1,
            b: {
                toJSON() {
                    return {
                        nested: {
                            toString: () => 'valueFromToString',
                        },
                    }
                },
            },
        }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify({
            a: 1,
            b: { nested: 'valueFromToString' },
        })
        expect(result).toBe(expected)
    })

    it('should handle Date objects correctly', () => {
        const date = new Date('2024-01-01T00:00:00Z')
        const obj = { event: 'New Year', date }
        const result = Array.from(jsonStreamStringify(obj)).join('')
        const expected = JSON.stringify(obj)
        expect(result).toBe(expected)
    })

    it(
        'should handle extremely large objects that might fail with standard JSON.stringify',
        { timeout: 60000 },
        () => {
            // This test demonstrates that streaming can handle objects where
            // JSON.stringify might fail due to string length limits or memory
            const LARGE_SIZE = 500_000 * 10

            const veryLargeArray = Array.from(
                { length: LARGE_SIZE },
                (_, i) => ({
                    index: i,
                    data: `Item ${i} with some additional text to make it larger`,
                    values: [i, i * 2, i * 3, i * 4, i * 5],
                }),
            )

            let totalLength = 0
            let chunkCount = 0

            for (const chunk of jsonStreamStringify(veryLargeArray, null, 0)) {
                totalLength += chunk.length
                chunkCount++
            }

            expect(totalLength).toBeGreaterThan(LARGE_SIZE * 50) // At least 50 chars per object
            expect(chunkCount).toBeGreaterThan(LARGE_SIZE) // Many chunks generated
        },
    )
})
