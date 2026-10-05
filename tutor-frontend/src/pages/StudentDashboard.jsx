import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { get } from "../api/api";
import { showError } from "../utils/toast";
import "../App.css";
import NotificationList from "../components/shared/NotificationList";
import StudyCalendar from "../components/StudyCalendar";
import DynamicPerformanceInsights from "../components/DynamicPerformanceInsights";
import VoiceStudyAgent from "../components/VoiceStudyAgent";
import WeakTopicDetector from "../components/WeakTopicDetector";
import StudentPerformanceTracker from "../components/StudentPerformanceTracker";
import StudentAssignments from "../components/StudentAssignments";
import AcademicCalendarView from "../components/AcademicCalendarView";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [dynamicNotifications, setDynamicNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://localhost:8000/api";

  const fetchData = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      const currentUser = userStr
        ? JSON.parse(userStr)
        : { studentId: 1, name: "Student Hub" };
      setUser(currentUser);

      try {
        const matsRes = await axios.get(`${API_BASE}/materials/`);
        const allMats = Array.isArray(matsRes.data) ? matsRes.data : [];
        const videos = allMats
          .filter((m) => m.type === "Video")
          .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
          .slice(0, 3);
        setRecentVideos(videos);
      } catch (e) {
        console.warn("Materials fetch failed");
      }

      const currentId =
        currentUser._id || currentUser.id || currentUser.studentId;

      try {
        const recsRes = await axios.get(
          `${API_BASE}/recommendations/${currentId}/?n=2`,
        );
        setRecommendations(Array.isArray(recsRes.data) ? recsRes.data : []);
      } catch (e) {
        console.warn("Recommendations fetch failed:", e);
        setRecommendations([]);
      }

      try {
        const dddd = await axios.get(
          `${API_BASE}/dashboard-dynamic-data/${currentId}/`,
        );
        setEnrolledSubjects(dddd.data.subjects || []);
        setDynamicNotifications(dddd.data.notifications || []);
      } catch (e) {
        console.warn("Dynamic data fetch failed", e);
      }

      try {
        const quizzesRes = await get("/quizzes/available/", true);
        setAvailableQuizzes(Array.isArray(quizzesRes) ? quizzesRes : []);
      } catch (e) {
        console.warn("Quizzes fetch failed:", e);
      }
    } catch (err) {
      console.error("Error fetching real-time data:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenMaterial = (note) => {
    if (note.file_url) {
      const fullUrl = `http://localhost:8000/${note.file_url}`;
      window.open(fullUrl, "_blank");
    } else {
      showError("No file URL found for this material.");
    }
  };

  if (loading)
    return (
      <div className="app-container page-enter-active">
        <div
          className="card card-modern pulse"
          style={{ textAlign: "center", padding: "100px" }}
        >
          Loading your learning hub...
        </div>
      </div>
    );

  return (
    <div className="app-container page-enter-active">
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
          <h1
            style={{
              fontSize: "2.8rem",
              color: "var(--text-main)",
              marginBottom: "8px",
            }}
          >
            Student Hub
          </h1>
          <p className="hero-subtitle" style={{ margin: 0 }}>
            Welcome back, <strong>{user?.name || "Diya Panda"}</strong>! Ready
            to excel?
          </p>
        </div>
      </header>

      {/* ── Academic Calendar (read-only) ──────────────────────────────── */}
      <section style={{ marginBottom: "40px" }}>
        <AcademicCalendarView />
      </section>

      {/* ── Assignments Section ───────────────────────────────────────── */}
      <section style={{ marginBottom: "40px" }}>
        <StudentAssignments />
      </section>

      {/* Assigned Quizzes Section */}
      <section style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              margin: 0,
            }}
          >
            <span style={{ fontSize: "1.8rem" }}>📝</span> Assigned Quizzes
          </h3>
          <span className="small" style={{ opacity: 0.7 }}>
            {availableQuizzes.length} quiz
            {availableQuizzes.length !== 1 ? "zes" : ""} available
          </span>
        </div>

        {availableQuizzes.length === 0 ? (
          <div
            className="card card-modern"
            style={{ padding: "30px", textAlign: "center", opacity: 0.7 }}
          >
            No quizzes assigned at the moment. Check back soon!
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {availableQuizzes.map((q) => (
              <div
                key={q.id}
                className="card card-modern hover-lift"
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderTop: q.already_attempted
                    ? "3px solid #22c55e"
                    : "3px solid var(--primary)",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span className="status-badge status-accent">
                      {q.subject}
                    </span>
                    <span className="small" style={{ opacity: 0.7 }}>
                      By {q.teacher_name}
                    </span>
                  </div>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "1.15rem" }}>
                    {q.title}
                  </h4>
                  {q.description && (
                    <p
                      className="small"
                      style={{ opacity: 0.7, margin: "0 0 12px 0" }}
                    >
                      {q.description}
                    </p>
                  )}
                  <div
                    className="small"
                    style={{ opacity: 0.8, marginBottom: "16px" }}
                  >
                    ⏱ <strong>{q.time_limit_minutes} mins</strong> &nbsp;|&nbsp;
                    ❓{" "}
                    <strong>
                      {q.question_count} question
                      {q.question_count !== 1 ? "s" : ""}
                    </strong>
                  </div>
                </div>

                <div>
                  {q.already_attempted ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "rgba(34, 197, 94, 0.1)",
                        padding: "10px 16px",
                        borderRadius: "8px",
                      }}
                    >
                      <span
                        className="small"
                        style={{ color: "#22c55e", fontWeight: 700 }}
                      >
                        ✅ Score: {q.my_score} / {q.my_total}
                      </span>
                      <button
                        className="btn btn-modern btn-outline-modern"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                        onClick={() => navigate(`/quiz/${q.id}`)}
                      >
                        Retake
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-modern btn-gradient"
                      style={{
                        width: "100%",
                        padding: "10px",
                        fontSize: "0.9rem",
                      }}
                      onClick={() => navigate(`/quiz/${q.id}`)}
                    >
                      🚀 Start Quiz
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Live Videos */}
      {recentVideos.length > 0 && (
        <section style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.8rem" }}>🎬</span> Recent Lectures
            </h3>
            <Link
              to="/notes"
              className="small"
              style={{ color: "var(--primary)", fontWeight: 700 }}
            >
              View All →
            </Link>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {recentVideos.map((v) => (
              <div
                key={v.material_id}
                className="card card-modern hover-lift delay-100"
                style={{
                  padding: "20px",
                  borderTop: "3px solid var(--primary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span className="status-badge status-accent">🔴 Video</span>
                  <span className="small" style={{ opacity: 0.6 }}>
                    {v.date}
                  </span>
                </div>
                <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                  {v.title}
                </div>
                <div
                  className="small"
                  style={{ opacity: 0.7, marginBottom: "16px" }}
                >
                  {v.subject}
                </div>
                <button
                  className="btn btn-modern btn-gradient"
                  style={{ width: "100%", fontSize: "0.85rem" }}
                  onClick={() => {
                    window.open(
                      `http://localhost:8000/${v.file_url}`,
                      "_blank",
                    );
                  }}
                >
                  ▶ Watch Lecture
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <section style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.8rem" }}>✨</span> AI Suggested for
              You
            </h3>
            <Link
              to="/notes"
              className="small"
              style={{ color: "var(--primary)", fontWeight: 700 }}
            >
              View All Materials
            </Link>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {recommendations.map((note, index) => (
              <div
                key={note.material_id}
                className={`card card-modern hover-lift delay-${(index + 2) * 100}`}
                style={{
                  borderLeft: "4px solid var(--secondary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px",
                }}
              >
                <div>
                  <div
                    className="small"
                    style={{
                      fontWeight: 800,
                      color: "var(--secondary)",
                      marginBottom: "4px",
                    }}
                  >
                    {note.subject.toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {note.title}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenMaterial(note)}
                  className="btn btn-modern btn-outline-modern"
                  style={{ padding: "8px 16px", fontSize: "0.8rem" }}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notifications Module */}
      <section style={{ marginBottom: "40px" }}>
        <NotificationList />
      </section>

      <div className="features-grid" style={{ marginBottom: "40px" }}>
        <Link
          to="/performance-prediction"
          className="feature-card"
          style={{ textDecoration: "none" }}
        >
          <div className="feature-icon">🤖</div>
          <h3>AI Prediction</h3>
          <p className="small">Your personalized academic forecast.</p>
        </Link>
        <Link
          to="/performance-analysis"
          className="feature-card"
          style={{ textDecoration: "none" }}
        >
          <div className="feature-icon">📊</div>
          <h3>Analysis</h3>
          <p className="small">Visualize your progress charts.</p>
        </Link>
        <Link
          to="/notes"
          className="feature-card"
          style={{ textDecoration: "none" }}
        >
          <div className="feature-icon">📂</div>
          <h3>Study Notes</h3>
          <p className="small">Personalized learning materials.</p>
        </Link>
      </div>

      <section style={{ marginBottom: "40px" }}>
        <StudentPerformanceTracker
          studentId={user?._id || user?.studentId || user?.id}
        />
      </section>

      <section style={{ marginBottom: "40px" }}>
        <DynamicPerformanceInsights />
      </section>

      <section style={{ marginBottom: "40px" }}>
        <StudyCalendar studentId={user?.studentId} />
      </section>

      <section style={{ marginBottom: "40px" }}>
        <WeakTopicDetector />
      </section>

      <div className="dashboard-grid">
        <div
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          className="slide-in-left"
        >
          <VoiceStudyAgent />
          <div className="card card-modern hover-lift">
            <h3
              style={{
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "1.8rem" }} className="pulse">
                📖
              </span>{" "}
              My Subjects
            </h3>
            {enrolledSubjects.length === 0 ? (
              <p
                className="small shimmer"
                style={{ opacity: 0.5, display: "inline-block" }}
              >
                No enrolled subjects assigned by Admin.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {enrolledSubjects.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      padding: "16px",
                      background: "var(--bg-main)",
                      borderRadius: "12px",
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{sub.name}</span>
                      <span
                        style={{ color: "var(--primary)", fontWeight: 800 }}
                      >
                        {sub.progress}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "#e2e8f0",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${sub.progress}%`,
                          height: "100%",
                          background:
                            "linear-gradient(90deg, var(--primary), var(--secondary))",
                          borderRadius: "10px",
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          className="slide-in-right"
        >
          <NotificationList dynamicAdminNotifications={dynamicNotifications} />
        </div>
      </div>
    </div>
  );
}
