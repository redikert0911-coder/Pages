import { createServerFn } from "@tanstack/react-start";
import { ensureSchema } from "~/lib/schema";
import { sql } from "~/db";
import { signup, login, getSession } from "~/lib/auth";
import { scrapeUrl } from "~/lib/scraper";
import { diffTexts, hasMeaningfulChanges, summarizeChanges } from "~/lib/differ";
import { generateDigest } from "~/lib/ai";
import { sendDigestEmail } from "~/lib/email";

export interface TrackedUrl {
  id: number;
  url: string;
  name: string;
  createdAt: string;
  lastScrapedAt: string | null;
}

export interface SnapshotRow {
  id: number;
  content: string;
  title: string | null;
  scrapedAt: string;
}

export interface DigestRow {
  id: number;
  snapshotOldId: number | null;
  snapshotNewId: number | null;
  summary: string;
  changes: unknown;
  createdAt: string;
}

// Helper: get the auth token from the function call's data or a global
function resolveToken(token?: string): string | null {
  if (token) return token;
  // Check global in SSR context
  if (typeof globalThis !== "undefined") {
    return (globalThis as Record<string, unknown>).__pagepulse_token as string | null;
  }
  return null;
}

// ---- Auth ----

export const serverSignup = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { email: string; password: string; name: string };
    return d;
  })
  .handler(async ({ data }) => {
    await ensureSchema();
    return signup(data.email, data.password, data.name);
  });

export const serverLogin = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { email: string; password: string };
    return d;
  })
  .handler(async ({ data }) => {
    await ensureSchema();
    return login(data.email, data.password);
  });

// ---- Tracked URLs ----

export const getTrackedUrls = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    const d = data as { token: string };
    return d;
  })
  .handler(async ({ data }) => {
    const session = getSession(data.token);
    if (!session) return [];

    try {
      await ensureSchema();
      const db = sql();
      const rows = await db`
        SELECT id, url, name, created_at, last_scraped_at
        FROM tracked_urls
        WHERE user_id = ${session.userId}
        ORDER BY created_at DESC
      `;
      return rows.map(
        (r): TrackedUrl => ({
          id: r.id as number,
          url: r.url as string,
          name: r.name as string,
          createdAt: String(r.created_at),
          lastScrapedAt: r.last_scraped_at ? String(r.last_scraped_at) : null,
        }),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("DATABASE_URL")) return [];
      throw err;
    }
  });

export const addTrackedUrl = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { token: string; url: string; name?: string };
    return d;
  })
  .handler(async ({ data }) => {
    const session = getSession(data.token);
    if (!session) throw new Error("Not signed in");

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(data.url);
    } catch {
      throw new Error("Invalid URL");
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("URL must start with http:// or https://");
    }

    await ensureSchema();
    const db = sql();
    const result = await db`
      INSERT INTO tracked_urls (user_id, url, name)
      VALUES (${session.userId}, ${data.url}, ${data.name ?? ""})
      RETURNING id, url, name, created_at, last_scraped_at
    `;
    const r = result[0]!;
    return {
      id: r.id as number,
      url: r.url as string,
      name: r.name as string,
      createdAt: String(r.created_at),
      lastScrapedAt: null,
    } as TrackedUrl;
  });

export const getTrackedUrl = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    const d = data as { token: string; urlId: number };
    return d;
  })
  .handler(async ({ data }) => {
    const session = getSession(data.token);
    if (!session) throw new Error("Not signed in");

    await ensureSchema();
    const db = sql();
    const rows = await db`
      SELECT id, url, name, created_at, last_scraped_at
      FROM tracked_urls
      WHERE id = ${data.urlId} AND user_id = ${session.userId}
    `;
    if (rows.length === 0) throw new Error("Not found");
    const r = rows[0]!;
    return {
      id: r.id as number,
      url: r.url as string,
      name: r.name as string,
      createdAt: String(r.created_at),
      lastScrapedAt: r.last_scraped_at ? String(r.last_scraped_at) : null,
    } as TrackedUrl;
  });

// ---- Snapshots ----

export const getSnapshots = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    const d = data as { token: string; urlId: number };
    return d;
  })
  .handler(async ({ data }) => {
    const session = getSession(data.token);
    if (!session) throw new Error("Not signed in");

    await ensureSchema();
    const db = sql();
    const rows = await db`
      SELECT s.id, s.content, s.title, s.scraped_at
      FROM snapshots s
      JOIN tracked_urls t ON s.tracked_url_id = t.id
      WHERE t.id = ${data.urlId} AND t.user_id = ${session.userId}
      ORDER BY s.scraped_at DESC
      LIMIT 10
    `;
    return rows.map(
      (r): SnapshotRow => ({
        id: r.id as number,
        content: r.content as string,
        title: (r.title as string) ?? null,
        scrapedAt: String(r.scraped_at),
      }),
    );
  });

// ---- Digests ----

export const getDigests = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    const d = data as { token: string; urlId: number };
    return d;
  })
  .handler(async ({ data }) => {
    const session = getSession(data.token);
    if (!session) throw new Error("Not signed in");

    await ensureSchema();
    const db = sql();
    const rows = await db`
      SELECT d.id, d.snapshot_old_id, d.snapshot_new_id, d.summary, d.changes, d.created_at
      FROM digests d
      JOIN tracked_urls t ON d.tracked_url_id = t.id
      WHERE t.id = ${data.urlId} AND t.user_id = ${session.userId}
      ORDER BY d.created_at DESC
      LIMIT 20
    `;
    return rows.map(
      (r): DigestRow => ({
        id: r.id as number,
        snapshotOldId: r.snapshot_old_id as number | null,
        snapshotNewId: r.snapshot_new_id as number | null,
        summary: r.summary as string,
        changes: typeof r.changes === "string" ? JSON.parse(r.changes as string) : r.changes,
        createdAt: String(r.created_at),
      }),
    );
  });

// ---- Scrape & Digest ----

export const scrapeAndDigest = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { token: string; urlId: number };
    return d;
  })
  .handler(async ({ data }) => {
    const session = getSession(data.token);
    if (!session) throw new Error("Not signed in");

    await ensureSchema();
    const db = sql();

    const urls = await db`
      SELECT id, url, name, user_id FROM tracked_urls
      WHERE id = ${data.urlId} AND user_id = ${session.userId}
    `;
    if (urls.length === 0) throw new Error("URL not found");
    const tracked = urls[0]!;

    const prevSnapshots = await db`
      SELECT id, content, title FROM snapshots
      WHERE tracked_url_id = ${data.urlId}
      ORDER BY scraped_at DESC LIMIT 1
    `;

    // Scrape
    let scraped;
    try {
      scraped = await scrapeUrl(tracked.url as string);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Scrape failed: ${msg}`);
    }

    const newSnap = await db`
      INSERT INTO snapshots (tracked_url_id, content, title)
      VALUES (${data.urlId}, ${scraped.content}, ${scraped.title})
      RETURNING id, content, title, scraped_at
    `;
    const newRow = newSnap[0]!;

    await db`
      UPDATE tracked_urls SET last_scraped_at = NOW()
      WHERE id = ${data.urlId}
    `;

    // First snapshot — baseline
    if (prevSnapshots.length === 0) {
      const d = await db`
        INSERT INTO digests (tracked_url_id, snapshot_old_id, snapshot_new_id, summary, changes)
        VALUES (${data.urlId}, NULL, ${newRow.id as number}, 'Initial snapshot captured. Future scrapes will compare against this baseline.', '[]')
        RETURNING id, summary, changes, created_at
      `;
      return {
        snapshot: { id: newRow.id, title: newRow.title, scrapedAt: String(newRow.scraped_at) } as SnapshotRow,
        digest: {
          id: d[0]!.id, snapshotOldId: null, snapshotNewId: newRow.id as number,
          summary: d[0]!.summary, changes: [], createdAt: String(d[0]!.created_at),
        } as DigestRow,
      };
    }

    const prev = prevSnapshots[0]!;
    const prevContent = prev.content as string;
    const prevTitle = (prev.title as string) ?? "";

    if (!hasMeaningfulChanges(prevContent, scraped.content)) {
      const d = await db`
        INSERT INTO digests (tracked_url_id, snapshot_old_id, snapshot_new_id, summary, changes)
        VALUES (${data.urlId}, ${prev.id as number}, ${newRow.id as number}, 'No meaningful changes detected since the last scrape.', '[]')
        RETURNING id, summary, changes, created_at
      `;
      return {
        snapshot: { id: newRow.id, title: newRow.title, scrapedAt: String(newRow.scraped_at) } as SnapshotRow,
        digest: {
          id: d[0]!.id, snapshotOldId: prev.id as number, snapshotNewId: newRow.id as number,
          summary: d[0]!.summary, changes: [], createdAt: String(d[0]!.created_at),
        } as DigestRow,
      };
    }

    const diffs = diffTexts(prevContent, scraped.content);
    const changeSummary = summarizeChanges(diffs);

    const aiResult = await generateDigest(
      tracked.url as string, scraped.title, diffs, prevTitle, scraped.title,
    );

    const changesJson = JSON.stringify({
      diffSummary: changeSummary.summary,
      titleChanged: prevTitle !== scraped.title,
      oldTitle: prevTitle, newTitle: scraped.title,
      diffs: diffs.slice(0, 200),
    });

    const d = await db`
      INSERT INTO digests (tracked_url_id, snapshot_old_id, snapshot_new_id, summary, changes)
      VALUES (${data.urlId}, ${prev.id as number}, ${newRow.id as number}, ${aiResult.summary}, ${changesJson})
      RETURNING id, summary, changes, created_at
    `;

    return {
      snapshot: { id: newRow.id, title: newRow.title, scrapedAt: String(newRow.scraped_at) } as SnapshotRow,
      digest: {
        id: d[0]!.id, snapshotOldId: prev.id as number, snapshotNewId: newRow.id as number,
        summary: d[0]!.summary, changes: JSON.parse(changesJson), createdAt: String(d[0]!.created_at),
      } as DigestRow,
    };
  });

// ---- Email ----

export const sendDigest = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { token: string; urlId: number; email: string };
    return d;
  })
  .handler(async ({ data }) => {
    const session = getSession(data.token);
    if (!session) throw new Error("Not signed in");

    await ensureSchema();
    const db = sql();

    const urls = await db`
      SELECT id, url, name FROM tracked_urls
      WHERE id = ${data.urlId} AND user_id = ${session.userId}
    `;
    if (urls.length === 0) throw new Error("URL not found");
    const tracked = urls[0]!;

    const digests = await db`
      SELECT summary, changes FROM digests
      WHERE tracked_url_id = ${data.urlId}
      ORDER BY created_at DESC LIMIT 1
    `;

    const summary = digests.length > 0 ? (digests[0]!.summary as string) : "No digest available yet.";
    const changes = digests.length > 0 ? JSON.stringify(digests[0]!.changes) : "";

    return sendDigestEmail({
      to: data.email,
      url: tracked.url as string,
      urlName: tracked.name as string,
      summary,
      changes,
    });
  });
