[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonString

# Class: JsonString\<T\>

Represents a JSON string value.
Parses and stores string data from the buffer.

## Extends

- [`JsonEntity`](JsonEntity.md)\<`T`\>

## Type Parameters

### T

`T` _extends_ `string` = `string`

The specific string type (defaults to string)

## Constructors

### Constructor

> **new JsonString**\<`T`\>(`buffer?`): `JsonString`\<`T`\>

Creates a new JSON entity.

#### Parameters

##### buffer?

Optional ByteBuffer or ByteStream to read from

[`ByteStream`](../type-aliases/ByteStream.md) | `ByteBuffer`

#### Returns

`JsonString`\<`T`\>

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

### allowBufferToBeExceeded

#### Set Signature

> **set** **allowBufferToBeExceeded**(`value`): `void`

Sets whether to allow exceeding the buffer size temporarily. Default is true.

##### Parameters

###### value

`boolean`

True to allow exceeding the buffer size, false to enforce the limit

##### Returns

`void`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`allowBufferToBeExceeded`](JsonEntity.md#allowbuffertobeexceeded)

---

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

Sets the maximum buffer size before compaction occurs. Defaults to 100 KB.
NOTE: The buffer size may be exceeded temporarily during reads. For example, if a large string is read that exceeds the max size.
If this is not desired, set `allowBufferToBeExceeded` to false (default is true).

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

> **\[asyncIterator\]**(): `AsyncGenerator`\<`string`, `any`, `any`\>

#### Returns

`AsyncGenerator`\<`string`, `any`, `any`\>

---

### \[iterator\]()

> **\[iterator\]**(): `Generator`\<`string`, `any`, `any`\>

#### Returns

`Generator`\<`string`, `any`, `any`\>

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

### parse()

> `protected` **parse**(): `T`

Parses a JSON string from the buffer.

#### Returns

`T`

The parsed string value

#### Overrides

[`JsonEntity`](JsonEntity.md).[`parse`](JsonEntity.md#parse)

---

### read()

> **read**(): `T`

Reads and parses the entity, consuming it in the process.

#### Returns

`T`

The parsed value

#### Throws

Error if the entity has already been consumed

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`read`](JsonEntity.md#read)

---

### readAsync()

> **readAsync**(): `Promise`\<`T`\>

Asynchronously reads and parses the entity from a stream.

#### Returns

`Promise`\<`T`\>

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

### stream()

> **stream**(`chunkSize`): `Generator`\<`string`\>

#### Parameters

##### chunkSize

`number` = `1024`

#### Returns

`Generator`\<`string`\>

---

### streamAsync()

> **streamAsync**(`chunkSize`): `AsyncGenerator`\<`string`\>

#### Parameters

##### chunkSize

`number` = `1024`

#### Returns

`AsyncGenerator`\<`string`\>

---

### streamBytes()

> **streamBytes**(`chunkSize`): `Generator`\<`Uint8Array`\<`ArrayBufferLike`\>\>

#### Parameters

##### chunkSize

`number` = `1024`

#### Returns

`Generator`\<`Uint8Array`\<`ArrayBufferLike`\>\>

---

### streamBytesAsync()

> **streamBytesAsync**(`chunkSize`): `AsyncGenerator`\<`Uint8Array`\<`ArrayBufferLike`\>\>

#### Parameters

##### chunkSize

`number` = `1024`

#### Returns

`AsyncGenerator`\<`Uint8Array`\<`ArrayBufferLike`\>\>

---

### tryParse()

> **tryParse**\<`T`\>(`cb`): `T` \| `undefined`

Attempts to parse by executing a callback, reverting buffer state on failure.

#### Type Parameters

##### T

`T` = `JsonString`\<`T`\>

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
