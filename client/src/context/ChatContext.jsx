import { createContext, useContext, useEffect, useState, useRef } from "react";
import AppContext from "./AppContext";
import { encryptMessage, decryptMessage, showEncryptionStatus } from "../utils/encryption";
export const ChatContext = createContext();

// Show encryption status on module load
showEncryptionStatus();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [unseenMessages, setUnseenMessages] = useState({}); //key-value pair
  const [lastMessages, setLastMessages] = useState({}); //key-value pair for last messages
  
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
        
        // Decrypt last messages
        const encryptedLastMessages = response.data.lastMessages || {};
        const decryptedLastMessages = {};
        
        Object.keys(encryptedLastMessages).forEach((userId) => {
          const lastMsg = encryptedLastMessages[userId];
          let decryptedText = lastMsg.text;
          
          // Only decrypt if it's not the placeholder text and user is logged in
          if (decryptedText && decryptedText !== '📷 Image' && user?._id) {
            try {
              decryptedText = decryptMessage(decryptedText, user._id, userId);
            } catch (error) {
              console.error("Error decrypting last message for user", userId, error);
              decryptedText = "Message"; // Fallback
            }
          }
          
          decryptedLastMessages[userId] = {
            ...lastMsg,
            text: decryptedText
          };
        });
        
        setLastMessages(decryptedLastMessages);
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
        console.log("📥 Loading messages from server:", response.data.message.length, "messages");

        const decryptedMessages = response.data.message.map((msg, index) => {
          console.log(`\n📨 Message ${index + 1}:`, msg);
          
          const decryptedMsg = { ...msg };
          
          // Decrypt text message if present
          if (msg.messageText && user?._id && userId) {
            try {
              console.log(`📝 Encrypted text:`, msg.messageText?.substring(0, 50) + "...");
              console.log(`🔓 Decrypting text with user IDs:`, user._id, "and", userId);
              const decryptedText = decryptMessage(
                msg.messageText,
                user._id,
                userId
              );
              console.log(`✅ Decrypted text:`, decryptedText);
              decryptedMsg.messageText = decryptedText;
            } catch (error) {
              console.error("❌ Error decrypting message text:", error);
            }
          }
          
          // Decrypt image URL if present
          if (msg.messageImage && user?._id && userId) {
            try {
              console.log(`🖼️ Encrypted image URL:`, msg.messageImage?.substring(0, 50) + "...");
              const decryptedImageUrl = decryptMessage(
                msg.messageImage,
                user._id,
                userId
              );
              console.log(`✅ Decrypted image URL`);
              decryptedMsg.messageImage = decryptedImageUrl;
            } catch (error) {
              console.error("❌ Error decrypting image URL:", error);
            }
          }
          
          return decryptedMsg;
        });
        
        console.log("✅ Setting", decryptedMessages.length, "decrypted messages to state");
        setMessages(decryptedMessages);
        
        // Clear unseen messages count for this user since we're viewing the conversation
        setUnseenMessages((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
      return response;
    } catch (err) {
      console.log(err);
    }
  };

  //function to send message to selected User
  const sendMessage = async (messageData) => {
    try {
      // Encrypt text message and/or image URL before sending
      let encryptedData = { ...messageData };
      
      // Encrypt text message if present
      if (messageData.text && user?._id && selectedUser?._id) {
        const encryptedText = encryptMessage(
          messageData.text,
          user._id,
          selectedUser._id
        );
        encryptedData = { ...messageData, text: encryptedText };
      }
      
      // Encrypt image URL if present (for Cloudinary URLs)
      if (messageData.image && user?._id && selectedUser?._id) {
        // If it's a data URL (base64), send as is for upload
        // If it's already a Cloudinary URL, encrypt it
        if (!messageData.image.startsWith('data:')) {
          const encryptedImage = encryptMessage(
            messageData.image,
            user._id,
            selectedUser._id
          );
          encryptedData = { ...encryptedData, image: encryptedImage };
        }
      }
      
      const response = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        encryptedData,
        { withCredentials: true }
      );
      if (response.data.status === "success") {
        // Decrypt and add message immediately for better UX
        const decryptedMessage = { ...response.data.message };
        console.log("📨 Received message from server:", decryptedMessage);
        console.log("📝 Message text (encrypted):", decryptedMessage.messageText);
        
        // Decrypt text message if present
        if (decryptedMessage.messageText && user?._id && selectedUser?._id) {
          try {
            console.log("🔓 Attempting to decrypt sent message...");
            const decrypted = decryptMessage(
              decryptedMessage.messageText,
              user._id,
              selectedUser._id
            );
            console.log("✅ Decrypted text:", decrypted);
            decryptedMessage.messageText = decrypted;
          } catch (error) {
            console.error("❌ Error decrypting sent message:", error);
          }
        }
        
        // Decrypt image URL if present
        if (decryptedMessage.messageImage && user?._id && selectedUser?._id) {
          try {
            console.log("🖼️ Attempting to decrypt image URL...");
            const decryptedImageUrl = decryptMessage(
              decryptedMessage.messageImage,
              user._id,
              selectedUser._id
            );
            console.log("✅ Decrypted image URL");
            decryptedMessage.messageImage = decryptedImageUrl;
          } catch (error) {
            console.error("❌ Error decrypting image URL:", error);
          }
        }
        
        // Add message to state immediately
        setMessages((prevMessages) => {
          // Check if message already exists (from socket)
          const exists = prevMessages.some(msg => msg._id === decryptedMessage._id);
          if (exists) {
            return prevMessages;
          }
          return [...prevMessages, decryptedMessage];
        });
        
        // Update last message for this conversation
        setLastMessages((prev) => ({
          ...prev,
          [selectedUser._id]: {
            text: decryptedMessage.messageText || (decryptedMessage.messageImage ? '📷 Image' : ''),
            time: decryptedMessage.createdAt || new Date().toISOString(),
            senderId: user._id
          }
        }));
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
      console.log("Message receiverId:", newMessage.receiverId);
      console.log("Current user ID:", user?._id);
      
      // Use ref to get current selectedUser to avoid stale closure
      const currentSelectedUser = selectedUserRef.current;
      
      // Convert IDs to strings for proper comparison
      const msgSenderId = String(newMessage.senderId);
      const msgReceiverId = String(newMessage.receiverId);
      const currentUserId = String(user?._id);
      const selectedUserId = String(currentSelectedUser?._id);
      
      // Check if this message is part of the current conversation
      const isCurrentConversation = currentSelectedUser && (
        (msgSenderId === selectedUserId && msgReceiverId === currentUserId) ||
        (msgSenderId === currentUserId && msgReceiverId === selectedUserId)
      );
      
      if (isCurrentConversation) {
        console.log("Message is part of current conversation, adding to messages");
        console.log("Original message text:", newMessage.messageText);
        
        // Decrypt the message before adding to state
        const decryptedMessage = { ...newMessage };
        console.log("📨 Socket message received:", decryptedMessage);
        console.log("📝 Message text (encrypted):", decryptedMessage.messageText);
        
        // Determine the other party in the conversation for decryption
        const otherUserId = msgSenderId === currentUserId ? newMessage.receiverId : newMessage.senderId;
        console.log("👤 Other user ID for decryption:", otherUserId);
        console.log("👤 Current user ID:", user._id);
        
        // Decrypt text message if present
        if (decryptedMessage.messageText && user?._id) {
          console.log("🔓 Attempting to decrypt socket message text...");
          
          try {
            const decryptedText = decryptMessage(
              decryptedMessage.messageText,
              user._id,
              otherUserId
            );
            console.log("✅ Decrypted message text:", decryptedText);
            decryptedMessage.messageText = decryptedText;
          } catch (error) {
            console.error("❌ Error decrypting received message text:", error);
          }
        }
        
        // Decrypt image URL if present
        if (decryptedMessage.messageImage && user?._id) {
          console.log("🖼️ Attempting to decrypt socket message image...");
          
          try {
            const decryptedImageUrl = decryptMessage(
              decryptedMessage.messageImage,
              user._id,
              otherUserId
            );
            console.log("✅ Decrypted image URL");
            decryptedMessage.messageImage = decryptedImageUrl;
          } catch (error) {
            console.error("❌ Error decrypting received image URL:", error);
          }
        }
        
        // Mark as seen if we're the receiver
        if (msgReceiverId === currentUserId) {
          decryptedMessage.seen = true;
          try {
            await axios.put(`/api/messages/mark/${newMessage._id}`);
          } catch (err) {
            console.error("Error marking message as seen:", err);
          }
        }
        
        // Add message to state, avoiding duplicates
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.some(msg => msg._id === newMessage._id);
          if (exists) {
            console.log("Message already exists, skipping duplicate");
            return prev;
          }
          return [...prev, decryptedMessage];
        });
      } else if (msgSenderId !== currentUserId) {
        // Message is from someone else not in current conversation
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
      
      // Update last message for this user regardless of current conversation
      const otherUserId = msgSenderId === currentUserId ? msgReceiverId : msgSenderId;
      
      // Decrypt the message text for the last message display
      let displayText = newMessage.messageImage ? '📷 Image' : '';
      if (newMessage.messageText && user?._id) {
        try {
          displayText = decryptMessage(newMessage.messageText, user._id, otherUserId);
        } catch (error) {
          console.error("Error decrypting last message text:", error);
          displayText = "New message";
        }
      }
      
      setLastMessages((prev) => ({
        ...prev,
        [otherUserId]: {
          text: displayText,
          time: newMessage.createdAt || new Date().toISOString(),
          senderId: newMessage.senderId
        }
      }));
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
    lastMessages,
    setLastMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
