import { describe, it, expect } from 'vitest'
import {
    JsonArray,
    JsonObject,
    JsoncArray,
    JsoncComment,
    JsoncObject,
    jsonStreamStringify,
} from '../../src/index.js'
import { stringToBytes } from '../../src/utils.js'

describe('JSONC comment parsing', () => {
    it('should parse single-line comment before value', () => {
        const json = '// header comment\n{"key": "value"}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({ key: 'value' })
    })

    it('should parse block comment before value', () => {
        const json = '/* block comment */ {"key": "value"}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({ key: 'value' })
    })

    it('should parse single-line comment between members', () => {
        const json = '{"a": 1, // comment\n "b": 2}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({ a: 1, b: 2 })
    })

    it('should parse block comment between tokens', () => {
        const json = '{"key": /* comment */ "value"}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({ key: 'value' })
    })

    it('should parse multi-line block comment', () => {
        const json = '{"key": /* line1\nline2\nline3 */ "value"}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({ key: 'value' })
    })

    it('should parse multiple consecutive comments', () => {
        const json = '// comment 1\n// comment 2\n/* block */ {"key": "value"}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({ key: 'value' })
    })

    it('should parse comments in arrays', () => {
        const json = '[1, // comment\n 2, /* inline */ 3]'
        const array = new JsoncArray<number>()
        array.jsonc = true
        array.feed(json)

        const result = array.read()
        expect(result).toEqual([1, 2, 3])
    })

    it('should preserve comments inside strings', () => {
        const json = '{"key": "value // not a comment"}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({ key: 'value // not a comment' })
    })

    it('should preserve block comments inside strings', () => {
        const json = '{"key": "value /* not a comment */"}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({ key: 'value /* not a comment */' })
    })

    it('should parse empty single-line comment', () => {
        const json = '//\n{"key": 1}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({ key: 1 })
    })

    it('should parse empty block comment', () => {
        const json = '/**/{"key": 1}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({ key: 1 })
    })

    it('should error on comments when jsonc is false (default)', () => {
        const json = '// comment\n{"key": "value"}'
        const object = new JsonObject()
        object.feed(json)

        expect(() => object.read()).toThrow()
    })

    it('should parse standard JSON correctly with jsonc enabled', () => {
        const json =
            '{"str": "hello", "num": 123, "bool": true, "null": null, "arr": [1, 2], "obj": {"a": 1}}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({
            str: 'hello',
            num: 123,
            bool: true,
            null: null,
            arr: [1, 2],
            obj: { a: 1 },
        })
    })
})

describe('JSONC comment yielding', () => {
    it('should yield comments from object members()', () => {
        const json = '{ // comment on a\n "a": 1, // comment on b\n "b": 2}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const items: (
            | { type: 'comment'; text: string; style: string }
            | { type: 'member'; key: string }
        )[] = []

        for (const item of object.members()) {
            if (item instanceof JsoncComment) {
                items.push({
                    type: 'comment',
                    text: item.text,
                    style: item.style,
                })
            } else {
                items.push({ type: 'member', key: item.key.read() })
                item.value.readValue()
            }
        }

        expect(items[0]).toEqual({
            type: 'comment',
            text: 'comment on a',
            style: 'line',
        })
        expect(items[1]).toEqual({ type: 'member', key: 'a' })
        // comment on b comes as inline after "1"
        expect(items[2]).toEqual({
            type: 'comment',
            text: 'comment on b',
            style: 'line',
        })
        expect(items[3]).toEqual({ type: 'member', key: 'b' })
    })

    it('should yield inline comments after values', () => {
        const json = '{"a": 1 // inline comment\n}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const items: string[] = []
        for (const item of object.members()) {
            if (item instanceof JsoncComment) {
                items.push(`comment:${item.text}`)
            } else {
                items.push(`member:${item.key.read()}`)
                item.value.readValue()
            }
        }

        expect(items).toEqual(['member:a', 'comment:inline comment'])
    })

    it('should yield trailing comments on containers', () => {
        const json = '{"a": 1} // trailing'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const items: string[] = []
        for (const item of object.members()) {
            if (item instanceof JsoncComment) {
                items.push(`comment:${item.text}`)
            } else {
                items.push(`member:${item.key.read()}`)
                item.value.readValue()
            }
        }

        expect(items).toContain('comment:trailing')
    })

    it('should yield comments from array items()', () => {
        const json = '[// before first\n 1, /* between */ 2]'
        const array = new JsoncArray()
        array.jsonc = true
        array.feed(json)

        const items: string[] = []
        for (const item of array.items()) {
            if (item instanceof JsoncComment) {
                items.push(`comment:${item.text}`)
            } else {
                items.push(`value:${item.read()}`)
            }
        }

        expect(items).toContain('comment:before first')
        expect(items).toContain('value:1')
        expect(items).toContain('comment:between')
        expect(items).toContain('value:2')
    })

    it('should yield block comments', () => {
        const json = '{ /* block */ "a": 1}'
        const object = new JsoncObject()
        object.jsonc = true
        object.feed(json)

        const comments: JsoncComment[] = []
        for (const item of object.members()) {
            if (item instanceof JsoncComment) {
                comments.push(item)
            } else {
                item.key.read()
                item.value.readValue()
            }
        }

        expect(comments).toHaveLength(1)
        expect(comments[0].style).toBe('block')
        expect(comments[0].text).toBe('block')
    })
})

describe('Trailing comma support', () => {
    it('should parse object with trailing comma when strict is false', () => {
        const json = '{"a": 1, "b": 2,}'
        const object = new JsoncObject()
        object.strict = false
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({ a: 1, b: 2 })
    })

    it('should parse array with trailing comma when strict is false', () => {
        const json = '[1, 2, 3,]'
        const array = new JsoncArray()
        array.strict = false
        array.feed(json)

        const result = array.read()
        expect(result).toEqual([1, 2, 3])
    })

    it('should error on trailing comma when strict is true (default)', () => {
        const json = '{"a": 1,}'
        const object = new JsoncObject()
        object.feed(json)

        expect(() => object.read()).toThrow()
    })

    it('should error on array trailing comma when strict is true', () => {
        const json = '[1, 2,]'
        const array = new JsoncArray()
        array.feed(json)

        expect(() => array.read()).toThrow()
    })

    it('should handle trailing comma with comments', () => {
        const json = '{"a": 1, // comment\n}'
        const object = new JsoncObject()
        object.jsonc = true
        object.strict = false
        object.feed(json)

        const result = object.read()
        expect(result).toEqual({ a: 1 })
    })
})

describe('JSONC streaming (async)', () => {
    it('should handle comment split across chunks', async () => {
        async function* chunks() {
            yield stringToBytes('{"key": /')
            yield stringToBytes('/ comment\n"value"}')
        }

        const object = new JsoncObject(chunks())
        object.jsonc = true

        const result = await object.readAsync()
        expect(result).toEqual({ key: 'value' })
    })

    it('should handle block comment split across chunks', async () => {
        async function* chunks() {
            yield stringToBytes('{"key": /*')
            yield stringToBytes(' comment ')
            yield stringToBytes('*/ "value"}')
        }

        const object = new JsoncObject(chunks())
        object.jsonc = true

        const result = await object.readAsync()
        expect(result).toEqual({ key: 'value' })
    })

    it('should handle block comment end split across chunks', async () => {
        async function* chunks() {
            yield stringToBytes('{"key": /* comment *')
            yield stringToBytes('/ "value"}')
        }

        const object = new JsoncObject(chunks())
        object.jsonc = true

        const result = await object.readAsync()
        expect(result).toEqual({ key: 'value' })
    })
})

describe('JSONC stringify', () => {
    it('should emit trailing commas when jsonc is true', () => {
        const data = { a: 1, b: 2 }
        const result = [
            ...jsonStreamStringify(data, undefined, 2, { jsonc: true }),
        ].join('')
        expect(result).toContain('"a": 1,')
        expect(result).toContain('"b": 2,')
    })

    it('should emit trailing commas in arrays when jsonc is true', () => {
        const data = [1, 2, 3]
        const result = [
            ...jsonStreamStringify(data, undefined, 2, { jsonc: true }),
        ].join('')
        expect(result).toContain('3,')
    })

    it('should not emit trailing commas when jsonc is false', () => {
        const data = { a: 1 }
        const result = [...jsonStreamStringify(data, undefined, 2)].join('')
        expect(result).toBe('{\n  "a": 1\n}')
    })

    it('should emit comments at paths', () => {
        const data = { a: 1, b: 2 }
        const result = [
            ...jsonStreamStringify(data, undefined, 2, {
                comments: {
                    a: 'comment for a',
                    b: { text: 'block comment', style: 'block' },
                },
            }),
        ].join('')

        expect(result).toContain('// comment for a')
        expect(result).toContain('/* block comment */')
    })

    it('should emit multiple comments for a path', () => {
        const data = { a: 1 }
        const result = [
            ...jsonStreamStringify(data, undefined, 2, {
                comments: {
                    a: ['line 1', 'line 2'],
                },
            }),
        ].join('')

        expect(result).toContain('// line 1')
        expect(result).toContain('// line 2')
    })

    it('should not emit comments in compact mode', () => {
        const data = { a: 1 }
        const result = [
            ...jsonStreamStringify(data, undefined, 0, {
                comments: { a: 'should not appear' },
            }),
        ].join('')

        expect(result).not.toContain('//')
        expect(result).toBe('{"a":1}')
    })
})
