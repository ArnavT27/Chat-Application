import React, { useContext } from "react";
import {
  Video,
  MoreVertical,
  Mail,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import assets from "../assets/assets";
import { ChatContext } from "../context/ChatContext";
import AppContext from "../context/AppContext";

const RightSidebar = () => {
  const { selectedUser } = useContext(ChatContext);
  const { onlineUsers, socket, user, setIsVideoCallActive, setVideoCallData } = useContext(AppContext);
  
  if (!selectedUser) {
    return (
      <div className="w-80 bg-transparent border-l border-white/10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-gray-300"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
            <MoreVertical className="w-10 h-10 text-emerald-400" />
          </div>
          <p className="text-sm">Select a conversation to view user details</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-transparent border-l border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Contact Info</h2>
          
        </div>

        {/* User Profile */}
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <img
              src={
                selectedUser.profilePic
                  ? selectedUser.profilePic
                  : assets.avatar_icon
              }
              alt={selectedUser.fullName}
              className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-emerald-500/30"
            />
            {onlineUsers.includes(selectedUser._id) && (
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg"></div>
            )}
          </div>
          <h3 className="text-xl font-semibold text-white mb-1">
            {selectedUser.fullName}
          </h3>
          <p className="text-sm text-gray-300 mb-6">{selectedUser.bio || "No bio available"}</p>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                
                if (!socket) {
                  console.error("Socket is not available");
                  alert("Socket connection not available. Please refresh the page.");
                  return;
                }
                
                if (!socket.connected) {
                  console.error("Socket is not connected");
                  alert("Socket is not connected. Please refresh the page.");
                  return;
                }
                
                if (!selectedUser) {
                  console.error("No user selected");
                  alert("Please select a user to call");
                  return;
                }
                
                if (!user) {
                  console.error("Current user not available");
                  return;
                }
                
                const callData = {
                  targetUserId: selectedUser._id,
                  caller: user,
                };
                
                console.log("Emitting video-call-initiate with data:", callData);
                socket.emit("video-call-initiate", callData);
                setIsVideoCallActive(true);
                setVideoCallData(null); // Not an incoming call
              }}
              className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg shadow-emerald-500/30 cursor-pointer"
              title="Start video call"
            >
              <Video className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (selectedUser?.email) {
                  // Open default email client with pre-filled recipient
                  window.location.href = `mailto:${selectedUser.email}?subject=Message from ${user?.fullName || 'Chat App'}&body=Hi ${selectedUser.fullName},%0D%0A%0D%0A`;
                } else {
                  alert("Email address not available for this user");
                }
              }}
              className="p-3 bg-white/10 backdrop-blur-sm text-gray-300 rounded-full hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
              title={`Send email to ${selectedUser.email || 'user'}`}
            >
              <Mail className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-5">
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Mail className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Email</p>
              <p className="text-sm text-white">{selectedUser.email}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Calendar className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Joined</p>
              <p className="text-sm text-white">
                {selectedUser.createdAt
                  ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : "January 2024"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
