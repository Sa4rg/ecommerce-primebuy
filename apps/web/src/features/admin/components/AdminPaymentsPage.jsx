// web/src/features/admin/components/AdminPaymentsPage.jsx
// Admin Payments Page - Stitch-like UI (Tailwind) + backend real via adminService

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../adminService";

function formatUSD(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatVES(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  // Simple format; si quieres locale "es-VE", cámbialo
  return num.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCompactDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function prettyMethod(method) {
  const m = String(method || "").toLowerCase();
  if (m === "zelle") return "Zelle";
  if (m === "zinli") return "Zinli";
  if (m === "pago_movil") return "Pago Móvil";
  if (m === "bank_transfer") return "Bank Transfer";
  return method || "-";
}

function methodIcon(method) {
  const m = String(method || "").toLowerCase();
  if (m === "zelle" || m === "zinli") return "🏦";
  if (m === "pago_movil") return "📱";
  if (m === "bank_transfer") return "🏛️";
  return "💳";
}

function statusMeta(status) {
  const s = String(status || "").toLowerCase();

  if (s === "submitted") {
    return {
      label: "Pending Review",
      pill: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      dot: "bg-yellow-400",
    };
  }
  if (s === "confirmed") {
    return {
      label: "Confirmed",
      pill: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      dot: "bg-emerald-400",
    };
  }
  if (s === "rejected") {
    return {
      label: "Rejected",
      pill: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      dot: "bg-rose-400",
    };
  }

  return {
    label: status || "Pending",
    pill: "bg-white/10 text-slate-300 border-white/10",
    dot: "bg-slate-300",
  };
}

function getPaymentId(p) {
  return p?.paymentId || p?.id || p?._id || "";
}

function getReference(p) {
  // backend: proof.reference
  return p?.proof?.reference || p?.reference || p?.proofReference || "-";
}

function formatAmount(payment) {
  const currency = String(payment?.currency || "").toUpperCase();

  // backend: amount + currency
  const amount = Number(payment?.amount);
  if (Number.isNaN(amount)) return "?";

  if (currency === "USD") return `${formatUSD(amount)} USD`;
  if (currency === "VES") return `Bs. ${formatVES(amount)} VES`;

  // fallback
  return `${amount} ${currency || ""}`.trim();
}

function exportPaymentsToCsv(payments) {
  const headers = ["paymentId", "method", "currency", "amount", "reference", "status", "createdAt", "updatedAt"];
  const rows = (payments || []).map((p) => [
    getPaymentId(p),
    p.method || "",
    p.currency || "",
    String(p.amount ?? ""),
    getReference(p),
    p.status || "",
    p.createdAt || "",
    p.updatedAt || "",
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          const escaped = s.replaceAll('"', '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payments_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [error, setError] = useState("");

  // Stitch-like UI
  const [activeTab, setActiveTab] = useState("all"); // all | submitted | confirmed | rejected
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // actions
  const [confirmingId, setConfirmingId] = useState("");
  const [rejectingId, setRejectingId] = useState("");

  const [rejectModal, setRejectModal] = useState({ open: false, paymentId: null });
  const [rejectReason, setRejectReason] = useState("");

  const nav = useNavigate();

  async function loadPayments() {
    setStatus("loading");
    setError("");

    try {
      // tu adminService ya soporta filtros: {status}
      const filters = activeTab === "all" ? {} : { status: activeTab };
      const data = await adminService.listPayments(filters);
      setPayments(Array.isArray(data) ? data : []);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Failed to load payments");
    }
  }

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const pendingCount = useMemo(() => {
    // si estás en "all", esto es exacto; si estás filtrando, es “lo que estás viendo”
    return payments.filter((p) => String(p.status).toLowerCase() === "submitted").length;
  }, [payments]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = payments;

    if (query) {
      list = list.filter((p) => {
        const pid = String(getPaymentId(p)).toLowerCase();
        const method = String(p.method || "").toLowerCase();
        const ref = String(getReference(p)).toLowerCase();
        return pid.includes(query) || method.includes(query) || ref.includes(query);
      });
    }

    // order by newest updated/created first
    return [...list].sort((a, b) => {
      const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return db - da;
    });
  }, [payments, q]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [q, activeTab]);

  async function handleConfirm(paymentId) {
    if (!paymentId) return;

    const ok = window.confirm(
      "Are you sure you want to CONFIRM this payment?\nThis will create the order and decrement stock."
    );
    if (!ok) return;

    setError("");
    setConfirmingId(String(paymentId));
    try {
      const result = await adminService.confirmPayment(paymentId);
      // Mantengo tu alert (como en tu UI original)
      window.alert(`Payment confirmed! Order created: ${result?.order?.orderId || "N/A"}`);
      await loadPayments();
    } catch (err) {
      setError(err?.message || "Failed to confirm");
      window.alert("Error: " + (err?.message || "Failed to confirm"));
    } finally {
      setConfirmingId("");
    }
  }

  function openRejectModal(paymentId) {
    setRejectModal({ open: true, paymentId });
    setRejectReason("");
  }

  function closeRejectModal() {
    setRejectModal({ open: false, paymentId: null });
    setRejectReason("");
  }

  async function handleReject() {
    if (!rejectModal.paymentId) return;

    if (!rejectReason.trim()) {
      window.alert("Please provide a reason for rejection");
      return;
    }

    setError("");
    setRejectingId(String(rejectModal.paymentId));
    try {
      await adminService.rejectPayment(rejectModal.paymentId, rejectReason.trim());
      closeRejectModal();
      await loadPayments();
    } catch (err) {
      setError(err?.message || "Failed to reject");
      window.alert("Error: " + (err?.message || "Failed to reject"));
    } finally {
      setRejectingId("");
    }
  }

  // Summary widgets (simple real data)
  const summary = useMemo(() => {
    const list = filtered;

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    const isToday = (iso) => {
      if (!iso) return false;
      const dt = new Date(iso);
      if (Number.isNaN(dt.getTime())) return false;
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    };

    const confirmedToday = list.filter(
      (p) => String(p.status).toLowerCase() === "confirmed" && isToday(p.updatedAt || p.createdAt)
    );

    const todaysRevenueUsd = confirmedToday
      .filter((p) => String(p.currency).toUpperCase() === "USD")
      .reduce((acc, p) => acc + Number(p.amount || 0), 0);

    const unverified = list.filter((p) => String(p.status).toLowerCase() === "submitted").length;

    return { todaysRevenueUsd, unverified };
  }, [filtered]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Admin · Payments</h1>
          <p className="text-slate-400 mt-2 text-lg">Review and manage customer payment submissions.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => exportPaymentsToCsv(filtered)}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
          >
            <span aria-hidden>⬇</span>
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => window.alert("Coming soon: manual record creation")}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-500/90 px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all"
          >
            <span aria-hidden>＋</span>
            New Record
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={[
            "px-6 py-2.5 rounded-full text-sm font-semibold transition-all",
            activeTab === "all"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5",
          ].join(" ")}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("submitted")}
          className={[
            "px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2",
            activeTab === "submitted"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5",
          ].join(" ")}
        >
          Pending Review
          <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full text-[10px] font-black">
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("confirmed")}
          className={[
            "px-6 py-2.5 rounded-full text-sm font-semibold transition-all",
            activeTab === "confirmed"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5",
          ].join(" ")}
        >
          Confirmed
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rejected")}
          className={[
            "px-6 py-2.5 rounded-full text-sm font-semibold transition-all",
            activeTab === "rejected"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5",
          ].join(" ")}
        >
          Rejected
        </button>

        <div className="ml-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 text-slate-400 text-sm w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔎</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-500"
              placeholder="Search transactions..."
              type="text"
            />
          </div>

          <div className="flex items-center gap-3">
            <span>
              Showing {total === 0 ? 0 : start + 1}-{Math.min(start + pageItems.length, total)} of {total} entries
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1 hover:text-white disabled:opacity-30"
                aria-label="Prev"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1 hover:text-white disabled:opacity-30"
                aria-label="Next"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Panel */}
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-5 text-sm font-semibold text-slate-300">Payment ID</th>
                <th className="px-6 py-5 text-sm font-semibold text-slate-300">Method</th>
                <th className="px-6 py-5 text-sm font-semibold text-slate-300">Amount</th>
                <th className="px-6 py-5 text-sm font-semibold text-slate-300">Reference</th>
                <th className="px-6 py-5 text-sm font-semibold text-slate-300">Status</th>
                <th className="px-6 py-5 text-sm font-semibold text-slate-300">Submitted At</th>
                <th className="px-6 py-5 text-sm font-semibold text-slate-300 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {status === "loading" && (
                <tr>
                  <td className="px-6 py-6 text-slate-400" colSpan={7}>
                    Loading...
                  </td>
                </tr>
              )}

              {status !== "loading" && pageItems.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-slate-400" colSpan={7}>
                    No payments found.
                  </td>
                </tr>
              )}

              {pageItems.map((p) => {
                const pid = getPaymentId(p);
                const meta = statusMeta(p.status);
                const isPending = String(p.status).toLowerCase() === "submitted";
                const busy = confirmingId === String(pid) || rejectingId === String(pid);

                return (
                  <tr key={pid} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-5 text-sm font-bold text-white">
                      {pid ? `#${String(pid).slice(0, 8)}` : "-"}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-400 text-lg" aria-hidden>
                          {methodIcon(p.method)}
                        </span>
                        <span className="text-sm text-slate-300">{prettyMethod(p.method)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm font-bold text-white">{formatAmount(p)}</td>

                    <td className="px-6 py-5 text-sm font-mono text-slate-400">{getReference(p)}</td>

                    <td className="px-6 py-5">
                      <span
                        className={[
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                          meta.pill,
                        ].join(" ")}
                      >
                        <span className={["w-1.5 h-1.5 rounded-full", meta.dot].join(" ")} />
                        {meta.label}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-400">
                      {formatCompactDate(p.submittedAt || p.updatedAt || p.createdAt)}
                    </td>

                    <td className="px-6 py-5 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleConfirm(pid)}
                            disabled={busy}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-60"
                          >
                            {confirmingId === String(pid) ? "Confirming..." : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openRejectModal(pid)}
                            disabled={busy}
                            className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60"
                          >
                            {rejectingId === String(pid) ? "Rejecting..." : "Reject"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => nav(`/admin/payments/${pid}`)}
                          className="bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 transition-all"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Rows per page: <b>{pageSize}</b>
          </p>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              const n = idx + 1;
              const active = n === safePage;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={[
                    "w-10 h-10 rounded-lg flex items-center justify-center text-sm transition-all",
                    active
                      ? "bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20"
                      : "hover:bg-white/10 text-slate-400 font-medium",
                  ].join(" ")}
                >
                  {n}
                </button>
              );
            })}

            {totalPages > 5 && <span className="text-slate-600 px-2">...</span>}

            {totalPages > 5 && (
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 text-slate-400 text-sm font-medium"
              >
                {totalPages}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6 rounded-2xl">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Today's Revenue (USD)</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-bold text-white">{formatUSD(summary.todaysRevenueUsd)}</h3>
            <span className="text-emerald-400 text-sm font-bold flex items-center bg-emerald-500/10 px-2 py-1 rounded-lg">
              +12.5%
            </span>
          </div>
        </div>

        <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6 rounded-2xl">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Unverified Payments</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-bold text-white">{summary.unverified}</h3>
            <span className="text-yellow-400 text-sm font-bold flex items-center bg-yellow-500/10 px-2 py-1 rounded-lg">
              High Priority
            </span>
          </div>
        </div>

        <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6 rounded-2xl">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">System Health</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-bold text-white">Active</h3>
            <div className="flex gap-1 items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold">Stable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal (Tailwind) */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#221910] p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Reject Payment</h3>
            <p className="mt-2 text-sm text-slate-400">Please provide a reason for rejection:</p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="mt-4 w-full min-h-[96px] rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-500"
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={rejectingId}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={rejectingId}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500/90 disabled:opacity-60"
              >
                {rejectingId ? "Rejecting..." : "Reject Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
