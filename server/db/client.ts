import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("connect", () => {
  console.log("New connection established");
});

pool.on("acquire", () => {
  console.log("Connection acquired from pool");
});

pool.on("remove", () => {
  console.log("Connection removed from pool");
});

pool.on("error", (err) => {
  console.error("Pool error:", err);
});

export default pool;
