import React, { useState, useEffect } from "react";
import { get } from "../../api/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, CreditCard, Bell } from "lucide-react";



export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await get("/admin/stats", true);
        setStats(data);
      } catch (err) {
        console.error("Stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading statistics...</div>;

  const barData = [
    { name: "Students", value: stats?.totalStudents || 0 },
    { name: "Teachers", value: stats?.totalTeachers || 0 },
    { name: "Parents", value: stats?.totalParents || 0 },
  ];

  return (
    <div className="page-enter-active">
      <div
        className="stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          className="card card-modern hover-lift delay-100"
          style={{ display: "flex", alignItems: "center", gap: "15px" }}
        >
          <div
            style={{
              padding: "10px",
              background: "#e0e7ff",
              borderRadius: "12px",
              color: "#4f46e5",
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: "0.9rem", color: "#64748b" }}>Students</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
              {stats?.totalStudents}
            </div>
          </div>
        </div>
        <div
          className="card card-modern hover-lift delay-100"
          style={{ display: "flex", alignItems: "center", gap: "15px" }}
        >
          <div
            style={{
              padding: "10px",
              background: "#dcfce7",
              borderRadius: "12px",
              color: "#10b981",
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: "0.9rem", color: "#64748b" }}>Teachers</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
              {stats?.totalTeachers}
            </div>
          </div>
        </div>
        <div
          className="card card-modern hover-lift delay-100"
          style={{ display: "flex", alignItems: "center", gap: "15px" }}
        >
          <div
            style={{
              padding: "10px",
              background: "#fef3c7",
              borderRadius: "12px",
              color: "#f59e0b",
            }}
          >
            <CreditCard size={24} />
          </div>
          <div>
            <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
              Pending Payments
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
              {stats?.pendingPayments}
            </div>
          </div>
        </div>
        <div
          className="card card-modern hover-lift delay-100"
          style={{ display: "flex", alignItems: "center", gap: "15px" }}
        >
          <div
            style={{
              padding: "10px",
              background: "#ffe4e6",
              borderRadius: "12px",
              color: "#e11d48",
            }}
          >
            <Bell size={24} />
          </div>
          <div>
            <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
              Notifications Sent
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
              {stats?.totalNotifications || 0}
            </div>
          </div>
        </div>
        <div
          className="card card-modern hover-lift delay-100"
          style={{ display: "flex", alignItems: "center", gap: "15px" }}
        >
          <div
            style={{
              padding: "10px",
              background: "#e0f2fe",
              borderRadius: "12px",
              color: "#0284c7",
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
              Active Assignments
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
              {stats?.totalAssignments || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="card card-modern slide-in-bottom delay-300">
        <h3 style={{ marginBottom: "20px" }}>User Distribution</h3>
        <div style={{ height: "350px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: "0.8rem",
            color: "#64748b",
            marginTop: "10px",
          }}
        >
          Real-time monitoring enabled
        </div>
      </div>
    </div>
  );
}
