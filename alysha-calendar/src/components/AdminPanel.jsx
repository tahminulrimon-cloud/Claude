import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createEntry, updateEntry, deleteEntry, uploadPhoto } from "../services/api";
import "./AdminPanel.css";

const EMPTY_FORM = {
  label: "", age: "", date: "", caption: "",
  milestone: "", photo: "", age_in_days: 0,
};

export default function AdminPanel({ entries, onRefresh, onClose }) {
  const { logout } = useAuth();
  const [mode, setMode] = useState("list"); // list | add | edit
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (mode === "add") { setForm(EMPTY_FORM); setError(""); }
    if (mode === "edit" && editTarget) { setForm({ ...editTarget }); setError(""); }
  }, [mode, editTarget]);

  const flash = (msg, isErr = false) => {
    isErr ? setError(msg) : setSuccess(msg);
    setTimeout(() => isErr ? setError("") : setSuccess(""), 3000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPhoto(file);
      setForm((f) => ({ ...f, photo: url }));
      flash("Photo uploaded!");
    } catch {
      flash("Upload failed. Try again.", true);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, age_in_days: Number(form.age_in_days) };
      if (mode === "edit") {
        await updateEntry(editTarget.id, payload);
        flash("Entry updated!");
      } else {
        await createEntry(payload);
        flash("Entry added!");
      }
      await onRefresh();
      setMode("list");
    } catch (err) {
      flash(err.response?.data?.error || "Save failed.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry permanently?")) return;
    setDeleting(id);
    try {
      await deleteEntry(id);
      flash("Entry deleted.");
      await onRefresh();
    } catch {
      flash("Delete failed.", true);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-title">
          <span>🛠</span>
          <div>
            <h2>Admin Panel</h2>
            <span>{entries.length} entries</span>
          </div>
        </div>
        <div className="admin-header-actions">
          {mode === "list" && (
            <button className="btn-add" onClick={() => setMode("add")}>+ Add Entry</button>
          )}
          {mode !== "list" && (
            <button className="btn-back" onClick={() => setMode("list")}>← Back</button>
          )}
          <button className="btn-logout" onClick={logout} title="Logout">Sign Out</button>
          <button className="btn-close-panel" onClick={onClose}>✕</button>
        </div>
      </div>

      {error   && <div className="admin-toast error">{error}</div>}
      {success && <div className="admin-toast success">{success}</div>}

      {/* ── List ── */}
      {mode === "list" && (
        <div className="admin-list">
          {entries.map((e) => (
            <div key={e.id} className="admin-row">
              <div className="row-thumb">
                {e.photo
                  ? <img src={e.photo} alt={e.label} />
                  : <span>📷</span>}
              </div>
              <div className="row-info">
                <strong>{e.label}</strong>
                <span>{e.date} · {e.age}</span>
                <em>{e.caption}</em>
              </div>
              <div className="row-actions">
                <button
                  className="btn-edit"
                  onClick={() => { setEditTarget(e); setMode("edit"); }}
                >Edit</button>
                <button
                  className="btn-delete"
                  disabled={deleting === e.id}
                  onClick={() => handleDelete(e.id)}
                >{deleting === e.id ? "…" : "Delete"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Form ── */}
      {(mode === "add" || mode === "edit") && (
        <form className="admin-form" onSubmit={handleSave}>
          <h3>{mode === "add" ? "New Entry" : `Editing: ${editTarget?.label}`}</h3>

          <div className="form-row-2">
            <div className="field">
              <label>Label *</label>
              <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required placeholder="Birth Day" />
            </div>
            <div className="field">
              <label>Age Label *</label>
              <input value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} required placeholder="Day 0" />
            </div>
          </div>

          <div className="form-row-2">
            <div className="field">
              <label>Date *</label>
              <input value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required placeholder="25 April 2022" />
            </div>
            <div className="field">
              <label>Age in Days * <span>(for sorting)</span></label>
              <input type="number" min="0" value={form.age_in_days} onChange={(e) => setForm((f) => ({ ...f, age_in_days: e.target.value }))} required />
            </div>
          </div>

          <div className="field">
            <label>Caption</label>
            <textarea rows={2} value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} placeholder="A sweet moment captured…" />
          </div>

          <div className="field">
            <label>Milestone</label>
            <input value={form.milestone} onChange={(e) => setForm((f) => ({ ...f, milestone: e.target.value }))} placeholder="First smile" />
          </div>

          <div className="field">
            <label>Photo URL</label>
            <div className="photo-row">
              <input
                value={form.photo}
                onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))}
                placeholder="https://… or upload below"
              />
              {form.photo && (
                <img src={form.photo} alt="preview" className="photo-preview" />
              )}
            </div>
          </div>

          <div className="upload-zone" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileUpload} />
            {uploading
              ? <span>Uploading…</span>
              : <span>📁 Click to upload photo from device</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => setMode("list")}>Cancel</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Saving…" : mode === "add" ? "Add Entry" : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
