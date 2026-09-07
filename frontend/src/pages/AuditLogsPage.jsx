import { useCallback, useEffect, useState } from "react";

import { ApiError, auditLogsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const ACTIONS = ["UPLOAD", "DOWNLOAD", "VERIFY", "SHARE", "REVOKE_SHARE"];

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
}

export default function AuditLogsPage() {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ documentId: "", action: "" });
  const [appliedFilters, setAppliedFilters] = useState({ documentId: "", action: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    setError("");
    try { setLogs(await auditLogsApi.list(token, appliedFilters)); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Unable to load audit logs."); }
    finally { setLoading(false); }
  }, [appliedFilters, token]);

  useEffect(() => { if (user.role === "ADMIN") loadLogs(); }, [loadLogs, user.role]);

  if (user.role !== "ADMIN") return <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8"><p className="text-sm font-semibold text-amber-700">Restricted area</p><h1 className="mt-2 text-2xl font-bold text-slate-950">Admin access required</h1><p className="mt-3 text-slate-600">Your account does not have permission to view audit logs.</p></div>;

  const submit = (event) => { event.preventDefault(); setLoading(true); setAppliedFilters(filters); };
  const clear = () => { const empty = { documentId: "", action: "" }; setFilters(empty); setLoading(true); setAppliedFilters(empty); };

  return <div className="mx-auto max-w-7xl"><p className="text-sm font-semibold text-blue-600">Administration</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Audit logs</h1><p className="mt-2 text-slate-600">Review recorded document activity across the system.</p><form onSubmit={submit} className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto_auto]"><label className="text-sm font-medium text-slate-700">Document ID<input min="1" type="number" value={filters.documentId} onChange={(event) => setFilters({ ...filters, documentId: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><label className="text-sm font-medium text-slate-700">Action<select value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"><option value="">All actions</option>{ACTIONS.map((action) => <option key={action} value={action}>{action}</option>)}</select></label><button className="self-end rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Apply filters</button><button type="button" onClick={clear} className="self-end rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Clear</button></form>{error && <div className="mt-5 flex justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button onClick={() => { setLoading(true); loadLogs(); }} className="font-semibold">Retry</button></div>}<section className="mt-6">{loading ? <div className="grid min-h-70 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">Loading audit logs…</div> : logs.length ? <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">ID</th><th className="px-5 py-3">User ID</th><th className="px-5 py-3">Document ID</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Timestamp</th><th className="px-5 py-3">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{logs.map((log) => <tr key={log.id}><td className="px-5 py-4 font-mono text-xs text-slate-600">{log.id}</td><td className="px-5 py-4 text-slate-700">{log.user_id ?? "—"}</td><td className="px-5 py-4 text-slate-700">{log.document_id ?? "—"}</td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{log.action}</span></td><td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(log.timestamp)}</td><td className="max-w-90 px-5 py-4 text-slate-600">{log.details || "—"}</td></tr>)}</tbody></table></div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><h2 className="text-lg font-semibold text-slate-900">No audit logs found</h2><p className="mt-2 text-sm text-slate-500">Try clearing the filters or check again after document activity occurs.</p></div>}</section></div>;
}
