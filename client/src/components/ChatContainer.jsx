import React, { useState, useEffect, useRef, useContext } from "react";
import { Send, Paperclip, Smile, MoreVertical } from "lucide-react";
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
        setMessages(res.data.message);
      }
      fetchData();
    } else {
      setMessages([]);
    }
  }, [selectedUser, currentUserId]);

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
      const response=await sendMessage({text: newMessage.trim()});
      setNewMessage("");
      console.log(messages);
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
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-black rounded-full flex items-center justify-center">
            <MoreVertical className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-50 mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-100">
            Choose a chat from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Chat Header */}
      <div className="bg-black border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={
                selectedUser.profilePic
                  ? selectedUser.profilePic
                  : assets.avatar_icon
              }
              alt={selectedUser.fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
            {selectedUser.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {selectedUser.fullName}
            </h3>
            <p className="text-sm text-gray-100">
              {onlineUsers.includes(selectedUser._id)
                ? "Online"
                : "Last seen recently"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-black rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUserId;
          const sender = isOwnMessage ? user : selectedUser;
          const receiver = selectedUser;
          if(!receiver || !selectedUser){
            return null
          }

          return (
            <div
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
                    className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
                  />
                )}
                <div
                  className={`flex flex-col ${
                    isOwnMessage ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? "bg-blue-500 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
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
                  <span className="text-xs text-gray-500 mt-1 px-1">
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
                {isOwnMessage && (
                  <img
                    src={sender.profilePic!==""?sender.profilePic:assets.avatar_icon}
                    alt={sender.fullName}
                    className="w-8 h-8 rounded-full object-cover ml-2 flex-shrink-0"
                  />
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-black border-t border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 hover:bg-gray-500 rounded-full transition-colors">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              hidden
              id="image"
              onChange={handleImageChange}
            />
            <label htmlFor="image">
              <Paperclip className="w-5 h-5 text-white" />
            </label>
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e)=>e.key==='Enter'?handleSendMessage(e):null}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-500 rounded-full transition-colors">
              <Smile className="w-5 h-5 text-white" />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-black disabled:cursor-not-allowed transition-colors mx-auto"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
