# yaml-stream-lite

A lightweight, memory-efficient, zero-dependency streaming YAML parser and stringifier written in TypeScript. Works in Node.js and browsers.

Part of the [json-stream-lite](https://github.com/jacobshirley/json-stream-lite) monorepo, and shares its streaming design: feed bytes in as they arrive and pull values out incrementally.

## Installation

```bash
npm install yaml-stream-lite
```

## Parsing

### Parse a complete document

```typescript
import { YamlDocument } from 'yaml-stream-lite'

const doc = new YamlDocument()
doc.feed('name: Alice\ntags:\n  - admin\n  - dev\n')
doc.eof = true

console.log(doc.read()) // { name: 'Alice', tags: ['admin', 'dev'] }
```

### Multiple documents

```typescript
import { YamlStream } from 'yaml-stream-lite'

const stream = new YamlStream()
stream.feed('a: 1\n---\nb: 2\n')
stream.eof = true

for (const doc of stream) {
    console.log(doc.read()) // { a: 1 }, then { b: 2 }
}
```

### Stream mapping members and sequence items

Walk a large mapping or sequence one entry at a time instead of building the whole value:

```typescript
import { YamlMapping, YamlSequence } from 'yaml-stream-lite'

const mapping = new YamlMapping()
mapping.feed('name: Alice\nage: 30\n')
mapping.eof = true

for (const { key, value } of mapping.members()) {
    console.log(key.read(), value.readValue())
}

const sequence = new YamlSequence()
sequence.feed('- 1\n- 2\n- 3\n')
sequence.eof = true

for (const item of sequence.items()) {
    console.log(item.readValue())
}
```

### Async streaming

Pass any async iterable or `ReadableStream` of strings or bytes to the constructor, then use the async variants:

```typescript
import { createReadStream } from 'node:fs'
import { YamlSequence } from 'yaml-stream-lite'

const sequence = new YamlSequence(createReadStream('large.yaml'))

for await (const item of sequence.itemsAsync()) {
    console.log(await item.readValueAsync())
}
```

### Key-value extraction

Flatten nested YAML into dotted key paths:

```typescript
import { yamlKeyValueParser } from 'yaml-stream-lite'

for (const [key, value] of yamlKeyValueParser(
    'user:\n  name: Alice\n  roles: [admin]\n',
)) {
    console.log(key, value) // 'user.name' 'Alice', then 'user.roles[0]' 'admin'
}
```

`yamlKeyValueParserAsync` does the same for async iterables and `ReadableStream`s.

## Stringifying

```typescript
import { yamlStreamStringify } from 'yaml-stream-lite'

const data = {
    name: 'Alice',
    tags: ['admin', 'dev'],
    bio: 'line one\nline two\n',
}

let yaml = ''
for (const chunk of yamlStreamStringify(data)) {
    yaml += chunk
}
// name: Alice
// tags:
//   - admin
//   - dev
// bio: |
//   line one
//   line two
```

Options:

| Option               | Default   | Description                                                            |
| -------------------- | --------- | ---------------------------------------------------------------------- |
| `indent`             | `2`       | Spaces per indent level                                                |
| `flowLevel`          | `-1`      | Depth from which collections use flow style (`{a: 1}`); `-1` for never |
| `sortKeys`           | `false`   | Sort mapping keys                                                      |
| `defaultScalarStyle` | `'plain'` | Quote style for strings that need quoting                              |

`yamlStreamStringifyBytes` yields `Uint8Array` chunks. `yamlStreamStringifyAsync` and `yamlStreamStringifyBytesAsync` take a (possibly async) iterable and write each item as a separate document, separated by `---`.

Values are converted like `JSON.stringify`: `toJSON()` is applied, and `undefined` and function values are skipped in mappings and written as `null` in sequences.

## Supported YAML

- Block and flow mappings and sequences
- Plain, single-quoted, double-quoted (with escapes) and block (`|`, `>`) scalars
- `null`, booleans, integers (including hex and octal), floats, `.inf` and `.nan`
- Comments
- Multiple documents (`---` and `...`)

Not supported: anchors and aliases (`&`, `*`), tags (`!!str`), complex (`?`) keys, and directives (`%YAML`).

## License

MIT
