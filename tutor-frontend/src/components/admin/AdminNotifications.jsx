import React, { useState, useEffect } from "react";
import { get, post } from "../../api/api";
import { toast } from "react-toastify";
import {
  Send,
  Hash,
} from "lucide-react";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [recipientType, setRecipientType] = useState("All Users");
  const [specificUserId, setSpecificUserId] = useState("");
  const [type, setType] = useState("Information");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isImportant, setIsImportant] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await get("/admin/notifications/", true);
      setNotifications(data);
    } catch (err) {
      toast.error("Failed to load sent notifications.");
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await get("/admin/users/", true);
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      return toast.error("Title and Message cannot be empty");
    }

    if (recipientType === "Specific User" && !specificUserId) {
      return toast.error("Please select a specific user from the dropdown");
    }

    setLoading(true);
    try {
      await post(
        "/admin/notifications/",
        {
          title,
          message,
          type,
          recipient_type: recipientType,
          specific_user: specificUserId || null,
          is_important: isImportant,
        },
        true,
      );

      toast.success("Notification Broadcasted Successfully!");
      setTitle("");
      setMessage("");
      setSpecificUserId("");
      fetchNotifications(); // Refresh list
    } catch (err) {
      toast.error(err.msg || "Failed to broadcast notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter-active">
      <h2 style={{ marginBottom: "30px", color: "var(--text-dark)" }}>
        Broadcast Notifications
      </h2>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}
      >
        {/* Form Card */}
        <div
          className="card card-modern floating-delayed"
          style={{ borderTop: "4px solid var(--primary)" }}
        >
          <h3
            style={{
              marginBottom: "25px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Send size={20} color="var(--primary)" /> Draft New Broadcast
          </h3>

          <form
            onSubmit={handleSendNotification}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "0.85rem",
                    color: "#64748b",
                  }}
                >
                  Broadcasting Scope
                </label>
                <select
                  className="input-modern"
                  value={recipientType}
                  onChange={(e) => {
                    setRecipientType(e.target.value);
                    setSpecificUserId("");
                  }}
                >
                  <option value="All Users">All Users Globally</option>
                  <option value="All Students">All Students</option>
                  <option value="All Teachers">All Teachers</option>
                  <option value="All Parents">All Parents</option>
                  <option value="Specific User">
                    Specific User (Direct Message)
                  </option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "0.85rem",
                    color: "#64748b",
                  }}
                >
                  Alert Type
                </label>
                <select
                  className="input-modern"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="Information">Information</option>
                  <option value="Announcement">Announcement</option>
                  <option value="Reminder">Reminder</option>
                  <option value="Warning">Warning</option>
                  <option value="Urgent">Critical / Urgent</option>
                </select>
              </div>
            </div>

            {recipientType === "Specific User" && (
              <div className="fade-in">
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "0.85rem",
                    color: "#64748b",
                  }}
                >
                  Target User
                </label>
                <select
                  className="input-modern"
                  required
                  value={specificUserId}
                  onChange={(e) => setSpecificUserId(e.target.value)}
                >
                  <option value="">-- Choose User in System --</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role.toUpperCase()} - {u.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "0.85rem",
                  color: "#64748b",
                }}
              >
                Notification Title
              </label>
              <input
                className="input-modern"
                placeholder="E.g. System Maintenance Tomorrow"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "0.85rem",
                  color: "#64748b",
                }}
              >
                Detailed Message
              </label>
              <textarea
                className="input-modern"
                placeholder="Type your full broadcast message here..."
                required
                rows="5"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                id="isImp"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <label
                htmlFor="isImp"
                style={{
                  cursor: "pointer",
                  fontWeight: "500",
                  color: isImportant ? "#ef4444" : "#64748b",
                }}
              >
                Flag as Priority/Important
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-modern btn-gradient"
              style={{
                padding: "12px",
                fontSize: "1rem",
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginTop: "10px",
              }}
              disabled={loading}
            >
              <Send size={20} />{" "}
              {loading ? "Broadcasting Protocol..." : "Dispatch Broadcast"}
            </button>
          </form>
        </div>

        {/* Sent History Array */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#475569",
            }}
          >
            <Hash size={20} /> Latest Broadcasts History
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              maxHeight: "600px",
              overflowY: "auto",
              paddingRight: "5px",
            }}
          >
            {notifications.length === 0 ? (
              <div
                className="card card-modern"
                style={{ textAlign: "center", color: "#94a3b8" }}
              >
                No notifications dispatched yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="card card-modern slide-in-right"
                  style={{
                    padding: "20px",
                    borderLeft: `4px solid ${n.type === "Urgent" ? "#ef4444" : n.type === "Warning" ? "#f59e0b" : "var(--primary)"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "1.05rem",
                        color: "var(--text-dark)",
                      }}
                    >
                      {n.title}
                    </div>
                    <span
                      className="status-badge"
                      style={{
                        fontSize: "0.7rem",
                        background: "#f1f5f9",
                        color: "#475569",
                      }}
                    >
                      {n.recipient_type}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#475569",
                      marginBottom: "15px",
                    }}
                  >
                    {n.message}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      color: "#94a3b8",
                    }}
                  >
                    <span>
                      Type: <b>{n.type}</b>{" "}
                      {n.is_important && (
                        <span style={{ color: "#ef4444" }}>(Priority)</span>
                      )}
                    </span>
                    <div style={{ display: "flex", gap: "15px" }}>
                      <span>
                        Reads: <b>{n.reads}</b>
                      </span>
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
