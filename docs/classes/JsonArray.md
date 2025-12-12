[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonArray

# Class: JsonArray\<T\>

Represents a JSON array.
Provides streaming access to array items.

## Extends

- [`JsonEntity`](JsonEntity.md)\<`T`[]\>

## Type Parameters

### T

`T` = `unknown`

The expected type of array elements

## Constructors

### Constructor

> **new JsonArray**\<`T`\>(`buffer?`): `JsonArray`\<`T`\>

Creates a new JSON entity.

#### Parameters

##### buffer?

Optional ByteBuffer or ByteStream to read from

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

Gets the current length of the buffer.

##### Returns

`number`

The number of bytes in the buffer

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`bufferLength`](JsonEntity.md#bufferlength)

---

### entityType

#### Get Signature

> **get** **entityType**(): `string`

Gets the type name of this entity.

##### Returns

`string`

The constructor name of this entity

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`entityType`](JsonEntity.md#entitytype)

---

### maxBufferSize

#### Set Signature

> **set** **maxBufferSize**(`size`): `void`

Sets the maximum buffer size before compaction occurs.

##### Parameters

###### size

`number`

The maximum buffer size in bytes

##### Returns

`void`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`maxBufferSize`](JsonEntity.md#maxbuffersize)

## Methods

### \[asyncIterator\]()

> **\[asyncIterator\]**(): `AsyncGenerator`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>, `any`, `any`\>

Returns an async iterator for array items.
Enables use of for await...of loops on JsonArray.

#### Returns

`AsyncGenerator`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>, `any`, `any`\>

---

### \[iterator\]()

> **\[iterator\]**(): `Generator`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>, `any`, `any`\>

Returns an iterator for array items.
Enables use of for...of loops on JsonArray.

#### Returns

`Generator`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>, `any`, `any`\>

---

### consume()

> **consume**(): `void`

Consumes the entity by reading it if not already consumed.

#### Returns

`void`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`consume`](JsonEntity.md#consume)

---

### consumeAsync()

> **consumeAsync**(): `Promise`\<`void`\>

Asynchronously consumes the entity by reading it if not already consumed.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`consumeAsync`](JsonEntity.md#consumeasync)

---

### feed()

> **feed**(...`input`): `void`

Feeds input data into the buffer.

#### Parameters

##### input

...[`JsonStreamInput`](../type-aliases/JsonStreamInput.md)[]

One or more strings, numbers, arrays of numbers, or Uint8Arrays to add to the buffer

#### Returns

`void`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`feed`](JsonEntity.md#feed)

---

### items()

> **items**(): `Generator`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>\>

Generator that yields array items.
Allows for streaming/incremental processing of large arrays.

#### Returns

`Generator`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>\>

#### Yields

Each item entity in the array

---

### itemsAsync()

> **itemsAsync**(): `AsyncGenerator`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>\>

Async generator that yields array items from a stream.
Allows for asynchronous streaming/incremental processing.

#### Returns

`AsyncGenerator`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>\>

#### Yields

Each item entity in the array

---

### parse()

> `protected` **parse**(): `T`[]

Parses the entire array into a JavaScript array.

#### Returns

`T`[]

The parsed array

#### Overrides

[`JsonEntity`](JsonEntity.md).[`parse`](JsonEntity.md#parse)

---

### read()

> **read**(): `T`[]

Reads and parses the entity, consuming it in the process.

#### Returns

`T`[]

The parsed value

#### Throws

Error if the entity has already been consumed

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`read`](JsonEntity.md#read)

---

### readAsync()

> **readAsync**(): `Promise`\<`T`[]\>

Asynchronously reads and parses the entity from a stream.

#### Returns

`Promise`\<`T`[]\>

A promise that resolves to the parsed value

#### Throws

Error if the entity has already been consumed

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`readAsync`](JsonEntity.md#readasync)

---

### skipWhitespace()

> `protected` **skipWhitespace**(): `void`

Skips whitespace characters in the buffer.

#### Returns

`void`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`skipWhitespace`](JsonEntity.md#skipwhitespace)

---

### tryParse()

> **tryParse**\<`T`\>(`cb`): `T` \| `undefined`

Attempts to parse by executing a callback, reverting buffer state on failure.

#### Type Parameters

##### T

`T` = `JsonArray`\<`T`\>

The return type of the callback

#### Parameters

##### cb

(`entity`) => `T`

The callback function to execute

#### Returns

`T` \| `undefined`

The result of the callback, or undefined if parsing needs more data

#### Throws

Error if the entity has already been consumed

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`tryParse`](JsonEntity.md#tryparse)
