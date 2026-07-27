import * as cheerio from "cheerio";

export interface ScrapedPage {
  title: string;
  content: string; // cleaned text content
  rawHtml: string;
}

export async function scrapeUrl(url: string): Promise<ScrapedPage> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "PagePulse/1.0 (competitive intelligence tool; +https://pagepulse.dev)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove script, style, noscript, and other non-content elements
  $("script, style, noscript, iframe, nav, footer, header, .sidebar, #sidebar, [role='navigation']").remove();

  const title = $("title").text().trim() || url;
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  return {
    title,
    content: bodyText.slice(0, 50000), // cap at 50k chars
    rawHtml: html.slice(0, 200000), // cap at 200k chars
  };
}
