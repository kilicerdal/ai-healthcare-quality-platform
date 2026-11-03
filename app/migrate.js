const fs = require("node:fs");
const path = require("node:path");
const pool = require("./db");
(async () => {
  try {
    await pool.query(fs.readFileSync(path.join(__dirname, "../docker/init.sql"), "utf8"));
    console.log("Claims schema ready");
  } catch (error) {
    console.error("Claims schema migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
