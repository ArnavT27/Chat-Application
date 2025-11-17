import React, { useContext, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Loader, Save, X } from "lucide-react";
import AppContext from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user, updateProfile } = useContext(AppContext);
  const [name, setName] = useState();
  const [bio, setBio] = useState();
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      setName(user.fullName || user.name || "");
      setBio(user.bio || "");
      setAvatarPreview(user.profilePic || "");
    }
  }, [user]);

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (!selectedFile) {
        await updateProfile({ fullName: name, bio });

        navigate("/");
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        try {
          const base64Image = reader.result;
          await updateProfile({ fullName: name, bio, profilePic: base64Image });
          navigate("/");
        } catch (error) {
          console.error("Error updating profile with image:", error);
          setError(error.response?.data?.message || "Failed to update profile");
        }
      };

      // In a real app, upload the image and save profile to backend here.

      // For now, we update local context so UI reflects changes immediately.
      // setUser?.({
      //   ...user,
      //   fullName: name,
      //   bio,
      //   profilePic: avatarPreview || user?.profilePic,
      // });
    } finally {
      setTimeout(() => setIsSaving(false), 600);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setName(user.fullName || "");
    setBio(user.bio || "");
    setAvatarPreview(user.profilePic || "");
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-green-400/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-2xl w-[92%] sm:w-full bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl ring-1 ring-white/10 border border-white/10 overflow-hidden"
      >
        <div className="p-6 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-white">
            Profile
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8">
            <div className="relative">
              <img
                src={avatarPreview || user?.profilePic}
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border border-white/10"
              />
              <button
                type="button"
                onClick={handlePickFile}
                className="absolute -bottom-2 -right-2 p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                aria-label="Change profile picture"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </div>

            <div className="flex-1">
              <p className="text-sm text-gray-300">Update your display photo</p>
              <p className="text-xs text-gray-400">
                JPG, PNG. Recommended 512x512
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                  className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
