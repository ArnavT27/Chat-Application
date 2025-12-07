import assets from "../assets/assets";
import { useState, useContext, useEffect } from "react";
import { Search, MoreVertical, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppContext from "../context/AppContext";
import { ChatContext } from "../context/ChatContext";
const URL = import.meta.env.VITE_BACKEND_URL;

const Sidebar = () => {
  const [isOnline] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const {
    setUser,
    setIsAuthenticated,
    axios,
    setIsLoading,
    setError,
    user,
    onlineUsers,
    socket,
  } = useContext(AppContext);
  const { getAllUsers, users, selectedUser, setSelectedUser, unseenMessages, lastMessages } =
    useContext(ChatContext);

  // Fetch users when component mounts
  useEffect(() => {
    getAllUsers();
  }, [onlineUsers]);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      console.log(response);
      if (response.data.status === "success") {
        setUser(null);
        setIsAuthenticated(false);
        navigate("/login");
        socket.disconnect();
        setShowDropdown(false);
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Logout failed");
    } finally {
      setIsLoading(false);
    }
  };
  // Create conversation data with last messages
  const conversations = users
    .map((chatUser) => {
      const lastMsg = lastMessages[chatUser._id];
      return {
        ...chatUser,
        lastMessage: lastMsg?.text || "No messages yet",
        lastMessageTime: lastMsg?.time || null,
        unreadCount: unseenMessages[chatUser._id] || 0,
      };
    })
    .sort((a, b) => {
      // Sort by last message time, putting conversations with messages first
      if (!a.lastMessageTime && !b.lastMessageTime) return 0;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conversation.lastMessage && conversation.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };
  // if(selectedUser){
  //   console.log(messages[messages.length-1])
  // }
  return (
    <div className="w-[350px] flex flex-col border-r border-white/10 bg-white/5 backdrop-blur-sm">
      {/* User Profile Header */}
      <div className="flex h-[100px] w-full items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={
                user?.profilePic === ""
                  ? assets.avatar_icon
                  : user?.profilePic || assets.avatar_icon
              }
              className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-500/30"
              onError={(e) => {
                e.target.src = assets.avatar_icon;
              }}
              alt="Profile"
            />
            <div
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 ${
                !isOnline ? "hidden" : ""
              }`}
            />
          </div>
          <div>
            <p className="font-semibold text-white">{user?.fullName || "User"}</p>
            <p
              className={`text-xs text-emerald-400 ${
                !isOnline ? "hidden" : ""
              }`}
            >
              Online
            </p>
          </div>
        </div>
        <div
          className="relative"
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="h-5 w-5 text-gray-300 cursor-pointer" />
          </motion.button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl py-2 w-40 z-50"
            >
              <button
                className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                onClick={() => {
                  navigate("/profile");
                  setShowDropdown(false);
                }}
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <button
                className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="h-px w-full bg-white/10"></div>
      
      {/* Search Input */}
      <div className="relative mt-6 flex justify-center px-4">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            className="w-full pl-11 pr-4 py-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            placeholder="Search conversations..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* CONVERSATIONS LIST */}
      <div className="flex-1 overflow-y-auto mt-4 px-2">
        {filteredConversations.map((conversation) => (
          <motion.div
            key={conversation._id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group flex items-center p-3 cursor-pointer rounded-xl mb-2 transition-all ${
              selectedUser?._id === conversation._id
                ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                : "hover:bg-white/5 border border-transparent"
            }`}
            onClick={() => setSelectedUser(conversation)}
          >
            {/* Avatar */}
            <div className="relative mr-3 flex-shrink-0">
              <img
                src={conversation.profilePic || assets.avatar_icon}
                alt={conversation.fullName}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white/20"
                onError={(e) => {
                  e.target.src = assets.avatar_icon;
                }}
              />
              {/* Online indicator */}
              {onlineUsers.includes(conversation._id) && (
                <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-lg"></div>
              )}
            </div>

            {/* Conversation Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold truncate text-white">
                  {conversation.fullName}
                </h3>
                {conversation.lastMessageTime && (
                  <span className="text-xs ml-2 text-gray-400 flex-shrink-0">
                    {formatTime(conversation.lastMessageTime)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm truncate text-gray-300">
                  {conversation.lastMessage}
                </p>
                {conversation.unreadCount > 0 && (
                  <div className="ml-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 shadow-lg">
                    {conversation.unreadCount}
                  </div>
                )}
              </div>
            </div>

            {/* More options */}
            <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </div>
          </motion.div>
        ))}

        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Search className="h-10 w-10 mb-3 text-gray-500" />
            <p className="text-sm">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
