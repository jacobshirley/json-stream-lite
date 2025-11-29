import { Parser } from "./parser";

/**
 * Error thrown when the parser needs more input to continue parsing.
 */
export class NoMoreTokensError extends Error {}

/**
 * Error thrown when the end of file has been reached and no more input is available.
 */
export class EofReachedError extends Error {}

/**
 * Abstract base class for incremental parsers that can process input as it becomes available.
 * Supports buffering, lookahead, and backtracking for complex parsing scenarios.
 *
 * @typeParam I - The input item type
 * @typeParam O - The output item type
 */
export abstract class IncrementalParser<I, O> extends Parser<I, O> {
  /** Current position in the input stream */
  protected inputOffset: number = 0;
  /** Number of outputs generated */
  protected outputOffset: number = 0;

  /** Buffer holding input items */
  protected buffer: I[] = [];
  /** Current position in the buffer */
  protected bufferIndex: number = 0;

  /** Whether end of file has been signaled */
  eof: boolean = false;

  /**
   * Feeds input items into the parser buffer.
   *
   * @param input - Input items to add to the buffer
   */
  feed(...input: (I | I[])[]): void {
    for (const item of input) {
      if (Array.isArray(item)) {
        for (const subItem of item) {
          this.buffer.push(subItem);
        }

        continue;
      }

      this.buffer.push(item);
    }
  }

  /**
   * Checks if end of file has been reached and buffer is exhausted.
   *
   * @returns True if no more input is available
   */
  protected atEof(): boolean {
    return this.eof && this.bufferIndex >= this.buffer.length;
  }

  /**
   * Peeks at an item in the buffer without consuming it.
   *
   * @param ahead - Number of positions to look ahead (default: 0)
   * @returns The item at the peek position, or null if at EOF
   * @throws NoMoreTokensError if more input is needed and EOF not signaled
   */
  protected peek(ahead: number = 0): I | null {
    const index = this.bufferIndex + ahead;
    if (index >= this.buffer.length) {
      if (!this.eof) {
        throw new NoMoreTokensError("No more items available");
      }
      return null;
    }
    return this.buffer[index];
  }

  /**
   * Consumes and returns the next item from the buffer.
   *
   * @returns The next item
   * @throws NoMoreTokensError if more input is needed and EOF not signaled
   * @throws EofReachedError if at EOF and no more items available
   */
  protected next(): I {
    if (this.bufferIndex >= this.buffer.length) {
      if (!this.eof) {
        throw new NoMoreTokensError("No more items available");
      }
      throw new EofReachedError("End of file reached");
    }
    this.inputOffset++;
    return this.buffer[this.bufferIndex++];
  }

  private expectValue<T extends I>(
    value: I,
    itemType: (new (...args: any[]) => T) | T,
  ): T {
    if (typeof itemType === "function") {
      if (!(value instanceof itemType)) {
        throw new Error(
          `[offset: ${this.inputOffset}] Expected ${itemType.name} but got ${value}`,
        );
      }
      return value as T;
    }

    if (value !== itemType) {
      const type =
        typeof value === "object" ? (value?.constructor.name ?? value) : value;

      throw new Error(
        `[offset: ${this.inputOffset}] Expected ${itemType} but got ${type}`,
      );
    }
    return value as T;
  }

  /**
   * Consumes and validates the next item against an expected type or value.
   *
   * @typeParam T - The expected item type
   * @param itemType - Constructor or value to match against
   * @returns The consumed item cast to the expected type
   * @throws Error if the item doesn't match the expected type/value
   */
  protected expect<T extends I>(itemType: (new (...args: any[]) => T) | T): T {
    const item = this.next();
    return this.expectValue(item, itemType);
  }

  /**
   * Tries multiple parsing functions and returns the first successful result.
   * Automatically backtracks on failure.
   *
   * @param fn - Array of parsing functions to try
   * @returns The result from the first successful parsing function
   * @throws NoMoreTokensError if any function needs more input
   * @throws Error if all parsing functions fail
   */
  protected oneOf(...fn: (() => O)[]): O {
    for (const f of fn) {
      const savedOffset = this.inputOffset;
      const savedIndex = this.bufferIndex;

      try {
        return f.bind(this)();
      } catch (err) {
        if (err instanceof NoMoreTokensError) {
          throw err;
        }
        this.inputOffset = savedOffset;
        this.bufferIndex = savedIndex;
      }
    }

    throw new Error("No parsing function succeeded");
  }

  /**
   * Compacts the buffer by removing consumed items
   */
  protected compact(): void {
    if (this.bufferIndex > 0) {
      this.buffer = this.buffer.slice(this.bufferIndex);
      this.bufferIndex = 0;
    }
  }

  /**
   * Override to customize when to compact the buffer
   * By default, compacts when more than 1000 items have been consumed
   *
   * @returns boolean indicating whether to compact the buffer
   */
  protected canCompact(): boolean {
    return this.bufferIndex > 1000;
  }

  /**
   * Generates parsed output items from the buffer.
   * Handles backtracking when more input is needed.
   *
   * @returns A generator yielding parsed output items
   */
  *parseNext(): Generator<O> {
    while (!this.atEof()) {
      const savedIndex = this.bufferIndex;

      try {
        yield this.parse();
        this.outputOffset++;

        if (this.canCompact()) {
          this.compact();
        }
      } catch (err) {
        if (!(err instanceof NoMoreTokensError)) {
          throw err;
        }
        this.bufferIndex = savedIndex;
        break;
      }
    }
  }

  /**
   * Abstract method to parse the next output item from the buffer.
   * Subclasses must implement this to define parsing logic.
   *
   * @returns The parsed output item
   */
  protected abstract parse(): O;
}
