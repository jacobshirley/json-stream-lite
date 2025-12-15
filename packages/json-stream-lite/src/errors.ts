/**
 * Base error class for JSON Stream Lite errors.
 */
export class JsonStreamLiteError extends Error {}

/**
 * Error thrown when the buffer is empty and more input is needed.
 */
export class NoMoreTokensError extends JsonStreamLiteError {}

/**
 * Error thrown when the end of file has been reached and no more items are available.
 */
export class EofReachedError extends JsonStreamLiteError {}

/**
 * Error thrown when the buffer size limit is exceeded.
 */
export class BufferSizeExceededError extends JsonStreamLiteError {}
