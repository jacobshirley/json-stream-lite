/**
 * Converts a string to a Uint8Array using UTF-8 encoding.
 *
 * @param str - The string to convert
 * @returns A Uint8Array containing the UTF-8 encoded bytes
 *
 * @example
 * ```typescript
 * const bytes = stringToBytes('hello')
 * console.log(bytes) // Uint8Array([104, 101, 108, 108, 111])
 * ```
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Converts a Uint8Array to a string using UTF-8 decoding.
 *
 * @param bytes - The byte array to convert
 * @returns The decoded string
 *
 * @example
 * ```typescript
 * const str = bytesToString(new Uint8Array([104, 101, 108, 108, 111]))
 * console.log(str) // 'hello'
 * ```
 */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Converts a Uint8Array representing a number string to a JavaScript number.
 *
 * @param bytes - The byte array containing the number string
 * @returns The parsed number
 *
 * @example
 * ```typescript
 * const num = bytesToNumber(new Uint8Array([49, 50, 51])) // "123"
 * console.log(num) // 123
 * ```
 */
export function bytesToNumber(bytes: Uint8Array): number {
  const str = bytesToString(bytes);
  return Number(str);
}
