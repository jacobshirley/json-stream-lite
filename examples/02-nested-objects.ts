// Nested Objects - Parsing JSON with nested objects and arrays
import { jsonKeyValueParser } from "json-stream-lite";

const json = JSON.stringify({
  user: {
    name: "Bob",
    profile: {
      email: "bob@example.com",
      verified: true,
    },
  },
  tags: ["admin", "active"],
  metadata: {
    created: 1699999999,
    items: [{ id: 1 }, { id: 2 }],
  },
});

console.log("Parsing nested JSON:");
for (const pair of jsonKeyValueParser(json)) {
  console.log(`  ${pair.key}: ${pair.value}`);
}

// Output:
// Parsing nested JSON:
//   user.name: Bob
//   user.profile.email: bob@example.com
//   user.profile.verified: true
//   tags[0]: admin
//   tags[1]: active
//   metadata.created: 1699999999
//   metadata.items[0].id: 1
//   metadata.items[1].id: 2
