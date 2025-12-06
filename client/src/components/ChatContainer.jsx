import React, { useState, useEffect, useRef, useContext } from "react";
import { Send, Paperclip, Smile, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import assets from "../assets/assets";
import { ChatContext } from "../context/ChatContext";
import AppContext from "../context/AppContext";
const ChatContainer = () => {
  // const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const { selectedUser,sendMessage,getMessages,messages,setMessages } = useContext(ChatContext);
  const { onlineUsers,user } = useContext(AppContext);
  const currentUserId = user?._id;
  
  // Filter messages for the selected conversation
  useEffect(() => {
    if (selectedUser) {
      const fetchData=async()=>{
        const res=await getMessages(selectedUser._id);
        if (res && res.data && res.data.message) {
          setMessages(res.data.message);
        }
      }
      fetchData();
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?._id, currentUserId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    console.log(e.target);
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async() => {
      console.log(reader.result)
      // Auto send image message
      if (selectedUser) {
        // const message = {
        //   _id: Date.now().toString(),
        //   senderId: currentUserId,
        //   receiverId: selectedUser._id,
        //   image: reader.result,
        //   seen: false,
        //   createdAt: new Date().toISOString(),
        // };
        await sendMessage(reader.result);
        // setMessages([...messages, message]);
      }
    };
  };

  const handleSendMessage = async(e) => {
    e.preventDefault(); 
    if (newMessage.trim() && selectedUser) {
      const messageText = newMessage.trim();
      setNewMessage(""); // Clear input immediately for better UX
      try {
        await sendMessage({text: messageText});
      } catch (error) {
        // If send fails, restore the message text
        setNewMessage(messageText);
        console.error("Failed to send message:", error);
      }
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
            <MoreVertical className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-300">
            Choose a chat from the sidebar to start messaging
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-transparent h-full min-h-0">
      {/* Chat Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={
                selectedUser.profilePic
                  ? selectedUser.profilePic
                  : assets.avatar_icon
              }
              alt={selectedUser.fullName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/30"
            />
            {onlineUsers.includes(selectedUser._id) && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-lg"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {selectedUser.fullName}
            </h3>
            <p className="text-sm text-emerald-400">
              {onlineUsers.includes(selectedUser._id)
                ? "Online"
                : "Last seen recently"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-300" />
          </motion.button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUserId;
          const sender = isOwnMessage ? user : selectedUser;
          const receiver = selectedUser;
          if(!receiver || !selectedUser){
            return null
          }

          return (
            <motion.div
              key={message._id}
              className={`flex ${
                isOwnMessage ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-xs lg:max-w-md ${
                  isOwnMessage ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {!isOwnMessage && (
                  <img
                    src={receiver.profilePic!==""?receiver.profilePic:assets.avatar_icon}
                    alt={receiver.fullName}
                    className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0 ring-2 ring-white/20"
                  />
                )}
                <div
                  className={`flex flex-col ${
                    isOwnMessage ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl shadow-lg ${
                      isOwnMessage
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-br-md"
                        : "bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-bl-md"
                    }`}
                  >
                    {message.messageText && <p className="text-sm">{message.messageText}</p>}
                    {message.messageImage && (
                      <img
                        src={message.messageImage}
                        alt="Shared image"
                        className="mt-2 rounded-lg max-w-full h-auto"
                      />
                    )}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 px-1">
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
                {isOwnMessage && (
                  <img
                    src={sender.profilePic!==""?sender.profilePic:assets.avatar_icon}
                    alt={sender.fullName}
                    className="w-8 h-8 rounded-full object-cover ml-2 flex-shrink-0 ring-2 ring-white/20"
                  />
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm px-6 py-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              hidden
              id="image"
              onChange={handleImageChange}
            />
            <label htmlFor="image" className="cursor-pointer">
              <Paperclip className="w-5 h-5 text-gray-300" />
            </label>
          </motion.div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e)=>e.key==='Enter'?handleSendMessage(e):null}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <Smile className="w-5 h-5 text-gray-300" />
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full hover:from-emerald-600 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
