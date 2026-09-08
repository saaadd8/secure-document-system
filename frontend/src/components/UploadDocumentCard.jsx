import { useRef, useState } from "react";

import { ApiError, documentsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Alert, LoadingButton } from "./ui";

export default function UploadDocumentCard({ onUploaded }) {
  const { token } = useAuth();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [uploading, setUploading] = useState(false);

  const upload = async (event) => {
    event.preventDefault();
    if (!file) {
      setStatus({ type: "error", message: "Choose a PDF first." });
      return;
    }
    setUploading(true);
    setStatus({ type: "", message: "" });
    try {
      await documentsApi.upload(token, file);
      setFile(null);
      inputRef.current.value = "";
      setStatus({ type: "success", message: "Document uploaded successfully." });
      await onUploaded();
    } catch (error) {
      setStatus({ type: "error", message: error instanceof ApiError ? error.message : "Upload failed. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700" aria-hidden="true">PDF</div>
        <div><h2 className="font-semibold text-slate-900">Upload a document</h2><p className="mt-1 text-sm text-slate-500">PDF files only. A SHA-256 integrity hash is recorded automatically.</p></div>
      </div>
      <form onSubmit={upload} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="flex min-h-11 flex-1 cursor-pointer items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-600 hover:border-blue-400 hover:bg-blue-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <input ref={inputRef} className="sr-only" type="file" accept="application/pdf,.pdf" aria-label="Choose a PDF document to upload" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          {file ? file.name : "Choose a PDF file"}
        </label>
        <LoadingButton loading={uploading} loadingLabel="Uploading..." className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Upload PDF</LoadingButton>
      </form>
      {status.message && <Alert variant={status.type === "success" ? "success" : "error"} className="mt-3">{status.message}</Alert>}
    </section>
  );
}
