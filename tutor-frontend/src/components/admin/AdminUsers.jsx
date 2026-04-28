import React, { useState, useEffect, useCallback } from "react";
import { get, post, put, remove } from "../../api/api";
import {
  UserPlus, Trash2, Edit2, X, Link, Users, AlertCircle
} from "lucide-react";
import { toast } from "react-toastify";

/* ─── Reusable Field Components ─── */
const Field = ({ label, children, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </label>
    {children}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="input-modern"
    style={{ margin: 0, ...(props.style || {}) }}
  />
);

const Select = ({ children, ...props }) => (
  <select {...props} className="input-modern" style={{ margin: 0, ...(props.style || {}) }}>
    {children}
  </select>
);

/* ─── Role Badge ─── */
const roleBadge = (role) => {
  const map = {
    admin:   { bg: "#fee2e2", color: "#dc2626" },
    teacher: { bg: "#dcfce7", color: "#16a34a" },
    parent:  { bg: "#fef9c3", color: "#ca8a04" },
    student: { bg: "#e0e7ff", color: "#4f46e5" },
  };
  const s = map[role] || map.student;
  return (
    <span style={{
      background: s.bg, color: s.color, padding: "3px 10px",
      borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase"
    }}>
      {role}
    </span>
  );
};

/* ─── Section Divider ─── */
const Section = ({ label }) => (
  <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px", margin: "6px 0 2px" }}>
    <div style={{ height: "1px", flex: 1, background: "#e2e8f0" }} />
    <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "nowrap" }}>
      {label}
    </span>
    <div style={{ height: "1px", flex: 1, background: "#e2e8f0" }} />
  </div>
);

/* ─── Initial Form State ─── */
const blankForm = {
  name: "", username: "", email: "", password: "", role: "student",
  // Student
  gender: "", dob: "", contact_number: "", parent_contact_number: "",
  address: "", admission_date: "", standard: "", division: "", subject: "", roll_number: "",
  // Teacher
  joining_date: "", specialization: "", standard_handled: "", qualification: "", experience: "", employee_id: "",
  // Parent
  occupation: "", linked_student: "",
};

export default function AdminUsers() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("all");

  const [showModal, setShowModal]   = useState(false);
  const [formMode, setFormMode]     = useState("add");
  const [editUserId, setEditUserId] = useState(null);
  const [formData, setFormData]     = useState(blankForm);
  const [submitting, setSubmitting] = useState(false);

  const [linkingParent, setLinkingParent]     = useState(null);
  const [selectedStudent, setSelectedStudent] = useState("");

  /* ─── Data Fetching ─── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get("/admin/users", true);
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const students = users.filter((u) => u.role === "student");

  /* ─── Modal Open Helpers ─── */
  const openAdd = () => {
    setFormMode("add");
    setFormData(blankForm);
    setEditUserId(null);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setFormMode("edit");
    setEditUserId(u._id);
    setFormData({
      ...blankForm,
      name:     u.name     || "",
      username: u.username || "",
      email:    u.email    || "",
      role:     u.role     || "student",
      ...(u.profile || {}),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(blankForm);
  };

  /* ─── Form Change Helper ─── */
  const set = (field) => (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  /* ─── Submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === "add") {
        await post("/admin/users", formData, true);
        toast.success("✅ User created and profile saved!");
      } else {
        await put(`/admin/users/${editUserId}`, formData, true);
        toast.success("✅ User profile updated!");
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      toast.error(err.msg || err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Delete ─── */
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" permanently? This cannot be undone.`)) return;
    try {
      await remove(`/admin/users/${id}`, true);
      toast.success("User deleted.");
      fetchUsers();
    } catch (err) {
      toast.error(err.msg || "Delete failed");
    }
  };

  /* ─── Link Child ─── */
  const handleLinkChild = async () => {
    if (!selectedStudent) return toast.error("Please select a student first");
    try {
      await post("/admin/link-child", { parentId: linkingParent._id, studentId: selectedStudent }, true);
      toast.success("Child linked successfully!");
      setLinkingParent(null);
      setSelectedStudent("");
      fetchUsers();
    } catch (err) {
      toast.error(err.msg || err.message || "Failed to link");
    }
  };

  /* ─── Role-Specific Form Fields ─── */
  const renderRoleFields = () => {
    const role = formData.role;

    if (role === "student") return (
      <>
        <Section label="Student Profile" />
        <Field label="Gender">
          <Select value={formData.gender} onChange={set("gender")}>
            <option value="">Select Gender</option>
            <option>Male</option><option>Female</option><option>Other</option>
          </Select>
        </Field>
        <Field label="Date of Birth">
          <Input type="date" value={formData.dob} onChange={set("dob")} />
        </Field>
        <Field label="Contact Number">
          <Input placeholder="e.g. 9876543210" value={formData.contact_number} onChange={set("contact_number")} />
        </Field>
        <Field label="Parent Contact Number">
          <Input placeholder="Parent's phone" value={formData.parent_contact_number} onChange={set("parent_contact_number")} />
        </Field>
        <Field label="Address">
          <Input placeholder="Full address" value={formData.address} onChange={set("address")} />
        </Field>
        <Field label="Admission Date">
          <Input type="date" value={formData.admission_date} onChange={set("admission_date")} />
        </Field>
        <Field label="Class / Standard" required>
          <Input placeholder="e.g. Grade 10 / Class XII" required value={formData.standard} onChange={set("standard")} />
        </Field>
        <Field label="Division / Section">
          <Input placeholder="e.g. A" value={formData.division} onChange={set("division")} />
        </Field>
        <Field label="Subject / Stream / Course" required>
          <Input placeholder="e.g. Science, Commerce" required value={formData.subject} onChange={set("subject")} />
        </Field>
        <Field label="Roll Number">
          <Input placeholder="e.g. 42" value={formData.roll_number} onChange={set("roll_number")} />
        </Field>
      </>
    );

    if (role === "teacher") return (
      <>
        <Section label="Teacher Profile" />
        <Field label="Gender">
          <Select value={formData.gender} onChange={set("gender")}>
            <option value="">Select Gender</option>
            <option>Male</option><option>Female</option><option>Other</option>
          </Select>
        </Field>
        <Field label="Date of Birth">
          <Input type="date" value={formData.dob} onChange={set("dob")} />
        </Field>
        <Field label="Contact Number">
          <Input placeholder="e.g. 9876543210" value={formData.contact_number} onChange={set("contact_number")} />
        </Field>
        <Field label="Address">
          <Input placeholder="Full address" value={formData.address} onChange={set("address")} />
        </Field>
        <Field label="Joining Date">
          <Input type="date" value={formData.joining_date} onChange={set("joining_date")} />
        </Field>
        <Field label="Subject Specialization" required>
          <Input placeholder="e.g. Mathematics, Physics" required value={formData.specialization} onChange={set("specialization")} />
        </Field>
        <Field label="Class / Std Handled" required>
          <Input placeholder="e.g. Grade 9–12" required value={formData.standard_handled} onChange={set("standard_handled")} />
        </Field>
        <Field label="Highest Qualification">
          <Input placeholder="e.g. B.Ed, M.Sc" value={formData.qualification} onChange={set("qualification")} />
        </Field>
        <Field label="Years of Experience">
          <Input placeholder="e.g. 5" value={formData.experience} onChange={set("experience")} />
        </Field>
        <Field label="Employee ID">
          <Input placeholder="e.g. TCH-001" value={formData.employee_id} onChange={set("employee_id")} />
        </Field>
      </>
    );

    if (role === "parent") return (
      <>
        <Section label="Parent Profile" />
        <Field label="Contact Number" required>
          <Input placeholder="e.g. 9876543210" required value={formData.contact_number} onChange={set("contact_number")} />
        </Field>
        <Field label="Address">
          <Input placeholder="Full address" value={formData.address} onChange={set("address")} />
        </Field>
        <Field label="Occupation">
          <Input placeholder="e.g. Engineer, Teacher" value={formData.occupation} onChange={set("occupation")} />
        </Field>
        {formMode === "add" && (
          <Field label="Link Student (Optional)">
            <Select value={formData.linked_student} onChange={set("linked_student")}>
              <option value="">-- Select a Student --</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.username || s.email})</option>
              ))}
            </Select>
          </Field>
        )}
      </>
    );

    return null;
  };

  /* ─── Filtered Table Data ─── */
  const filtered = filter === "all" ? users : users.filter((u) => u.role === filter);

  /* ─── Profile Summary Cell ─── */
  const profileSummary = (u) => {
    if (u.role === "student") return (
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{u.profile?.standard || <span style={{ color: "#94a3b8" }}>No Class</span>}</div>
        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{u.profile?.subject || "No Stream"}</div>
        {u.profile?.roll_number && <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Roll: {u.profile.roll_number}</div>}
      </div>
    );
    if (u.role === "teacher") return (
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{u.profile?.specialization || <span style={{ color: "#94a3b8" }}>No Subject</span>}</div>
        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{u.profile?.qualification || ""}</div>
        {u.profile?.experience && <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{u.profile.experience} yrs exp</div>}
      </div>
    );
    if (u.role === "parent") return (
      <div>
        {u.children?.length > 0
          ? <div style={{ color: "#16a34a", fontWeight: 600, fontSize: "0.85rem" }}>👶 {u.children.map(c => c.name).join(", ")}</div>
          : <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>Not linked to any student</div>}
        {u.profile?.contact_number && <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "3px" }}>{u.profile.contact_number}</div>}
      </div>
    );
    if (u.role === "admin") return <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Superuser</div>;
    return null;
  };

  /* ─── Render ─── */
  return (
    <div className="page-enter-active">
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>User Management</h2>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.85rem" }}>
            Create and manage Student, Teacher &amp; Parent accounts
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            className="input-modern"
            style={{ width: "auto", padding: "9px 14px", margin: 0 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="parent">Parents</option>
            <option value="admin">Admins</option>
          </select>
          <button className="btn btn-modern btn-gradient" onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="card card-modern" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <Users size={40} style={{ color: "#e2e8f0", marginBottom: "12px" }} />
            <p style={{ color: "#94a3b8", margin: 0 }}>No users found for this role.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {["User", "Role", "Profile Info", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {/* User Cell */}
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 700, color: "#1e293b" }}>{u.name}</div>
                    <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{u.email}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>@{u.username || u.email}</div>
                  </td>

                  {/* Role Cell */}
                  <td style={{ padding: "16px 20px" }}>{roleBadge(u.role)}</td>

                  {/* Profile Info Cell */}
                  <td style={{ padding: "16px 20px" }}>{profileSummary(u)}</td>

                  {/* Actions Cell */}
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={() => openEdit(u)} title="Edit" style={{ color: "#4f46e5", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", padding: "4px 0" }}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(u._id, u.name)} title="Delete" style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", padding: "4px 0" }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>

                      {/* Parent Link UI */}
                      {u.role === "parent" && (
                        linkingParent?._id === u._id ? (
                          <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "10px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <select
                              className="input-modern"
                              style={{ margin: 0, padding: "6px 10px", fontSize: "0.82rem" }}
                              value={selectedStudent}
                              onChange={(e) => setSelectedStudent(e.target.value)}
                            >
                              <option value="">-- Choose Student --</option>
                              {students.map((s) => (
                                <option key={s._id} value={s._id}>{s.name} ({s.username || s.email})</option>
                              ))}
                            </select>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={handleLinkChild} className="btn btn-modern btn-gradient" style={{ flex: 1, padding: "5px 8px", fontSize: "0.78rem" }}>
                                Confirm Link
                              </button>
                              <button onClick={() => { setLinkingParent(null); setSelectedStudent(""); }} className="btn btn-modern btn-outline-modern" style={{ padding: "5px 8px", fontSize: "0.78rem" }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setLinkingParent(u); setSelectedStudent(""); }} style={{ color: "#0891b2", background: "none", border: "1px dashed #0891b2", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", padding: "4px 8px" }}>
                            <Link size={12} /> Link Student
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL OVERLAY ── */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{
            background: "white", borderRadius: "16px", width: "100%", maxWidth: "780px",
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            display: "flex", flexDirection: "column"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, background: "white", zIndex: 1, borderRadius: "16px 16px 0 0" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#1e293b" }}>
                  {formMode === "add" ? "Add New User" : "Edit User Profile"}
                </h3>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                  {formMode === "add" ? "Fill in all required fields to create the account." : "Update user information and profile fields."}
                </p>
              </div>
              <button onClick={closeModal} style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: "24px 28px", flex: 1 }}>
              {/* ── Account Info Section ── */}
              <div style={{ marginBottom: "8px" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 16px" }}>Account Information</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                  <Field label="Full Name" required>
                    <Input placeholder="e.g. Rahul Sharma" required value={formData.name} onChange={set("name")} />
                  </Field>
                  <Field label="Username" required>
                    <Input placeholder="e.g. rahul_sharma" required value={formData.username} onChange={set("username")} disabled={formMode === "edit"} />
                  </Field>
                  <Field label="Email" required>
                    <Input type="email" placeholder="e.g. rahul@school.com" required value={formData.email} onChange={set("email")} disabled={formMode === "edit"} />
                  </Field>
                  {formMode === "add" && (
                    <Field label="Temporary Password" required>
                      <Input type="password" placeholder="Min 6 characters" required minLength={6} value={formData.password} onChange={set("password")} />
                    </Field>
                  )}
                  <Field label="Role" required>
                    <Select value={formData.role} onChange={set("role")} disabled={formMode === "edit"}>
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </Field>
                </div>
              </div>

              {/* ── Role-Specific Fields ── */}
              <div style={{ marginTop: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                  {renderRoleFields()}
                </div>
              </div>

              {/* ── First Login Notice ── */}
              {formMode === "add" && (
                <div style={{ marginTop: "20px", background: "#eff6ff", borderRadius: "8px", padding: "12px 16px", display: "flex", gap: "10px", alignItems: "flex-start", border: "1px solid #bfdbfe" }}>
                  <AlertCircle size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#1d4ed8" }}>
                    The user will be prompted to change their temporary password on first login.
                  </p>
                </div>
              )}

              {/* ── Submit Buttons ── */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #e2e8f0" }}>
                <button type="button" onClick={closeModal} className="btn btn-modern btn-outline-modern" style={{ padding: "10px 24px" }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-modern btn-gradient" style={{ padding: "10px 28px", display: "flex", alignItems: "center", gap: "6px" }} disabled={submitting}>
                  {submitting ? "Saving…" : formMode === "add" ? "Create Account" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
