import React, { useState, useEffect } from "react";
import { get, post, remove } from "../../api/api";
import { UserCheck, Hash, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminAssignments() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [formData, setFormData] = useState({
    studentId: "",
    teacherId: "",
    subjects: [],
  });
  const [teacherSpecializations, setTeacherSpecializations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchAssignments();
  }, []);

  const fetchData = async () => {
    try {
      const users = await get("/admin/users/", true);
      const stds = users.filter((u) => u.role === "student");
      const tchs = users.filter((u) => u.role === "teacher");
      setStudents(stds);
      setTeachers(tchs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users data");
    }
  };

  const fetchAssignments = async () => {
    try {
      const data = await get("/admin/assignments/", true);
      setAssignments(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assignments history");
    }
  };

  const handleTeacherChange = (teacherId) => {
    setFormData({ ...formData, teacherId, subjects: [] });

    if (!teacherId) {
      setTeacherSpecializations([]);
      return;
    }

    const selectedTeacher = teachers.find(
      (t) => t._id === parseInt(teacherId, 10) || t._id === teacherId,
    );

    if (
      selectedTeacher &&
      selectedTeacher.profile &&
      selectedTeacher.profile.specialization
    ) {
      // Split by comma if multiple specializations exist, else single array
      const specs = selectedTeacher.profile.specialization
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      setTeacherSpecializations(
        specs.length > 0 ? specs : ["Mathematics", "Science", "English"],
      ); // Fallback if empty text
    } else {
      setTeacherSpecializations([
        "Mathematics",
        "Science",
        "English",
        "History",
        "Computer Science",
      ]); // Fallback
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();

    if (!formData.studentId || !formData.teacherId) {
      return toast.error(
        "Please explicitly select both a Student and a Teacher.",
      );
    }

    if (formData.subjects.length === 0) {
      return toast.error("Please assign at least one governing subject.");
    }

    setLoading(true);
    try {
      await post("/admin/assignments/", formData, true);
      toast.success("Assignment Enforced Successfully!");
      setFormData({ studentId: "", teacherId: "", subjects: [] });
      setTeacherSpecializations([]);
      fetchAssignments(); // Refresh grid
    } catch (err) {
      const errorMsg =
        err.message ||
        err.error ||
        err.msg ||
        "Failed to commit assignment to database";
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to terminate this assignment?"))
      return;
    try {
      await remove(`/admin/assignments/${id}/`, true);
      toast.success("Assignment terminated.");
      fetchAssignments();
    } catch (err) {
      toast.error("Failed to remove assignment.");
    }
  };

  return (
    <div className="page-enter-active">
      <h2 style={{ marginBottom: "30px", color: "var(--text-dark)" }}>
        Enforce Teacher Assignments
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "30px",
        }}
      >
        {/* Form Construction */}
        <div
          className="card card-modern floating-delayed"
          style={{ borderTop: "4px solid var(--primary)" }}
        >
          <form
            onSubmit={handleAssign}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "0.85rem",
                  color: "#64748b",
                }}
              >
                Target Student
              </label>
              <select
                className="input-modern"
                required
                value={formData.studentId}
                onChange={(e) =>
                  setFormData({ ...formData, studentId: e.target.value })
                }
              >
                <option value="">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
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
                Governing Teacher
              </label>
              <select
                className="input-modern"
                required
                value={formData.teacherId}
                onChange={(e) => handleTeacherChange(e.target.value)}
              >
                <option value="">-- Choose Governing Teacher --</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} (Spec: {t.profile?.specialization || "N/A"})
                  </option>
                ))}
              </select>
            </div>

            {formData.teacherId && (
              <div className="fade-in">
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "0.85rem",
                    color: "#64748b",
                  }}
                >
                  Subjects Managed by Teacher
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(130px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {teacherSpecializations.map((sub, idx) => (
                    <label
                      key={idx}
                      className={`role-card ${formData.subjects.includes(sub) ? "active" : ""}`}
                      style={{
                        padding: "10px",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <input
                        type="checkbox"
                        hidden
                        checked={formData.subjects.includes(sub)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setFormData({
                              ...formData,
                              subjects: [...formData.subjects, sub],
                            });
                          else
                            setFormData({
                              ...formData,
                              subjects: formData.subjects.filter(
                                (s) => s !== sub,
                              ),
                            });
                        }}
                      />
                      {sub}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-modern btn-gradient"
              disabled={loading}
              style={{ width: "100%", marginTop: "10px" }}
            >
              <UserCheck size={20} style={{ marginRight: "8px" }} />{" "}
              {loading ? "Enforcing..." : "Commit Assignment Registry"}
            </button>
          </form>
        </div>

        {/* Assignment Database Stream */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#475569",
            }}
          >
            <Hash size={20} /> Active Assignments Registry
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              maxHeight: "500px",
              overflowY: "auto",
              paddingRight: "5px",
            }}
          >
            {assignments.length === 0 ? (
              <div
                className="card card-modern"
                style={{ textAlign: "center", color: "#94a3b8" }}
              >
                No assignments in registry.
              </div>
            ) : (
              assignments.map((a) => (
                <div
                  key={a.id}
                  className="card card-modern slide-in-right"
                  style={{
                    padding: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderLeft: "4px solid #10b981",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "1.05rem",
                        color: "var(--text-dark)",
                        marginBottom: "5px",
                      }}
                    >
                      {a.student_name}{" "}
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "0.85rem",
                          margin: "0 8px",
                        }}
                      >
                        assigned to
                      </span>{" "}
                      {a.teacher_name}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      <strong>Subjects:</strong> {a.subjects}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#cbd5e1",
                        marginTop: "5px",
                      }}
                    >
                      Assigned via Admin on{" "}
                      {new Date(a.assigned_at).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(a.id)}
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#ef4444",
                      borderRadius: "8px",
                      padding: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    title="Terminate Assignment"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
