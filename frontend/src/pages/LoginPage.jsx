import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { Alert, LoadingButton } from "../components/ui";
import { ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const submit = async (event) => { event.preventDefault(); setError(""); setSubmitting(true); try { await signIn(form); navigate(location.state?.from?.pathname || "/", { replace: true }); } catch (err) { setError(err instanceof ApiError ? err.message : "Unable to sign in. Please try again."); } finally { setSubmitting(false); } };
  return <AuthShell title="Welcome back" subtitle="Sign in to your secure document workspace"><form onSubmit={submit} className="space-y-4" aria-busy={submitting || undefined}><Field label="Email" type="email" autoComplete="email" value={form.email} onChange={(email) => setForm({ ...form, email })} /><Field label="Password" type="password" autoComplete="current-password" value={form.password} onChange={(password) => setForm({ ...form, password })} />{error && <Alert variant="error">{error}</Alert>}<LoadingButton type="submit" loading={submitting} loadingLabel="Signing in..." className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Sign in</LoadingButton></form><p className="mt-6 text-center text-sm text-slate-500">New here? <Link className="font-medium text-blue-600 hover:underline focus-visible:rounded" to="/register">Create an account</Link></p></AuthShell>;
}

export function AuthShell({ title, subtitle, children }) { return <div className="grid min-h-screen place-items-center bg-slate-950 p-6"><main className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"><div className="mb-8"><div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-blue-600 font-bold text-white" aria-hidden="true">S</div><h1 className="text-2xl font-bold text-slate-900">{title}</h1><p className="mt-2 text-sm text-slate-500">{subtitle}</p></div>{children}</main></div>; }
export function Field({ label, type, value, onChange, autoComplete }) { const id = `auth-${label.toLowerCase().replaceAll(" ", "-")}`; return <label className="block text-sm font-medium text-slate-700" htmlFor={id}>{label}<input id={id} required type={type} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>; }
