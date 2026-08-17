/** Strip HTML (e.g. Text Editor fields) to plain text for display and summaries. */
export function htmlToPlainText(value: string | undefined | null): string {
  if (!value) return "";
  const s = String(value);
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = s;
    const text = el.textContent || el.innerText || "";
    // Handle doubly-encoded HTML (Quill stores escaped <p> tags inside real <p> tags)
    return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
