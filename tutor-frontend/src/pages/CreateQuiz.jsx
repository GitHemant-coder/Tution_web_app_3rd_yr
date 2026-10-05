/**
 * CreateQuiz.jsx — Teacher Quiz Creation Page
 *
 * Allows a teacher to:
 * 1. Fill in quiz details (title, subject, time limit)
 * 2. Add multiple-choice questions with 4 options each
 * 3. Mark the correct answer
 * 4. Submit to POST /api/quizzes/
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { post } from "../api/api";
import { showSuccess, showError } from "../utils/toast";
import "../App.css";

// A blank question template
const blankQuestion = () => ({
  text: "",
  options: ["", "", "", ""], // 4 options
  correct_answer: "",
  marks: 1,
});

export default function CreateQuiz() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    subject: "Mathematics",
    description: "",
    time_limit_minutes: 30,
  });

  const [questions, setQuestions] = useState([blankQuestion()]);
  const [submitting, setSubmitting] = useState(false);

  // ── Update quiz header fields ─────────────────────────────────────────
  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── Add a new blank question ──────────────────────────────────────────
  const addQuestion = () => {
    setQuestions((prev) => [...prev, blankQuestion()]);
  };

  // ── Remove a question by index ────────────────────────────────────────
  const removeQuestion = (idx) => {
    if (questions.length === 1) {
      showError("A quiz must have at least one question.");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Update a question's text or marks ────────────────────────────────
  const updateQuestion = (idx, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // ── Update one option within a question ───────────────────────────────
  const updateOption = (qIdx, optIdx, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const newOptions = [...updated[qIdx].options];
      newOptions[optIdx] = value;
      updated[qIdx] = { ...updated[qIdx], options: newOptions };
      return updated;
    });
  };

  // ── Set correct answer for a question ────────────────────────────────
  const setCorrectAnswer = (qIdx, optionText) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx] = { ...updated[qIdx], correct_answer: optionText };
      return updated;
    });
  };

  // ── Validate and submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.subject.trim()) {
      showError("Title and subject are required.");
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        showError(`Question ${i + 1} text is empty.`);
        return;
      }
      const filledOptions = q.options.filter((o) => o.trim());
      if (filledOptions.length < 2) {
        showError(`Question ${i + 1} needs at least 2 options.`);
        return;
      }
      if (!q.correct_answer) {
        showError(`Question ${i + 1}: Please select the correct answer.`);
        return;
      }
      if (!q.options.includes(q.correct_answer)) {
        showError(
          `Question ${i + 1}: Correct answer must match one of the options.`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      // Build clean questions (remove empty options)
      const cleanQuestions = questions.map((q) => ({
        text: q.text.trim(),
        options: q.options.filter((o) => o.trim()),
        correct_answer: q.correct_answer,
        marks: parseInt(q.marks) || 1,
      }));

      await post(
        "/quizzes/",
        {
          title: form.title.trim(),
          subject: form.subject,
          description: form.description.trim(),
          time_limit_minutes: parseInt(form.time_limit_minutes),
          questions: cleanQuestions,
        },
        true,
      );

      showSuccess("Quiz created and published to students!");
      navigate("/teacher-dashboard");
    } catch (err) {
      showError(err.message || "Failed to create quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="app-container page-enter-active"
      style={{ maxWidth: "900px", margin: "0 auto" }}
    >
      {/* Header */}
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2.2rem", marginBottom: "8px" }}>
          📝 Create New Quiz
        </h1>
        <p className="hero-subtitle">
          Set questions, options and the time limit for your students.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        {/* ── Quiz Details Card ─────────────────────────────────────────── */}
        <div
          className="card card-modern slide-in-left"
          style={{ marginBottom: "28px", padding: "28px" }}
        >
          <h3 style={{ marginBottom: "20px" }}>📋 Quiz Details</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div className="form-group">
              <label className="form-label">Quiz Title *</label>
              <input
                className="input input-modern"
                placeholder="e.g. Chapter 3 – Quadratic Equations"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select
                className="input input-modern"
                value={form.subject}
                onChange={(e) => updateForm("subject", e.target.value)}
              >
                {[
                  "Mathematics",
                  "Science",
                  "English",
                  "History",
                  "Computer Science",
                  "Physics",
                  "Chemistry",
                  "Biology",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div className="form-group">
              <label className="form-label">Time Limit (minutes)</label>
              <input
                className="input input-modern"
                type="number"
                min="1"
                max="180"
                value={form.time_limit_minutes}
                onChange={(e) =>
                  updateForm("time_limit_minutes", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input
                className="input input-modern"
                placeholder="Brief instructions for students..."
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Questions ─────────────────────────────────────────────────── */}
        {questions.map((q, qIdx) => (
          <div
            key={qIdx}
            className="card card-modern"
            style={{
              marginBottom: "20px",
              padding: "24px",
              borderLeft: "4px solid var(--primary)",
            }}
          >
            {/* Question header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h4 style={{ margin: 0 }}>Question {qIdx + 1}</h4>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <label className="form-label" style={{ margin: 0 }}>
                  Marks:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={q.marks}
                  onChange={(e) =>
                    updateQuestion(qIdx, "marks", e.target.value)
                  }
                  className="input input-modern"
                  style={{ width: "70px", padding: "6px 10px" }}
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    cursor: "pointer",
                  }}
                >
                  🗑 Remove
                </button>
              </div>
            </div>

            {/* Question text */}
            <div className="form-group">
              <label className="form-label">Question Text *</label>
              <textarea
                className="input input-modern"
                rows={2}
                placeholder="Type the question here..."
                value={q.text}
                onChange={(e) => updateQuestion(qIdx, "text", e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Options */}
            <label className="form-label">
              Options *{" "}
              <span style={{ fontWeight: 400, opacity: 0.6 }}>
                (click the ✓ radio to mark the correct answer)
              </span>
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "8px",
              }}
            >
              {q.options.map((opt, optIdx) => (
                <div
                  key={optIdx}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {/* Radio to mark correct answer */}
                  <input
                    type="radio"
                    name={`correct_${qIdx}`}
                    title="Mark as correct answer"
                    checked={q.correct_answer === opt && opt.trim() !== ""}
                    onChange={() => {
                      if (opt.trim()) setCorrectAnswer(qIdx, opt);
                    }}
                    style={{
                      cursor: "pointer",
                      accentColor: "#22c55e",
                      width: "16px",
                      height: "16px",
                    }}
                  />
                  <input
                    className="input input-modern"
                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                    value={opt}
                    onChange={(e) => {
                      updateOption(qIdx, optIdx, e.target.value);
                      // If this option was the correct answer, update it too
                      if (q.correct_answer === opt) {
                        setCorrectAnswer(qIdx, e.target.value);
                      }
                    }}
                    style={{
                      flex: 1,
                      border:
                        q.correct_answer === opt && opt.trim()
                          ? "1px solid #22c55e"
                          : undefined,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Show which answer is marked correct */}
            {q.correct_answer && (
              <p
                className="small"
                style={{ color: "#22c55e", marginTop: "8px" }}
              >
                ✓ Correct answer: <strong>{q.correct_answer}</strong>
              </p>
            )}
          </div>
        ))}

        {/* Add question button */}
        <button
          type="button"
          className="btn btn-modern btn-outline-modern"
          onClick={addQuestion}
          style={{ width: "100%", marginBottom: "20px" }}
        >
          + Add Another Question
        </button>

        {/* Submit */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            className="btn btn-modern btn-outline-modern"
            onClick={() => navigate("/teacher-dashboard")}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-modern btn-gradient"
            disabled={submitting}
            style={{ flex: 2 }}
          >
            {submitting ? "Publishing..." : "🚀 Publish Quiz to Students"}
          </button>
        </div>
      </form>
    </div>
  );
}
