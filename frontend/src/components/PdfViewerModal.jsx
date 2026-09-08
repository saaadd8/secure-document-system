import { useEffect } from "react";

export default function PdfViewerModal({ documentName, url, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Viewing ${documentName}`}>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Secure PDF view</p><h2 className="truncate font-semibold text-slate-900" title={documentName}>{documentName}</h2></div>
          <div className="flex shrink-0 gap-2"><a href={url} target="_blank" rel="noreferrer" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Open in tab</a><button type="button" onClick={onClose} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">Close</button></div>
        </div>
        <iframe title={`PDF preview: ${documentName}`} src={url} className="min-h-0 flex-1 bg-slate-100" />
      </div>
    </div>
  );
}
