import { useCallback, useEffect, useState } from "react";

import DocumentTable from "../components/DocumentTable";
import ShareDialog from "../components/ShareDialog";
import UploadDocumentCard from "../components/UploadDocumentCard";
import { EmptyState, ErrorState } from "../components/ui";
import { ApiError, documentsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState({});
  const [busyAction, setBusyAction] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const loadDocuments = useCallback(async () => { setError(""); try { setDocuments(await documentsApi.list(token)); } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Unable to load documents."); } finally { setLoading(false); } }, [token]);
  useEffect(() => { loadDocuments(); }, [loadDocuments]);
  const download = async (document) => { setBusyAction(`download-${document.id}`); setError(""); try { const { blob, filename } = await documentsApi.download(token, document.id); const url = URL.createObjectURL(blob); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = filename || document.filename; anchor.click(); URL.revokeObjectURL(url); } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Unable to download the document."); } finally { setBusyAction(""); } };
  const verify = async (document) => { setBusyAction(`verify-${document.id}`); setError(""); try { const result = await documentsApi.verify(token, document.id); setVerification((current) => ({ ...current, [document.id]: result })); } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Unable to verify this document."); } finally { setBusyAction(""); } };

  return <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-blue-600">Secure workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">My documents</h1><p className="mt-2 text-slate-600">Upload, verify, and securely retrieve your PDFs.</p></div><div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">Signed in as <span className="font-semibold text-slate-900">{user.name}</span></div></div><div className="mt-8"><UploadDocumentCard onUploaded={loadDocuments} /></div>{error && <div className="mt-5"><ErrorState message={error} onRetry={() => { setLoading(true); loadDocuments(); }} /></div>}<section className="mt-6">{loading ? <div className="grid min-h-70 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500" role="status" aria-live="polite">Loading your documents...</div> : documents.length ? <DocumentTable documents={documents} verification={verification} busyAction={busyAction} onDownload={download} onVerify={verify} onShare={setSelectedDocument} /> : <EmptyState icon="PDF" title="No documents yet" description="Upload your first PDF above to store it securely and create its integrity hash." />}</section>{selectedDocument && <ShareDialog document={selectedDocument} onClose={() => setSelectedDocument(null)} />}</div>;
}
