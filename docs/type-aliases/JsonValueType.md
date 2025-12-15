[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonValueType

# Type Alias: JsonValueType\<T\>

> **JsonValueType**\<`T`\> = `T` _extends_ `string` ? [`JsonString`](../classes/JsonString.md)\<`Extract`\<`T`, `string`\>\> : `T` _extends_ `number` ? [`JsonNumber`](../classes/JsonNumber.md)\<`Extract`\<`T`, `number`\>\> : `T` _extends_ `boolean` ? [`JsonBoolean`](../classes/JsonBoolean.md)\<`Extract`\<`T`, `boolean`\>\> : `T` _extends_ `null` ? [`JsonNull`](../classes/JsonNull.md) : `T` _extends_ infer K[] ? [`JsonArray`](../classes/JsonArray.md)\<`K`\> : `T` _extends_ `object` ? [`JsonObject`](../classes/JsonObject.md)\<`Extract`\<`T`, `object`\>\> : [`JsonString`](../classes/JsonString.md) \| [`JsonNumber`](../classes/JsonNumber.md) \| [`JsonBoolean`](../classes/JsonBoolean.md) \| [`JsonNull`](../classes/JsonNull.md) \| [`JsonArray`](../classes/JsonArray.md) \| [`JsonObject`](../classes/JsonObject.md)

Union type representing any JSON value entity type (primitive, object, or array).

## Type Parameters

### T

`T` = `any`

The expected type of the value
