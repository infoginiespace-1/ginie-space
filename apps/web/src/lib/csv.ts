export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | undefined | null>>
): void {
  const escapeCell = (val: string | number | undefined | null): string => {
    const raw = val === undefined || val === null ? "" : String(val);
    const normalized = raw.replace(/\r?\n/g, " ");
    if (normalized.includes(",") || normalized.includes('"')) {
      return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
  };

  const csvContent = [
    headers.map(escapeCell).join(","),
    ...rows.map((r) => r.map(escapeCell).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
