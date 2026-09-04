function toTime24(hStr: string, mStr: string | undefined, ampm?: string): string {
  let h = parseInt(hStr, 10);
  if (ampm) {
    h = h % 12;
    if (ampm.toLowerCase() === "pm") h += 12;
  }
  const m = mStr ? parseInt(mStr, 10) : 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Detects a spoken-style time in a task title ("Call mom at 3pm", "Standup
 * 9:30am", "Due at 14:00") and returns the parsed 24h time plus the title
 * with that phrase removed, Todoist-quick-add style. Returns null if no
 * confident time phrase is found. */
export function detectTimeFromTitle(title: string): { time: string; cleanedTitle: string } | null {
  const ampmRegex = /\b(?:at\s+)?(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\b/i;
  const ampmMatch = title.match(ampmRegex);
  if (ampmMatch) {
    const time = toTime24(ampmMatch[1], ampmMatch[2], ampmMatch[3]);
    return { time, cleanedTitle: stripMatch(title, ampmMatch[0]) };
  }

  // 24h form only recognized with an explicit "at" to avoid false positives
  // on other numbers in the title (scores, quantities, etc).
  const h24Regex = /\bat\s+([01]?\d|2[0-3]):([0-5]\d)\b/i;
  const h24Match = title.match(h24Regex);
  if (h24Match) {
    const time = toTime24(h24Match[1], h24Match[2]);
    return { time, cleanedTitle: stripMatch(title, h24Match[0]) };
  }

  return null;
}

function stripMatch(title: string, matched: string): string {
  return title.replace(matched, "").replace(/\s{2,}/g, " ").trim();
}

export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
}
