import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API, { getImageUrl } from "../api";
import "./profileModal.css";

const emptyPassword = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ProfileModal({ show, onClose }) {
  const [tab, setTab] = useState("details");
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", avatar: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [passwords, setPasswords] = useState(emptyPassword);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show) return undefined;

    let active = true;
    setTab("details");
    setPasswords(emptyPassword);
    setAvatarFile(null);
    setLoading(true);

    API.get("/auth/me")
      .then((res) => {
        if (!active) return;
        const user = res.data.user;
        setProfile({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          avatar: user.avatar || "",
        });
        setPreview(getImageUrl(user.avatar));
      })
      .catch(() => {
        if (!active) return;
        toast.error("Please login again");
        onClose();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [show, onClose]);

  useEffect(() => {
    if (!show) return undefined;

    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [show, onClose]);

  if (!show) return null;

  const handleProfileChange = (event) => {
    setProfile((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);

    const data = new FormData();
    data.append("name", profile.name);
    data.append("email", profile.email);
    data.append("phone", profile.phone);
    if (avatarFile) data.append("avatar", avatarFile);

    try {
      const res = await API.put("/auth/profile", data);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setPreview(getImageUrl(res.data.user.avatar));
      setAvatarFile(null);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await API.put("/auth/change-password", passwords);
      toast.success("Password changed successfully");
      setPasswords(emptyPassword);
    } catch (error) {
      toast.error(error.response?.data?.message || "Password change failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="profile-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 id="profile-modal-title" className="fw-bold mb-0">
            My Profile
          </h5>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        </div>

        <ul className="nav nav-pills nav-fill gap-1 mb-3 profile-tabs">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${tab === "details" ? "active" : ""}`}
              onClick={() => setTab("details")}
            >
              Details
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${tab === "password" ? "active" : ""}`}
              onClick={() => setTab("password")}
            >
              Password
            </button>
          </li>
        </ul>

        {loading ? (
          <p className="text-center text-muted my-4">Loading profile...</p>
        ) : tab === "details" ? (
          <form onSubmit={saveProfile}>
            <div className="d-flex align-items-center gap-3 mb-3">
              {preview ? (
                <img
                  src={preview}
                  alt="avatar"
                  className="rounded-circle border"
                  style={{ width: "64px", height: "64px", objectFit: "cover" }}
                />
              ) : (
                <i className="bi bi-person-circle text-danger" style={{ fontSize: "64px" }}></i>
              )}
              <label className="btn btn-sm btn-outline-danger mb-0">
                Change avatar
                <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
              </label>
            </div>

            <label className="form-label small fw-semibold">Name</label>
            <input
              className="form-control form-control-sm mb-2"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              required
            />

            <label className="form-label small fw-semibold">Email</label>
            <input
              className="form-control form-control-sm mb-2"
              type="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              required
            />

            <label className="form-label small fw-semibold">Phone</label>
            <input
              className="form-control form-control-sm mb-2"
              name="phone"
              value={profile.phone}
              onChange={handleProfileChange}
              placeholder="Phone number"
            />

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-danger btn-sm px-3" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={changePassword}>
            <label className="form-label small fw-semibold">Current password</label>
            <input
              type="password"
              className="form-control form-control-sm mb-2"
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
              required
            />

            <label className="form-label small fw-semibold">New password</label>
            <input
              type="password"
              className="form-control form-control-sm mb-2"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords((prev) => ({ ...prev, newPassword: event.target.value }))
              }
              minLength={8}
              required
            />

            <label className="form-label small fw-semibold">Confirm new password</label>
            <input
              type="password"
              className="form-control form-control-sm mb-2"
              autoComplete="new-password"
              value={passwords.confirmPassword}
              onChange={(event) =>
                setPasswords((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
              minLength={8}
              required
            />

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-danger btn-sm px-3" disabled={saving}>
                {saving ? "Updating..." : "Update password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
