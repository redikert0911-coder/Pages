import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setToken, setUserInfo } from "~/lib/client-auth";
import { serverSignup } from "~/lib/server-fns";
import { Spinner } from "~/components/Spinner";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);

    try {
      const result = await serverSignup({ data: { name, email, password } });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setToken(result.token);
      setUserInfo({ name: name || email, email });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
    if (error) setError("");
  }

  const inputClass = (field: string) =>
    `block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${
      fieldErrors[field]
        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
        : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
    }`;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-4 py-8">
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
            <h1 className="text-lg font-semibold text-gray-900">Create your account</h1>
            <p className="mt-0.5 text-sm text-gray-500">Start tracking competitors in seconds.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <span className="mt-0.5 shrink-0">⚠️</span><p>{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">Full name</label>
              <input id="name" type="text" required value={name}
                onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
                className={inputClass("name")} placeholder="Jane Smith" autoComplete="name" autoFocus />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Work email</label>
              <input id="email" type="email" required value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                className={inputClass("email")} placeholder="you@company.com" autoComplete="email" />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <input id="password" type="password" required value={password}
                onChange={(e) => {
                  setPassword(e.target.value); clearFieldError("password");
                  if (confirmPassword && e.target.value !== confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
                  else if (confirmPassword) clearFieldError("confirmPassword");
                }}
                className={inputClass("password")} placeholder="At least 6 characters" autoComplete="new-password" minLength={6} />
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">Confirm password</label>
              <input id="confirmPassword" type="password" required value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (password && e.target.value !== password) setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
                  else clearFieldError("confirmPassword");
                }}
                className={inputClass("confirmPassword")} placeholder="Repeat your password" autoComplete="new-password" />
              {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
              {loading ? (<span className="flex items-center justify-center gap-2"><Spinner className="h-4 w-4" /> Creating account...</span>) : "Create account"}
            </button>
          </form>

          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Sign in</a>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Free for up to 3 tracked URLs. No credit card required.
        </p>
      </div>
    </div>
  );
}
