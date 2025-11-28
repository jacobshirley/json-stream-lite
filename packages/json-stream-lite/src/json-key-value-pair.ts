export type JsonPrimitive = string | number | boolean | null;
export class JsonKeyValuePair {
  key: string;
  value: JsonPrimitive;

  constructor(key: string, value: JsonPrimitive) {
    this.key = key;
    this.value = value;
  }
}
