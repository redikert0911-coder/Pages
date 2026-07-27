export interface EmailDigest {
  to: string;
  url: string;
  urlName: string;
  summary: string;
  changes: string;
}

// Send a digest email. For MVP, this logs the email content and returns success.
// When a real email service is configured, replace the implementation.
export async function sendDigestEmail(digest: EmailDigest): Promise<{ success: boolean; error?: string }> {
  // If we had an email service, we'd use it here.
  // For now, log and succeed — the in-app experience is primary.
  console.log("--- DIGEST EMAIL ---");
  console.log(`To: ${digest.to}`);
  console.log(`Subject: PagePulse Digest: Changes on ${digest.urlName || digest.url}`);
  console.log(`Summary: ${digest.summary}`);
  console.log(`Changes: ${digest.changes.slice(0, 500)}...`);
  console.log("--- END EMAIL ---");

  // Try SendGrid if key is set
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sendgridKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: digest.to }] }],
          from: { email: "digest@pagepulse.dev", name: "PagePulse" },
          subject: `PagePulse Digest: Changes on ${digest.urlName || digest.url}`,
          content: [
            {
              type: "text/plain",
              value: `${digest.summary}\n\nChanges:\n${digest.changes}`,
            },
          ],
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        return { success: false, error: `SendGrid error: ${res.status}` };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return { success: true };
}
