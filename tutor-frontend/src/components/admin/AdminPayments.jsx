import React, { useState, useEffect } from "react";
import { get, post, put } from "../../api/api";
import { CheckCircle, Clock, Plus } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    student: "",
    amount: "",
    month: "",
  });

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    const interval = setInterval(fetchPayments, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const fetchPayments = async () => {
    try {
      const data = await get("/admin/payments/", true);
      setPayments(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payments. " + (err.msg || ""));
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await get("/admin/users/", true);
      setStudents(data.filter((u) => u.role === "student"));
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch students. " + (err.msg || ""));
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await put(`/admin/payments/${id}/`, { status }, true);
      toast.success("Payment status updated");
      fetchPayments();
    } catch (err) {
      toast.error("Failed to update payment");
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await post("/admin/payments/", formData, true);
      toast.success("Payment record added");
      setShowAdd(false);
      setFormData({ student: "", amount: "", month: "" });
      fetchPayments();
    } catch (err) {
      toast.error("Failed to add payment");
    }
  };

  if (loading) return <div>Loading payments...</div>;

  return (
    <div className="page-enter-active">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h2>Fee & Payment Management</h2>
        <button
          className="btn btn-modern btn-gradient"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus size={18} /> {showAdd ? "Cancel" : "Record Payment"}
        </button>
      </div>

      {showAdd && (
        <div
          className="card card-modern slide-in-bottom"
          style={{ marginBottom: "20px" }}
        >
          <form
            onSubmit={handleAddPayment}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr auto",
              gap: "15px",
              alignItems: "end",
            }}
          >
            <div>
              <label className="small">Student</label>
              <select
                className="input-modern"
                required
                value={formData.student}
                onChange={(e) =>
                  setFormData({ ...formData, student: e.target.value })
                }
              >
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="small">Amount (₹)</label>
              <input
                type="number"
                className="input-modern"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>
            <div>
              <label className="small">Timing (Month)</label>
              <input
                type="month"
                className="input-modern"
                required
                value={formData.month}
                onChange={(e) =>
                  setFormData({ ...formData, month: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              className="btn btn-modern btn-gradient"
              style={{ height: "42px" }}
            >
              Save
            </button>
          </form>
        </div>
      )}

      <div
        className="card card-modern slide-in-bottom delay-100"
        style={{ padding: "0", overflow: "hidden" }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead
            style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}
          >
            <tr>
              <th style={{ padding: "20px", textAlign: "left" }}>Student</th>
              <th style={{ padding: "20px", textAlign: "left" }}>Timing</th>
              <th style={{ padding: "20px", textAlign: "left" }}>Amount</th>
              <th style={{ padding: "20px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "20px", textAlign: "left" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{ padding: "20px", textAlign: "center" }}
                >
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "20px" }}>
                    {p.student?.name || "Unknown"}
                  </td>
                  <td style={{ padding: "20px", fontSize: "0.85rem" }}>
                    {p.timing || p.month}
                  </td>
                  <td style={{ padding: "20px" }}>₹{p.amount}</td>
                  <td style={{ padding: "20px" }}>
                    <span
                      style={{
                        color: p.status === "paid" ? "#10b981" : "#f59e0b",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontWeight: "600",
                      }}
                    >
                      {p.status === "paid" ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: "20px" }}>
                    {p.status === "pending" && (
                      <button
                        onClick={() => handleUpdateStatus(p._id, "paid")}
                        className="btn btn-modern btn-outline-modern"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      >
                        Mark as Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
