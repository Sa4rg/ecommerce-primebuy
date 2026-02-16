// src/shared/layout/AppLayout.jsx
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar.jsx";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#221910] text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <Outlet />
      </main>
    </div>
  );
}
