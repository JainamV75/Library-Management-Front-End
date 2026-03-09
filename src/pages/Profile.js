import { useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

function Profile() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    libraryId: "",
    phone: "",
    address: "",
    bio: "",
    photoUrl: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setMessage("");
        setIsError(false);
        const res = await api.get("/users/me");
        setFormData({
          name: res.data.name || "",
          email: res.data.email || "",
          role: res.data.role || "",
          libraryId: res.data.libraryId || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
          bio: res.data.bio || "",
          photoUrl: res.data.photoUrl || "",
        });
      } catch (err) {
        setIsError(true);
        setMessage("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage("");
    setIsError(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, photoUrl: String(reader.result || "") }));
      setMessage("");
      setIsError(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage("");
      setIsError(false);
      await api.put("/users/me", {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
        photoUrl: formData.photoUrl,
      });
      localStorage.setItem("profile_photo_url", formData.photoUrl || "");
      localStorage.setItem("profile_photo_user_id", String(user?.userId || ""));
      window.dispatchEvent(
        new CustomEvent("profile-updated", {
          detail: {
            photoUrl: formData.photoUrl || "",
            userId: user?.userId,
            name: formData.name,
          },
        })
      );
      setMessage("Profile saved successfully");
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setIsError(true);
      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage || "Failed to save profile"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Profile</h2>
          <p className="page-subtitle">Update personal details and profile photo</p>
        </div>
      </div>

      {message && <p className={`notice ${isError ? "notice-error" : "notice-success"}`}>{message}</p>}

      <form className="form-container" onSubmit={handleSave}>
        <div className="form-field">
          <label>Profile Photo</label>
          <div className="inline-actions">
            {formData.photoUrl ? (
              <img alt="Profile" className="profile-avatar profile-avatar-large" src={formData.photoUrl} />
            ) : (
              <span className="profile-avatar profile-avatar-placeholder profile-avatar-large">No Photo</span>
            )}
            <label className="btn-outline upload-label">
              Add Photo
              <input accept="image/*" onChange={handlePhotoUpload} className="file-input-hidden" type="file" />
            </label>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="profileName">Name</label>
            <input id="profileName" name="name" onChange={handleChange} value={formData.name} />
          </div>
          <div className="form-field">
            <label htmlFor="profileEmail">Email</label>
            <input disabled id="profileEmail" value={formData.email} />
          </div>
          <div className="form-field">
            <label htmlFor="profileRole">Role</label>
            <input disabled id="profileRole" value={formData.role} />
          </div>
          <div className="form-field">
            <label htmlFor="profileLibrary">Library ID</label>
            <input disabled id="profileLibrary" value={formData.libraryId} />
          </div>
          <div className="form-field">
            <label htmlFor="profilePhone">Phone</label>
            <input id="profilePhone" name="phone" onChange={handleChange} value={formData.phone} />
          </div>
          <div className="form-field">
            <label htmlFor="profileAddress">Address</label>
            <input id="profileAddress" name="address" onChange={handleChange} value={formData.address} />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="profileBio">Bio</label>
          <textarea id="profileBio" name="bio" onChange={handleChange} rows={4} value={formData.bio} />
        </div>

        <div className="form-actions">
          <button className="btn-primary" disabled={saving} type="submit">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default Profile;
