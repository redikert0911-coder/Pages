import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setToken, setUserInfo } from "~/lib/client-auth";
import { serverLogin } from "~/lib/server-fns";
import { Spinner } from "~/components/Spinner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await serverLogin({ data: { email, password } });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setToken(result.token);
      setUserInfo({ name: result.name ?? email, email });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-4">
      <a href="/" className="mb-10 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white shadow-md">
          P
        </div>
        <span className="text-xl font-bold tracking-tight text-gray-900">
          Page<span className="text-indigo-600">Pulse</span>
        </span>
      </a>

      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <h1 className="text-lg font-semibold text-gray-900">Welcome back</h1>
            <p className="mt-0.5 text-sm text-gray-500">Sign in to your PagePulse account</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email address</label>
              <input id="email" type="email" required value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                placeholder="you@company.com" autoComplete="email" autoFocus />
            </div>

            <div className="mb-6">
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              </div>
              <input id="password" type="password" required value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                placeholder="Enter your password" autoComplete="current-password" />
            </div>

            <button type="submit" disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
              {loading ? (<span className="flex items-center justify-center gap-2"><Spinner className="h-4 w-4" /> Signing in...</span>) : "Sign in"}
            </button>
          </form>

          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Create one</a>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
