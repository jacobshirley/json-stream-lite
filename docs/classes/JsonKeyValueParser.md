[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonKeyValueParser

# Class: JsonKeyValueParser

## Extends

- [`JsonEntity`](JsonEntity.md)\<`Generator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md)\>\>

## Constructors

### Constructor

> **new JsonKeyValueParser**(`buffer?`, `container?`, `parentKey?`): `JsonKeyValueParser`

#### Parameters

##### buffer?

[`ByteStream`](../type-aliases/ByteStream.md) | `ByteBuffer`

##### container?

[`JsonObject`](JsonObject.md)\<`unknown`\> | [`JsonArray`](JsonArray.md)\<`unknown`\> | [`JsonValue`](JsonValue.md)\<`unknown`, `string`\>

##### parentKey?

`string`

#### Returns

`JsonKeyValueParser`

#### Overrides

[`JsonEntity`](JsonEntity.md).[`constructor`](JsonEntity.md#constructor)

## Properties

### buffer

> `protected` **buffer**: `ByteBuffer`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`buffer`](JsonEntity.md#buffer)

---

### consumed

> **consumed**: `boolean` = `false`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`consumed`](JsonEntity.md#consumed)

## Accessors

### bufferLength

#### Get Signature

> **get** **bufferLength**(): `number`

##### Returns

`number`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`bufferLength`](JsonEntity.md#bufferlength)

---

### entityType

#### Get Signature

> **get** **entityType**(): `string`

##### Returns

`string`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`entityType`](JsonEntity.md#entitytype)

---

### maxBufferSize

#### Set Signature

> **set** **maxBufferSize**(`size`): `void`

##### Parameters

###### size

`number`

##### Returns

`void`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`maxBufferSize`](JsonEntity.md#maxbuffersize)

## Methods

### \[asyncIterator\]()

> **\[asyncIterator\]**(): `AsyncGenerator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md), `any`, `any`\>

#### Returns

`AsyncGenerator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md), `any`, `any`\>

---

### \[iterator\]()

> **\[iterator\]**(): `Generator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md), `any`, `any`\>

#### Returns

`Generator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md), `any`, `any`\>

---

### consume()

> **consume**(): `void`

#### Returns

`void`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`consume`](JsonEntity.md#consume)

---

### consumeAsync()

> **consumeAsync**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`consumeAsync`](JsonEntity.md#consumeasync)

---

### feed()

> **feed**(...`input`): `void`

#### Parameters

##### input

...[`JsonStreamInput`](../type-aliases/JsonStreamInput.md)[]

#### Returns

`void`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`feed`](JsonEntity.md#feed)

---

### parse()

> **parse**(): `Generator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md)\>

#### Returns

`Generator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md)\>

#### Overrides

[`JsonEntity`](JsonEntity.md).[`parse`](JsonEntity.md#parse)

---

### parseAsync()

> **parseAsync**(): `AsyncGenerator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md)\>

#### Returns

`AsyncGenerator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md)\>

---

### read()

> **read**(): `Generator`

#### Returns

`Generator`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`read`](JsonEntity.md#read)

---

### readAsync()

> **readAsync**(): `Promise`\<`Generator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md), `any`, `any`\>\>

#### Returns

`Promise`\<`Generator`\<[`JsonKeyValuePair`](../type-aliases/JsonKeyValuePair.md), `any`, `any`\>\>

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`readAsync`](JsonEntity.md#readasync)

---

### skipWhitespace()

> `protected` **skipWhitespace**(): `void`

#### Returns

`void`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`skipWhitespace`](JsonEntity.md#skipwhitespace)

---

### tryParse()

> **tryParse**\<`T`\>(`cb`): `T` \| `undefined`

#### Type Parameters

##### T

`T` = `JsonKeyValueParser`

#### Parameters

##### cb

(`entity`) => `T`

#### Returns

`T` \| `undefined`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`tryParse`](JsonEntity.md#tryparse)
