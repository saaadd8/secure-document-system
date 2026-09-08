import { useCallback, useEffect, useState } from "react";

import DocumentTable from "../components/DocumentTable";
import PdfViewerModal from "../components/PdfViewerModal";
import ShareDialog from "../components/ShareDialog";
import UploadDocumentCard from "../components/UploadDocumentCard";
import { Alert, EmptyState, ErrorState, StatusBadge } from "../components/ui";
import { ApiError, documentsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verification, setVerification] = useState({});
  const [busyAction, setBusyAction] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewer, setViewer] = useState(null);
  const loadDocuments = useCallback(async () => { setError(""); try { setDocuments(await documentsApi.list(token)); } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Unable to load documents."); } finally { setLoading(false); } }, [token]);
  useEffect(() => { loadDocuments(); }, [loadDocuments]);
  const closeViewer = () => { if (viewer) URL.revokeObjectURL(viewer.url); setViewer(null); };
  const view = async (document) => { setBusyAction(`view-${document.id}`); setError(""); try { const { blob } = await documentsApi.view(token, document.id); setViewer({ name: document.filename, url: URL.createObjectURL(blob) }); setNotice("Secure PDF preview opened."); } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Unable to open the document."); } finally { setBusyAction(""); } };
  const download = async (document) => { setBusyAction(`download-${document.id}`); setError(""); try { const { blob, filename } = await documentsApi.download(token, document.id); const url = URL.createObjectURL(blob); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = filename || document.filename; anchor.click(); URL.revokeObjectURL(url); setNotice("Download started."); } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Unable to download the document."); } finally { setBusyAction(""); } };
  const verify = async (document) => { setBusyAction(`verify-${document.id}`); setError(""); try { const result = await documentsApi.verify(token, document.id); setVerification((current) => ({ ...current, [document.id]: result })); setNotice(result.valid ? "Integrity verified: the stored PDF matches its SHA-256 hash." : "Integrity check found a hash mismatch."); } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Unable to verify this document."); } finally { setBusyAction(""); } };
  return <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-blue-600">Secure workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">My documents</h1><p className="mt-2 text-slate-600">Upload a PDF, verify its integrity, then view, download, or share it securely.</p></div><div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">Signed in as <span className="font-semibold text-slate-900">{user.name}</span></div></div><div className="mt-6 flex flex-wrap gap-2"><StatusBadge variant="info">1. Upload</StatusBadge><StatusBadge>2. Verify</StatusBadge><StatusBadge>3. View</StatusBadge><StatusBadge>4. Download</StatusBadge><StatusBadge>5. Share</StatusBadge></div><div className="mt-6"><UploadDocumentCard onUploaded={async () => { await loadDocuments(); setNotice("Document uploaded and ready to verify or share."); }} /></div>{notice && <Alert variant="success" className="mt-5" actionLabel="Dismiss" onAction={() => setNotice("")}>{notice}</Alert>}{error && <ErrorState className="mt-5" message={error} onRetry={() => { setLoading(true); loadDocuments(); }} />}<section className="mt-6">{loading ? <div className="grid min-h-70 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500" role="status" aria-live="polite">Loading your documents...</div> : documents.length ? <DocumentTable documents={documents} verification={verification} busyAction={busyAction} onView={view} onDownload={download} onVerify={verify} onShare={setSelectedDocument} /> : <EmptyState icon="PDF" title="No documents yet" description="Upload your first PDF above, then verify it and share it securely." />}</section>{selectedDocument && <ShareDialog document={selectedDocument} onClose={() => setSelectedDocument(null)} />}{viewer && <PdfViewerModal documentName={viewer.name} url={viewer.url} onClose={closeViewer} />}</div>;
}
