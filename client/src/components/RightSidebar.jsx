import React, { useContext } from "react";
import {
  Phone,
  Video,
  MoreVertical,
  Mail,
  MapPin,
  Calendar,
} from "lucide-react";
import assets from "../assets/assets";
import { ChatContext } from "../context/ChatContext";

const RightSidebar = () => {
  const { selectedUser } = useContext(ChatContext);
  if (!selectedUser) {
    return (
      <div className="w-80 bg-black border-l border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-200">
          <MoreVertical className="w-12 h-12 mx-auto mb-4 text-gray-100" />
          <p>Select a conversation to view user details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-black border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Contact Info</h2>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
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
              className="w-24 h-24 rounded-full object-cover mx-auto"
            />
            {selectedUser.isOnline && (
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-200 mb-1">
            {selectedUser.fullName}
          </h3>
          <p className="text-sm text-white mb-4">{selectedUser.bio}</p>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3">
            <button className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors cursor-pointer">
              <Mail className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="flex-1 p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-100">Email</p>
              <p className="text-sm text-gray-300">{selectedUser.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Joined</p>
              <p className="text-sm text-gray-500">January 2024</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Location</p>
              <p className="text-sm text-gray-500">San Francisco, CA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
