export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function bytesToNumber(bytes: Uint8Array): number {
  const str = bytesToString(bytes);
  return Number(str);
}
