function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDate(value) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

function IntegrityBadge({ result }) {
  if (!result) return <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-slate-300" />Not checked</span>;
  return result.valid
    ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />VALID</span>
    : <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700"><span className="h-2 w-2 rounded-full bg-rose-500" />INVALID</span>;
}

function ActionButton({ children, onClick, disabled = false }) { return <button onClick={onClick} disabled={disabled} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">{children}</button>; }

export default function DocumentTable({ documents, verification, busyAction, onDownload, onVerify, onShare }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-900">My documents</h2><p className="mt-0.5 text-sm text-slate-500">{documents.length} document{documents.length === 1 ? "" : "s"} stored securely</p></div></div><div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-medium">Document</th><th className="px-5 py-3 font-medium">Details</th><th className="px-5 py-3 font-medium">Integrity</th><th className="px-5 py-3 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{documents.map((document) => <tr key={document.id} className="align-top"><td className="px-5 py-4"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-50 text-xs font-bold text-rose-600">PDF</span><div className="min-w-45"><p className="max-w-56 truncate text-sm font-semibold text-slate-900" title={document.filename}>{document.filename}</p><p className="mt-1 font-mono text-[11px] text-slate-400" title={document.sha256_hash}>SHA-256 {document.sha256_hash.slice(0, 12)}…</p></div></div></td><td className="px-5 py-4 text-sm text-slate-600"><p>{document.document_type} · {formatBytes(document.file_size)}</p><p className="mt-1 text-xs text-slate-400">Created {formatDate(document.created_at)}</p></td><td className="px-5 py-4"><IntegrityBadge result={verification[document.id]} /></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><ActionButton disabled={busyAction === `download-${document.id}`} onClick={() => onDownload(document)}>{busyAction === `download-${document.id}` ? "Downloading…" : "Download"}</ActionButton><ActionButton disabled={busyAction === `verify-${document.id}`} onClick={() => onVerify(document)}>{busyAction === `verify-${document.id}` ? "Checking…" : "Verify"}</ActionButton><ActionButton onClick={() => onShare(document)}>Share</ActionButton></div></td></tr>)}</tbody></table></div></div>;
}
