import { createFileRoute } from "@tanstack/react-router";
import { isSignedIn } from "~/lib/client-auth";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const signedIn = typeof window !== "undefined" && isSignedIn();

  return (
    <div className="min-h-dvh">
      {/* Nav */}
      <nav className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
              P
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Page<span className="text-indigo-600">Pulse</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            {signedIn ? (
              <a href="/dashboard" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors">
                Dashboard
              </a>
            ) : (
              <>
                <a
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign in
                </a>
                <a href="/signup" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors">
                  Get started
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 py-20 sm:py-28" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f5f3ff 100%)" }}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            AI-powered competitive intelligence
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Stop tracking competitors{" "}
            <span className="text-indigo-600">in spreadsheets</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
            PagePulse monitors your competitors' websites and sends you a weekly
            AI-written digest of what changed — and
            <strong className="text-gray-900"> why it matters</strong>. No more
            manual checks, no more raw diffs. Just the signal.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="/signup" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors">
              Start tracking — free
            </a>
            <a href="/login" className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-8 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
              Sign in
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Free tier: 3 monitored URLs. No credit card required.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Three simple steps to stay ahead of the competition.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                icon: "🔗",
                title: "Add URLs",
                description:
                  "Paste the competitor websites you want to track. PagePulse takes it from there.",
              },
              {
                step: "2",
                icon: "🤖",
                title: "AI scans weekly",
                description:
                  "Every week, we scrape each page and compare it against the last snapshot using AI.",
              },
              {
                step: "3",
                icon: "📧",
                title: "Get the digest",
                description:
                  "Receive a plain-English email summarizing what changed and why it matters.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-200/80"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Built for B2B SaaS teams
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Everything you need to monitor the competitive landscape.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: "📊", title: "Visual diffs", desc: "Side-by-side and inline diff views with green/red highlighting so you can see exactly what changed." },
              { icon: "🧠", title: "AI commentary", desc: "Not just a diff — each digest includes AI analysis on competitive significance." },
              { icon: "⏱️", title: "Weekly cadence", desc: "Automated weekly scrapes. Set it and forget it — digests arrive in your inbox." },
              { icon: "📋", title: "Change history", desc: "Full archive of every snapshot and digest. Review how competitors evolved over time." },
              { icon: "🔔", title: "Email delivery", desc: "Digests land in your inbox on your schedule. No need to log in." },
              { icon: "🛡️", title: "Private & secure", desc: "Your tracked URLs and data are private to your account. No sharing, no selling." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 rounded-2xl p-5 hover:bg-gray-50 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:py-24" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f5f3ff 100%)" }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Stop guessing. Start knowing.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Free for 3 URLs. $29/mo unlimited. No credit card required.
          </p>
          <div className="mt-8">
            <a href="/signup" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors">
              Create free account
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">
              P
            </div>
            <span className="text-sm font-medium text-gray-500">PagePulse</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} PagePulse. AI-powered competitive intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
