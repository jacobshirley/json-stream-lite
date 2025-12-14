import { describe, it, expect } from 'vitest'
import {
    JsonArray,
    JsonObject,
    JsonValue,
    JsonString,
    JsonNumber,
    JsonBoolean,
} from '../../src/index.js'
import { stringToBytes } from '../../src/utils.js'

describe('Type inference', () => {
    it('should infer object value types from generic parameter', () => {
        type User = {
            name: string
            age: number
            active: boolean
        }

        const json = '{"name": "Alice", "age": 30, "active": true}'
        const object = new JsonObject<User>()
        object.feed(...stringToBytes(json))

        const result: User = {} as User

        for (const { key, value } of object.members()) {
            const keyStr = key.read()
            const valueEntity = value.read()

            // With the improved types, value is now JsonValue<string | number | boolean>
            // instead of JsonValue<User>, which is more accurate

            if (keyStr === 'name') {
                // valueEntity should be a string entity
                expect(valueEntity).toBeInstanceOf(JsonString)
                const val = valueEntity.read()
                expect(typeof val).toBe('string')
                result[keyStr] = val as string
            } else if (keyStr === 'age') {
                // valueEntity should be a number entity
                expect(valueEntity).toBeInstanceOf(JsonNumber)
                const val = valueEntity.read()
                expect(typeof val).toBe('number')
                result[keyStr] = val as number
            } else if (keyStr === 'active') {
                // valueEntity should be a boolean entity
                expect(valueEntity).toBeInstanceOf(JsonBoolean)
                const val = valueEntity.read()
                expect(typeof val).toBe('boolean')
                result[keyStr] = val as boolean
            }
        }

        expect(result).toEqual({ name: 'Alice', age: 30, active: true })
    })

    it('should infer array element types from generic parameter', () => {
        type User = {
            name: string
            age: number
        }

        const json =
            '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]'
        const array = new JsonArray<User>()
        array.feed(...stringToBytes(json))

        const results: User[] = []

        for (const item of array.items()) {
            // With proper typing, item is JsonValueType<User>
            // which resolves to JsonObject<User> | JsonString | JsonNumber | etc.
            expect(item).toBeInstanceOf(JsonObject)
            const val = item.read()
            expect(val).toHaveProperty('name')
            expect(val).toHaveProperty('age')
            results.push(val as User)
        }

        expect(results).toEqual([
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
        ])
    })

    it('should handle nested types correctly', () => {
        type Response = {
            users: Array<{
                name: string
                age: number
            }>
            count: number
        }

        const json = '{"users": [{"name": "Alice", "age": 30}], "count": 1}'
        const object = new JsonObject<Response>()
        object.feed(...stringToBytes(json))

        let usersArray: any = null
        let countValue: any = null

        for (const { key, value } of object.members()) {
            const keyStr = key.read()
            const valueEntity = value.read()

            if (keyStr === 'users') {
                // valueEntity should be an array
                expect(valueEntity).toBeInstanceOf(JsonArray)
                usersArray = valueEntity.read()
            } else if (keyStr === 'count') {
                // valueEntity should be a number
                expect(valueEntity).toBeInstanceOf(JsonNumber)
                countValue = valueEntity.read()
            }
        }

        expect(usersArray).toEqual([{ name: 'Alice', age: 30 }])
        expect(countValue).toBe(1)
    })

    it('should work with primitive array types', () => {
        const json = '[1, 2, 3, 4, 5]'
        const array = new JsonArray<number>()
        array.feed(...stringToBytes(json))

        const results: number[] = []

        for (const item of array.items()) {
            // item is JsonValueType<number>
            expect(item).toBeInstanceOf(JsonNumber)
            const val = item.read()
            expect(typeof val).toBe('number')
            results.push(val as number)
        }

        expect(results).toEqual([1, 2, 3, 4, 5])
    })

    it('should work with string array types', () => {
        const json = '["hello", "world", "test"]'
        const array = new JsonArray<string>()
        array.feed(...stringToBytes(json))

        const results: string[] = []

        for (const item of array.items()) {
            // item is JsonValueType<string>
            expect(item).toBeInstanceOf(JsonString)
            const val = item.read()
            expect(typeof val).toBe('string')
            results.push(val as string)
        }

        expect(results).toEqual(['hello', 'world', 'test'])
    })
})
