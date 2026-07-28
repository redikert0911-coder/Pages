import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PagePulse — Competitive Intelligence" },
      {
        name: "description",
        content:
          "AI-powered competitive intelligence. Track competitor websites and get weekly AI digests of meaningful changes.",
      },
      { name: "theme-color", content: "#4f46e5" },
      // Open Graph
      { property: "og:title", content: "PagePulse — Competitive Intelligence" },
      {
        property: "og:description",
        content:
          "AI-powered competitive intelligence. Track competitor websites and get weekly AI digests.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%234f46e5'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-family='system-ui' font-weight='700' font-size='18' fill='white'%3EP%3C/text%3E%3C/svg%3E",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-3 text-5xl">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  ),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-gray-50 antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
