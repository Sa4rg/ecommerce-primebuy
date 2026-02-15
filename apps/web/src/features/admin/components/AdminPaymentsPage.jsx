// Admin Payments Page - Review and manage submitted payments
import { useEffect, useState } from "react";
import { adminService } from "../adminService";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "submitted", label: "Pending Review" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
];

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, paymentId: null });
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  async function loadPayments() {
    setLoading(true);
    setError("");
    try {
      const filters = statusFilter ? { status: statusFilter } : {};
      const data = await adminService.listPayments(filters);
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(paymentId) {
    if (!window.confirm("Are you sure you want to CONFIRM this payment? This will automatically create the order.")) return;
    
    setActionLoading(paymentId);
    try {
      const result = await adminService.confirmPayment(paymentId);
      alert(`Payment confirmed! Order created: ${result.order?.orderId || 'N/A'}`);
      await loadPayments();
    } catch (err) {
      alert("Error: " + (err.message || "Failed to confirm"));
    } finally {
      setActionLoading(null);
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
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setActionLoading(rejectModal.paymentId);
    try {
      await adminService.rejectPayment(rejectModal.paymentId, rejectReason);
      closeRejectModal();
      await loadPayments();
    } catch (err) {
      alert("Error: " + (err.message || "Failed to reject"));
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleString();
  }

  function formatAmount(payment) {
    if (payment.currency === "USD") {
      return `$${payment.amountUSD?.toFixed(2) ?? "?"} USD`;
    }
    return `Bs. ${payment.amountVES?.toFixed(2) ?? "?"} VES`;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Admin: Payments</h1>

      {/* Filter */}
      <div style={{ marginBottom: "20px" }}>
        <label>Filter by status: </label>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "8px", fontSize: "14px" }}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <button 
          onClick={loadPayments} 
          style={{ marginLeft: "10px", padding: "8px 16px" }}
        >
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
      )}

      {/* Loading */}
      {loading && <p>Loading...</p>}

      {/* Payments Table */}
      {!loading && payments.length === 0 && (
        <p>No payments found.</p>
      )}

      {!loading && payments.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0", textAlign: "left" }}>
              <th style={thStyle}>Payment ID</th>
              <th style={thStyle}>Method</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Reference</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Submitted At</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.paymentId} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={tdStyle}>
                  <code style={{ fontSize: "12px" }}>{p.paymentId?.slice(0, 8)}...</code>
                </td>
                <td style={tdStyle}>{p.method}</td>
                <td style={tdStyle}>{formatAmount(p)}</td>
                <td style={tdStyle}>{p.reference || "-"}</td>
                <td style={tdStyle}>
                  <StatusBadge status={p.status} />
                </td>
                <td style={tdStyle}>{formatDate(p.submittedAt)}</td>
                <td style={tdStyle}>
                  {p.status === "submitted" && (
                    <>
                      <button
                        onClick={() => handleConfirm(p.paymentId)}
                        disabled={actionLoading === p.paymentId}
                        style={{ ...btnStyle, background: "#28a745", color: "#fff" }}
                      >
                        {actionLoading === p.paymentId ? "..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => openRejectModal(p.paymentId)}
                        disabled={actionLoading === p.paymentId}
                        style={{ ...btnStyle, background: "#dc3545", color: "#fff", marginLeft: "5px" }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {p.status !== "submitted" && <span style={{ color: "#999" }}>-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Reject Payment</h3>
            <p>Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              style={{ width: "100%", minHeight: "80px", padding: "8px" }}
            />
            <div style={{ marginTop: "15px", textAlign: "right" }}>
              <button onClick={closeRejectModal} style={{ marginRight: "10px" }}>
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                style={{ background: "#dc3545", color: "#fff", padding: "8px 16px", border: "none" }}
              >
                {actionLoading ? "..." : "Reject Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: { bg: "#ffc107", color: "#000" },
    submitted: { bg: "#17a2b8", color: "#fff" },
    confirmed: { bg: "#28a745", color: "#fff" },
    rejected: { bg: "#dc3545", color: "#fff" },
  };
  const c = colors[status] || { bg: "#6c757d", color: "#fff" };
  
  return (
    <span style={{
      background: c.bg,
      color: c.color,
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "bold",
    }}>
      {status}
    </span>
  );
}

const thStyle = { padding: "12px 8px", borderBottom: "2px solid #ddd" };
const tdStyle = { padding: "12px 8px" };
const btnStyle = { padding: "6px 12px", border: "none", borderRadius: "4px", cursor: "pointer" };
const modalOverlay = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};
const modalContent = {
  background: "#fff",
  padding: "20px",
  borderRadius: "8px",
  width: "400px",
  maxWidth: "90%",
};
