import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const dbPath = join(rootDir, "data", "trip-db.json");
const port = Number(process.env.API_PORT ?? 3001);

const emptyDatabase = {
  events: [],
  paintedPeriods: [],
};

async function readDatabase() {
  try {
    const content = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(content);
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
      paintedPeriods: Array.isArray(parsed.paintedPeriods) ? parsed.paintedPeriods : [],
    };
  } catch {
    await writeDatabase(emptyDatabase);
    return emptyDatabase;
  }
}

async function writeDatabase(database) {
  await mkdir(dirname(dbPath), { recursive: true });
  await writeFile(dbPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

createServer(async (request, response) => {
  try {
    if (!request.url?.startsWith("/api/database")) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    if (request.method === "GET") {
      sendJson(response, 200, await readDatabase());
      return;
    }

    if (request.method === "POST") {
      const body = await readBody(request);
      const parsed = JSON.parse(body);
      const database = {
        events: Array.isArray(parsed.events) ? parsed.events : [],
        paintedPeriods: Array.isArray(parsed.paintedPeriods) ? parsed.paintedPeriods : [],
      };

      await writeDatabase(database);
      sendJson(response, 200, database);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, 500, { error: error instanceof Error ? error.message : "Unknown error" });
  }
}).listen(port, () => {
  console.log(`Database API running at http://localhost:${port}`);
  console.log(`Writing to ${dbPath}`);
});
