import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alert, LoadingButton } from "../components/ui";
import { authApi, ApiError } from "../lib/api";
import { AuthShell, Field } from "./LoginPage";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => { event.preventDefault(); setError(""); setSubmitting(true); try { await authApi.register(form); navigate("/login", { replace: true }); } catch (err) { setError(err instanceof ApiError ? err.message : "Unable to register. Please try again."); } finally { setSubmitting(false); } };
  return <AuthShell title="Create your account" subtitle="Start managing documents securely"><form onSubmit={submit} className="space-y-4" aria-busy={submitting || undefined}><Field label="Name" type="text" autoComplete="name" value={form.name} onChange={(name) => setForm({ ...form, name })} /><Field label="Email" type="email" autoComplete="email" value={form.email} onChange={(email) => setForm({ ...form, email })} /><Field label="Password" type="password" autoComplete="new-password" value={form.password} onChange={(password) => setForm({ ...form, password })} />{error && <Alert variant="error">{error}</Alert>}<LoadingButton type="submit" loading={submitting} loadingLabel="Creating account..." className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Create account</LoadingButton></form><p className="mt-6 text-center text-sm text-slate-500">Already registered? <Link className="font-medium text-blue-600 hover:underline focus-visible:rounded" to="/login">Sign in</Link></p></AuthShell>;
}
