import assets from "../assets/assets";
import { useState, useContext, useEffect } from "react";
import { Search, MoreVertical, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  } = useContext(AppContext);
  const { getAllUsers, users, selectedUser, setSelectedUser,unseenMessages,messages } =
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

        setShowDropdown(false);
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Logout failed");
    } finally {
      setIsLoading(false);
    }
  };
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    console.log(date)
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  // Create conversation data with last messages
  // console.log(selectedUser)
  const conversations = users
    .map((user) => {
      return {
        ...user,
        // lastMessage: messages[messages.length-1]?.messageText,
        // lastMessageTime: Date.now(),
        unreadCount: selectedUser?unseenMessages[selectedUser._id]:0,
      };
    })
    .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="border-r-[0.5px] border-solid min-h-screen w-[350px] flex flex-col">
      <div className="flex h-[100px] w-full justify-between">
        <div className="flex mt-[35px] ml-[30px]">
          <div>
            <img
              src={
                user?.profilePic === ""
                  ? assets.avatar_icon
                  : user?.profilePic || assets.avatar_icon
              }
              className={`h-[45px] w-[45px] rounded-4xl mr-[10px] z-10 `}
              onError={(e) => {
                e.target.src = assets.avatar_icon;
              }}
              alt="Profile"
            ></img>
            <div
              className={`bg-green-600 h-[8px] w-[8px] rounded-4xl relative bottom-[7px] left-[34px] z-0 ${
                !isOnline ? "hidden" : ""
              }`}
            ></div>
          </div>
          <div>
            <p className="">{user?.fullName || "User"}</p>
            <p
              className={`text-gray-500 text-[10px] ${
                !isOnline ? "hidden" : ""
              }`}
            >
              Online
            </p>
          </div>
        </div>
        <div
          className="relative top-[45px] right-[30px]"
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <MoreVertical className="h-4 w-4 text-gray-400 cursor-pointer" />

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-32 z-50">
              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  // Handle profile action
                  navigate("/profile");
                  // console.log("Profile clicked");
                  setShowDropdown(false);
                }}
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white h-[0.5px] w-full "></div>
      {/*INPUT */}
      <div className="relative mt-[25px] flex justify-center">
        <div className="relative w-[90%]">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="text-gray-500"></Search>
          </div>
          <input
            className="w-full pl-10 pr-3 py-2 bg-white bg-opacity-50 rounded-2xl h-[45px] border border-gray-700  text-black placeholder-gray-500 outline-0"
            placeholder="Search conversations..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* CONVERSATIONS LIST */}
      <div className="flex-1 overflow-y-auto mt-[30px] ">
        {filteredConversations.map((conversation) => (
          <div
            key={conversation._id}
            className={`group flex items-center p-4 cursor-pointer border-b border-gray-100 ${
              selectedUser?._id === conversation._id
                ? "bg-blue-50 border-l-4 border-l-blue-500"
                : ""
            }`}
            onClick={() => setSelectedUser(conversation)}
          >
            {/* Avatar */}
            <div className="relative mr-3">
              <img
                src={conversation.profilePic || assets.avatar_icon}
                alt={conversation.fullName}
                className="h-12 w-12 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = assets.avatar_icon;
                }}
              />
              {/* Online indicator */}
              {onlineUsers.includes(conversation._id) && (
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>

            {/* Conversation Info */}
            <div className="flex-1 min-w-0 ">
              <div className="flex items-center justify-between mb-1">
                <h3
                  className={`text-sm font-semibold truncate ${
                    selectedUser?._id === conversation._id
                      ? "text-black"
                      : "text-white"
                  }`}
                >
                  {conversation.fullName}
                </h3>
                <span
                  className={`text-xs ml-2 ${
                    selectedUser?._id === conversation._id
                      ? "text-black"
                      : "text-white"
                  }`}
                >
                  {/* {formatTime(conversation.lastMessageTime)} */}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p
                  className={`text-sm truncate ${
                    selectedUser?._id === conversation._id
                      ? "text-gray-700"
                      : "text-gray-300"
                  }`}
                >
                  {conversation.lastMessage}
                </p>
                {conversation.unreadCount > 0 && (
                  <div className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {conversation.unreadCount}
                  </div>
                )}
              </div>
            </div>

            {/* More options */}
            <div className="ml-2 opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        ))}

        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Search className="h-8 w-8 mb-2" />
            <p className="text-sm">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
