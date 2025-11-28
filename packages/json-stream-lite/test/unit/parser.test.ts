import { describe, it, expect } from 'vitest';
import { JsonKeyValueParser, JsonKeyValuePair } from '../../src';
import { stringToBytes } from '../../src/utils';

describe('JSON Key Value Parser', () => {
    it('should break down a simple JSON object', () => {
        const json = '{"key": "value"}';
        const parser = new JsonKeyValueParser()
        
        parser.feed(...stringToBytes(json));
        const keyValuePairs = Array.from(parser.parseNext());

        expect(keyValuePairs).toEqual([new JsonKeyValuePair('key', 'value')]);
    });

    it('should handle various primitive values', () => {
        const json = '{"str": "hello", "num": 123, "bool": true, "nullVal": null}';
        const parser = new JsonKeyValueParser();
        
        parser.feed(...stringToBytes(json));
        const keyValuePairs = Array.from(parser.parseNext());

        expect(keyValuePairs).toEqual([
            new JsonKeyValuePair('str', 'hello'),
            new JsonKeyValuePair('num', 123),
            new JsonKeyValuePair('bool', true),
            new JsonKeyValuePair('nullVal', null),
        ]);
    });

    it('should ignore whitespace between keyValuePairs', () => {
        const json = '{   "key1"  :  "value1" ,  "key2" : 42  }';
        const parser = new JsonKeyValueParser();
        
        parser.feed(...stringToBytes(json));
        const keyValuePairs = Array.from(parser.parseNext());

        expect(keyValuePairs).toEqual([
            new JsonKeyValuePair('key1', 'value1'),
            new JsonKeyValuePair('key2', 42),
        ]);
    });

    it('should handle empty JSON objects', () => {
        const json = '{}';
        const parser = new JsonKeyValueParser();
        
        parser.feed(...stringToBytes(json));
        const keyValuePairs = Array.from(parser.parseNext());

        expect(keyValuePairs).toEqual([]);
    });

    it('should handle multiple key-value pairs', () => {
        const json = '{"a": 1, "b": "two", "c": false}';
        const parser = new JsonKeyValueParser();
        
        parser.feed(...stringToBytes(json));
        const keyValuePairs = Array.from(parser.parseNext());

        expect(keyValuePairs).toEqual([
            new JsonKeyValuePair('a', 1),
            new JsonKeyValuePair('b', 'two'),
            new JsonKeyValuePair('c', false),
        ]);
    });

    it('should handle sub objects (only top-level key-value pairs are returned)', () => {
        const json = '{"outerKey": {"innerKey": "innerValue"}, "anotherKey": 99}';
        const parser = new JsonKeyValueParser();
        
        parser.feed(...stringToBytes(json));
        const keyValuePairs = Array.from(parser.parseNext());

        expect(keyValuePairs).toEqual([
            new JsonKeyValuePair('outerKey.innerKey', 'innerValue'),
            new JsonKeyValuePair('anotherKey', 99),
        ]);
    });

    it('should handle arrays', () => {
        const json = '{"arrayKey": [1, 2, 3], "simpleKey": "simpleValue"}';
        const parser = new JsonKeyValueParser();
        
        parser.feed(...stringToBytes(json));
        const keyValuePairs = Array.from(parser.parseNext());

        expect(keyValuePairs).toEqual([
            new JsonKeyValuePair('arrayKey[0]', 1),
            new JsonKeyValuePair('arrayKey[1]', 2),
            new JsonKeyValuePair('arrayKey[2]', 3),
            new JsonKeyValuePair('simpleKey', 'simpleValue'),
        ]);
    })

    it('should handle top-level arrays', () => {
        const json = '[{"key1": "value1"}, {"key2": "value2"}]';
        const parser = new JsonKeyValueParser();
        
        parser.feed(...stringToBytes(json));
        const keyValuePairs = Array.from(parser.parseNext());

        expect(keyValuePairs).toEqual([
            new JsonKeyValuePair('[0].key1', 'value1'),
            new JsonKeyValuePair('[1].key2', 'value2'),
        ]);
    })

    it('should handle nested arrays and objects', () => {
        const json = '{"obj": {"arr": [true, false, null, [null], {"key": "value"}]}, "num": 42, "nullable": null}';
        const parser = new JsonKeyValueParser();
        
        const keyValuePairs: JsonKeyValuePair[] = [];
        for (const byte of stringToBytes(json)) {
            parser.feed(byte);
            keyValuePairs.push(...parser.parseNext());
        }

        expect(keyValuePairs).toEqual([
            new JsonKeyValuePair('obj.arr[0]', true),
            new JsonKeyValuePair('obj.arr[1]', false),
            new JsonKeyValuePair('obj.arr[2]', null),
            new JsonKeyValuePair('obj.arr[3][0]', null),
            new JsonKeyValuePair('obj.arr[4].key', 'value'),
            new JsonKeyValuePair('num', 42),
            new JsonKeyValuePair('nullable', null),
        ]);
    })
})