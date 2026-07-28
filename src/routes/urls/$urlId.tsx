import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { getToken, getUserInfo } from "~/lib/client-auth";
import {
  getTrackedUrl, getDigests, getSnapshots, scrapeAndDigest, sendDigest,
  type TrackedUrl, type SnapshotRow, type DigestRow,
} from "~/lib/server-fns";
import { NavBar } from "~/components/NavBar";
import { Spinner } from "~/components/Spinner";
import { EmptyState } from "~/components/EmptyState";

export const Route = createFileRoute("/urls/$urlId")({ component: UrlDetailPage });

interface ChangeData {
  diffSummary: string; titleChanged: boolean;
  oldTitle: string; newTitle: string;
  diffs: { type: "added" | "removed" | "unchanged"; text: string }[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  const [view, setView] = useState<"unified" | "side-by-side">("unified");

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
      if (msg.includes("Not signed in") || msg.includes("Not found")) {
        navigate({ to: "/login" }); return;
      }
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
      if (result.success) {
        setSendMsg("Digest sent to your email!");
      } else if (result.error === "NO_PROVIDER") {
        // No email provider configured — open the user’s mail client with a pre-filled digest
        const displayName = trackedUrl?.name || trackedUrl?.url || "tracked page";
        const subject = encodeURIComponent("PagePulse Digest: " + displayName);
        let changesText = "";
        if (changes) {
          if (changes.diffSummary) changesText = changes.diffSummary;
          if (changes.titleChanged && changes.oldTitle && changes.newTitle) {
            changesText += "\nTitle changed: \u201c" + changes.oldTitle + "\u201d \u2192 \u201c" + changes.newTitle + "\u201d";
          }
        }
        const bodyLines = [
          "PagePulse Digest",
          "",
          "Tracked URL: " + (trackedUrl?.url || ""),
          "Page: " + displayName,
          "",
          "Summary:",
          latestDigest?.summary || "No meaningful changes detected.",
        ];
        if (changesText) {
          bodyLines.push("", "Changes:", changesText);
        }
        bodyLines.push("", "View full digest in PagePulse:", window.location.href);
        const body = encodeURIComponent(bodyLines.join("\n"));
        window.open("mailto:" + (userInfo?.email ?? "") + "?subject=" + subject + "&body=" + body, "_blank");
        setSendMsg("Email client opened — send the pre-filled digest from there.");
      } else {
        setSendMsg(result.error ?? "Failed to send email");
      }
    } catch (err) { setSendMsg(err instanceof Error ? err.message : "Network error"); }
    finally { setSending(false); }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  const latestDigest = digests[0];
  const changes = latestDigest?.changes ? (latestDigest.changes as ChangeData) : null;
  const diffs = changes?.diffs ?? [];
  const hasChanges = diffs.length > 0;

  return (
    <div className="min-h-dvh bg-gray-50">
      <NavBar showBackToDashboard />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>⚠️</span><p>{error}</p>
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        {sendMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <span>✅</span><p>{sendMsg}</p>
            <button onClick={() => setSendMsg("")} className="ml-auto text-emerald-400 hover:text-emerald-600">✕</button>
          </div>
        )}

        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {trackedUrl?.name || "Competitor"}
              </h1>
              <a href={trackedUrl?.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500 transition-colors">
                {trackedUrl?.url}
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
              {trackedUrl?.lastScrapedAt && (
                <p className="mt-1 text-xs text-gray-400">Last scraped: {formatDate(trackedUrl.lastScrapedAt)}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleSendEmail} disabled={sending || !latestDigest} className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
                {sending ? (<span className="flex items-center gap-1.5"><Spinner className="h-3.5 w-3.5" /> Sending</span>) : (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                    Email digest
                  </span>
                )}
              </button>
              <button onClick={handleScrape} disabled={scraping} className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
                {scraping ? (<span className="flex items-center gap-1.5"><Spinner className="h-4 w-4" /> Scraping...</span>) : (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                    Scrape now
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {latestDigest ? (
          <div className="mb-8">
            <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80">
              <div className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-medium text-indigo-700">AI-GENERATED</span>
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(latestDigest.createdAt)}</p>
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg, rgb(238 242 255 / 0.5), rgb(245 243 255 / 0.5))" }}>
                  <p className="text-sm leading-relaxed text-gray-800">{latestDigest.summary}</p>
                </div>
                {changes?.titleChanged && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm">
                    <span className="text-amber-600">📝</span>
                    <span className="text-amber-800">
                      Title changed: <span className="font-medium line-through text-amber-600">{changes.oldTitle}</span>{" → "}<span className="font-medium text-amber-900">{changes.newTitle}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {hasChanges && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/80">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Page Changes</h3>
                    <p className="mt-0.5 text-xs text-gray-500">{changes.diffSummary}</p>
                  </div>
                  <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                    <button onClick={() => setView("unified")} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${view === "unified" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Unified</button>
                    <button onClick={() => setView("side-by-side")} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${view === "side-by-side" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Side by side</button>
                  </div>
                </div>

                {view === "unified" ? (
                  <div className="max-h-[500px] overflow-y-auto rounded-xl border border-gray-200 bg-[#fafbfc]">
                    <div className="p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
                      {diffs.map((seg, i) => {
                        if (seg.type === "added") return <span key={i} className="bg-emerald-100 text-emerald-900 border-b border-emerald-200">{seg.text}</span>;
                        if (seg.type === "removed") return <span key={i} className="bg-red-100 text-red-900 line-through border-b border-red-200">{seg.text}</span>;
                        return <span key={i} className="text-gray-700">{seg.text}</span>;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto rounded-xl border border-gray-200">
                    <div className="grid grid-cols-2 divide-x divide-gray-200">
                      <div className="bg-red-50/30 p-4">
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-red-400">Removed</div>
                        <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
                          {diffs.filter((s) => s.type === "removed" || s.type === "unchanged").map((seg, i) => {
                            if (seg.type === "removed") return <span key={i} className="bg-red-200 text-red-900">{seg.text}</span>;
                            return <span key={i} className="text-gray-400">{seg.text}</span>;
                          })}
                        </div>
                      </div>
                      <div className="bg-emerald-50/30 p-4">
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Added</div>
                        <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
                          {diffs.filter((s) => s.type === "added" || s.type === "unchanged").map((seg, i) => {
                            if (seg.type === "added") return <span key={i} className="bg-emerald-200 text-emerald-900">{seg.text}</span>;
                            return <span key={i} className="text-gray-400">{seg.text}</span>;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon="📊" title="No digest yet" description="Click 'Scrape now' to capture the first snapshot of this page. Future scrapes will be compared against this baseline."
            action={<button onClick={handleScrape} disabled={scraping} className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">{scraping ? (<span className="flex items-center gap-1.5"><Spinner className="h-4 w-4" /> Scraping...</span>) : "Scrape now"}</button>}
          />
        )}

        {digests.length > 1 && (
          <div className="mt-8">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Change History
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{digests.length - 1}</span>
            </h2>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-6">
                {digests.slice(1).map((d) => {
                  const dChanges = d.changes ? (d.changes as ChangeData) : null;
                  const hasDiffs = dChanges?.diffs && dChanges.diffs.length > 0;
                  return (
                    <div key={d.id} className="relative flex gap-6 pl-12">
                      <div className={`absolute left-[16px] mt-1.5 h-3 w-3 rounded-full border-2 border-white shadow-sm ${hasDiffs ? "bg-indigo-500" : "bg-gray-300"}`} />
                      <div className="flex-1 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-400">{formatDateShort(d.createdAt)}</span>
                          {hasDiffs ? <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-medium text-indigo-700">Changes</span> : <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-600">No changes</span>}
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700">{d.summary}</p>
                        {hasDiffs && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-500">View diff summary</summary>
                            <p className="mt-2 text-xs text-gray-500">{dChanges?.diffSummary}{dChanges?.titleChanged && <> — Title: "{dChanges.oldTitle}" → "{dChanges.newTitle}"</>}</p>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {snapshots.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              Snapshots
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{snapshots.length}</span>
            </h2>
            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80">
              {snapshots.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-6 text-right font-mono text-xs text-gray-300">#{snapshots.length - i}</span>
                    <span className="truncate text-sm text-gray-700">{s.title || "Untitled snapshot"}</span>
                  </div>
                  <span className="ml-4 shrink-0 text-xs text-gray-400">{formatDate(s.scrapedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
