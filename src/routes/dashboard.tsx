import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { getToken, clearToken, clearUserInfo, getUserInfo } from "~/lib/client-auth";
import {
  getTrackedUrls,
  addTrackedUrl,
  scrapeAndDigest,
  type TrackedUrl,
} from "~/lib/server-fns";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [urls, setUrls] = useState<TrackedUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [scraping, setScraping] = useState<number | null>(null);
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

  function handleSignOut() {
    clearToken();
    clearUserInfo();
    navigate({ to: "/login" });
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">PagePulse</h1>
          <div className="flex items-center gap-3">
            {userInfo && (
              <span className="text-sm text-gray-500">{userInfo.email}</span>
            )}
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Add URL form */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Track a competitor
          </h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://competitor.com"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (optional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-40"
            />
            <button
              type="submit"
              disabled={adding || !newUrl.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Track URL"}
            </button>
          </form>
        </div>

        {/* Tracked URLs */}
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Tracked URLs
        </h2>

        {urls.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200">
            <div className="mb-2 text-4xl">🔍</div>
            <p className="text-gray-500">No competitors tracked yet.</p>
            <p className="text-sm text-gray-400">
              Add a URL above to start monitoring changes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {urls.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {u.name && (
                      <span className="font-medium text-gray-900">{u.name}</span>
                    )}
                    <a
                      href={u.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      {u.url}
                    </a>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {u.lastScrapedAt
                      ? `Last scraped: ${new Date(u.lastScrapedAt).toLocaleString()}`
                      : "Not scraped yet"}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() =>
                      navigate({
                        to: "/urls/$urlId",
                        params: { urlId: String(u.id) },
                      })
                    }
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleScrape(u.id)}
                    disabled={scraping === u.id}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {scraping === u.id ? "Scraping..." : "Scrape now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
