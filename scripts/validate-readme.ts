/**
 * Extracts TypeScript code blocks from README.md and type-checks them.
 *
 * Each ```typescript block is written to a temp file and compiled with tsc --noEmit.
 * Import statements are hoisted to the top level, while the remaining code is
 * wrapped in an async IIFE so top-level await works.
 */

import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'
import os from 'os'

const ROOT = path.resolve(import.meta.dirname, '..')
const TSC = path.join(ROOT, 'node_modules/.bin/tsc')
const README = path.join(ROOT, 'README.md')

const content = await fs.readFile(README, 'utf-8')

// Extract all ```typescript ... ``` blocks with their line numbers
const blocks: { code: string; line: number; heading: string }[] = []
const lines = content.split('\n')
let currentHeading = ''
let inBlock = false
let blockStart = 0
let blockLines: string[] = []

for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('#')) {
        currentHeading = line.replace(/^#+\s*/, '')
    }
    if (line.trim() === '```typescript') {
        inBlock = true
        blockStart = i + 1
        blockLines = []
    } else if (inBlock && line.trim() === '```') {
        inBlock = false
        blocks.push({
            code: blockLines.join('\n'),
            line: blockStart + 1, // 1-indexed
            heading: currentHeading,
        })
    } else if (inBlock) {
        blockLines.push(line)
    }
}

if (blocks.length === 0) {
    console.log('No TypeScript code blocks found in README.md')
    process.exit(0)
}

// Create temp directory for validation files
const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'readme-validate-'))

// Find @types/node for fs/promises etc.
const nodeTypesDir = path.join(ROOT, 'node_modules/@types')

// Write a tsconfig for the temp files
const tsconfig = {
    compilerOptions: {
        target: 'ES2023',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        skipLibCheck: true,
        lib: ['DOM', 'ESNext'],
        noEmit: true,
        esModuleInterop: true,
        allowArbitraryExtensions: true,
        erasableSyntaxOnly: true,
        typeRoots: [nodeTypesDir],
        paths: {
            'json-stream-lite': [
                path.join(ROOT, 'packages/json-stream-lite/src/index.ts'),
            ],
            'json-stream-lite/*': [
                path.join(ROOT, 'packages/json-stream-lite/src/*.ts'),
            ],
        },
        types: ['node'],
    },
    include: ['*.ts'],
}

await fs.writeFile(
    path.join(tmpDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2),
)

/**
 * Split a code block into import lines (top-level) and body lines.
 * Import lines stay at the top; body is wrapped in an async IIFE.
 */
function buildFile(code: string, hasImports: boolean): string {
    if (!hasImports) {
        // No imports — add declare stubs for common variables used in
        // continuation snippets (variables from prior README context).
        return `
import type { JsonObject, JsonArray, JsonValue, JsonString, JsonNumber, JsonBoolean, JsonNull } from 'json-stream-lite'
import type { ByteStream, JsonKeyValuePair, JsonPrimitive, StreamInput } from 'json-stream-lite'
declare const parser: JsonObject
declare const arrayParser: JsonArray
declare const stream: ReadableStream<Uint8Array>
declare const json: string
declare const result: any
declare const item: JsonValue
declare const key: string
declare const value: JsonPrimitive
;(async () => {
${code}
})()
`
    }

    // Separate import lines from body
    const codeLines = code.split('\n')
    const imports: string[] = []
    const body: string[] = []
    let inImportBlock = false

    for (const line of codeLines) {
        if (/^\s*import\s/.test(line)) {
            imports.push(line)
            // Check if it's a multi-line import (has { but no })
            if (line.includes('{') && !line.includes('}')) {
                inImportBlock = true
            }
        } else if (inImportBlock) {
            imports.push(line)
            if (line.includes('}')) {
                inImportBlock = false
            }
        } else if (/^\s*declare\s/.test(line)) {
            // declare statements must be at the top level
            imports.push(line)
        } else {
            body.push(line)
        }
    }

    return `${imports.join('\n')}\n;(async () => {\n${body.join('\n')}\n})()\n`
}

let hasErrors = false
const results: {
    heading: string
    line: number
    ok: boolean
    error?: string
}[] = []

for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const hasImports = /^\s*import\s/m.test(block.code)
    const fileContent = buildFile(block.code, hasImports)

    const filename = `block-${i}.ts`
    await fs.writeFile(path.join(tmpDir, filename), fileContent)

    try {
        execSync(`${TSC} --noEmit -p tsconfig.json --pretty`, {
            cwd: tmpDir,
            stdio: 'pipe',
            encoding: 'utf-8',
        })
        results.push({ heading: block.heading, line: block.line, ok: true })
    } catch (e: any) {
        const output = (e.stdout || '') + (e.stderr || '')
        const fileErrors = output
            .split('\n')
            .filter((l: string) => l.includes(filename))
            .join('\n')
        results.push({
            heading: block.heading,
            line: block.line,
            ok: false,
            error: fileErrors || output.slice(0, 500),
        })
        hasErrors = true
    }

    // Clean up the file so other blocks don't interfere
    await fs.unlink(path.join(tmpDir, filename))
}

// Report
console.log(`\nREADME.md code block validation (${blocks.length} blocks):\n`)
for (const r of results) {
    const status = r.ok ? '\u2713' : '\u2717'
    console.log(`  ${status} Line ${r.line}: "${r.heading}"`)
    if (r.error) {
        for (const line of r.error.split('\n').slice(0, 5)) {
            console.log(`    ${line}`)
        }
    }
}

// Cleanup
await fs.rm(tmpDir, { recursive: true })

if (hasErrors) {
    console.log('\nSome README code blocks failed type-checking.')
    process.exit(1)
} else {
    console.log('\nAll README code blocks pass type-checking.')
}
