import { ByteStream } from './types'
import { bytesToString } from './utils'

export class NoMoreTokensError extends Error {}
export class EofReachedError extends Error {}

export class ByteBuffer {
    /** Maximum size of the buffer before compaction */
    maxBufferSize: number = 1000
    /** Whether end of file has been signaled */
    eof: boolean = false
    /** Current position in the buffer */
    bufferIndex: number = 0
    /** Whether the buffer is locked against compaction */
    locked: boolean = false
    /** Current position in the input stream */
    protected inputOffset: number = 0
    /** Number of outputs generated */
    protected outputOffset: number = 0
    /** Buffer holding input items */
    protected buffer: number[] = []
    /** Optional async iterable input source */
    protected asyncIterable?: ByteStream

    constructor(asyncIterable?: ByteStream) {
        this.asyncIterable = asyncIterable
    }

    async readStream(): Promise<void> {
        if (!this.asyncIterable) {
            return
        }

        let i = 0
        while (i < this.maxBufferSize) {
            const nextByte =
                await this.asyncIterable[Symbol.asyncIterator]().next()
            if (nextByte.done) {
                this.eof = true
                break
            }

            this.feed(nextByte.value)
            i++
        }
    }

    get length(): number {
        return this.buffer.length
    }

    /**
     * Feeds input items into the parser buffer.
     *
     * @param input - Input items to add to the buffer
     */
    feed(...input: (number | number[] | Uint8Array)[]): void {
        for (const item of input) {
            if (Array.isArray(item)) {
                for (const subItem of item) {
                    this.buffer.push(subItem)
                }

                continue
            } else if (item instanceof Uint8Array) {
                for (const subItem of item) {
                    this.buffer.push(subItem)
                }

                continue
            }

            this.buffer.push(item)
        }
    }

    /**
     * Checks if end of file has been reached and buffer is exhausted.
     *
     * @returns True if no more input is available
     */
    atEof(): boolean {
        return this.eof && this.bufferIndex >= this.buffer.length
    }

    /**
     * Peeks at an item in the buffer without consuming it.
     *
     * @param ahead - Number of positions to look ahead (default: 0)
     * @returns The item at the peek position, or null if at EOF
     * @throws NoMoreTokensError if more input is needed and EOF not signaled
     */
    peek(ahead: number = 0): number | null {
        const index = this.bufferIndex + ahead
        if (index >= this.buffer.length) {
            if (!this.eof) {
                throw new NoMoreTokensError('Buffer empty')
            }
            return null
        }
        return this.buffer[index]
    }

    /**
     * Consumes and returns the next item from the buffer.
     *
     * @returns The next item
     * @throws NoMoreTokensError if more input is needed and EOF not signaled
     * @throws EofReachedError if at EOF and no more items available
     */
    next(): number {
        if (this.bufferIndex >= this.buffer.length) {
            if (!this.eof) {
                throw new NoMoreTokensError('No more items available')
            }
            throw new EofReachedError('End of file reached')
        }
        this.inputOffset++
        return this.buffer[this.bufferIndex++]
    }

    /**
     * Consumes and validates the next item against an expected type or value.
     *
     * @typeParam T - The expected item type
     * @param itemType - Constructor or value to match against
     * @returns The consumed item cast to the expected type
     * @throws Error if the item doesn't match the expected type/value
     */
    expect<T extends number>(itemType: T): T {
        const item = this.next()
        if (item !== itemType) {
            throw new Error(`Expected ${itemType} but got ${item}`)
        }
        return itemType
    }

    /**
     * Compacts the buffer by removing consumed items
     */
    compact(): void {
        if (!this.locked && this.bufferIndex > 0) {
            this.buffer = this.buffer.slice(this.bufferIndex)
            this.bufferIndex = 0
        }
    }

    /**
     * Override to customize when to compact the buffer
     * By default, compacts when more than 1000 items have been consumed
     *
     * @returns boolean indicating whether to compact the buffer
     */
    canCompact(): boolean {
        return this.bufferIndex > this.maxBufferSize
    }

    resetOnFail<T>(tryFn: () => T, onFail?: (e: Error) => void): T | undefined {
        const bufferIndex = this.bufferIndex
        try {
            const result = tryFn()
            if (this.canCompact()) {
                this.compact()
            }
            return result
        } catch (e) {
            if (e instanceof NoMoreTokensError) {
                this.bufferIndex = bufferIndex
                onFail?.(e)
            } else {
                throw e
            }
        }

        return undefined
    }

    toString(): string {
        return [
            'ByteBuffer {',
            `  buffer: [${this.buffer.join(', ')}],`,
            `  bufferIndex: ${this.bufferIndex},`,
            `  inputOffset: ${this.inputOffset},`,
            `  outputOffset: ${this.outputOffset},`,
            `  eof: ${this.eof},`,
            `  as string: ${bytesToString(new Uint8Array(this.buffer))}`,
            '  as string from bufferIndex: ' +
                bytesToString(
                    new Uint8Array(this.buffer.slice(this.bufferIndex)),
                ),
            '}',
        ].join('\n')
    }
}
