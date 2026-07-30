const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: bun scripts/run-sql.js <sql-file>");
    process.exit(1);
  }
  const sql = fs.readFileSync(path.resolve(file), "utf8");
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  await c.query(sql);
  console.log("Applied", file);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
