const textEncoder = new TextEncoder()
// ignoreBOM keeps a leading U+FEFF in decoded text instead of dropping it.
const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true })

/**
 * Converts a string to a Uint8Array of UTF-8 encoded bytes.
 *
 * @param str - The string to convert
 * @returns A Uint8Array containing the UTF-8 encoded bytes
 */
export function stringToBytes(str: string): Uint8Array {
    return textEncoder.encode(str)
}

/**
 * Converts a Uint8Array of UTF-8 encoded bytes to a string.
 *
 * @param bytes - The Uint8Array to decode
 * @returns The decoded string
 */
export function bytesToString(bytes: Uint8Array): string {
    return textDecoder.decode(bytes)
}

/**
 * Converts a Uint8Array of UTF-8 encoded bytes to a number.
 *
 * @param bytes - The Uint8Array representing a numeric string
 * @returns The parsed number value
 */
export function bytesToNumber(bytes: Uint8Array): number {
    const str = bytesToString(bytes)
    return Number(str)
}
