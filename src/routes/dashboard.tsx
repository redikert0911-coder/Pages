import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { getToken, getUserInfo } from "~/lib/client-auth";
import {
  getTrackedUrls,
  addTrackedUrl,
  scrapeAndDigest,
  type TrackedUrl,
} from "~/lib/server-fns";
import { NavBar } from "~/components/NavBar";
import { Spinner } from "~/components/Spinner";
import { EmptyState } from "~/components/EmptyState";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function DashboardPage() {
  const navigate = useNavigate();
  const [urls, setUrls] = useState<TrackedUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [scraping, setScraping] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const userInfo = getUserInfo();

  const token = getToken();

  const loadUrls = useCallback(async () => {
    if (!token) {
      navigate({ to: "/login" });
      return;
    }
    try {
      const data = await getTrackedUrls({ data: { token } });
      setUrls(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("DATABASE_URL")) {
        setError("Database not connected. Connect a database to enable tracking.");
      } else {
        setError("Failed to load URLs");
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    loadUrls();
  }, [loadUrls]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setError("");
    setAdding(true);

    try {
      await addTrackedUrl({
        data: { token: token!, url: newUrl.trim(), name: newName.trim() },
      });
      setNewUrl("");
      setNewName("");
      setShowAddForm(false);
      await loadUrls();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("DATABASE_URL")) {
        setError("Database not connected. Connect a database to enable tracking.");
      } else {
        setError(msg);
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleScrape(urlId: number) {
    setScraping(urlId);
    setError("");
    try {
      await scrapeAndDigest({ data: { token: token!, urlId } });
      await loadUrls();
      navigate({ to: "/urls/$urlId", params: { urlId: String(urlId) } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("DATABASE_URL")) {
        setError("Database not connected. Connect a database first.");
      } else {
        setError(msg);
      }
    } finally {
      setScraping(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  const firstName = userInfo?.name?.split(" ")[0] || userInfo?.email?.split("@")[0] || "there";

  return (
    <div className="min-h-dvh bg-gray-50">
      <NavBar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-medium">Something went wrong</p>
              <p className="text-red-600">{error}</p>
            </div>
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
              ✕
            </button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your competitors.
          </p>
        </div>

        {/* Stats bar */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl">
              🔗
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{urls.length}</p>
              <p className="text-xs font-medium text-gray-500">Tracked URLs</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl">
              📊
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {urls.filter((u) => u.lastScrapedAt).length}
              </p>
              <p className="text-xs font-medium text-gray-500">With snapshots</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-xl">
              🕐
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {urls.filter((u) => !u.lastScrapedAt).length}
              </p>
              <p className="text-xs font-medium text-gray-500">Pending scrape</p>
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your competitors</h2>
          {urls.length > 0 && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              + Add competitor
            </button>
          )}
        </div>

        {/* Add URL form */}
        {showAddForm && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/80">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Track a new competitor</h3>
              <button onClick={() => setShowAddForm(false)} className="text-sm text-gray-400 hover:text-gray-600">
                Cancel
              </button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url" required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://competitor.com"
                className="block w-full flex-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                autoFocus
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Company name (optional)"
                className="block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors sm:w-48"
              />
              <button
                type="submit"
                disabled={adding || !newUrl.trim()}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {adding ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" /> Adding...
                  </span>
                ) : "Track URL"}
              </button>
            </form>
          </div>
        )}

        {/* URL cards */}
        {urls.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="Track your first competitor"
            description="Add a competitor's URL to start monitoring their website for changes. PagePulse will scrape it weekly and send you AI-powered digests."
            action={
              <button onClick={() => setShowAddForm(true)} className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors">
                Add competitor URL
              </button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {urls.map((u) => {
              const domain = extractDomain(u.url);
              const initial = (u.name || domain).charAt(0).toUpperCase();
              const isScraping = scraping === u.id;
              return (
                <div key={u.id} className="group flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/80 hover:shadow-md hover:ring-gray-300/80 transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm"
                      style={{
                        backgroundColor: ["#4f46e5","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#be185d","#4b5563"][u.id % 8],
                      }}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {u.name && <h3 className="truncate font-semibold text-gray-900">{u.name}</h3>}
                        <a href={u.url} target="_blank" rel="noopener noreferrer" className="truncate text-sm text-indigo-600 hover:text-indigo-500 transition-colors">
                          {domain}
                        </a>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {u.lastScrapedAt ? <>Last scraped {timeAgo(u.lastScrapedAt)}</> : <span className="font-medium text-amber-600">Not scraped yet</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => navigate({ to: "/urls/$urlId", params: { urlId: String(u.id) } })} className="flex-1 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors">
                      View digest
                    </button>
                    <button onClick={() => handleScrape(u.id)} disabled={isScraping} className="flex-1 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
                      {isScraping ? (<span className="flex items-center justify-center gap-1.5"><Spinner className="h-3.5 w-3.5" /> Scraping</span>) : "Scrape now"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {urls.length > 3 && !showAddForm && (
          <div className="mt-6 text-center">
            <button onClick={() => setShowAddForm(true)} className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors">
              + Add another competitor
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
