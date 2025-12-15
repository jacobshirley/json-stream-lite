[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonValue

# Class: JsonValue\<T, K\>

Represents any JSON value (primitive, object, or array).
Provides lazy evaluation and type detection for JSON values.

## Extends

- [`JsonEntity`](JsonEntity.md)\<[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>\>

## Type Parameters

### T

`T` = `any`

The expected type of the value

### K

`K` _extends_ `string` = `string`

The key type for object properties (defaults to string)

## Constructors

### Constructor

> **new JsonValue**\<`T`, `K`\>(`buffer?`, `key?`): `JsonValue`\<`T`, `K`\>

Creates a new JsonValue entity.

#### Parameters

##### buffer?

Optional ByteBuffer or ByteStream to read from

[`ByteStream`](../type-aliases/ByteStream.md) | `ByteBuffer`

##### key?

[`JsonString`](JsonString.md)\<`K`\>

Optional key associated with this value (for object members)

#### Returns

`JsonValue`\<`T`, `K`\>

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

Consumes the value, ensuring it is fully read.

#### Returns

`void`

#### Overrides

[`JsonEntity`](JsonEntity.md).[`consume`](JsonEntity.md#consume)

---

### consumeAsync()

> **consumeAsync**(): `Promise`\<`void`\>

Asynchronously consumes the value, ensuring it is fully read.

#### Returns

`Promise`\<`void`\>

#### Overrides

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

> `protected` **parse**(): [`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>

Parses the value, determining its type and creating the appropriate entity.

#### Returns

[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>

The parsed JSON entity (primitive, object, or array)

#### Overrides

[`JsonEntity`](JsonEntity.md).[`parse`](JsonEntity.md#parse)

---

### read()

> **read**(): [`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>

Reads the value entity without reading its contents.
Allows for lazy evaluation of the actual value.

#### Returns

[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>

The JSON entity representing this value

#### Overrides

[`JsonEntity`](JsonEntity.md).[`read`](JsonEntity.md#read)

---

### readAsync()

> **readAsync**(): `Promise`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>\>

Asynchronously reads the value entity from a stream.

#### Returns

`Promise`\<[`JsonValueType`](../type-aliases/JsonValueType.md)\<`T`\>\>

A promise that resolves to the JSON entity representing this value

#### Overrides

[`JsonEntity`](JsonEntity.md).[`readAsync`](JsonEntity.md#readasync)

---

### readValue()

> **readValue**(): `T`

Reads and fully evaluates the value.

#### Returns

`T`

The actual JavaScript value (string, number, boolean, null, object, or array)

---

### readValueAsync()

> **readValueAsync**(): `Promise`\<`T`\>

Asynchronously reads and fully evaluates the value.

#### Returns

`Promise`\<`T`\>

A promise that resolves to the actual JavaScript value

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

`T` = `JsonValue`\<`T`, `K`\>

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
