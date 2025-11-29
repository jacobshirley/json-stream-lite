import { IncrementalParser, NoMoreTokensError } from "./incremental-parser.js";
import { JsonKeyValuePair, JsonPrimitive } from "./json-key-value-pair.js";
import { bytesToNumber, bytesToString } from "./utils.js";

const BYTE_MAP = {
  QUOTATION: 34,
  n: 110,
  t: 116,
  f: 102,
  u: 117,
  zero: 48,
  nine: 57,
  minus: 45,
  dot: 46,
  plus: 43,
  e: 101,
  E: 69,
  space: 32,
  tab: 9,
  carriageReturn: 13,
  lineFeed: 10,
  leftBrace: 123,
  rightBrace: 125,
  leftSquare: 91,
  rightSquare: 93,
  comma: 44,
};

const isWhitespace = (byte: number | null): boolean => {
  return (
    byte === BYTE_MAP.space ||
    byte === BYTE_MAP.tab ||
    byte === BYTE_MAP.carriageReturn ||
    byte === BYTE_MAP.lineFeed
  );
};

const isDigit = (byte: number | null): boolean => {
  return byte !== null && byte >= BYTE_MAP.zero && byte <= BYTE_MAP.nine;
};

const isNumberStart = (byte: number | null): boolean => {
  return (
    byte === BYTE_MAP.minus ||
    (byte !== null && byte >= BYTE_MAP.zero && byte <= BYTE_MAP.nine)
  );
};

const isNumeric = (byte: number | null): boolean => {
  return (
    isDigit(byte) ||
    byte === BYTE_MAP.dot || // .
    byte === BYTE_MAP.e || // e
    byte === BYTE_MAP.E || // E
    byte === BYTE_MAP.minus || // -
    byte === BYTE_MAP.plus // +
  );
};

export class JsonKeyValueParser extends IncrementalParser<
  number,
  JsonKeyValuePair
> {
  private stack: {
    parent?: string;
    type?: "object" | "array";
    index: number;
  }[] = [];

  skipWhitespace(): void {
    while (isWhitespace(this.peek())) {
      this.next();
    }
  }

  nextPrimitive(): JsonPrimitive {
    this.skipWhitespace();

    while (
      this.peek() !== BYTE_MAP.QUOTATION &&
      this.peek() !== BYTE_MAP.n &&
      this.peek() !== BYTE_MAP.t &&
      this.peek() !== BYTE_MAP.f &&
      !isNumberStart(this.peek())
    ) {
      this.next();
    }

    let value: JsonPrimitive;
    const next = this.next();

    switch (next) {
      case BYTE_MAP.QUOTATION: {
        const valueStrBytes: number[] = [];
        while (this.peek() !== BYTE_MAP.QUOTATION) {
          valueStrBytes.push(this.next());
        }
        this.next(); // Skip closing quotation
        value = bytesToString(new Uint8Array(valueStrBytes));
        break;
      }
      case BYTE_MAP.n: {
        this.next(); // u
        this.next(); // l
        this.next(); // l
        value = null;
        break;
      }
      case BYTE_MAP.t: {
        this.next(); // r
        this.next(); // u
        this.next(); // e
        value = true;
        break;
      }
      case BYTE_MAP.f: {
        this.next(); // a
        this.next(); // l
        this.next(); // s
        this.next(); // e
        value = false;
        break;
      }
      default: {
        const numberBytes: number[] = [];
        numberBytes.push(next);
        while (true) {
          const peeked = this.peek()!;

          if (isNumeric(peeked)) {
            numberBytes.push(this.next());
          } else {
            break;
          }
        }

        value = bytesToNumber(new Uint8Array(numberBytes));
        break;
      }
    }

    return value;
  }

  nextKeyValue(): JsonKeyValuePair {
    this.skipWhitespace();
    const next = this.peek();

    if (!this.stack.length) {
      this.stack.push({
        index: 0,
        type: next === BYTE_MAP.leftBrace ? "object" : "array",
      });
    }

    const topOfStack = this.stack[this.stack.length - 1];

    if (next === BYTE_MAP.leftBrace) {
      const key = this.nextPrimitive();
      if (typeof key !== "string") {
        throw new Error("Expected string key in JSON object");
      }
      this.skipWhitespace();
      this.next(); // consume :
      this.skipWhitespace();
      this.stack.push({
        parent: topOfStack.parent ? `${topOfStack.parent}.${key}` : key,
        type: this.peek() === BYTE_MAP.leftBrace ? "object" : "array",
        index: 0,
      });
      return this.nextKeyValue();
    } else if (next === BYTE_MAP.leftSquare) {
      this.next(); // consume opening bracket
      this.skipWhitespace();
      this.stack.push({
        parent: topOfStack.parent ? `${topOfStack.parent}[0]` : "[0]",
        type: "array",
        index: 0,
      });
      return this.nextKeyValue();
    } else if (next === BYTE_MAP.comma) {
      this.next(); // consume ,

      if (topOfStack.type === "array") {
        const parent = topOfStack.parent;
        const index = ++topOfStack.index;

        this.stack.push({
          parent: parent ? `${parent}[${index}]` : `[${index}]`,
          type: "array",
          index: index,
        });

        return this.nextKeyValue();
      } else {
        const key = this.nextPrimitive();
        if (typeof key !== "string") {
          throw new Error("Expected string key in JSON object");
        }
        this.skipWhitespace();
        this.next(); // consume :
        this.stack.push({
          parent: topOfStack.parent ? `${topOfStack.parent}.${key}` : key,
          type: "object",
          index: 0,
        });

        return this.nextKeyValue();
      }
    } else if (next === BYTE_MAP.rightBrace || next === BYTE_MAP.rightSquare) {
      this.next();
      this.stack.pop();
      return this.nextKeyValue();
    } else {
      const value = this.nextPrimitive();
      this.stack.pop();
      return new JsonKeyValuePair(topOfStack.parent ?? "", value);
    }
  }

  protected parse(): JsonKeyValuePair {
    const stack = this.stack.map((frame) => ({ ...frame }));

    try {
      return this.nextKeyValue();
    } catch (e) {
      if (e instanceof NoMoreTokensError) {
        this.stack = stack;
      }
      throw e;
    }
  }
}
