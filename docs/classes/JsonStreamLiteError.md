[**json-stream-lite**](../README.md)

---

[json-stream-lite](../packages.md) / JsonStreamLiteError

# Class: JsonStreamLiteError

Base error class for JSON Stream Lite errors.

## Extends

- `Error`

## Extended by

- [`NoMoreTokensError`](NoMoreTokensError.md)
- [`EofReachedError`](EofReachedError.md)
- [`BufferSizeExceededError`](BufferSizeExceededError.md)

## Constructors

### Constructor

> **new JsonStreamLiteError**(`message?`): `JsonStreamLiteError`

#### Parameters

##### message?

`string`

#### Returns

`JsonStreamLiteError`

#### Inherited from

`Error.constructor`

### Constructor

> **new JsonStreamLiteError**(`message?`, `options?`): `JsonStreamLiteError`

#### Parameters

##### message?

`string`

##### options?

`ErrorOptions`

#### Returns

`JsonStreamLiteError`

#### Inherited from

`Error.constructor`
