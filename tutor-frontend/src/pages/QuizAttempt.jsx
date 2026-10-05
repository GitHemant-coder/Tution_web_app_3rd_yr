/**
 * QuizAttempt.jsx — Student Quiz Taking Page
 *
 * Flow:
 * 1. Student clicks "Start Quiz" from the StudentDashboard quiz tab
 * 2. They land here, we call /api/quizzes/<id>/start/ to get questions + attempt_id
 * 3. We request fullscreen and start integrity monitoring
 * 4. Student answers questions one by one
 * 5. On submit:
 *    a. Stop monitoring
 *    b. POST answers to /api/attempts/<id>/submit/
 *    c. POST each integrity event to /api/attempts/<id>/integrity-events/
 *    d. Show result
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { post, get } from "../api/api";
import { showError, showSuccess } from "../utils/toast";
import useQuizIntegrityMonitor from "../hooks/useQuizIntegrityMonitor";
import "../App.css";

export default function QuizAttempt() {
  const { quizId } = useParams(); // from URL: /quiz/:quizId
  const navigate = useNavigate();

  // ── Quiz state ─────────────────────────────────────────────────────────
  const [quizInfo, setQuizInfo] = useState(null); // { title, subject, time_limit_minutes, ... }
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); // which question we're on
  const [answers, setAnswers] = useState({}); // { "<q_id>": "<chosen_answer>" }
  const [timeLeft, setTimeLeft] = useState(null); // seconds remaining
  const [phase, setPhase] = useState("loading"); // loading | quiz | result
  const [result, setResult] = useState(null); // { score, total_marks, percentage }
  const [submitting, setSubmitting] = useState(false);

  // ── Integrity monitor ──────────────────────────────────────────────────
  const {
    startMonitoring,
    stopMonitoring,
    getIntegrityData,
    requestFullscreen,
  } = useQuizIntegrityMonitor();

  // ── Start the quiz on mount ────────────────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "student") {
      navigate("/login");
      return;
    }
    initQuiz();
    // eslint-disable-next-line
  }, [quizId]);

  const initQuiz = async () => {
    try {
      const data = await post(`/quizzes/${quizId}/start/`, {}, true);
      setQuizInfo({
        title: data.quiz_title,
        subject: data.subject,
        time_limit_minutes: data.time_limit_minutes,
        total_marks: data.total_marks,
      });
      setQuestions(data.questions);
      setAttemptId(data.attempt_id);
      setTimeLeft(data.time_limit_minutes * 60); // convert minutes → seconds
      setPhase("quiz");

      // Ask for fullscreen and start monitoring
      await requestFullscreen();
      startMonitoring();
    } catch (err) {
      showError("Failed to start quiz. Please try again.");
      navigate("/dashboard");
    }
  };

  // ── Countdown timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "quiz" || timeLeft === null) return;

    if (timeLeft <= 0) {
      // Time's up — auto submit
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line
  }, [phase, timeLeft]);

  // ── Format seconds as MM:SS ────────────────────────────────────────────
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Select an answer for current question ──────────────────────────────
  const selectAnswer = (questionId, chosenOption) => {
    setAnswers((prev) => ({ ...prev, [questionId]: chosenOption }));
  };

  // ── Submit the quiz ────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    // 1. Stop integrity monitoring
    stopMonitoring();

    try {
      // 2. Submit answers to backend
      const scoreData = await post(
        `/attempts/${attemptId}/submit/`,
        { answers },
        true,
      );

      // 3. Send each integrity event to the backend
      const { integrityEvents } = getIntegrityData();
      for (const event of integrityEvents) {
        try {
          await post(
            `/attempts/${attemptId}/integrity-events/`,
            {
              event_type: event.eventType,
              timestamp: event.timestamp,
              duration_seconds: event.duration,
            },
            true,
          );
        } catch (e) {
          // Don't fail the submission if integrity logging fails
          console.error("Failed to log integrity event:", e);
        }
      }

      // 4. Show result
      setResult(scoreData);
      setPhase("result");
      showSuccess("Quiz submitted!");

      // Exit fullscreen gracefully
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err) {
      showError("Failed to submit quiz. Please try again.");
      setSubmitting(false);
    }
  }, [submitting, attemptId, answers, stopMonitoring, getIntegrityData]);

  // ── Render: Loading ────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div
        className="app-container page-enter-active"
        style={{ textAlign: "center", paddingTop: "100px" }}
      >
        <div className="card card-modern pulse" style={{ padding: "60px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "16px" }}>📝</div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  // ── Render: Result ─────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const { integrityEvents, tabSwitches, fullscreenExits, windowBlurs } =
      getIntegrityData();
    const hasSuspiciousActivity = integrityEvents.length > 0;

    return (
      <div
        className="app-container page-enter-active"
        style={{ maxWidth: "700px", margin: "60px auto" }}
      >
        <div
          className="card card-modern"
          style={{ padding: "40px", textAlign: "center" }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>
            {result.percentage >= 80
              ? "🎉"
              : result.percentage >= 50
                ? "👍"
                : "📚"}
          </div>
          <h2 style={{ marginBottom: "8px" }}>Quiz Submitted!</h2>
          <p className="hero-subtitle">{quizInfo?.title}</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              margin: "32px 0",
            }}
          >
            <div className="card card-modern" style={{ padding: "20px" }}>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "var(--primary)",
                }}
              >
                {result.score}
              </div>
              <div className="small">Score</div>
            </div>
            <div className="card card-modern" style={{ padding: "20px" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800 }}>
                {result.total_marks}
              </div>
              <div className="small">Total Marks</div>
            </div>
            <div
              className="card card-modern"
              style={{ padding: "20px", gridColumn: "1 / -1" }}
            >
              <div
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  color: result.percentage >= 50 ? "#22c55e" : "#ef4444",
                }}
              >
                {result.percentage}%
              </div>
              <div className="small">Percentage</div>
            </div>
          </div>

          {/* Show if any suspicious activity was detected */}
          {hasSuspiciousActivity && (
            <div
              style={{
                background: "rgba(234, 179, 8, 0.1)",
                border: "1px solid rgba(234, 179, 8, 0.4)",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "24px",
                textAlign: "left",
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  color: "#eab308",
                  marginBottom: "8px",
                }}
              >
                ⚠️ Activity Recorded During Quiz
              </p>
              <p
                className="small"
                style={{ opacity: 0.8, marginBottom: "8px" }}
              >
                The following browser events were automatically logged and
                shared with your teacher:
              </p>
              <ul
                className="small"
                style={{ paddingLeft: "16px", opacity: 0.8 }}
              >
                {tabSwitches > 0 && (
                  <li>Tab switch / page hidden: {tabSwitches} time(s)</li>
                )}
                {fullscreenExits > 0 && (
                  <li>Exited fullscreen: {fullscreenExits} time(s)</li>
                )}
                {windowBlurs > 0 && (
                  <li>Window lost focus: {windowBlurs} time(s)</li>
                )}
              </ul>
            </div>
          )}

          <button
            className="btn btn-modern btn-gradient"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Quiz In Progress ───────────────────────────────────────────
  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const isTimeWarning = timeLeft !== null && timeLeft < 60; // last 60 seconds

  return (
    <div
      className="app-container page-enter-active"
      style={{ maxWidth: "800px", margin: "0 auto" }}
    >
      {/* Header: Quiz title + timer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2 style={{ marginBottom: "4px" }}>{quizInfo?.title}</h2>
          <span className="status-badge status-accent">
            {quizInfo?.subject}
          </span>
        </div>

        {/* Countdown timer */}
        <div
          className="card card-modern"
          style={{
            padding: "10px 24px",
            fontWeight: 800,
            fontSize: "1.4rem",
            color: isTimeWarning ? "#ef4444" : "var(--primary)",
            border: isTimeWarning ? "2px solid #ef4444" : undefined,
          }}
        >
          ⏱ {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <span className="small">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="small">{Object.keys(answers).length} answered</span>
        </div>
        <div
          style={{
            background: "var(--border)",
            borderRadius: "4px",
            height: "6px",
          }}
        >
          <div
            style={{
              background: "var(--primary)",
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
              height: "100%",
              borderRadius: "4px",
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      {/* Question card */}
      {currentQuestion && (
        <div
          className="card card-modern slide-in-left"
          style={{ padding: "32px", marginBottom: "24px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "20px",
            }}
          >
            <p style={{ fontSize: "1.1rem", fontWeight: 600, flex: 1 }}>
              {currentQuestion.text}
            </p>
            <span
              className="status-badge status-success"
              style={{ marginLeft: "16px", whiteSpace: "nowrap" }}
            >
              {currentQuestion.marks} mark
              {currentQuestion.marks !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Options */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {currentQuestion.options.map((option, idx) => {
              const isSelected = currentAnswer === option;
              return (
                <button
                  key={idx}
                  onClick={() => selectAnswer(currentQuestion.id, option)}
                  style={{
                    padding: "14px 20px",
                    borderRadius: "10px",
                    border: isSelected
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                    background: isSelected
                      ? "rgba(56, 189, 248, 0.12)"
                      : "var(--card-bg)",
                    color: "var(--text)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: isSelected ? 600 : 400,
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ marginRight: "10px", opacity: 0.5 }}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <button
          className="btn btn-modern btn-outline-modern"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>

        {!isLast ? (
          <button
            className="btn btn-modern btn-gradient"
            onClick={() =>
              setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
            }
          >
            Next →
          </button>
        ) : (
          <button
            className="btn btn-modern btn-gradient"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ background: "#22c55e" }}
          >
            {submitting ? "Submitting..." : "✅ Submit Quiz"}
          </button>
        )}
      </div>

      {/* Question navigator (dots) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "24px",
          justifyContent: "center",
        }}
      >
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.75rem",
              background:
                idx === currentIndex
                  ? "var(--primary)"
                  : answers[q.id]
                    ? "#22c55e"
                    : "var(--border)",
              color:
                idx === currentIndex || answers[q.id] ? "white" : "var(--text)",
            }}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
