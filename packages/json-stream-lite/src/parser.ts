/**
 * Abstract base class for parsers that transform input items to output items.
 * Provides a common interface for feeding input and generating output.
 *
 * @typeParam I - The input item type
 * @typeParam O - The output item type
 */
export abstract class Parser<I, O> {
  /**
   * Feeds input items to the parser.
   *
   * @param input - Input items to process
   */
  abstract feed(...input: I[]): void;

  /**
   * Generates output items from the fed input.
   *
   * @returns A generator yielding output items
   */
  abstract parseNext(): Generator<O>;
}
