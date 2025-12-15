// Streaming JSON strings (advanced usage)
/**
 * Example demonstrating streaming JSON string parsing using json-stream-lite.
 */

import { JsonString } from 'json-stream-lite'

const jsonString = '"Streamed JSON String Example"'

const jsonObject = new JsonString(
    (async function* () {
        for (const chunk of new TextEncoder().encode(jsonString)) {
            yield chunk
        }
    })(),
)

for await (const streamChunk of jsonObject.streamAsync(2)) {
    console.log('Received string chunk:', streamChunk)
}

/**
 * Expected Output:
 * Received string chunk: St
 * Received string chunk: re
 * Received string chunk: am
 * Received string chunk: ed
 * Received string chunk:  J
 * Received string chunk: JS
 * Received string chunk: ON
 * Received string chunk: St
 * Received string chunk: ri
 * Received string chunk: ng
 * Received string chunk:  E
 * Received string chunk: xa
 * Received string chunk: mp
 * Received string chunk: le
 */
