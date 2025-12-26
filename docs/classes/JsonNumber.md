[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonNumber

# Class: JsonNumber\<T\>

Represents a JSON number value.
Parses numeric data including integers, floats, and scientific notation.

## Extends

- [`JsonEntity`](JsonEntity.md)\<`T`\>

## Type Parameters

### T

`T` _extends_ `number` = `number`

The specific number type (defaults to number)

## Constructors

### Constructor

> **new JsonNumber**\<`T`\>(`buffer?`): `JsonNumber`\<`T`\>

Creates a new JSON entity.

#### Parameters

##### buffer?

Optional ByteBuffer or ByteStream to read from

[`ByteStream`](../type-aliases/ByteStream.md) | `ByteBuffer`

#### Returns

`JsonNumber`\<`T`\>

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

...[`StreamInput`](../type-aliases/StreamInput.md)[]

One or more strings, numbers, arrays of numbers, or Uint8Arrays to add to the buffer

#### Returns

`void`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`feed`](JsonEntity.md#feed)

---

### parse()

> `protected` **parse**(): `T`

Parses a JSON number from the buffer.

#### Returns

`T`

The parsed number value

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

### tryParse()

> **tryParse**\<`T`\>(`cb`): `T` \| `undefined`

Attempts to parse by executing a callback, reverting buffer state on failure.

#### Type Parameters

##### T

`T` = `JsonNumber`\<`T`\>

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

---

### stringify()

> `static` **stringify**(`value`, `replacer?`, `indent?`, `options?`): `Generator`\<`string`\>

Serializes a value into a JSON string using json-stream-lite.
See `jsonStreamStringify` for more details.

#### Parameters

##### value

`unknown`

##### replacer?

`any`

##### indent?

`number` = `0`

##### options?

[`JsonStreamStringifyOptions`](../type-aliases/JsonStreamStringifyOptions.md)

#### Returns

`Generator`\<`string`\>

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`stringify`](JsonEntity.md#stringify)

---

### stringifyBytes()

> `static` **stringifyBytes**(`value`, `replacer?`, `indent?`, `options?`): `Generator`\<`Uint8Array`\<`ArrayBufferLike`\>\>

Serializes a value into JSON as Uint8Array byte chunks using json-stream-lite.
See `jsonStreamStringifyBytes` for more details.

#### Parameters

##### value

`unknown`

##### replacer?

`any`

##### indent?

`number` = `0`

##### options?

[`JsonStreamStringifyOptions`](../type-aliases/JsonStreamStringifyOptions.md)

#### Returns

`Generator`\<`Uint8Array`\<`ArrayBufferLike`\>\>

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`stringifyBytes`](JsonEntity.md#stringifybytes)
