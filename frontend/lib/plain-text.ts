/** Strip HTML (e.g. Text Editor fields) to plain text for display and summaries. */
export function htmlToPlainText(value: string | undefined | null): string {
  if (!value) return "";
  const s = String(value);
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = s;
    return (el.textContent || el.innerText || "").replace(/\s+/g, " ").trim();
  }
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
