[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonEntity

# Abstract Class: JsonEntity\<T\>

## Extended by

- [`JsonString`](JsonString.md)
- [`JsonNumber`](JsonNumber.md)
- [`JsonBoolean`](JsonBoolean.md)
- [`JsonNull`](JsonNull.md)
- [`JsonValue`](JsonValue.md)
- [`JsonObject`](JsonObject.md)
- [`JsonArray`](JsonArray.md)
- [`JsonKeyValueParser`](JsonKeyValueParser.md)

## Type Parameters

### T

`T`

## Constructors

### Constructor

> **new JsonEntity**\<`T`\>(`buffer?`): `JsonEntity`\<`T`\>

#### Parameters

##### buffer?

[`ByteStream`](../type-aliases/ByteStream.md) | `ByteBuffer`

#### Returns

`JsonEntity`\<`T`\>

## Properties

### buffer

> `protected` **buffer**: `ByteBuffer`

---

### consumed

> **consumed**: `boolean` = `false`

## Accessors

### bufferLength

#### Get Signature

> **get** **bufferLength**(): `number`

##### Returns

`number`

---

### entityType

#### Get Signature

> **get** **entityType**(): `string`

##### Returns

`string`

---

### maxBufferSize

#### Set Signature

> **set** **maxBufferSize**(`size`): `void`

##### Parameters

###### size

`number`

##### Returns

`void`

## Methods

### consume()

> **consume**(): `void`

#### Returns

`void`

---

### consumeAsync()

> **consumeAsync**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

---

### feed()

> **feed**(...`input`): `void`

#### Parameters

##### input

...(`number` \| `number`[])[]

#### Returns

`void`

---

### parse()

> `abstract` `protected` **parse**(): `T`

#### Returns

`T`

---

### read()

> **read**(): `T`

#### Returns

`T`

---

### readAsync()

> **readAsync**(): `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

---

### skipWhitespace()

> `protected` **skipWhitespace**(): `void`

#### Returns

`void`

---

### tryParse()

> **tryParse**\<`T`\>(`cb`): `T` \| `undefined`

#### Type Parameters

##### T

`T` = `JsonEntity`\<`T`\>

#### Parameters

##### cb

(`entity`) => `T`

#### Returns

`T` \| `undefined`
