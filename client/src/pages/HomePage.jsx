import React, { useContext, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import VideoCall from "../components/VideoCall";
import AppContext from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const { user, isAuthenticated, isVideoCallActive, videoCallData, setIsVideoCallActive, setVideoCallData } = useContext(AppContext);
  const [currentUserId] = useState("680f50aaf10f3cd28382ecf2");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !isAuthenticated) {
      navigate("/login");
    }
  }, [user, isAuthenticated, navigate]);

  // Debug video call state
  useEffect(() => {
    console.log("HomePage - Video call state:", {
      isVideoCallActive,
      videoCallData,
      isIncoming: !!videoCallData,
    });
  }, [isVideoCallActive, videoCallData]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full bg-green-400/20 blur-[150px]" />

      <div className="relative mx-auto flex h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-6 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
          <div>
            <p className="text-xs tracking-[0.4em] text-emerald-300/80 uppercase">
              Active workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              {user?.name || user?.username
                ? `Welcome back, ${user?.name || user?.username}`
                : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              Keep your conversations in-sync and pick up right where you left
              off.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="rounded-2xl border border-white/10 bg-emerald-400/10 px-6 py-4 text-sm text-gray-100">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
                status
              </p>
              <p className="text-lg font-semibold text-white">
                {selectedUser ? "In Conversation" : "Browsing Inbox"}
              </p>
            </div>
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-300">
                quick tip
              </p>
              <p className="text-sm text-gray-200">
                Tap a contact to continue the last chat or start a fresh one.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6 flex flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl min-h-0">
          <Sidebar
            setSelectedUser={setSelectedUser}
            selectedUser={selectedUser}
            currentUserId={currentUserId}
          />
          <ChatContainer
            setSelectedUser={setSelectedUser}
            selectedUser={selectedUser}
            currentUserId={currentUserId}
          />
          <RightSidebar
            setSelectedUser={setSelectedUser}
            selectedUser={selectedUser}
          />
        </div>
      </div>
      
      {/* Video Call Component */}
      {isVideoCallActive && (
        <VideoCall
          isOpen={isVideoCallActive}
          onClose={() => {
            console.log("VideoCall onClose called");
            setIsVideoCallActive(false);
            setVideoCallData(null);
          }}
          isIncoming={!!videoCallData}
          callerInfo={videoCallData}
        />
      )}
    </div>
  );
};

export default HomePage;
