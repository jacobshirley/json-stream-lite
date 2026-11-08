import { describe, expect, test } from 'vitest'
import {
    YamlMapping,
    YamlSequence,
    yamlStreamStringify,
    yamlStreamStringifyBytes,
    YamlValue,
} from '../../src/index.js'

describe('end-to-end', () => {
    test('parses large sequence', () => {
        const items: string[] = []
        for (let i = 0; i < 1000; i++) {
            items.push(`- item${i}`)
        }
        const yaml = items.join('\n') + '\n'

        const s = new YamlSequence()
        s.feed(yaml)
        s.eof = true
        const result = s.read() as string[]
        expect(result.length).toBe(1000)
        expect(result[0]).toBe('item0')
        expect(result[999]).toBe('item999')
    })

    test('parses large mapping', () => {
        const lines: string[] = []
        for (let i = 0; i < 500; i++) {
            lines.push(`key${i}: value${i}`)
        }
        const yaml = lines.join('\n') + '\n'

        const m = new YamlMapping()
        m.feed(yaml)
        m.eof = true
        const result = m.read()
        expect(Object.keys(result).length).toBe(500)
        expect(result['key0']).toBe('value0')
        expect(result['key499']).toBe('value499')
    })

    test('streaming byte chunks', () => {
        const data = { name: 'test', values: [1, 2, 3] }
        const chunks: Uint8Array[] = []
        for (const chunk of yamlStreamStringifyBytes(data)) {
            chunks.push(chunk)
        }
        const totalBytes = chunks.reduce((sum, c) => sum + c.length, 0)
        expect(totalBytes).toBeGreaterThan(0)

        const decoder = new TextDecoder()
        const result = chunks.map((c) => decoder.decode(c)).join('')
        expect(result).toContain('name: test')
    })

    test('parses deeply nested structure', () => {
        const yaml = [
            'level1:',
            '  level2:',
            '    level3:',
            '      level4:',
            '        value: deep',
            '',
        ].join('\n')

        const m = new YamlMapping()
        m.feed(yaml)
        m.eof = true
        expect(m.read()).toEqual({
            level1: {
                level2: {
                    level3: {
                        level4: {
                            value: 'deep',
                        },
                    },
                },
            },
        })
    })

    test('round-trip: stringify then parse simple object', () => {
        const original = { name: 'Alice', age: 30, active: true }
        const yamlStr = Array.from(yamlStreamStringify(original)).join('')

        const v = new YamlValue()
        v.feed(yamlStr)
        v.eof = true
        const parsed = v.readValue()
        expect(parsed).toEqual(original)
    })

    test('round-trip: stringify then parse nested object', () => {
        const original = {
            user: { name: 'Bob', scores: [10, 20, 30] },
            active: false,
        }
        const yamlStr = Array.from(yamlStreamStringify(original)).join('')

        const v = new YamlValue()
        v.feed(yamlStr)
        v.eof = true
        const parsed = v.readValue()
        expect(parsed).toEqual(original)
    })

    test('async iteration over sequence', async () => {
        const yaml = '- a\n- b\n- c\n'
        const encoder = new TextEncoder()
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                const bytes = encoder.encode(yaml)
                // Send byte by byte to stress streaming
                for (let i = 0; i < bytes.length; i += 10) {
                    controller.enqueue(bytes.slice(i, i + 10))
                }
                controller.close()
            },
        })

        const s = new YamlSequence(stream, -1, 'block')
        const values: unknown[] = []
        for await (const item of s) {
            values.push(await item.readValueAsync())
        }
        expect(values).toEqual(['a', 'b', 'c'])
    })

    test('async iteration over sequence of mappings', async () => {
        const yaml = '- name: Alice\n  age: 25\n- name: Bob\n  age: 30\n'
        const encoder = new TextEncoder()
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                const bytes = encoder.encode(yaml)
                for (let i = 0; i < bytes.length; i += 10) {
                    controller.enqueue(bytes.slice(i, i + 10))
                }
                controller.close()
            },
        })

        const s = new YamlSequence(stream, -1, 'block')
        const values: unknown[] = []
        for await (const item of s) {
            values.push(await item.readValueAsync())
        }
        expect(values).toEqual([
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 30 },
        ])
    })

    test('async iteration over nested mapping', async () => {
        const yaml =
            'name: Project\nauthors:\n  - name: Alice\n  - name: Bob\ntags: [a, b]\n'
        const encoder = new TextEncoder()
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                const bytes = encoder.encode(yaml)
                for (let i = 0; i < bytes.length; i += 8) {
                    controller.enqueue(bytes.slice(i, i + 8))
                }
                controller.close()
            },
        })

        const m = new YamlMapping(stream, -1, 'block')
        const result: Record<string, unknown> = {}
        for await (const { key, value } of m) {
            const k = String(await key.readAsync())
            result[k] = await value.readValueAsync()
        }
        expect(result).toEqual({
            name: 'Project',
            authors: [{ name: 'Alice' }, { name: 'Bob' }],
            tags: ['a', 'b'],
        })
    })

    test('parses mixed types in sequence', () => {
        const yaml = [
            '- hello',
            '- 42',
            '- 3.14',
            '- true',
            '- false',
            '- null',
            '- ~',
            '',
        ].join('\n')

        const s = new YamlSequence()
        s.feed(yaml)
        s.eof = true
        expect(s.read()).toEqual(['hello', 42, 3.14, true, false, null, null])
    })
})
