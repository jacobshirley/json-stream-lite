[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonValue

# Class: JsonValue

## Extends

- [`JsonEntity`](JsonEntity.md)\<[`JsonValueType`](../type-aliases/JsonValueType.md)\>

## Constructors

### Constructor

> **new JsonValue**(`buffer?`, `key?`): `JsonValue`

#### Parameters

##### buffer?

[`ByteStream`](../type-aliases/ByteStream.md) | `ByteBuffer`

##### key?

[`JsonString`](JsonString.md)

#### Returns

`JsonValue`

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

### consume()

> **consume**(): `void`

#### Returns

`void`

#### Overrides

[`JsonEntity`](JsonEntity.md).[`consume`](JsonEntity.md#consume)

---

### consumeAsync()

> **consumeAsync**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Overrides

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

### parse()

> `protected` **parse**(): [`JsonValueType`](../type-aliases/JsonValueType.md)

#### Returns

[`JsonValueType`](../type-aliases/JsonValueType.md)

#### Overrides

[`JsonEntity`](JsonEntity.md).[`parse`](JsonEntity.md#parse)

---

### read()

> **read**(): [`JsonValueType`](../type-aliases/JsonValueType.md)

#### Returns

[`JsonValueType`](../type-aliases/JsonValueType.md)

#### Overrides

[`JsonEntity`](JsonEntity.md).[`read`](JsonEntity.md#read)

---

### readAsync()

> **readAsync**(): `Promise`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\>

#### Returns

`Promise`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\>

#### Overrides

[`JsonEntity`](JsonEntity.md).[`readAsync`](JsonEntity.md#readasync)

---

### readValue()

> **readValue**(): `unknown`

#### Returns

`unknown`

---

### readValueAsync()

> **readValueAsync**(): `Promise`\<`unknown`\>

#### Returns

`Promise`\<`unknown`\>

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

`T` = `JsonValue`

#### Parameters

##### cb

(`entity`) => `T`

#### Returns

`T` \| `undefined`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`tryParse`](JsonEntity.md#tryparse)
