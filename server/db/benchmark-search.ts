import pool from "./client";

const ITERATIONS = 20;

async function timeQuery(queryText: string, params: unknown[]) {
  const samples: number[] = [];

  for (let i = 0; i < ITERATIONS + 1; i++) {
    const start = process.hrtime.bigint();
    await pool.query(queryText, params);
    const end = process.hrtime.bigint();

    // discard the first run as a warmup (cold caches, connection setup)
    if (i === 0) continue;
    samples.push(Number(end - start) / 1_000_000); // ns -> ms
  }

  return {
    avg: samples.reduce((a, b) => a + b, 0) / samples.length,
    min: Math.min(...samples),
    max: Math.max(...samples),
  };
}

async function explainAnalyze(queryText: string, params: unknown[]) {
  const { rows } = await pool.query(`EXPLAIN ANALYZE ${queryText}`, params);
  const planLines: string[] = rows.map((r: any) => r["QUERY PLAN"]);

  const topNode = planLines[0].trim();
  const executionLine = planLines.find((l) => l.startsWith("Execution Time"));
  const executionTimeMs = executionLine
    ? parseFloat(executionLine.replace("Execution Time: ", "").replace(" ms", ""))
    : null;

  return { topNode, executionTimeMs };
}

async function main() {
  const termArg = process.argv[2];

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM users`,
  );
  const userCount = countRows[0].count;

  let term = termArg;
  if (!term) {
    const { rows } = await pool.query(
      `SELECT split_part(name, ' ', 1) AS first_name, COUNT(*) AS c
       FROM users GROUP BY 1 ORDER BY c DESC LIMIT 1`,
    );
    term = rows[0].first_name;
  }

  console.log(`users table has ${userCount} rows. Using search term: "${term}"`);

  const ftsQuery = `SELECT * FROM users WHERE to_tsvector('english', name) @@ to_tsquery('english', $1)`;
  const ilikeQuery = `SELECT * FROM users WHERE name ILIKE '%' || $1 || '%'`;

  const ftsResult = await pool.query(ftsQuery, [term]);
  const ilikeResult = await pool.query(ilikeQuery, [term]);

  console.log(
    `FTS matched ${ftsResult.rowCount} rows, ILIKE matched ${ilikeResult.rowCount} rows`,
  );

  const ftsTiming = await timeQuery(ftsQuery, [term]);
  const ilikeTiming = await timeQuery(ilikeQuery, [term]);

  console.log(`FTS wall-clock:   avg ${ftsTiming.avg.toFixed(2)}ms, min ${ftsTiming.min.toFixed(2)}ms, max ${ftsTiming.max.toFixed(2)}ms`);
  console.log(`ILIKE wall-clock: avg ${ilikeTiming.avg.toFixed(2)}ms, min ${ilikeTiming.min.toFixed(2)}ms, max ${ilikeTiming.max.toFixed(2)}ms`);

  const ftsPlan = await explainAnalyze(ftsQuery, [term]);
  const ilikePlan = await explainAnalyze(ilikeQuery, [term]);

  console.log(`FTS plan:   ${ftsPlan.topNode} (Execution Time: ${ftsPlan.executionTimeMs}ms)`);
  console.log(`ILIKE plan: ${ilikePlan.topNode} (Execution Time: ${ilikePlan.executionTimeMs}ms)`);

  const speedup = ftsTiming.avg / ilikeTiming.avg;
  const faster = speedup > 1 ? "ILIKE" : "FTS";
  const ratio = speedup > 1 ? speedup : 1 / speedup;

  console.log("\n--- Summary ---");
  console.log(`term="${term}" | users table: ${userCount} rows`);
  console.log(
    `FTS:   ${ftsResult.rowCount} matches | wall-clock avg ${ftsTiming.avg.toFixed(2)}ms | server execution ${ftsPlan.executionTimeMs}ms`,
  );
  console.log(
    `ILIKE: ${ilikeResult.rowCount} matches | wall-clock avg ${ilikeTiming.avg.toFixed(2)}ms | server execution ${ilikePlan.executionTimeMs}ms`,
  );
  console.log(`${faster} is ${ratio.toFixed(2)}x faster (wall-clock)`);

  await pool.end();
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
