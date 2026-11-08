/**
 * Base error class for YAML Stream Lite errors.
 */
export class YamlStreamLiteError extends Error {}

/**
 * Error thrown when the buffer is empty and more input is needed.
 */
export class NoMoreTokensError extends YamlStreamLiteError {}

/**
 * Error thrown when the end of file has been reached and no more items are available.
 */
export class EofReachedError extends YamlStreamLiteError {}

/**
 * Error thrown when the buffer size limit is exceeded.
 */
export class BufferSizeExceededError extends YamlStreamLiteError {}
