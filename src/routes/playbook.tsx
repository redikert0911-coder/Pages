import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/playbook")({
  component: PlaybookPage,
});

function PlaybookPage() {
  return (
    <div className="min-h-dvh bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
              P
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Page<span className="text-indigo-600">Pulse</span>
            </span>
          </a>
          <a
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            Try free
          </a>
        </div>
      </nav>

      {/* Article header */}
      <header
        className="px-4 py-16 sm:py-20"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f5f3ff 100%)",
        }}
      >
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Competitive Intelligence Playbook
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How B2B SaaS Startups Should Track Competitors (Without Losing Their
            Minds)
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            A practical guide to setting up a competitive intelligence practice
            — from scrappy manual tracking to AI-powered automation.
          </p>
        </div>
      </header>

      {/* Article body */}
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="prose prose-lg prose-gray max-w-none space-y-12">
          {/* Why manual tracking fails */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">
              1. Why manual tracking fails
            </h2>
            <p className="mt-4 leading-relaxed text-gray-700">
              Every founder knows they should track competitors. Almost none do
              it consistently. The pattern is universal:
            </p>
            <ul className="mt-4 space-y-2 text-gray-700">
              <li>
                <strong>You forget.</strong> Competitor research falls off the
                priority list behind product, sales, and hiring. Three weeks go
                by and you haven't checked.
              </li>
              <li>
                <strong>It's noisy.</strong> You open 10 tabs, scan each site,
                and squint at old screenshots. Did that pricing table change?
                Was that feature there last month? You're guessing.
              </li>
              <li>
                <strong>There's no context.</strong> Even when you spot a change,
                you still have to figure out what it means. Is a new enterprise
                tier a real threat or just window dressing?
              </li>
            </ul>
            <p className="mt-4 leading-relaxed text-gray-700">
              Manual tracking doesn't fail because founders are lazy. It fails
              because it's a high-effort, low-immediacy task. You never feel the
              pain of *not* doing it — until a competitor blindsides you.
            </p>
          </section>

          {/* What actually matters */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">
              2. What actually matters (and what doesn't)
            </h2>
            <p className="mt-4 leading-relaxed text-gray-700">
              Not every website change is competitive intelligence. Most are
              noise: blog post dates, testimonial rotations, CSS tweaks. Here's
              what to actually watch:
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "✅ Pricing changes",
                  desc: "New tiers, price increases, feature gating. The most actionable signal.",
                },
                {
                  title: "✅ New features",
                  desc: "Product page additions, new use cases, integrations. Shows where they're heading.",
                },
                {
                  title: "✅ Messaging pivots",
                  desc: "Headline changes, value prop shifts, new ICP language. They're repositioning.",
                },
                {
                  title: "✅ Team growth",
                  desc: "New hires on the team page, especially in sales, product, or leadership.",
                },
                {
                  title: "❌ Blog posts",
                  desc: "Content marketing cadence tells you very little about strategic direction.",
                },
                {
                  title: "❌ Design tweaks",
                  desc: "Button colors and font sizes are not competitive threats.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200/80"
                >
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* The 3-tier CI stack */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">
              3. The 3-tier competitive intelligence stack
            </h2>
            <p className="mt-4 leading-relaxed text-gray-700">
              Different stages need different tools. Here's what's appropriate
              at each level:
            </p>

            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6">
                <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  Tier 1
                </span>
                <h3 className="mt-3 text-xl font-bold text-gray-900">
                  Manual: Spreadsheet + Calendar
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  For: Pre-revenue, 1-3 competitors. Create a simple tracker
                  with columns for URL, last checked date, and notes. Set a
                  recurring Monday morning calendar reminder. Cost: $0. Time:
                  30-60 min/week.
                </p>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  👉{" "}
                  <a
                    href="#template"
                    className="text-indigo-600 underline hover:text-indigo-500"
                  >
                    Get the free template below
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6">
                <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                  Tier 2 ⭐
                </span>
                <h3 className="mt-3 text-xl font-bold text-gray-900">
                  Automated: AI-Powered Monitoring
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  For: Seed to Series A, 5-20 competitors. Tools like PagePulse
                  automatically scrape competitor sites, diff against previous
                  snapshots, and send weekly AI-generated digests. Cost:
                  $0-$29/mo. Time: 5 min/week (reading the digest).
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  This is the sweet spot for most startups — automated enough to
                  be consistent, affordable enough to be a no-brainer, and the
                  AI commentary means you actually understand what changes mean.
                </p>
                <p className="mt-3">
                  <a
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                  >
                    Try PagePulse free →
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6">
                <span className="inline-block rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                  Tier 3
                </span>
                <h3 className="mt-3 text-xl font-bold text-gray-900">
                  Enterprise: CI Platforms
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  For: Series B+, dedicated CI teams. Platforms like Klue and
                  Crayon provide battlecards, win/loss analysis, and CRM
                  integration. Cost: $10k-$50k+/yr. Time: Full-time CI role.
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  These are powerful but overkill for most startups. You don't
                  need a battlecard library when you're tracking five companies.
                </p>
              </div>
            </div>
          </section>

          {/* Template */}
          <section id="template">
            <h2 className="text-2xl font-bold text-gray-900">
              4. Free Competitor Tracking Template
            </h2>
            <p className="mt-4 leading-relaxed text-gray-700">
              If you're at Tier 1 (or just want a lightweight backup), here's a
              simple template. Copy it into Google Sheets, Notion, or wherever
              you work.
            </p>

            <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Competitor
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      URL
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Last Checked
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      What Changed
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Significance
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      "Acme Corp",
                      "acme.com/pricing",
                      "Aug 1",
                      "Added Enterprise tier at $99/mo",
                      "High — they're moving upmarket",
                      "Review our pricing",
                    ],
                    [
                      "Beta SaaS",
                      "beta.io",
                      "Aug 1",
                      "New 'Teams' feature on homepage",
                      "Medium — entering collaboration space",
                      "Monitor adoption",
                    ],
                    [
                      "Gamma AI",
                      "gamma.ai/about",
                      "Jul 25",
                      "Hired VP Sales (ex-Salesforce)",
                      "High — likely scaling sales team",
                      "Watch for GTM acceleration",
                    ],
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className={
                        i < 2 ? "border-b border-gray-100" : ""
                      }
                    >
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="px-4 py-3 text-gray-700"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Set a weekly recurring calendar reminder. Spend 30 minutes
              Monday morning. Fill in the rows. That's it.
            </p>
          </section>

          {/* When to upgrade */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">
              5. When to upgrade from manual tracking
            </h2>
            <p className="mt-4 leading-relaxed text-gray-700">
              Manual tracking works until it doesn't. Here are the signals
              you've outgrown Tier 1:
            </p>
            <ul className="mt-4 space-y-2 text-gray-700">
              <li>
                🔴 You're tracking more than 5 competitors — the spreadsheet
                becomes unwieldy
              </li>
              <li>
                🔴 You missed a change that cost you a deal — a competitor
                dropped pricing and you found out from a prospect
              </li>
              <li>
                🔴 You're skipping weeks — the Monday reminder gets snoozed
                into oblivion
              </li>
              <li>
                🔴 Multiple teammates need the intel — a spreadsheet doesn't
                share well
              </li>
              <li>
                🔴 You want historical context — "when did they launch that
                feature?" is a question you can't answer from memory
              </li>
            </ul>
            <p className="mt-4 leading-relaxed text-gray-700">
              When you hit two or more of these, it's time to automate. Tier 2
              tools like PagePulse handle the scraping, diffing, and
              summarization so you get a weekly email instead of a Monday
              morning chore.
            </p>
          </section>

          {/* CTA */}
          <section className="rounded-2xl bg-indigo-600 p-8 text-center">
            <h2 className="text-2xl font-bold text-white">
              Ready to automate your competitor tracking?
            </h2>
            <p className="mt-3 text-indigo-100">
              Free for 3 URLs. $29/mo unlimited. No credit card required.
            </p>
            <div className="mt-6">
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-base font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
              >
                Start tracking — free
              </a>
            </div>
          </section>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">
              P
            </div>
            <span className="text-sm font-medium text-gray-500">PagePulse</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} PagePulse. AI-powered competitive
            intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
