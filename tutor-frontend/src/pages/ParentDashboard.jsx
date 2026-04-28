import React, { useState, useEffect } from "react";
import axios from "axios";
import "../App.css";
import ParentPerformance from "../components/ParentPerformance";
import ParentAlertsWidget from "../components/ParentAlertsWidget";
import NotificationList from "../components/shared/NotificationList";

const API_BASE = "http://localhost:8000/api";

export default function ParentDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [stats, setStats] = useState(null);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [childId, setChildId] = useState(user?.studentId || 1);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch parent profile first to get linked children
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        let childIdLocal = user.studentId || 1;

        try {
          const profileRes = await axios.get(`${API_BASE}/auth/profile/me/`, {
            headers,
          });
          const linkedChildren = profileRes.data.profile?.linked_children;
          if (linkedChildren && linkedChildren.length > 0) {
            childIdLocal = linkedChildren[0].id;
            setChildId(childIdLocal);
          }
        } catch (e) {
          console.warn("Could not load parent profile linked children", e);
        }

        const [dashRes, riskRes, rankRes] = await Promise.all([
          axios.get(`${API_BASE}/dashboard/`),
          axios.get(`${API_BASE}/at-risk-students/?page_size=3`),
          axios.get(`${API_BASE}/student-ranking/?student_id=${childIdLocal}`),
        ]);

        setStats(dashRes.data);
        setAtRiskStudents(riskRes.data.students || []);
        setTopStudents(rankRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user.studentId]);

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "analyse", label: "🔍 Analyse Child" },
    { id: "atrisk", label: "⚠️ At-Risk Alerts" },
  ];

  return (
    <div className="app-container page-enter-active">
      {/* Header */}
      <header
        style={{
          marginBottom: "40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2.8rem", marginBottom: "8px" }}>
            Parent Portal
          </h1>
          <p className="hero-subtitle">
            Welcome, <strong>{user?.name || "Parent"}</strong>! Monitor your
            child's academic journey.
          </p>
        </div>
        {stats && (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div
              className="card card-modern hover-lift delay-100"
              style={{ padding: "12px 24px", textAlign: "center" }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                TOTAL STUDENTS
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                {stats.total_students}
              </div>
            </div>
            <div
              className="card card-modern hover-lift delay-200"
              style={{ padding: "12px 24px", textAlign: "center" }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#10b981",
                }}
              >
                PASS RATE
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                {stats.pass_percentage}%
              </div>
            </div>
            <div
              className="card card-modern hover-lift delay-300"
              style={{ padding: "12px 24px", textAlign: "center" }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#f59e0b",
                }}
              >
                AVG SCORE
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                {stats.average_marks}
              </div>
            </div>
          </div>
        )}
      </header>

      <section style={{ marginBottom: "40px" }}>
        <NotificationList />
      </section>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "32px",
          borderBottom: "2px solid var(--border)",
          paddingBottom: "0",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? "btn-modern btn-gradient" : "btn-modern btn-outline-modern"}`}
            style={{ borderRadius: "8px 8px 0 0", paddingBottom: "12px" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: "24px",
          }}
        >
          {/* Overall Stats */}
          <div className="card card-modern slide-in-left delay-300">
            <h3 style={{ marginBottom: "24px" }}>
              📈 Class Performance Overview
            </h3>
            {loading ? (
              <p className="small">Loading stats...</p>
            ) : (
              stats && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {[
                    {
                      label: "Average Score",
                      value: stats.average_marks,
                      max: 100,
                      color: "#6366f1",
                    },
                    {
                      label: "Pass Rate",
                      value: stats.pass_percentage,
                      max: 100,
                      color: "#10b981",
                    },
                    {
                      label: "Fail Rate",
                      value: stats.fail_percentage,
                      max: 100,
                      color: "#ef4444",
                    },
                  ].map((item, i) => (
                    <div key={i}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span className="small" style={{ fontWeight: 600 }}>
                          {item.label}
                        </span>
                        <span style={{ fontWeight: 700, color: item.color }}>
                          {item.value}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: "10px",
                          background: "#e2e8f0",
                          borderRadius: "5px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${item.value}%`,
                            height: "100%",
                            background: item.color,
                            borderRadius: "5px",
                            transition: "width 1s ease",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Quick Performance Check */}
          <div className="card card-modern slide-in-right delay-400">
            <h3 style={{ marginBottom: "24px" }}>🎯 Quick Child Check</h3>
            <p className="small" style={{ opacity: 0.7, marginBottom: "20px" }}>
              Enter your child's Student ID to get an instant performance
              snapshot from the AI engine.
            </p>
            <ParentPerformance />
          </div>
        </div>
      )}

      {/* Insert Smart Parent Alerts below Overview row if on overview tab */}
      {activeTab === "overview" && (
        <div style={{ marginTop: "24px" }}>
          <ParentAlertsWidget studentId={childId} />
        </div>
      )}

      {activeTab === "analyse" && (
        <div
          className="card card-modern scale-in delay-100"
          style={{ padding: "32px" }}
        >
          <h3 style={{ marginBottom: "8px" }}>🔍 Deep Child Analysis</h3>
          <p className="small" style={{ opacity: 0.7, marginBottom: "28px" }}>
            Get a full AI-powered breakdown of any student's academic
            performance, attendance, study habits and predicted score.
          </p>
          <ParentPerformance studentId={childId} />
        </div>
      )}

      {activeTab === "atrisk" && (
        <div className="card card-modern scale-in delay-100">
          <h3 style={{ marginBottom: "8px" }}>⚠️ Students Needing Attention</h3>
          <p className="small" style={{ opacity: 0.7, marginBottom: "24px" }}>
            These students have been flagged by the AI system as potentially
            at-risk based on attendance, quiz scores, and study habits.
          </p>
          {loading ? (
            <p className="small">Loading data...</p>
          ) : atRiskStudents.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", opacity: 0.5 }}>
              ✅ No students are currently flagged as at-risk!
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {atRiskStudents.map((s, i) => (
                <div
                  key={i}
                  className="list-item"
                  style={{ padding: "20px", borderLeft: "4px solid #ef4444" }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{s.name}</div>
                    <div className="small">
                      Score: <strong>{s.performance_score}</strong> |
                      Attendance: <strong>{s.attendance}%</strong> | Quiz:{" "}
                      <strong>{s.quiz_score}%</strong>
                    </div>
                  </div>
                  <span
                    className="status-badge"
                    style={{
                      background: "#fef2f2",
                      color: "#dc2626",
                      padding: "6px 12px",
                    }}
                  >
                    ⚠️ Needs Help
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
