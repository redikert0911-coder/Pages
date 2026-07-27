import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { getToken, getUserInfo } from "~/lib/client-auth";
import {
  getTrackedUrl, getDigests, getSnapshots, scrapeAndDigest, sendDigest,
  type TrackedUrl, type SnapshotRow, type DigestRow,
} from "~/lib/server-fns";

export const Route = createFileRoute("/urls/$urlId")({ component: UrlDetailPage });

interface ChangeData {
  diffSummary: string; titleChanged: boolean;
  oldTitle: string; newTitle: string;
  diffs: { type: "added" | "removed" | "unchanged"; text: string }[];
}

function UrlDetailPage() {
  const { urlId } = Route.useParams();
  const navigate = useNavigate();
  const token = getToken();
  const userInfo = getUserInfo();
  const [trackedUrl, setTrackedUrl] = useState<TrackedUrl | null>(null);
  const [digests, setDigests] = useState<DigestRow[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sendMsg, setSendMsg] = useState("");

  const loadData = useCallback(async () => {
    if (!token) return;
    const id = Number(urlId);
    try {
      const [urlData, digestData, snapData] = await Promise.all([
        getTrackedUrl({ data: { token, urlId: id } }),
        getDigests({ data: { token, urlId: id } }),
        getSnapshots({ data: { token, urlId: id } }),
      ]);
      setTrackedUrl(urlData); setDigests(digestData); setSnapshots(snapData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Not signed in") || msg.includes("Not found")) { navigate({ to: "/login" }); return; }
      setError(msg);
    } finally { setLoading(false); }
  }, [token, urlId, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleScrape() {
    setScraping(true); setError("");
    try {
      await scrapeAndDigest({ data: { token: token!, urlId: Number(urlId) } });
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Scrape failed"); }
    finally { setScraping(false); }
  }

  async function handleSendEmail() {
    setSending(true); setSendMsg("");
    try {
      const result = await sendDigest({ data: { token: token!, urlId: Number(urlId), email: userInfo?.email ?? "" } });
      if (result.success) { setSendMsg("Digest sent to your email!"); }
      else { setSendMsg(result.error ?? "Failed to send email"); }
    } catch (err) { setSendMsg(err instanceof Error ? err.message : "Network error"); }
    finally { setSending(false); }
  }

  if (loading) return <div className="flex min-h-dvh items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>;

  const latestDigest = digests[0];
  const changes = latestDigest?.changes ? (latestDigest.changes as ChangeData) : null;

  return (
    <div className="min-h-dvh">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">&larr; Dashboard</a>
            <h1 className="text-lg font-bold text-gray-900">{trackedUrl?.name || trackedUrl?.url || "URL Detail"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSendEmail} disabled={sending || !latestDigest} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              {sending ? "Sending..." : "Email digest"}
            </button>
            <button onClick={handleScrape} disabled={scraping} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
              {scraping ? "Scraping..." : "Scrape now"}
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {sendMsg && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{sendMsg}</div>}
        {trackedUrl && (
          <div className="mb-6">
            <a href={trackedUrl.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-500">{trackedUrl.url}</a>
            <p className="mt-1 text-xs text-gray-400">{trackedUrl.lastScrapedAt ? `Last scraped: ${new Date(trackedUrl.lastScrapedAt).toLocaleString()}` : "Not scraped yet"}</p>
          </div>
        )}
        {latestDigest ? (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">AI Analysis</span>
              <span className="text-xs text-gray-400">{new Date(latestDigest.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-gray-800 leading-relaxed">{latestDigest.summary}</p>
            {changes && changes.diffs && changes.diffs.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Changes detected: {changes.diffSummary}
                  {changes.titleChanged && ` (title: "${changes.oldTitle}" -> "${changes.newTitle}")`}
                </h3>
                <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
                    {changes.diffs.map((seg, i) => {
                      if (seg.type === "added") return <span key={i} className="bg-green-100 text-green-900">{seg.text}</span>;
                      if (seg.type === "removed") return <span key={i} className="bg-red-100 text-red-900 line-through">{seg.text}</span>;
                      return <span key={i}>{seg.text}</span>;
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200">
            <div className="mb-2 text-4xl">📊</div>
            <p className="text-gray-500">No digest yet.</p>
            <p className="text-sm text-gray-400">Click &ldquo;Scrape now&rdquo; to capture the first snapshot.</p>
          </div>
        )}
        {digests.length > 1 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Change History</h2>
            <div className="space-y-3">
              {digests.slice(1).map((d) => (
                <div key={d.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                  <span className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleString()}</span>
                  <p className="text-sm text-gray-700 mt-1">{d.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {snapshots.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Snapshots ({snapshots.length})</h2>
            <div className="space-y-2">
              {snapshots.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5 shadow-sm ring-1 ring-gray-200">
                  <span className="text-sm text-gray-600">{s.title || "Untitled"}</span>
                  <span className="text-xs text-gray-400">{new Date(s.scrapedAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
