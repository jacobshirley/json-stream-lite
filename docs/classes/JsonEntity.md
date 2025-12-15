[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonEntity

# Abstract Class: JsonEntity\<T\>

Abstract base class for all JSON entities.
Provides common functionality for parsing, reading, and consuming JSON values.

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

The type of value this entity represents

## Constructors

### Constructor

> **new JsonEntity**\<`T`\>(`buffer?`): `JsonEntity`\<`T`\>

Creates a new JSON entity.

#### Parameters

##### buffer?

Optional ByteBuffer or ByteStream to read from

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

---

### bufferLength

#### Get Signature

> **get** **bufferLength**(): `number`

Gets the current length of the buffer.

##### Returns

`number`

The number of bytes in the buffer

---

### entityType

#### Get Signature

> **get** **entityType**(): `string`

Gets the type name of this entity.

##### Returns

`string`

The constructor name of this entity

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

## Methods

### consume()

> **consume**(): `void`

Consumes the entity by reading it if not already consumed.

#### Returns

`void`

---

### consumeAsync()

> **consumeAsync**(): `Promise`\<`void`\>

Asynchronously consumes the entity by reading it if not already consumed.

#### Returns

`Promise`\<`void`\>

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

---

### parse()

> `abstract` `protected` **parse**(): `T`

Abstract method that subclasses must implement to parse their specific type.

#### Returns

`T`

The parsed value of type T

---

### read()

> **read**(): `T`

Reads and parses the entity, consuming it in the process.

#### Returns

`T`

The parsed value

#### Throws

Error if the entity has already been consumed

---

### readAsync()

> **readAsync**(): `Promise`\<`T`\>

Asynchronously reads and parses the entity from a stream.

#### Returns

`Promise`\<`T`\>

A promise that resolves to the parsed value

#### Throws

Error if the entity has already been consumed

---

### skipWhitespace()

> `protected` **skipWhitespace**(): `void`

Skips whitespace characters in the buffer.

#### Returns

`void`

---

### tryParse()

> **tryParse**\<`T`\>(`cb`): `T` \| `undefined`

Attempts to parse by executing a callback, reverting buffer state on failure.

#### Type Parameters

##### T

`T` = `JsonEntity`\<`T`\>

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
