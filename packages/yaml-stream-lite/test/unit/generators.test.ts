import { describe, expect, test } from 'vitest'
import {
    YamlKeyValuePair,
    yamlKeyValueParser,
    yamlKeyValueParserAsync,
} from '../../src/index.js'

describe('yamlKeyValueParser (sync)', () => {
    test('parses flat mapping', () => {
        const yaml = 'name: John\nage: 30\n'
        const pairs: YamlKeyValuePair[] = []
        for (const pair of yamlKeyValueParser(yaml)) {
            pairs.push(pair)
        }
        expect(pairs).toEqual([
            ['name', 'John'],
            ['age', 30],
        ])
    })

    test('parses nested mapping', () => {
        const yaml = 'user:\n  name: Alice\n  scores:\n    - 10\n    - 20\n'
        const pairs: YamlKeyValuePair[] = []
        for (const pair of yamlKeyValueParser(yaml)) {
            pairs.push(pair)
        }
        expect(pairs).toEqual([
            ['user.name', 'Alice'],
            ['user.scores[0]', 10],
            ['user.scores[1]', 20],
        ])
    })

    test('parses sequence at root', () => {
        const yaml = '- a\n- b\n'
        const pairs: YamlKeyValuePair[] = []
        for (const pair of yamlKeyValueParser(yaml)) {
            pairs.push(pair)
        }
        expect(pairs).toEqual([
            ['[0]', 'a'],
            ['[1]', 'b'],
        ])
    })
})

describe('yamlKeyValueParserAsync', () => {
    test('parses from string', async () => {
        const yaml = 'x: 1\ny: 2\n'
        const pairs: YamlKeyValuePair[] = []
        for await (const pair of yamlKeyValueParserAsync(yaml)) {
            pairs.push(pair)
        }
        expect(pairs).toEqual([
            ['x', 1],
            ['y', 2],
        ])
    })

    test('parses from ReadableStream', async () => {
        const yaml = 'a: hello\nb: world\n'
        const encoder = new TextEncoder()
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                // Send in chunks
                const bytes = encoder.encode(yaml)
                const mid = Math.floor(bytes.length / 2)
                controller.enqueue(bytes.slice(0, mid))
                controller.enqueue(bytes.slice(mid))
                controller.close()
            },
        })

        const pairs: YamlKeyValuePair[] = []
        for await (const pair of yamlKeyValueParserAsync(stream)) {
            pairs.push(pair)
        }
        expect(pairs).toEqual([
            ['a', 'hello'],
            ['b', 'world'],
        ])
    })
})
