[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonArray

# Class: JsonArray\<T\>

## Extends

- [`JsonEntity`](JsonEntity.md)\<`T`[]\>

## Type Parameters

### T

`T` = `unknown`

## Constructors

### Constructor

> **new JsonArray**\<`T`\>(`buffer?`): `JsonArray`\<`T`\>

#### Parameters

##### buffer?

[`ByteStream`](../type-aliases/ByteStream.md) | `ByteBuffer`

#### Returns

`JsonArray`\<`T`\>

#### Inherited from

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

> **\[asyncIterator\]**(): `AsyncGenerator`\<[`JsonValueType`](../type-aliases/JsonValueType.md), `any`, `any`\>

#### Returns

`AsyncGenerator`\<[`JsonValueType`](../type-aliases/JsonValueType.md), `any`, `any`\>

---

### \[iterator\]()

> **\[iterator\]**(): `Generator`\<[`JsonValueType`](../type-aliases/JsonValueType.md), `any`, `any`\>

#### Returns

`Generator`\<[`JsonValueType`](../type-aliases/JsonValueType.md), `any`, `any`\>

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

...(`number` \| `number`[])[]

#### Returns

`void`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`feed`](JsonEntity.md#feed)

---

### items()

> **items**(): `Generator`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\>

#### Returns

`Generator`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\>

---

### itemsAsync()

> **itemsAsync**(): `AsyncGenerator`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\>

#### Returns

`AsyncGenerator`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\>

---

### parse()

> `protected` **parse**(): `T`[]

#### Returns

`T`[]

#### Overrides

[`JsonEntity`](JsonEntity.md).[`parse`](JsonEntity.md#parse)

---

### read()

> **read**(): `T`[]

#### Returns

`T`[]

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`read`](JsonEntity.md#read)

---

### readAsync()

> **readAsync**(): `Promise`\<`T`[]\>

#### Returns

`Promise`\<`T`[]\>

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

`T` = `JsonArray`\<`T`\>

#### Parameters

##### cb

(`entity`) => `T`

#### Returns

`T` \| `undefined`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`tryParse`](JsonEntity.md#tryparse)
