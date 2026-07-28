export interface EmailDigest {
  to: string;
  url: string;
  urlName: string;
  summary: string;
  changes: string;
}

export interface EmailContent {
  subject: string;
  plainText: string;
}

/** Build human-readable digest email content for both email providers and mailto: links. */
export function buildDigestEmailContent(digest: EmailDigest, appUrl: string): EmailContent {
  const displayName = digest.urlName || digest.url;
  const subject = `PagePulse Digest: ${displayName}`;

  let changesText = "";
  try {
    const parsed = JSON.parse(digest.changes);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const d = parsed as Record<string, unknown>;
      if (d.diffSummary) changesText = d.diffSummary as string;
      if (d.titleChanged && d.oldTitle && d.newTitle) {
        changesText += `\nTitle changed: "${d.oldTitle}" → "${d.newTitle}"`;
      }
    }
  } catch {
    // If changes is not JSON or empty, skip
  }

  const plainText = [
    `PagePulse Digest`,
    ``,
    `Tracked URL: ${digest.url}`,
    `Page: ${displayName}`,
    ``,
    `Summary:`,
    digest.summary || "No meaningful changes detected.",
    ``,
    changesText ? `Changes:\n${changesText}` : "",
    ``,
    `View full digest in PagePulse:`,
    appUrl,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, plainText };
}

// Send a digest email via SendGrid if configured, or return a clear error
// so the client can fall back to mailto:.
export async function sendDigestEmail(digest: EmailDigest): Promise<{ success: boolean; error?: string }> {
  console.log("--- DIGEST EMAIL ---");
  console.log(`To: ${digest.to}`);
  console.log(`Subject: PagePulse Digest: Changes on ${digest.urlName || digest.url}`);
  console.log(`Summary: ${digest.summary}`);
  console.log("--- END EMAIL ---");

  // Try SendGrid if key is set
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    try {
      const { subject, plainText } = buildDigestEmailContent(digest, "https://pagepulse.dev");

      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sendgridKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: digest.to }] }],
          from: { email: "digest@pagepulse.dev", name: "PagePulse" },
          subject,
          content: [{ type: "text/plain", value: plainText }],
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        return { success: false, error: `SendGrid error: ${res.status}` };
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // No email provider configured — tell the client to fall back
  return { success: false, error: "NO_PROVIDER" };
}
