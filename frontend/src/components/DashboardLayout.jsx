import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const navigation = [
  { label: "Overview", to: "/" },
  { label: "My documents", to: "/documents" },
  { label: "Shared with me", to: "/shared" },
];

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };
  const visibleNavigation = user.role === "ADMIN"
    ? [...navigation, { label: "Audit logs", to: "/audit-logs" }]
    : navigation;

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="flex flex-col bg-slate-950 px-5 py-6 text-slate-100">
        <div className="mb-10 flex items-center gap-3 px-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 font-bold">S</span><span className="font-semibold">SecureDocs</span></div>
        <nav className="space-y-1">{visibleNavigation.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm ${isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}>{item.label}</NavLink>)}</nav>
        <div className="mt-auto rounded-xl border border-slate-800 p-3"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-xs text-slate-400">{user.email}</p><button onClick={handleSignOut} className="mt-3 text-xs font-medium text-slate-300 hover:text-white">Sign out</button></div>
      </aside>
      <main className="p-6 sm:p-10"><Outlet /></main>
    </div>
  );
}
