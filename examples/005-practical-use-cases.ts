// Practical use cases example

import { jsonKeyValueParser, JsonKeyValuePair } from "json-stream-lite";

/**
 * This example demonstrates practical use cases for json-stream-lite
 * in real-world scenarios like configuration parsing, data filtering,
 * and transformation pipelines.
 */

// Example 1: Configuration file parsing
console.log("Example 1: Configuration Parsing");
console.log("=================================");

const configJson = `{
    "app": {
        "name": "MyApp",
        "version": "1.0.0",
        "debug": false
    },
    "database": {
        "host": "localhost",
        "port": 5432
    }
}`;

console.log("Parsing configuration file:\n");

// Build a flat configuration map
const config = new Map<string, string | number | boolean | null>();
for (const pair of jsonKeyValueParser(configJson)) {
  config.set(pair.key, pair.value);
  console.log(`  ${pair.key} = ${JSON.stringify(pair.value)}`);
}

console.log(`\nConfiguration entries: ${config.size}`);

// Access specific values
console.log("\nAccessing specific values:");
console.log(`  App name: ${config.get("app.name")}`);
console.log(`  Database host: ${config.get("database.host")}`);
console.log(`  Debug mode: ${config.get("app.debug")}`);

// Example 2: Path-based value extraction
console.log("\n\nExample 2: Path-Based Value Extraction");
console.log("========================================");

function getValueAtPath(json: string, targetPath: string): unknown | undefined {
  for (const pair of jsonKeyValueParser(json)) {
    if (pair.key === targetPath) {
      return pair.value;
    }
  }
  return undefined;
}

const apiResponse = `{
    "response": {
        "data": {
            "user": {
                "email": "user@example.com",
                "name": "John"
            }
        }
    }
}`;

console.log('Extracting value at path "response.data.user.email":');
const email = getValueAtPath(apiResponse, "response.data.user.email");
console.log(`  Result: ${email}`);

console.log('\nExtracting value at path "response.data.user.name":');
const name = getValueAtPath(apiResponse, "response.data.user.name");
console.log(`  Result: ${name}`);

// Example 3: Streaming data validation
console.log("\n\nExample 3: Streaming Data Validation");
console.log("======================================");

const dataToValidate = `{
    "name": "Product",
    "price": 49.99,
    "stock": 100,
    "category": "electronics"
}`;

console.log("Validating product data:\n");

interface ValidationRule {
  field: string;
  validate: (value: unknown) => boolean;
  message: string;
}

const rules: ValidationRule[] = [
  {
    field: "name",
    validate: (v) => typeof v === "string" && (v as string).length > 0,
    message: "Name must be a non-empty string",
  },
  {
    field: "price",
    validate: (v) => typeof v === "number" && (v as number) > 0,
    message: "Price must be a positive number",
  },
  {
    field: "stock",
    validate: (v) => typeof v === "number" && Number.isInteger(v as number),
    message: "Stock must be an integer",
  },
];

const errors: string[] = [];
const validated: Record<string, unknown> = {};

for (const pair of jsonKeyValueParser(dataToValidate)) {
  const rule = rules.find((r) => r.field === pair.key);
  if (rule) {
    if (rule.validate(pair.value)) {
      console.log(`  ✓ ${pair.key}: ${JSON.stringify(pair.value)}`);
      validated[pair.key] = pair.value;
    } else {
      console.log(`  ✗ ${pair.key}: ${rule.message}`);
      errors.push(rule.message);
    }
  } else {
    console.log(
      `  - ${pair.key}: ${JSON.stringify(pair.value)} (no validation)`,
    );
  }
}

console.log(`\nValidation ${errors.length === 0 ? "passed" : "failed"}!`);

// Example 4: Counting and summarizing values
console.log("\n\nExample 4: Counting and Summarizing");
console.log("=====================================");

const statsJson =
  '{"temperature": 22.5, "humidity": 65, "pressure": 1013, "windSpeed": 12.3}';

console.log(`Input: ${statsJson}\n`);

let numericCount = 0;
let sum = 0;
let max = -Infinity;
let maxKey = "";

for (const pair of jsonKeyValueParser(statsJson)) {
  if (typeof pair.value === "number") {
    numericCount++;
    sum += pair.value;
    if (pair.value > max) {
      max = pair.value;
      maxKey = pair.key;
    }
    console.log(`  ${pair.key}: ${pair.value}`);
  }
}

console.log(`\nSummary:`);
console.log(`  Numeric values: ${numericCount}`);
console.log(`  Sum: ${sum}`);
console.log(`  Average: ${(sum / numericCount).toFixed(2)}`);
console.log(`  Maximum: ${max} (${maxKey})`);

// Example 5: Building a simple object from key-value pairs
console.log("\n\nExample 5: Building Object from Key-Value Pairs");
console.log("=================================================");

const simpleJson = '{"firstName": "Jane", "lastName": "Doe", "age": 28}';
console.log(`Input: ${simpleJson}\n`);

const result: Record<string, string | number | boolean | null> = {};

for (const pair of jsonKeyValueParser(simpleJson)) {
  result[pair.key] = pair.value;
}

console.log("Reconstructed object:");
console.log(`  ${JSON.stringify(result, null, 2).split("\n").join("\n  ")}`);
