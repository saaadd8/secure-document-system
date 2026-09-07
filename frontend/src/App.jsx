import { Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuditLogsPage from "./pages/AuditLogsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SharedWithMePage from "./pages/SharedWithMePage";

function PlaceholderPage({ title }) { return <div><p className="text-sm font-medium text-blue-600">Coming next</p><h1 className="mt-2 text-3xl font-bold">{title}</h1><p className="mt-3 text-slate-600">The dashboard foundation is ready; this workflow has not been implemented yet.</p></div>; }

export default function App() {
  return <Routes><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route element={<ProtectedRoute />}><Route element={<DashboardLayout />}><Route path="/" element={<DashboardPage />} /><Route path="/documents" element={<DashboardPage />} /><Route path="/shared" element={<SharedWithMePage />} /><Route path="/audit-logs" element={<AuditLogsPage />} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
