import { createContext, useContext, useEffect, useState, useRef } from "react";
import AppContext from "./AppContext";
import { encryptMessage, decryptMessage } from "../utils/encryption";
export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [unseenMessages, setUnseenMessages] = useState({}); //key-value pair
  
  const { socket, axios, user } = useContext(AppContext);
  const selectedUserRef = useRef(selectedUser);
  
  // Keep selectedUserRef in sync with selectedUser
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

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
        // Decrypt messages when loading
        console.log("Loading messages, decrypting...");
        const decryptedMessages = response.data.message.map((msg) => {
          if (msg.messageText && user?._id && userId) {
            console.log("Decrypting message:", msg._id);
            console.log("Original encrypted text:", msg.messageText?.substring(0, 50));
            try {
              const decryptedText = decryptMessage(
                msg.messageText,
                user._id,
                userId
              );
              console.log("Decrypted text:", decryptedText);
              return { ...msg, messageText: decryptedText };
            } catch (error) {
              console.error("Error decrypting message:", error);
              return msg;
            }
          }
          return msg;
        });
        console.log("Setting decrypted messages:", decryptedMessages.length);
        setMessages(decryptedMessages);
      }
      return response;
    } catch (err) {
      console.log(err);
    }
  };

  //function to send message to selected User
  const sendMessage = async (messageData) => {
    try {
      // Encrypt text message before sending
      let encryptedData = { ...messageData };
      if (messageData.text && user?._id && selectedUser?._id) {
        const encryptedText = encryptMessage(
          messageData.text,
          user._id,
          selectedUser._id
        );
        encryptedData = { ...messageData, text: encryptedText };
      }
      
      const response = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        encryptedData,
        { withCredentials: true }
      );
      if (response.data.status === "success") {
        // Decrypt the message before adding to local state
        const decryptedMessage = { ...response.data.message };
        if (decryptedMessage.messageText && user?._id) {
          try {
            decryptedMessage.messageText = decryptMessage(
              decryptedMessage.messageText,
              user._id,
              selectedUser._id
            );
          } catch (error) {
            console.error("Error decrypting sent message:", error);
          }
        }
        setMessages((prevMessages) => [...prevMessages, decryptedMessage]);
      } else {
        console.log("Failed to send message",response.data);
      }
    } catch (err) {
      console.log(err.response);
    }
  };

  //function to subscribe to messages for selected user
  useEffect(() => {
    if (!socket) {
      console.log("Socket not available for message subscription");
      return;
    }

    console.log("Setting up newMessage listener, selectedUser:", selectedUser?._id);

    const handleNewMessage = async (newMessage) => {
      console.log("New message received:", newMessage);
      console.log("Current selectedUser:", selectedUserRef.current?._id);
      console.log("Message senderId:", newMessage.senderId);
      
      // Use ref to get current selectedUser to avoid stale closure
      const currentSelectedUser = selectedUserRef.current;
      
      if (currentSelectedUser && newMessage.senderId === currentSelectedUser._id) {
        console.log("Message is from selected user, adding to messages");
        console.log("Original message text:", newMessage.messageText);
        
        // Decrypt the message before adding to state
        const decryptedMessage = { ...newMessage };
        if (decryptedMessage.messageText && user?._id && newMessage.senderId) {
          console.log("Attempting to decrypt message...");
          console.log("Current user ID:", user._id);
          console.log("Sender ID:", newMessage.senderId);
          
          try {
            const decryptedText = decryptMessage(
              decryptedMessage.messageText,
              user._id,
              newMessage.senderId
            );
            decryptedMessage.messageText = decryptedText;
            console.log("Decrypted message text:", decryptedText);
          } catch (error) {
            console.error("Error decrypting received message:", error);
            // Keep encrypted text if decryption fails
          }
        } else {
          console.log("Skipping decryption - missing data:", {
            hasMessageText: !!decryptedMessage.messageText,
            hasUserId: !!user?._id,
            hasSenderId: !!newMessage.senderId
          });
        }
        
        decryptedMessage.seen = true;
        setMessages((prev) =>  [...prev, decryptedMessage]);
        // Mark as seen
        try {
          await axios.put(`/api/messages/mark/${newMessage._id}`);
        } catch (err) {
          console.error("Error marking message as seen:", err);
        }
      } else {
        console.log("Message is not from selected user, updating unseen count");
        setUnseenMessages((prevUnseenMessages) => {
          return {
            ...prevUnseenMessages,
            [newMessage.senderId]: (prevUnseenMessages && prevUnseenMessages[newMessage.senderId])
              ? prevUnseenMessages[newMessage.senderId] + 1
              : 1,
          };
        });
      }
    };
    const unsubscribe=()=>{
      if(socket) socket.off("newMessage");
    }
    // Add new listener
    socket.on("newMessage", handleNewMessage);
    console.log("✓ newMessage listener registered");

    return () => {
      console.log("Cleaning up newMessage listener");
      unsubscribe();
    };
  }, [socket, selectedUser?._id, axios, user?._id]);
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
