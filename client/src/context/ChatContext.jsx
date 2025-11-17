import { createContext, useContext, useEffect, useState } from "react";
import AppContext from "./AppContext";
export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [unseenMessages, setUnseenMessages] = useState({}); //key-value pair
  
  const { socket, axios } = useContext(AppContext);

  //function to get all users
  const getAllUsers = async () => {
    try {
      const response = await axios.get("/api/messages/users", {
        withCredentials: true,
      });
      if (response.data.status === "success") {
        setUsers(response.data.users);
        setUnseenMessages(response.data.unseenMessages);
      }
    } catch (err) {
      console.log("Error", err.response?.data);
    }
  };
  //function to get messages for selected user
  const getMessages = async (userId) => {
    try {
      const response = await axios.get(`/api/messages/${userId}`, {
        withCredentials: true,
      });
      if (response.data.status === "success") {
        setMessages(response.data.message);
      }
      return response;
    } catch (err) {
      console.log(err);
    }
  };

  //function to send message to selected User
  const sendMessage = async (messageData) => {
    try {
      const response = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData,
        { withCredentials: true }
      );
      if (response.data.status === "success") {
        setMessages((prevMessages) => [...prevMessages, response.data.message]);
      } else {
        console.log("Failed to send message",response.data);
      }
    } catch (err) {
      console.log(err.response);
    }
  };

  //function to subscribe to messages for selected user
  const subscribeToMessage = async () => {
    if (!socket) return;
    socket.on("newMessage", async (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);
        await axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prevUnseenMessages) => {
          return {
            ...prevUnseenMessages,
            [newMessage.senderId]: (prevUnseenMessages && prevUnseenMessages[newMessage.senderId])
              ? prevUnseenMessages[newMessage.senderId] + 1
              : 1,
          };
        });
      }
    });
  };

  //function to unsubscribe from messages
  const unsubscribeFromMessage = async () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    subscribeToMessage();
    return () => unsubscribeFromMessage();
  }, [socket, selectedUser, subscribeToMessage, unsubscribeFromMessage]);
  const value = {
    messages,
    users,
    selectedUser,
    getAllUsers,
    setMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    getMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
