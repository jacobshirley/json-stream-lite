[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonObject

# Class: JsonObject\<T\>

Represents a JSON object.
Provides streaming access to object members (key-value pairs).

## Extends

- [`JsonEntity`](JsonEntity.md)\<`T`\>

## Type Parameters

### T

`T` _extends_ `object` = `any`

The expected type of the object

## Constructors

### Constructor

> **new JsonObject**\<`T`\>(`buffer?`): `JsonObject`\<`T`\>

Creates a new JSON entity.

#### Parameters

##### buffer?

Optional ByteBuffer or ByteStream to read from

[`ByteStream`](../type-aliases/ByteStream.md) | `ByteBuffer`

#### Returns

`JsonObject`\<`T`\>

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

> **\[asyncIterator\]**(): `AsyncGenerator`\<[`JsonObjectMember`](../type-aliases/JsonObjectMember.md)\<`T`\>, `any`, `any`\>

Returns an async iterator for object members.
Enables use of for await...of loops on JsonObject.

#### Returns

`AsyncGenerator`\<[`JsonObjectMember`](../type-aliases/JsonObjectMember.md)\<`T`\>, `any`, `any`\>

---

### \[iterator\]()

> **\[iterator\]**(): `Generator`\<[`JsonObjectMember`](../type-aliases/JsonObjectMember.md)\<`T`\>, `any`, `any`\>

Returns an iterator for object members.
Enables use of for...of loops on JsonObject.

#### Returns

`Generator`\<[`JsonObjectMember`](../type-aliases/JsonObjectMember.md)\<`T`\>, `any`, `any`\>

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

...[`StreamInput`](../type-aliases/StreamInput.md)[]

One or more strings, numbers, arrays of numbers, or Uint8Arrays to add to the buffer

#### Returns

`void`

#### Inherited from

[`JsonEntity`](JsonEntity.md).[`feed`](JsonEntity.md#feed)

---

### members()

> **members**(): `Generator`\<[`JsonObjectMember`](../type-aliases/JsonObjectMember.md)\<`T`\>\>

Generator that yields object members as key-value pairs.
Allows for streaming/incremental processing of large objects.

#### Returns

`Generator`\<[`JsonObjectMember`](../type-aliases/JsonObjectMember.md)\<`T`\>\>

#### Yields

Object containing the key and value entities for each member

---

### membersAsync()

> **membersAsync**(): `AsyncGenerator`\<[`JsonObjectMember`](../type-aliases/JsonObjectMember.md)\<`T`\>\>

Async generator that yields object members from a stream.
Allows for asynchronous streaming/incremental processing.

#### Returns

`AsyncGenerator`\<[`JsonObjectMember`](../type-aliases/JsonObjectMember.md)\<`T`\>\>

#### Yields

Object containing the key and value entities for each member

---

### parse()

> `protected` **parse**(): `T`

Parses the entire object into a JavaScript object.

#### Returns

`T`

The parsed object

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

`T` = `JsonObject`\<`T`\>

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
