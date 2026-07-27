export interface DiffSegment {
  type: "added" | "removed" | "unchanged";
  text: string;
}

// Simple word-level diff between two texts.
// Returns segments useful for rendering highlighted diffs.
export function diffTexts(oldText: string, newText: string): DiffSegment[] {
  const oldWords = tokenize(oldText);
  const newWords = tokenize(newText);
  const segments: DiffSegment[] = [];

  // Compute LCS matrix for word-level diff
  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  // Backtrack to build diff
  const result: DiffSegment[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ type: "unchanged", text: oldWords[i - 1]! });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      result.unshift({ type: "added", text: newWords[j - 1]! });
      j--;
    } else if (i > 0) {
      result.unshift({ type: "removed", text: oldWords[i - 1]! });
      i--;
    }
  }

  // Merge adjacent segments of the same type
  for (let k = result.length - 1; k > 0; k--) {
    if (result[k]!.type === result[k - 1]!.type) {
      result[k - 1]!.text = result[k - 1]!.text + result[k]!.text;
      result.splice(k, 1);
    }
  }

  return result;
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

// Check if there are meaningful changes between two texts.
// Filters out trivial changes (small whitespace, timestamps).
export function hasMeaningfulChanges(
  oldText: string,
  newText: string,
): boolean {
  const oldNorm = normalizeForComparison(oldText);
  const newNorm = normalizeForComparison(newText);
  if (oldNorm === newNorm) return false;

  // Check that at least 1% of text changed and at least 20 chars differ
  const diffs = diffTexts(oldText, newText);
  const changedChars = diffs
    .filter((d) => d.type !== "unchanged")
    .reduce((sum, d) => sum + d.text.length, 0);
  const totalChars = Math.max(oldText.length, newText.length);
  return changedChars > 20 && changedChars / totalChars > 0.005;
}

function normalizeForComparison(text: string): string {
  return text
    .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}.*?(Z|[+-]\d{2}:?\d{2})?/g, "") // ISO dates
    .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, "") // US dates
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "") // UUIDs
    .replace(/\s+/g, " ")
    .trim();
}

export function summarizeChanges(diffs: DiffSegment[]): {
  addedCount: number;
  removedCount: number;
  summary: string;
} {
  let addedCount = 0;
  let removedCount = 0;

  for (const d of diffs) {
    if (d.type === "added") addedCount += d.text.length;
    if (d.type === "removed") removedCount += d.text.length;
  }

  const parts: string[] = [];
  if (addedCount > 0) parts.push(`~${Math.round(addedCount / 10) * 10} chars added`);
  if (removedCount > 0) parts.push(`~${Math.round(removedCount / 10) * 10} chars removed`);

  return {
    addedCount,
    removedCount,
    summary: parts.length > 0 ? parts.join(", ") : "no meaningful changes",
  };
}
