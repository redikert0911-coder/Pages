import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: () => {
    // Redirect to dashboard — if not signed in, dashboard will handle it
    throw redirect({ to: "/dashboard" });
  },
});
